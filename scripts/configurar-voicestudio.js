#!/usr/bin/env node
/**
 * configurar-voicestudio.js — aponta o MCP do VoiceStudio para ESTE repositório, onde quer que ele esteja.
 * Uso: node scripts/configurar-voicestudio.js            (só mostra o atual e o esperado; não muda nada)
 *      node scripts/configurar-voicestudio.js --aplicar  (grava as variáveis de usuário; Windows)
 *
 * O VoiceStudio aceita UM diretório base (OMNIVOICE_MCP_BASE_PATH) e recebe/entrega arquivos por caminho
 * RELATIVO a ele (ex.: canais/<canal>/series/<serie>/epXX/audio/x.wav). Base = raiz do repositório:
 * o caminho muda de PC para PC, o que está dentro dele não. Rodar 1x por máquina e reabrir o VoiceStudio.
 */
const path = require("path");
const { execFileSync } = require("child_process");

const base = path.resolve(__dirname, "..");
const esperado = { OMNIVOICE_MCP_BASE_PATH: base, OMNIVOICE_MCP_OUTPUT_MODE: "files" };
const aplicar = process.argv.includes("--aplicar");

for (const [nome, valor] of Object.entries(esperado)) {
  const atual = process.env[nome] || "(vazio)";
  console.log(`${nome}\n  atual:    ${atual}\n  esperado: ${valor}${atual === valor ? "  [ok]" : ""}`);
}

if (!aplicar) {
  console.log("\nNada foi alterado. Para gravar: node scripts/configurar-voicestudio.js --aplicar");
  process.exit(0);
}

if (process.platform === "win32") {
  for (const [nome, valor] of Object.entries(esperado)) execFileSync("setx", [nome, valor], { stdio: "ignore" });
  console.log("\nGravado nas variáveis de usuário. Feche o VoiceStudio e abra de novo (de um terminal novo, ou após logoff).");
} else {
  console.log("\nNeste sistema, adicione ao perfil do shell (~/.bashrc ou ~/.zshrc):");
  for (const [nome, valor] of Object.entries(esperado)) console.log(`export ${nome}="${valor}"`);
}
