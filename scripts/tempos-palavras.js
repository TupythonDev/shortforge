#!/usr/bin/env node
/**
 * tempos-palavras.js <pasta-audio> [s01,s02] — grava em tempos.json o início/fim de CADA PALAVRA das falas
 * (campo "palavras" do segmento), para legenda palavra a palavra ou para sincronizar uma palavra-chave sem
 * dividir a frase. Rodar depois de montar-narracao.js (que recria tempos.json e apaga as palavras antigas).
 * O texto vem do roteiro (segmentos.json); o Whisper só dá o tempo. Palavra que o Whisper não ouviu igual
 * (número, nome próprio) recebe tempo estimado entre as vizinhas e sai com "estimado": true.
 * Requer WHISPER_PY e WHISPER_MODELO, os mesmos de avaliar-takes.py (ver docs/voz.md).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { args, falhar } = require("./lib/cli");

const PY = `
import json, os, sys
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[1], device=os.environ.get("WHISPER_DEV", "cpu"), compute_type="int8")
out = {}
for f in json.load(open(sys.argv[2], encoding="utf-8")):
    seg, _ = m.transcribe(f, language="pt", beam_size=5, vad_filter=False, word_timestamps=True)
    out[f] = [[w.word, w.start, w.end] for s in seg for w in (s.words or [])]
print(json.dumps(out, ensure_ascii=False))
`;

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");

/** Palavras do roteiro como vão para a tela: sem tags do TTS ([sigh], [[termo|pronúncia]] → termo); pontuação solta gruda na palavra anterior. */
function palavrasDoTexto(texto) {
  const limpo = texto.replace(/\[\[([^\]|]*)(\|[^\]]*)?\]\]/g, "$1").replace(/\[[^\]]*\]/g, " ");
  const out = [];
  for (const p of limpo.split(/\s+/).filter(Boolean)) {
    if (norm(p) || !out.length) out.push(p);
    else out[out.length - 1] += " " + p;
  }
  return out.filter((p) => norm(p));
}

/**
 * Casa as palavras do roteiro com as ouvidas ([{p, inicio, fim}], tempos dentro do take) pela maior
 * subsequência comum. As que não casam dividem o intervalo entre as vizinhas casadas, pelo tamanho.
 */
function alinhar(roteiro, ouvidasBrutas, duracao) {
  // o Whisper parte palavra com hífen em duas ("guarda", "-roupa"): junta de volta
  const ouvidas = [];
  for (const o of ouvidasBrutas) {
    if (ouvidas.length && o.p.trim().startsWith("-")) ouvidas[ouvidas.length - 1] = { ...ouvidas[ouvidas.length - 1], p: ouvidas[ouvidas.length - 1].p + o.p.trim(), fim: o.fim };
    else ouvidas.push(o);
  }
  const a = roteiro.map(norm);
  const b = ouvidas.map((o) => norm(o.p));
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = roteiro.map((p) => ({ p }));
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) Object.assign(out[i++], { inicio: ouvidas[j].inicio, fim: ouvidas[j++].fim });
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  for (let i = 0; i < out.length; i++) {
    if (out[i].inicio != null) continue;
    let k = i;
    while (k < out.length && out[k].inicio == null) k++;
    const de = i ? out[i - 1].fim : 0;
    const ate = Math.max(de, k < out.length ? out[k].inicio : duracao);
    const total = roteiro.slice(i, k).reduce((s, p) => s + p.length, 0);
    let t = de;
    for (let n = i; n < k; n++) {
      const d = ((ate - de) * roteiro[n].length) / total;
      Object.assign(out[n], { inicio: t, fim: t + d, estimado: true });
      t += d;
    }
    i = k;
  }
  return out;
}

function transcrever(arquivos) {
  const py = process.env.WHISPER_PY, modelo = process.env.WHISPER_MODELO;
  if (!py || !modelo) falhar("ERRO: defina WHISPER_PY (python com faster-whisper) e WHISPER_MODELO (pasta do modelo). Ver docs/voz.md.");
  const lista = path.join(os.tmpdir(), `palavras-${process.pid}.json`);
  fs.writeFileSync(lista, JSON.stringify(arquivos));
  const r = spawnSync(py, ["-c", PY, modelo, lista], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" }, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  fs.rmSync(lista, { force: true });
  if (r.error || r.status) falhar("ERRO: o Whisper local falhou:\n" + (r.error ? r.error.message : r.stderr.slice(-1500)));
  return JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
}

function main() {
  const opts = args(process.argv.slice(2));
  const dir = opts._[0];
  const fTempos = dir && path.join(dir, "tempos.json");
  if (!dir || !fs.existsSync(fTempos)) falhar("ERRO: informe a pasta de áudio com tempos.json (rode montar-narracao.js antes). Uso: node scripts/tempos-palavras.js <pasta-audio> [s01,s02]");
  const defs = JSON.parse(fs.readFileSync(path.join(dir, "segmentos.json"), "utf8"));
  const tempos = JSON.parse(fs.readFileSync(fTempos, "utf8"));
  const so = opts._[1] ? opts._[1].split(",") : null;
  const ids = Object.keys(tempos.segmentos).filter((id) => defs[id] != null && (!so || so.includes(id)));
  if (!ids.length) falhar("ERRO: nenhum segmento para processar.");

  const wav = (id) => path.resolve(dir, "segs", tempos.segmentos[id].take);
  const ouvido = transcrever(ids.map(wav));
  let estimadas = 0;
  for (const id of ids) {
    const s = tempos.segmentos[id];
    const c = typeof defs[id] === "object" ? defs[id] : { texto: defs[id] };
    const rit = Number(c.ritmo) || 1;
    // tempo do take → tempo da narração: a fala entra em "inicio" e o "ritmo" (atempo) a estica
    const naNarracao = (t) => +Math.min(s.fim, s.inicio + t / rit).toFixed(3);
    const ouvidas = ouvido[wav(id)].map(([p, inicio, fim]) => ({ p, inicio, fim }));
    s.palavras = alinhar(palavrasDoTexto(c.texto), ouvidas, (s.fim - s.inicio) * rit).map((w) => ({
      p: w.p, inicio: naNarracao(w.inicio), fim: naNarracao(w.fim), ...(w.estimado ? { estimado: true } : {}),
    }));
    const est = s.palavras.filter((w) => w.estimado);
    estimadas += est.length;
    if (est.length) console.warn(`AVISO: ${id}: tempo estimado para ${est.map((w) => `"${w.p}"`).join(", ")} (o Whisper ouviu: ${ouvidas.map((o) => o.p.trim()).join(" ")})`);
  }
  fs.writeFileSync(fTempos, JSON.stringify(tempos, null, 2));
  console.log(JSON.stringify({ segmentos: ids.length, palavras: ids.reduce((n, id) => n + tempos.segmentos[id].palavras.length, 0), estimadas }));
}

if (require.main === module) main();
module.exports = { alinhar, palavrasDoTexto };
