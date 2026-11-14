#!/usr/bin/env node
/**
 * gerar.js — cena de EXEMPLO: gera html/cena.html sincronizada com a narração.
 * Uso (da raiz do repositório): node <pasta-do-episodio>/html/gerar.js
 *
 * Lê ../audio/segmentos.json (texto de cada fala) e ../audio/tempos.json (início/fim de cada fala, gravado por
 * scripts/montar-narracao.js). Sem tempos.json, estima os tempos pelo tamanho do texto: dá para ver a cena antes
 * de ter voz. É um ponto de partida para copiar e redesenhar; a parte que vale manter é o esqueleto:
 *   - tudo é animação CSS com atraso em segundos (o render.js posiciona o tempo de cada animação por quadro)
 *   - legenda na tela desde o quadro 0, com a palavra de "destaque" em cor
 *   - cartão de votação entra junto da última fala da história; cartão SEGUE nos últimos 2 s
 */
const fs = require("fs");
const path = require("path");

// ---- o que mudar por canal / episódio ----
const CANAL = "@seucanal";
const COR = { fundo1: "#0b1530", fundo2: "#1d3557", destaque: "#ffd23f", texto: "#ffffff", contorno: "#0a0a12", alerta: "#e63946" };
const VOTO = { naFala: "g05", pergunta: "QUEM BATEU?", opcoes: ["A) Alguém da ilha", "B) O próprio farol"] };
const FOLGA_FINAL = 2; // segundos de cartão SEGUE depois da última fala

// ---- tempos ----
const dirAudio = path.join(__dirname, "..", "audio");
const segs = JSON.parse(fs.readFileSync(path.join(dirAudio, "segmentos.json"), "utf8"));
const ids = Object.keys(segs);
const texto = (id) => (typeof segs[id] === "string" ? segs[id] : segs[id].texto);
const fTempos = path.join(dirAudio, "tempos.json");
let S;
if (fs.existsSync(fTempos)) S = JSON.parse(fs.readFileSync(fTempos, "utf8")).segmentos;
else {
  console.warn("AVISO: sem audio/tempos.json; tempos estimados pelo tamanho do texto (rode narrar.js e montar-narracao.js).");
  S = {};
  let t = 0; // a primeira fala começa no segundo 0
  for (const id of ids) { const d = Math.max(1.2, texto(id).length * 0.07); S[id] = { inicio: +t.toFixed(3), fim: +(t + d).toFixed(3) }; t += d + 0.3; }
}
const fimFalas = S[ids[ids.length - 1]].fim;
const TOTAL = +(fimFalas + FOLGA_FINAL).toFixed(2);
const f3 = (x) => x.toFixed(3);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ---- legendas: uma por fala, da entrada dela até a entrada da próxima ----
let legendas = "";
ids.forEach((id, i) => {
  const ini = i === 0 ? 0 : S[id].inicio; // a primeira já está na tela no quadro 0
  const fim = i === ids.length - 1 ? fimFalas + 0.2 : S[ids[i + 1]].inicio;
  const d = segs[id].destaque;
  let html = esc(texto(id));
  if (d) html = html.replace(new RegExp(`(^|[^\\p{L}])(${d})(?![\\p{L}])`, "iu"), `$1<b>$2</b>`);
  legendas += `<p class="leg${i === 0 ? " primeira" : ""}" style="animation-delay:${f3(ini)}s;animation-duration:${f3(fim - ini)}s">${html}</p>\n`;
});

// ---- estrelas (posições fixas: nada de Math.random, o resultado tem que ser igual em todo render) ----
let estrelas = "";
for (let i = 0; i < 60; i++) {
  const x = (i * 197) % 1080, y = (i * 113) % 1000, r = 1.5 + (i % 3);
  estrelas += `<circle cx="${x}" cy="${y}" r="${r}" style="animation-delay:-${(i % 7) * 0.6}s"/>`;
}

const tVoto = S[VOTO.naFala] ? S[VOTO.naFala].inicio + 0.4 : fimFalas - 2;
const tSegue = TOTAL - 2;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>cena de exemplo</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1080px; height: 1920px; overflow: hidden; background: ${COR.fundo1}; font-family: "Arial Black", "Segoe UI Black", Impact, sans-serif; }
  .camada { position: absolute; inset: 0; }
  /* câmera: empurra devagar para dentro durante o vídeo inteiro; cada camada anda numa velocidade (parallax) */
  .ceu    { background: linear-gradient(${COR.fundo1}, ${COR.fundo2} 70%, #3a5a80); animation: cam1 ${TOTAL}s linear both; }
  .longe  { animation: cam2 ${TOTAL}s linear both; }
  .perto  { animation: cam3 ${TOTAL}s linear both; }
  @keyframes cam1 { to { transform: scale(1.06); } }
  @keyframes cam2 { to { transform: scale(1.14) translateY(-20px); } }
  @keyframes cam3 { to { transform: scale(1.28) translateY(-60px); } }
  .ceu svg circle { fill: #fff; animation: pisca 4.2s ease-in-out infinite; }
  @keyframes pisca { 50% { opacity: .25; } }
  /* o farol: a luz gira e apaga/acende em momentos da história */
  .feixe { transform-origin: 540px 905px; animation: gira 7s linear infinite; }
  @keyframes gira { from { transform: rotate(-38deg); } 50% { transform: rotate(38deg); } to { transform: rotate(-38deg); } }
  .luz { animation: apaga ${TOTAL}s linear both; }
  @keyframes apaga { 0%, 3% { opacity: 1; } 6%, 72% { opacity: .08; } 78%, 100% { opacity: 1; } }
  .porta { fill: #2b1a12; animation: abre ${TOTAL}s linear both; }
  @keyframes abre { 0%, 74% { fill: #2b1a12; } 80%, 100% { fill: ${COR.destaque}; } }
  .mar { animation: onda 5s ease-in-out infinite; }
  @keyframes onda { 50% { transform: translateX(-40px); } }
  .vinheta { background: radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.6)); }
  .grao { opacity: .09; mix-blend-mode: overlay; }

  /* legendas grandes, com contorno, entrada animada */
  .leg { position: absolute; left: 70px; right: 70px; top: 1400px; text-align: center; font-size: 78px; line-height: 1.12;
         color: ${COR.texto}; -webkit-text-stroke: 14px ${COR.contorno}; paint-order: stroke fill; opacity: 0;
         animation-name: leg; animation-timing-function: linear; animation-fill-mode: both; }
  .leg b { color: ${COR.destaque}; }
  @keyframes leg { 0% { opacity: 0; transform: translateY(40px) scale(.94); } 4% { opacity: 1; transform: none; } 96% { opacity: 1; } 100% { opacity: 0; } }
  .leg.primeira { animation-name: leg0; } /* visível já no quadro 0 */
  @keyframes leg0 { 0%, 96% { opacity: 1; } 100% { opacity: 0; } }

  .voto { position: absolute; left: 90px; right: 90px; top: 250px; opacity: 0; animation: entra .5s ease-out ${f3(tVoto)}s both; }
  .voto h2 { font-size: 92px; text-align: center; color: ${COR.contorno}; background: ${COR.destaque}; border-radius: 28px; padding: 26px; }
  .voto li { list-style: none; margin-top: 22px; font-size: 62px; color: ${COR.texto}; background: rgba(10,10,18,.82); border: 6px solid ${COR.destaque}; border-radius: 24px; padding: 22px 34px; }
  .segue { position: absolute; left: 140px; right: 140px; top: 1690px; text-align: center; font-size: 70px; color: #fff; background: ${COR.alerta};
           border-radius: 60px; padding: 30px; opacity: 0; animation: entra .4s ease-out ${f3(tSegue)}s both; }
  @keyframes entra { from { opacity: 0; transform: translateY(60px) scale(.9); } to { opacity: 1; transform: none; } }
</style></head>
<body>
  <div class="camada ceu"><svg viewBox="0 0 1080 1920">${estrelas}<circle cx="820" cy="330" r="110" style="fill:#f4f1de;animation:none"/><circle cx="780" cy="300" r="100" style="fill:${COR.fundo1};animation:none;opacity:.55"/></svg></div>
  <div class="camada longe"><svg viewBox="0 0 1080 1920">
    <g class="luz"><polygon class="feixe" points="540,905 -500,560 -500,1010" fill="${COR.destaque}" opacity=".35"/><circle cx="540" cy="905" r="46" fill="${COR.destaque}"/></g>
    <path d="M440 1330 L490 950 H590 L640 1330 Z" fill="#e8e4d8"/><path d="M462 1160 L476 1050 H604 L618 1160 Z" fill="${COR.alerta}"/>
    <rect x="474" y="860" width="132" height="92" rx="10" fill="#22324f" stroke="#e8e4d8" stroke-width="10"/><path d="M462 862 L540 790 L618 862 Z" fill="${COR.alerta}"/>
    <rect class="porta" x="508" y="1230" width="64" height="100" rx="30"/>
  </svg></div>
  <div class="camada perto"><svg viewBox="0 0 1080 1920">
    <path d="M-100 1420 Q200 1250 540 1320 T1180 1400 V1920 H-100 Z" fill="#101a2e"/>
    <g class="mar"><path d="M-200 1560 Q-60 1520 80 1560 T360 1560 T640 1560 T920 1560 T1200 1560 T1480 1560 V1920 H-200 Z" fill="#16325c"/>
    <path d="M-200 1660 Q-60 1625 80 1660 T360 1660 T640 1660 T920 1660 T1200 1660 T1480 1660 V1920 H-200 Z" fill="#0d2242"/></g>
  </svg></div>
  <div class="camada vinheta"></div>
  <svg class="camada grao" viewBox="0 0 1080 1920"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/></filter><rect width="1080" height="1920" filter="url(#g)"/></svg>

  ${legendas}
  <div class="voto"><h2>${esc(VOTO.pergunta)}</h2><ul>${VOTO.opcoes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div>
  <div class="segue">SEGUE ${esc(CANAL)}</div>
</body></html>
`;

const saida = path.join(__dirname, "cena.html");
fs.writeFileSync(saida, html);
const rel = (p) => path.relative(process.cwd(), p).replace(/\\/g, "/");
console.log(`OK -> ${rel(saida)} (${TOTAL}s)`);
console.log(`Render: node scripts/render.js ${rel(saida)} --duracao ${TOTAL} --saida ${rel(path.join(__dirname, "..", "final", "ep01-v1.mp4"))}` +
  (fs.existsSync(fTempos) ? ` --audio <narracao com apad de ${FOLGA_FINAL}s>` : ""));
