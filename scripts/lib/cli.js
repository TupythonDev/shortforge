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

/**
 * Tamanho do vídeo a partir de --largura/--altura ou do atalho --horizontal (1920x1080). Padrão: vertical 1080x1920.
 * Devolve { largura, altura } ou { erro } (yuv420p exige medidas pares).
 */
function tamanhoDoVideo(opts) {
  const padrao = opts.horizontal ? [1920, 1080] : [1080, 1920];
  const largura = opts.largura != null ? Number(opts.largura) : padrao[0];
  const altura = opts.altura != null ? Number(opts.altura) : padrao[1];
  const ok = (n) => Number.isInteger(n) && n >= 64 && n <= 7680 && n % 2 === 0;
  if (!ok(largura) || !ok(altura)) return { erro: `ERRO: tamanho inválido ${opts.largura ?? largura}x${opts.altura ?? altura}; use números pares entre 64 e 7680 (ex.: --largura 1920 --altura 1080).` };
  return { largura, altura };
}

module.exports = { args, falhar, arquivoObrigatorio, probeDuracao, tamanhoDoVideo };
