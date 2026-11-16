#!/usr/bin/env node
/**
 * limpar-episodio.js <pasta-do-episodio> [--apagar] [--versoes-antigas] [--takes-escolhidos] [--forcar]
 * Tira de um episódio concluído o que dá para refazer ou já não serve. SIMULA por padrão: só lista o que sairia e
 * quanto espaço libera; nada é apagado sem --apagar (regra do projeto: nada some sem o dono confirmar).
 *
 * Entra na lista sempre (refazível ou descartável):
 *   - audio/segs/: takes de voz que NÃO foram escolhidos (os citados em tempos.json e escolhas.json ficam)
 *   - final/: versões intermediárias (-nosom, -silent, -preview, -som-preview) e a pasta checks/ e chk*.jpg
 *   - html/cena.html, quando o gerar.js existe (a cena é regerada por ele)
 *   - audio/_asr.json, audio/*.log, tmp/ e *.tmp
 * Só com a opção:
 *   --versoes-antigas    final/ de versões anteriores à mais nova (epXX-vN-*: vídeo, som, upload)
 *   --takes-escolhidos   audio/segs/ inteira (a narracao.wav e o tempos.json ficam; remontar a voz exigiria narrar de novo)
 * Nunca toca: roteiro, publicacao.md, cues.js, gerar.js e demais html/, assets/, narracao*.wav, tempos.json,
 * segmentos.json, escolhas.json, sfx-*, capa, CREDITS.txt, o vídeo mais novo, nem pastas começando com "_".
 * Recusa rodar se final/ não tiver nenhum vídeo que sobraria (episódio ainda sem versão pronta), salvo --forcar.
 */
const fs = require("fs");
const path = require("path");
const { args, falhar } = require("./lib/cli");

const MB = (b) => (b / 1048576).toFixed(1) + " MB";

function tamanho(p) {
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.size;
  return fs.readdirSync(p).reduce((s, n) => s + tamanho(path.join(p, n)), 0);
}

const lerJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const ls = (p) => (fs.existsSync(p) ? fs.readdirSync(p) : []);
const versao = (nome) => { const m = /-v(\d+)(?=[-.])/.exec(nome); return m ? Number(m[1]) : null; };
const INTERMEDIARIO = /(-nosom|-silent|-preview)\.mp4$/i;

/** Monta o plano sem mexer em nada: { itens: [{ rel, motivo, bytes, dir }], avisos, semFinal }. */
function planejar(pasta, opts = {}) {
  const itens = [];
  const avisos = [];
  const rel = (p) => path.relative(pasta, p).replace(/\\/g, "/");
  const add = (p, motivo) => itens.push({ rel: rel(p), abs: p, motivo, bytes: tamanho(p), dir: fs.statSync(p).isDirectory() });

  // takes de voz
  const dSegs = path.join(pasta, "audio", "segs");
  if (fs.existsSync(dSegs)) {
    if (opts.takesEscolhidos) add(dSegs, "takes de voz (a narração montada e o tempos.json ficam)");
    else {
      const tempos = lerJson(path.join(pasta, "audio", "tempos.json"));
      const esc = lerJson(path.join(pasta, "audio", "escolhas.json")) || {};
      if (!tempos) avisos.push("audio/tempos.json não existe: não dá para saber quais takes foram usados, então os takes ficam");
      else {
        const usados = new Set([...Object.values(tempos.segmentos || {}).map((s) => s.take), ...Object.values(esc).map((s) => s && s.take)].filter(Boolean));
        for (const f of ls(dSegs)) if (/-t\d+\.wav$/i.test(f) && !usados.has(f)) add(path.join(dSegs, f), "take de voz não escolhido");
      }
    }
  }

  // final/
  const dFinal = path.join(pasta, "final");
  const arqs = ls(dFinal);
  const videos = arqs.filter((f) => /\.mp4$/i.test(f));
  const maisNova = Math.max(0, ...videos.map(versao).filter((v) => v != null));
  const saem = new Set();
  for (const f of arqs) {
    const p = path.join(dFinal, f);
    if (f === "checks" || /^chk.*\.jpg$/i.test(f)) { add(p, "imagem de conferência"); saem.add(f); }
    else if (INTERMEDIARIO.test(f)) { add(p, "vídeo intermediário"); saem.add(f); }
    else if (opts.versoesAntigas && versao(f) != null && versao(f) < maisNova && /\.(mp4|json|jpg)$/i.test(f)) { add(p, `versão anterior (a mais nova é v${maisNova})`); saem.add(f); }
  }
  const semFinal = !videos.some((f) => !saem.has(f));

  // cena gerada, temporários
  if (fs.existsSync(path.join(pasta, "html", "gerar.js")) && fs.existsSync(path.join(pasta, "html", "cena.html"))) add(path.join(pasta, "html", "cena.html"), "cena regerada pelo gerar.js");
  for (const f of ls(path.join(pasta, "audio"))) if (f === "_asr.json" || /\.log$/i.test(f)) add(path.join(pasta, "audio", f), "temporário");
  for (const f of ls(pasta)) if (f === "tmp" || /\.tmp$/i.test(f)) add(path.join(pasta, f), "temporário");

  const pastasSoltas = [...ls(pasta), ...ls(path.join(pasta, "audio")).map((f) => "audio/" + f), ...ls(dFinal).map((f) => "final/" + f)]
    .filter((n) => /(^|\/)_/.test(n) && fs.statSync(path.join(pasta, n)).isDirectory());
  return { itens, avisos, semFinal, intocadas: pastasSoltas };
}

function main() {
  const opts = args(process.argv.slice(2), { booleanas: ["apagar", "versoes-antigas", "takes-escolhidos", "forcar"] });
  const pasta = opts._[0] && path.resolve(opts._[0]);
  if (!pasta || !fs.existsSync(pasta) || !fs.statSync(pasta).isDirectory()) falhar("ERRO: informe a pasta do episódio. Uso: node scripts/limpar-episodio.js <pasta-do-episodio> [--apagar] [--versoes-antigas] [--takes-escolhidos]");
  if (!["roteiro.md", "audio", "final"].some((n) => fs.existsSync(path.join(pasta, n)))) falhar(`ERRO: ${pasta} não parece uma pasta de episódio (sem roteiro.md, audio/ nem final/).`);

  const plano = planejar(pasta, { versoesAntigas: opts["versoes-antigas"], takesEscolhidos: opts["takes-escolhidos"] });
  if (plano.semFinal && !opts.forcar) falhar("ERRO: final/ não tem nenhum vídeo que ficaria depois da limpeza (episódio sem versão pronta?). Use --forcar se for isso mesmo.");
  plano.avisos.forEach((a) => console.warn("AVISO: " + a));

  if (!plano.itens.length) return console.log("Nada para limpar.");
  const porMotivo = new Map();
  for (const i of plano.itens) porMotivo.set(i.motivo, [...(porMotivo.get(i.motivo) || []), i]);
  for (const [motivo, lista] of porMotivo) {
    console.log(`\n${motivo}: ${lista.length} · ${MB(lista.reduce((s, i) => s + i.bytes, 0))}`);
    lista.slice(0, 8).forEach((i) => console.log(`  ${i.rel}${i.dir ? "/" : ""}  (${MB(i.bytes)})`));
    if (lista.length > 8) console.log(`  ... e mais ${lista.length - 8}`);
  }
  const total = plano.itens.reduce((s, i) => s + i.bytes, 0);
  if (plano.intocadas.length) console.log(`\nNão mexi nas pastas: ${plano.intocadas.join(", ")} (começam com "_")`);
  console.log(`\nTotal: ${plano.itens.length} itens, ${MB(total)}`);
  if (!opts.apagar) return console.log("SIMULAÇÃO: nada foi apagado. Para apagar de verdade, rode de novo com --apagar.");

  for (const i of plano.itens) fs.rmSync(i.abs, { recursive: true, force: true });
  console.log(`Apagado: ${plano.itens.length} itens, ${MB(total)} liberados.`);
}

if (require.main === module) main();
module.exports = { planejar, versao };
