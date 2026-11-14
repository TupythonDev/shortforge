#!/usr/bin/env node
/**
 * mixar-sons.js — mixa efeitos + drone no episódio (voz > SFX > fundo), -16 LUFS / TP < -4 dBFS.
 * uso: node scripts/mixar-sons.js <video.mp4> <pasta-ep> <saida.mp4>
 * Cues: <pasta-ep>/cues.js (modelo em modelos/ep01/cues.exemplo.js); sem ele, mixa só voz + drone. Lê <pasta-ep>/audio/tempos.json e <pasta-ep>/audio/narracao-final.wav. Grava cues.json ao lado da saída.
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const { falhar, arquivoObrigatorio, probeDuracao } = require("./lib/cli");
const [v0, ep, saida] = process.argv.slice(2);
if (!ep || !saida) falhar("ERRO: informe vídeo, pasta do episódio e saída. Uso: node scripts/mixar-sons.js <video.mp4> <pasta-ep> <saida.mp4>");
const video = arquivoObrigatorio(v0, "o vídeo renderizado");
for (const f of ["tempos.json", "narracao-final.wav"]) arquivoObrigatorio(path.join(ep, "audio", f), `${ep}/audio/${f}`);
const K = path.join(process.env.USERPROFILE || process.env.HOME, ".claude", "skills", "sound-effects", "sfx", "kit");
const SONS = path.resolve(__dirname, "..", "entity", "sons");
const T = JSON.parse(fs.readFileSync(path.join(ep, "audio", "tempos.json"), "utf8")).segmentos;
const dur = probeDuracao(video);
const ids = Object.keys(T), g = ids.filter((i) => !/[bc]$/.test(i));
const ini = g.map((id) => { const i = ids.indexOf(id); return i === 0 ? 0 : (T[ids[i - 1]].fim + T[id].inicio) / 2; });
const sh = (n) => ini[n - 1];

// cues: arquivo, início (s), duração (s) | 0 = inteiro, volume, fades
// cues próprios do episódio: module.exports = (ctx) => [...]  ou  => ({ cues: [...], drone: <arquivo> | null })
// drone padrão = drone-escuro.mp3 (tom sombrio); um canal de outro tom passa drone: null ou o próprio fundo.
// cue com duck: true abaixa sob a voz (sidechain), como o drone.
const custom = path.resolve(ep, "cues.js");
const res = fs.existsSync(custom) ? require(custom)({ K, SONS, T, sh, dur, ids }) : []; // sem cues.js: só voz + drone
const cues = Array.isArray(res) ? res : res.cues;
const drone = Array.isArray(res) || res.drone === undefined ? path.join(SONS, "drone-escuro.mp3") : res.drone;
fs.writeFileSync(path.join(path.dirname(saida), "cues.json"), JSON.stringify(cues.map(({ desc, t, d, v }) => ({ desc, t: +t.toFixed(3), d, v })), null, 1));

const inputs = ["-i", video, "-i", path.join(ep, "audio", "narracao-final.wav")];
const nDuck = cues.filter((c) => c.duck).length + (drone ? 1 : 0);
const vsLabels = Array.from({ length: nDuck }, (_, i) => `[vs${i}]`);
let fg = `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${dur},asplit=${1 + nDuck}[voz]${vsLabels.join("")};`;
const labels = ["[voz]"];
let vsi = 0;
cues.forEach((c, i) => {
  inputs.push(...(c.loop ? ["-stream_loop", "-1"] : []), ...(c.ss ? ["-ss", String(c.ss)] : []), "-i", c.f);
  const n = i + 2, ms = Math.max(0, Math.round(c.t * 1000));
  let ch = `[${n}:a]aformat=sample_rates=48000:channel_layouts=stereo`;
  if (c.d) ch += `,atrim=0:${c.d},asetpts=PTS-STARTPTS`;
  if (c.af) ch += `,${c.af}`; // filtro próprio do cue (ex.: lowpass para som debaixo d'água)
  if (c.fi) ch += `,afade=t=in:d=${c.fi}`;
  if (c.fo) ch += `,afade=t=out:st=${Math.max(0, (c.d || 3) - c.fo)}:d=${c.fo}`;
  fg += `${ch},volume=${c.v},adelay=${ms}|${ms}[c${i}${c.duck ? "x" : ""}];`;
  // duck: true (padrão) ou {ratio, release} para abaixar mais suave (música: ratio baixo evita "bombear")
  const dk = { ratio: 8, release: 500, ...(typeof c.duck === "object" ? c.duck : {}) };
  if (c.duck) fg += `[c${i}x][vs${vsi++}]sidechaincompress=threshold=0.015:ratio=${dk.ratio}:attack=40:release=${dk.release}[c${i}];`;
  labels.push(`[c${i}]`);
});
if (drone) {
  const dn = cues.length + 2;
  inputs.push("-i", drone);
  fg += `[${dn}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${dur},asetpts=PTS-STARTPTS,afade=t=in:d=2,afade=t=out:st=${dur - 3}:d=3,volume=0.30[dr];`;
  fg += `[dr][vs${vsi++}]sidechaincompress=threshold=0.015:ratio=10:attack=30:release=500[drd];`;
  labels.push("[drd]");
}
fg += `${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=first[m]`;
const tmp = saida.replace(/\.mp4$/, "-bruto.wav");
execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...inputs, "-filter_complex", fg, "-map", "[m]", "-t", String(dur), "-ar", "48000", "-c:a", "pcm_f32le", tmp], { stdio: "inherit" }); // float: a soma pode passar de 0 dBFS antes do ganho, e WAV 16 bits cortaria (distorce)

// mede no MP4 exportado e ajusta ganho até -16 LUFS / pico real < -4 dBFS
function medir(f) {
  const o = require("child_process").spawnSync("ffmpeg", ["-nostats", "-hide_banner", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const r = o.slice(o.lastIndexOf("Summary"));
  return { I: parseFloat(/I:\s+(-?[\d.]+) LUFS/.exec(r)[1]), TP: parseFloat(/Peak:\s+(-?[\d.]+) dBFS/.exec(r)[1]) };
}
const bruto = medir(tmp);
console.log(`mix bruto: ${bruto.I} LUFS, pico ${bruto.TP} dBFS`);
let gain = -16 - bruto.I, m;
for (let k = 0; k < 4; k++) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", video, "-i", tmp, "-map", "0:v", "-map", "1:a", "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.56:attack=5:release=200:level=disabled`, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(dur), saida], { stdio: "inherit" });
  m = medir(saida);
  console.log(`tentativa ${k + 1}: ganho ${gain.toFixed(2)} dB -> ${m.I} LUFS, pico ${m.TP} dBFS`);
  if (Math.abs(m.I + 16) <= 0.7 && m.TP <= -4) break;
  gain += -16 - m.I;
}
fs.unlinkSync(tmp);
console.log("OK", saida, m);
