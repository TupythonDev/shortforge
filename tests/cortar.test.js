const test = require("node:test");
const assert = require("node:assert");
const { PERFIS, duracaoDoCorte } = require("../scripts/cortar");

test("master de 64,3s não é cortado em nenhuma plataforma (preserva CTA/votação)", () => {
  for (const p of ["tiktok", "yt", "reels"]) assert.strictEqual(duracaoDoCorte(PERFIS[p], 64.29), 64.29);
});

test("master maior que o máximo da plataforma usa a duração-alvo", () => {
  assert.strictEqual(duracaoDoCorte(PERFIS.tiktok, 120), 75);
  assert.strictEqual(duracaoDoCorte(PERFIS.reels, 120), 45);
});

test("--dur explícito sempre vence, limitado ao tamanho do master", () => {
  assert.strictEqual(duracaoDoCorte(PERFIS.yt, 64.29, "45"), 45);
  assert.strictEqual(duracaoDoCorte(PERFIS.yt, 30, "45"), 30);
});
