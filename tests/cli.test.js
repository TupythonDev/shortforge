const test = require("node:test");
const assert = require("node:assert");
const { args, tamanhoDoVideo } = require("../scripts/lib/cli");

test("tamanhoDoVideo: padrão vertical, --horizontal e medidas explícitas", () => {
  assert.deepStrictEqual(tamanhoDoVideo({}), { largura: 1080, altura: 1920 });
  assert.deepStrictEqual(tamanhoDoVideo({ horizontal: true }), { largura: 1920, altura: 1080 });
  assert.deepStrictEqual(tamanhoDoVideo({ largura: "2560", altura: "1440" }), { largura: 2560, altura: 1440 });
});

test("tamanhoDoVideo: recusa medida ímpar, fora do limite ou não numérica", () => {
  for (const o of [{ largura: "1921" }, { altura: "abc" }, { largura: "10" }, { largura: "9000" }]) assert.ok(tamanhoDoVideo(o).erro, JSON.stringify(o));
});

test("args: flags com valor e argumentos posicionais", () => {
  const o = args(["video.mp4", "--titulo", "Ep 1", "--dur", "45"]);
  assert.deepStrictEqual(o._, ["video.mp4"]);
  assert.strictEqual(o.titulo, "Ep 1");
  assert.strictEqual(o.dur, "45");
});

test("args: flag booleana sem valor", () => {
  assert.strictEqual(args(["--publicaAgora"]).publicaAgora, true);
});

test("args: chave em booleanas não engole o argumento seguinte", () => {
  const o = args(["--sem-facebook", "video.mp4"], { booleanas: ["sem-facebook"] });
  assert.strictEqual(o["sem-facebook"], true);
  assert.deepStrictEqual(o._, ["video.mp4"]);
});

test("args: sem a lista de booleanas o comportamento antigo (consome) é mantido", () => {
  assert.strictEqual(args(["--x", "y"]).x, "y");
});
