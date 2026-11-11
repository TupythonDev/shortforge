#!/usr/bin/env node
/**
 * sons-openverse.js — busca e baixa sons do Openverse (API pública, só licenças comerciais).
 *   node scripts/sons-openverse.js buscar "horror drone" [--cc0]
 *   node scripts/sons-openverse.js baixar <id> [<id>...] [--nome apelido]
 * Baixa para entity/sons/ e registra autor/licença/fonte em entity/sons/CREDITOS.md.
 * Preferir CC0; BY exige crédito na descrição do vídeo.
 */
const fs = require("fs");
const path = require("path");
const API = "https://api.openverse.org/v1/audio/";
const DIR = path.resolve(__dirname, "..", "entity", "sons");
const [cmd, ...resto] = process.argv.slice(2);
const flag = (n) => { const i = resto.indexOf(n); return i >= 0 ? resto.splice(i, 1) && true : false; };

async function get(url) {
  const r = await fetch(url, { headers: { "User-Agent": "canal-dark-estudio" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r;
}

(async () => {
  if (cmd === "buscar") {
    const cc0 = flag("--cc0");
    const q = resto.join(" ");
    const u = new URL(API);
    u.search = new URLSearchParams({ q, license_type: "commercial", page_size: "12", ...(cc0 ? { license: "cc0" } : {}) });
    const d = await (await get(u)).json();
    console.log(`${d.result_count} resultados para "${q}"`);
    for (const r of d.results) console.log(`${r.id} | ${(r.duration / 1000).toFixed(1)}s | ${r.license.toUpperCase()} ${r.license_version} | ${r.title.slice(0, 50)} | ${r.creator}`);
  } else if (cmd === "baixar") {
    fs.mkdirSync(DIR, { recursive: true });
    const nomeIdx = resto.indexOf("--nome");
    const nome = nomeIdx >= 0 ? resto.splice(nomeIdx, 2)[1] : null;
    for (const id of resto) {
      const m = await (await get(API + id + "/")).json();
      const lic = `${m.license.toUpperCase()} ${m.license_version}`;
      if (!["cc0", "by", "by-sa", "pdm"].includes(m.license)) throw new Error(`Licença não permitida para monetização: ${lic}`);
      const ext = (m.filetype || path.extname(new URL(m.url).pathname).slice(1) || "wav").toLowerCase();
      const base = (nome || m.title.replace(/\.[a-z0-9]+$/i, "")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
      const dest = path.join(DIR, `${base}.${ext}`);
      fs.writeFileSync(dest, Buffer.from(await (await get(m.url)).arrayBuffer()));
      fs.appendFileSync(path.join(DIR, "CREDITOS.md"), `- ${path.basename(dest)} — "${m.title}" por ${m.creator} — ${lic} — ${m.foreign_landing_url}\n`);
      console.log(`ok ${path.basename(dest)} (${lic}, ${m.creator})`);
    }
  } else {
    console.error("uso: buscar <termo> [--cc0] | baixar <id>... [--nome apelido]");
    process.exit(1);
  }
})().catch((e) => { console.error("FALHOU:", e.message); process.exit(1); });
