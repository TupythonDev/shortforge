const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// pega erro de sintaxe e uso quebrado em qualquer script (node --check)
const dir = path.join(__dirname, "..", "scripts");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".js"))) {
  test(`sintaxe de scripts/${f}`, () => {
    const r = spawnSync(process.execPath, ["--check", path.join(dir, f)], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, r.stderr);
  });
}

test("render.js sem argumento falha com mensagem (não aceita a pasta atual como cena)", () => {
  const r = spawnSync(process.execPath, [path.join(dir, "render.js")], { encoding: "utf8" });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /informe/);
});

for (const f of ["montar-narracao.js", "mixar-sons.js"]) {
  test(`${f} sem argumento falha com mensagem de uso`, () => {
    const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: "utf8" });
    assert.notStrictEqual(r.status, 0);
    assert.match(r.stderr, /informe/);
  });
}
