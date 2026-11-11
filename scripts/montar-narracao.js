#!/usr/bin/env node
/**
 * montar-narracao.js <pasta-audio> — para cada segmento de segmentos.json escolhe o take de DURAÇÃO MEDIANA
 * (heurística: sem ouvir, descarta o mais rápido/mais lento), concatena com 0,3s de pausa antes de cada
 * fala e grava narracao.wav + tempos.json (início/fim exatos de cada segmento, base da sincronia do vídeo).
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { probeDuracao } = require("./lib/cli");

const GAP = 0.3;
const dir = process.argv[2];
if (!dir) { console.error("uso: node scripts/montar-narracao.js <pasta-audio>"); process.exit(1); }

const ids = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, "segmentos.json"), "utf8")));
const arquivos = fs.readdirSync(path.join(dir, "segs"));

const escolhidos = [];
const tempos = {};
let t = GAP;
for (const id of ids) {
  const takes = arquivos
    .filter((f) => new RegExp("^" + id + "-t[0-9]+\\.wav$").test(f))
    .map((f) => ({ f, d: probeDuracao(path.join(dir, "segs", f)) }))
    .sort((a, b) => a.d - b.d);
  if (!takes.length) { console.error(`ERRO: sem takes para ${id}. Rode scripts/narrar.js antes.`); process.exit(1); }
  const m = takes[Math.floor(takes.length / 2)];
  escolhidos.push(path.join(dir, "segs", m.f));
  tempos[id] = { take: m.f, inicio: +t.toFixed(3), fim: +(t + m.d).toFixed(3) };
  t += m.d + GAP;
}

// cada fala ganha GAP s de silêncio no início (adelay) e depois tudo é concatenado
const entradas = escolhidos.flatMap((f) => ["-i", f]);
const gapMs = Math.round(GAP * 1000);
let filtro = escolhidos
  .map((_, i) => `[${i}:a]aformat=sample_rates=24000:channel_layouts=mono,adelay=${gapMs}|${gapMs}[a${i}];`)
  .join("");
filtro += escolhidos.map((_, i) => `[a${i}]`).join("") + `concat=n=${escolhidos.length}:v=0:a=1,apad=pad_dur=${GAP}[o]`; // pausa final mantém a duração histórica
execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...entradas, "-filter_complex", filtro, "-map", "[o]", path.join(dir, "narracao.wav")]);

const total = probeDuracao(path.join(dir, "narracao.wav"));
fs.writeFileSync(path.join(dir, "tempos.json"), JSON.stringify({ total, segmentos: tempos }, null, 2));
console.log(JSON.stringify({ total, segmentos: Object.keys(tempos).length }));
