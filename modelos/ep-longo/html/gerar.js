#!/usr/bin/env node
/**
 * gerar.js — cena de EXEMPLO para vídeo LONGO e HORIZONTAL (16:9, 1920x1080): gera html/cena.html
 * sincronizada com a narração. Uso (da raiz do repositório): node <pasta-do-episodio>/html/gerar.js
 *
 * Lê ../audio/segmentos.json e ../audio/tempos.json (gravado por scripts/montar-narracao.js). Sem tempos.json,
 * estima os tempos pelo tamanho do texto: dá para ver a cena antes de ter voz. Com "palavras" no tempos.json
 * (npm run palavras), a palavra falada acende na legenda. O que cada segmento aceita, além de "texto":
 *   - "cap":     título de capítulo; o 1º segmento do capítulo leva este campo (o 1º do vídeo é o capítulo 1)
 *   - "cena":    imagem de ../assets/ que fica na tela dali em diante, com zoom lento (vale até a próxima "cena")
 *   - "destaque": palavra da legenda em cor (usado só quando não há tempos por palavra)
 * Esqueleto que vale manter: tudo é animação CSS com atraso em segundos (o render.js posiciona o tempo de cada
 * animação por quadro) · texto na tela desde o quadro 0 · cartão final nos últimos segundos.
 * Imagens: use só o que você pode usar (própria, licença livre ou uso transformativo com comentário). Ver docs/publicacao.md.
 * Ao fim, imprime os capítulos em mm:ss para colar na descrição do YouTube (precisa de 3+ capítulos de 10 s ou mais).
 */
const fs = require("fs");
const path = require("path");

// ---- o que mudar por canal / vídeo ----
const CANAL = "@seucanal";
const TITULO = "TÍTULO DO VÍDEO";
const COR = { fundo1: "#0a0f1e", fundo2: "#1b2a4a", destaque: "#ffd23f", texto: "#ffffff", contorno: "#06080f", alerta: "#e63946" };
const FINAL = { chamada: "GOSTOU? INSCREVA-SE", sub: "e veja o próximo vídeo" };
const LARGURA = 1920, ALTURA = 1080;

// ---- dados ----
const dirAudio = path.join(__dirname, "..", "audio");
const dirAssets = path.join(__dirname, "..", "assets");
const segs = JSON.parse(fs.readFileSync(path.join(dirAudio, "segmentos.json"), "utf8"));
const ids = Object.keys(segs);
const cfg = (id) => (typeof segs[id] === "string" ? { texto: segs[id] } : segs[id]);
const fTempos = path.join(dirAudio, "tempos.json");
let S;
if (fs.existsSync(fTempos)) S = JSON.parse(fs.readFileSync(fTempos, "utf8")).segmentos;
else {
  console.warn("AVISO: sem audio/tempos.json; tempos estimados pelo tamanho do texto (rode narrar.js e montar-narracao.js).");
  S = {};
  let t = 0; // a primeira fala começa no segundo 0
  for (const id of ids) { const d = Math.max(1.2, cfg(id).texto.length * 0.07); S[id] = { inicio: +t.toFixed(3), fim: +(t + d).toFixed(3) }; t += d + 0.3; }
}
const fimFalas = S[ids[ids.length - 1]].fim;
const TOTAL = +(fimFalas + 3).toFixed(2); // 3 s de folga depois da última fala (o cartão final fica na tela)
const f3 = (x) => x.toFixed(3);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ---- legendas: uma por fala, da entrada dela até a entrada da próxima ----
let legendas = "";
ids.forEach((id, i) => {
  const c = cfg(id);
  const ini = i === 0 ? 0 : S[id].inicio;
  const fim = i === ids.length - 1 ? fimFalas + 0.2 : S[ids[i + 1]].inicio;
  if (c.texto.length > 150) console.warn(`AVISO: ${id} tem ${c.texto.length} caracteres; a legenda fica com 3+ linhas. Divida em dois segmentos.`);
  let html;
  const pal = S[id].palavras;
  if (pal && pal.length) {
    // cada palavra acende quando é falada (animação com atraso absoluto, como o resto da cena)
    html = pal.map((w) => `<span class="w" style="animation-delay:${f3(w.inicio)}s;animation-duration:${f3(Math.max(0.05, w.fim - w.inicio))}s">${esc(w.p)}</span>`).join(" ");
  } else {
    html = esc(c.texto);
    if (c.destaque) html = html.replace(new RegExp(`(^|[^\\p{L}])(${c.destaque})(?![\\p{L}])`, "iu"), `$1<b>$2</b>`);
  }
  legendas += `<p class="leg${i === 0 ? " primeira" : ""}" style="animation-delay:${f3(ini)}s;animation-duration:${f3(fim - ini)}s">${html}</p>\n`;
});

// ---- capítulos ----
const capitulos = ids.filter((id) => cfg(id).cap).map((id, n) => ({ id, n: n + 1, titulo: cfg(id).cap, t: id === ids[0] ? 0 : S[id].inicio }));
if (!capitulos.length || capitulos[0].id !== ids[0]) console.warn('AVISO: o 1º segmento deve ter "cap" (o vídeo começa no capítulo 1).');
const cards = capitulos.map((c, i) => `<div class="cap${i === 0 ? " primeiro" : ""}" style="animation-delay:${f3(c.t)}s"><small>${i === 0 ? esc(TITULO) + " · " : ""}CAPÍTULO ${c.n}</small><strong>${esc(c.titulo)}</strong></div>`).join("\n");

// ---- imagens de fundo: cada "cena" vale até a próxima ----
const blocos = ids.filter((id) => cfg(id).cena).map((id) => ({ arq: cfg(id).cena, t: id === ids[0] ? 0 : S[id].inicio }));
let fundos = "";
blocos.forEach((b, i) => {
  if (!fs.existsSync(path.join(dirAssets, b.arq))) { console.warn(`AVISO: assets/${b.arq} não existe; fica o fundo de grade.`); return; }
  const fim = i + 1 < blocos.length ? blocos[i + 1].t : TOTAL;
  const lado = i % 2 ? "kbb" : "kba"; // alterna a direção do zoom
  fundos += `<div class="img${b.t === 0 ? " primeira" : ""}" style="animation-delay:${f3(b.t)}s"><div style="background-image:url('../assets/${encodeURI(b.arq)}');animation-name:${lado};animation-delay:${f3(b.t)}s;animation-duration:${f3(fim - b.t + 0.5)}s"></div></div>\n`;
});

const tFinal = S[ids[ids.length - 1]].inicio;
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>cena longa horizontal</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${LARGURA}px; height: ${ALTURA}px; overflow: hidden; background: ${COR.fundo1}; font-family: "Arial Black", "Segoe UI Black", Impact, sans-serif; }
  .camada { position: absolute; inset: 0; }
  /* fundo sem imagem: degradê com uma grade que anda devagar */
  .base { background: linear-gradient(135deg, ${COR.fundo1}, ${COR.fundo2}); }
  .grade { background-image: linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px);
           background-size: 120px 120px; animation: anda ${TOTAL}s linear both; }
  @keyframes anda { to { background-position: -600px -300px; } }

  .img { position: absolute; inset: 0; overflow: hidden; animation: entra .5s ease-out both; }
  .img.primeira { animation: none; }
  .img > div { position: absolute; inset: -6%; background-size: cover; background-position: center; animation-timing-function: linear; animation-fill-mode: both; }
  @keyframes kba { from { transform: scale(1) translate(0, 0); } to { transform: scale(1.12) translate(-2%, -1%); } }
  @keyframes kbb { from { transform: scale(1.12) translate(2%, 1%); } to { transform: scale(1) translate(0, 0); } }
  @keyframes entra { from { opacity: 0; } to { opacity: 1; } }
  .vinheta { background: radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,.55)), linear-gradient(transparent 62%, rgba(0,0,0,.75)); }

  /* legenda grande embaixo, com contorno; a palavra falada acende */
  .leg { position: absolute; left: 150px; right: 150px; bottom: 80px; text-align: center; font-size: 58px; line-height: 1.15;
         color: ${COR.texto}; -webkit-text-stroke: 10px ${COR.contorno}; paint-order: stroke fill; opacity: 0;
         animation-name: leg; animation-timing-function: linear; animation-fill-mode: both; }
  .leg b { color: ${COR.destaque}; }
  .leg .w { animation-name: acende; animation-timing-function: linear; animation-fill-mode: none; }
  @keyframes acende { from, to { color: ${COR.destaque}; } }
  @keyframes leg { 0% { opacity: 0; transform: translateY(20px); } 3% { opacity: 1; transform: none; } 97% { opacity: 1; } 100% { opacity: 0; } }
  .leg.primeira { animation-name: leg0; }
  @keyframes leg0 { 0%, 97% { opacity: 1; } 100% { opacity: 0; } }

  /* cartão de capítulo: canto superior esquerdo, 5 s */
  .cap { position: absolute; left: 80px; top: 70px; padding: 18px 34px; background: rgba(6,8,15,.82); border-left: 10px solid ${COR.destaque}; border-radius: 10px;
         opacity: 0; animation: capa 5s ease-in-out both; }
  .cap small { display: block; font-size: 26px; color: ${COR.destaque}; letter-spacing: 2px; }
  .cap strong { display: block; margin-top: 6px; font-size: 50px; color: ${COR.texto}; }
  .cap.primeiro { animation-name: capa0; }
  @keyframes capa { 0% { opacity: 0; transform: translateX(-40px); } 8%, 88% { opacity: 1; transform: none; } 100% { opacity: 0; } }
  @keyframes capa0 { 0%, 88% { opacity: 1; } 100% { opacity: 0; } }

  .barra { position: absolute; left: 0; bottom: 0; height: 8px; width: 100%; background: ${COR.destaque}; transform-origin: 0 50%; animation: cresce ${TOTAL}s linear both; }
  @keyframes cresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* cartão final: entra na última fala e fica até o fim */
  .fim { position: absolute; inset: 0; background: rgba(6,8,15,.72); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
         opacity: 0; animation: entra .6s ease-out ${f3(tFinal)}s both; }
  .fim h2 { font-size: 110px; color: ${COR.destaque}; -webkit-text-stroke: 12px ${COR.contorno}; paint-order: stroke fill; }
  .fim p { margin-top: 24px; font-size: 56px; color: ${COR.texto}; }
  .fim .canal { margin-top: 40px; padding: 20px 56px; border-radius: 60px; background: ${COR.alerta}; color: #fff; font-size: 64px; }
</style></head>
<body>
  <div class="camada base"></div>
  <div class="camada grade"></div>
  ${fundos}
  <div class="camada vinheta"></div>
  ${cards}
  <div class="fim"><h2>${esc(FINAL.chamada)}</h2><p>${esc(FINAL.sub)}</p><div class="canal">${esc(CANAL)}</div></div>
  ${legendas}
  <div class="barra"></div>
</body></html>
`;

const saida = path.join(__dirname, "cena.html");
fs.writeFileSync(saida, html);
const rel = (p) => path.relative(process.cwd(), p).replace(/\\/g, "/");
console.log(`OK -> ${rel(saida)} (${TOTAL}s, ${capitulos.length} capítulos, ${blocos.length} imagens)`);
console.log(`Render: node scripts/render.js ${rel(saida)} --horizontal --duracao ${TOTAL} --saida ${rel(path.join(__dirname, "..", "final", "ep01-v1.mp4"))}` +
  (fs.existsSync(fTempos) ? " --audio <narracao com apad de 3s>" : ""));
console.log("\nCapítulos para a descrição do YouTube:\n" + capitulos.map((c) => `${mmss(c.t)} ${c.titulo}`).join("\n"));
