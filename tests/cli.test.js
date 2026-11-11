const test = require("node:test");
const assert = require("node:assert");
const { args } = require("../scripts/lib/cli");

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
