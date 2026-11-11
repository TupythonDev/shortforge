#!/usr/bin/env node
/**
 * narrar.js — gera takes de TTS por segmento no VoiceStudio.
 * Uso: node scripts/narrar.js <segmentos.json> <pasta-saida> [--takes 3]
 * segmentos.json: {"s1":"texto"}  ou  {"s5b":{"texto":"...","voz":"<id perfil>","filtro":"<filtro ffmpeg>","speed":0.8}}
 * Voz: "voz" do segmento ou a variável VOZ_PERFIL (ID do perfil do canal, veja o CLAUDE.md do canal). Velocidade: VELOCIDADE (padrão 0.8). Gera <pasta>/segs/<id>-t<N>.wav.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const [segFile, outDir] = process.argv.slice(2);
const takes = parseInt(process.argv.includes("--takes") ? process.argv[process.argv.indexOf("--takes") + 1] : 3, 10);
const API = "http://localhost:3900/v1/audio/speech";
(async () => {
  const segs = JSON.parse(fs.readFileSync(segFile, "utf8"));
  fs.mkdirSync(path.join(outDir, "segs"), { recursive: true });
  for (const [id, def] of Object.entries(segs)) {
    const cfg = typeof def === "string" ? { texto: def } : def;
    const voz = cfg.voz || process.env.VOZ_PERFIL;
    if (!voz) throw new Error(`${id}: defina "voz" no segmento ou a variável VOZ_PERFIL (ID do perfil do canal)`);
    for (let t = 1; t <= takes; t++) {
      const dest = path.join(outDir, "segs", `${id}-t${t}.wav`);
      if (fs.existsSync(dest)) continue;
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ model: "omnivoice", voice: voz, input: cfg.texto, response_format: "wav", num_step: 32, speed: cfg.speed || parseFloat(process.env.VELOCIDADE || 0.8), language: "pt-BR", seed: 1000 + t }),
      });
      if (!r.ok) throw new Error(`${id} t${t}: HTTP ${r.status} ${await r.text()}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (cfg.filtro) {
        const bruto = dest.replace(/\.wav$/, "-bruto.wav");
        fs.writeFileSync(bruto, buf);
        execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", bruto, "-af", cfg.filtro, "-ar", "24000", "-ac", "1", dest]);
        fs.unlinkSync(bruto);
      } else fs.writeFileSync(dest, buf);
      console.log("ok", id, "t" + t);
    }
  }
})().catch((e) => { console.error("FALHOU:", e.message); process.exit(1); });
