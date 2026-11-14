#!/usr/bin/env node
/**
 * montar-narracao.js <pasta-audio> [--lufs -18] — monta a narração a partir de segmentos.json e grava narracao.wav +
 * tempos.json (início/fim exatos de cada segmento, base da sincronia do vídeo).
 * Take: o de <pasta>/escolhas.json (gerado por scripts/avaliar-takes.py) ou, sem ele, o de DURAÇÃO MEDIANA
 * (heurística sem ouvir: descarta o mais rápido/mais lento).
 * Posição: "inicio" (s, absoluto) fixa a fala num ponto da cena; sem ele, a fala segue a anterior após
 * "gap" (s; padrão 0,3) + "pausa_antes" (s, o espaço das cenas de câmera sem fala).
 * Som (opcional): "af" = filtro ffmpeg aplicado na montagem (ou um nome de AMBIENTES abaixo); com --lufs cada fala
 * é levada a esse volume por ganho fixo (não comprime: preserva a entonação), mais "ganho_db" do segmento.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { probeDuracao } = require("./lib/cli");

const GAP = 0.3;
// ecos curtos e baixos: dão o "lugar" da fala sem virar efeito
const AMBIENTES = {
  casa: "aecho=1.0:0.9:19|33|51:0.2|0.13|0.07", // cômodo pequeno de madeira
  festa: "highpass=f=90,aecho=1.0:0.9:70|140:0.08|0.04", // ar livre, um pouco de distância
  porta: "aecho=1.0:0.9:25|45:0.25|0.15", // atrás da porta, dentro de casa
};
const dir = process.argv[2];
if (!dir) { console.error("uso: node scripts/montar-narracao.js <pasta-audio> [--lufs -18]"); process.exit(1); }
const iL = process.argv.indexOf("--lufs");
const LUFS = iL > 0 ? parseFloat(process.argv[iL + 1]) : null;

const defs = JSON.parse(fs.readFileSync(path.join(dir, "segmentos.json"), "utf8"));
const cfg = (id) => (typeof defs[id] === "object" ? defs[id] : {});
const ids = Object.keys(defs);
const fEsc = path.join(dir, "escolhas.json");
const esc = fs.existsSync(fEsc) ? JSON.parse(fs.readFileSync(fEsc, "utf8")) : {};
const arquivos = fs.readdirSync(path.join(dir, "segs"));

function lufs(f, af) {
  const o = spawnSync("ffmpeg", ["-nostats", "-hide_banner", "-i", f, "-af", (af ? af + "," : "") + "apad=pad_dur=0.5,ebur128", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  return parseFloat(/I:\s+(-?[\d.]+) LUFS/.exec(o.slice(o.lastIndexOf("Summary")))[1]);
}

const pecas = [];
const tempos = {};
let t = 0;
for (const id of ids) {
  const c = cfg(id);
  const takes = arquivos
    .filter((f) => new RegExp("^" + id + "-t[0-9]+\\.wav$").test(f))
    .map((f) => ({ f, d: probeDuracao(path.join(dir, "segs", f)) }))
    .sort((a, b) => a.d - b.d);
  if (!takes.length) { console.error(`ERRO: sem takes para ${id}. Rode scripts/narrar.js antes.`); process.exit(1); }
  const m = (esc[id] && takes.find((k) => k.f === esc[id].take)) || takes[Math.floor(takes.length / 2)];
  const ini = c.inicio != null ? Number(c.inicio) : t + (c.gap != null ? Number(c.gap) : GAP) + (Number(c.pausa_antes) || 0);
  if (ini < t - 0.001) console.warn(`AVISO: ${id} começa em ${ini.toFixed(2)}s, antes do fim da fala anterior (${t.toFixed(2)}s)`);
  const af = c.af ? AMBIENTES[c.af] || c.af : "";
  const ganho = LUFS != null ? LUFS - lufs(path.join(dir, "segs", m.f), af) + (Number(c.ganho_db) || 0) : Number(c.ganho_db) || 0;
  pecas.push({ f: path.join(dir, "segs", m.f), ini, af, ganho });
  tempos[id] = { take: m.f, inicio: +ini.toFixed(3), fim: +(ini + m.d).toFixed(3) };
  t = ini + m.d;
}

// cada fala entra no seu instante (adelay) e tudo é somado; pausa final de GAP mantém a duração histórica
const total = +(t + GAP).toFixed(3);
const entradas = pecas.flatMap((p) => ["-i", p.f]);
let filtro = pecas
  .map((p, i) => { const ms = Math.round(p.ini * 1000); return `[${i}:a]aformat=sample_rates=24000:channel_layouts=mono${p.af ? "," + p.af : ""},volume=${p.ganho.toFixed(2)}dB,adelay=${ms}|${ms}[a${i}];`; })
  .join("");
filtro += pecas.map((_, i) => `[a${i}]`).join("") + `amix=inputs=${pecas.length}:normalize=0:duration=longest,apad=whole_dur=${total},atrim=0:${total}[o]`;
execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...entradas, "-filter_complex", filtro, "-map", "[o]", path.join(dir, "narracao.wav")]);

fs.writeFileSync(path.join(dir, "tempos.json"), JSON.stringify({ total: probeDuracao(path.join(dir, "narracao.wav")), segmentos: tempos }, null, 2));
console.log(JSON.stringify({ total, segmentos: Object.keys(tempos).length }));
