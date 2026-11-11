// Exemplo de cues de um episódio (copie para <pasta-ep>/cues.js e ajuste). Os ids de segmento (s3b, s4...) e os
// arquivos de som vêm do seu episódio: aqui são só ilustrativos.
// ctx: K = kit da skill sound-effects, SONS = entity/sons, T = audio/tempos.json, sh(n) = início do shot n, dur, ids
const path = require("path");
module.exports = ({ K, SONS, T, sh }) => {
  const beat = T.s4.fim - 0.05;
  return [
    { desc: "capa: impacto suave", f: path.join(K, "impact.ogg"), t: 0.05, v: 0.5 },
    ...[2, 3, 6, 7].map((n) => ({ desc: `corte shot ${n}: whoosh`, f: path.join(K, "whoosh.ogg"), t: sh(n) - 0.07, v: 0.3 })),
    { desc: "lâmpada piscando (capa)", f: path.join(SONS, "lampada-piscando.mp3"), t: 0.1, d: sh(2) - 0.1, v: 0.18, loop: true, fi: 0.3, fo: 0.6 },
    { desc: "lâmpada piscando (corredor)", f: path.join(SONS, "lampada-piscando.mp3"), t: sh(3), d: sh(4) - sh(3), v: 0.3, loop: true, fi: 0.4, fo: 0.8 },
    { desc: "passos baixos (câmeras)", f: path.join(SONS, "passos-azulejo.mp3"), t: T.s3b.inicio + 1.0, d: T.s3c.inicio - T.s3b.inicio - 0.6, v: 0.1, fi: 1.0, fo: 0.4 },
    { desc: "passos fortes na palavra 'passos'", f: path.join(SONS, "passos-azulejo.mp3"), t: T.s3c.inicio, d: sh(4) - T.s3c.inicio + 0.9, v: 0.55, fi: 0.15, fo: 0.9 },
    { desc: "riser até as 03:00", f: path.join(K, "riser.ogg"), t: sh(4) - 2.0, v: 0.35 },
    { desc: "interfone toca (03:00)", f: path.join(SONS, "interfone-toca.mp3"), t: sh(4) + 0.3, d: 5.0, v: 0.16, fi: 0.05, fo: 1.5 },
    { desc: "impacto no beat preto", f: path.join(K, "impact.ogg"), t: beat, v: 1.0 },
    { desc: "batimentos (ele está atrás + espelho)", f: path.join(SONS, "batimentos.mp3"), t: sh(5), d: sh(7) - sh(5), v: 0.5, loop: true, fi: 1.5, fo: 1.2 },
    { desc: "cartão A: pop", f: path.join(K, "pop.ogg"), t: sh(7) + 0.6, v: 0.5 },
    { desc: "cartão B: pop", f: path.join(K, "pop.ogg"), t: sh(7) + 1.2, v: 0.5 },
  ];
};
