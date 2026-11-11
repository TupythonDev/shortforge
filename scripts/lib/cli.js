// cli.js — utilitários comuns dos scripts (antes copiados em cada arquivo)
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

/** Lê --chave valor / --flag. Chaves em `booleanas` nunca consomem o argumento seguinte. */
function args(argv, { booleanas = [] } = {}) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const chave = a.slice(2);
      const proximo = argv[i + 1];
      const consome = !booleanas.includes(chave) && proximo !== undefined && !proximo.startsWith("--");
      opts[chave] = consome ? argv[++i] : true;
    } else opts._.push(a);
  }
  return opts;
}

function falhar(msg) {
  console.error(msg);
  process.exit(1);
}

/** Exige um caminho de ARQUIVO existente (path.resolve("") apontava para a pasta atual e passava na checagem). */
function arquivoObrigatorio(valor, rotulo) {
  if (!valor || valor === true) falhar(`ERRO: informe ${rotulo}.`);
  const p = path.resolve(String(valor));
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) falhar(`ERRO: arquivo não encontrado: ${p}`);
  return p;
}

function probeDuracao(arquivo) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", arquivo], {
    windowsHide: true,
  }).toString();
  return parseFloat(JSON.parse(out).format.duration);
}

module.exports = { args, falhar, arquivoObrigatorio, probeDuracao };
