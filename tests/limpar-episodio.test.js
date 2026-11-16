const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { planejar, versao } = require("../scripts/limpar-episodio");

function episodio() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "ep-"));
  const w = (rel, conteudo = "x") => { const p = path.join(d, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, conteudo); };
  for (const t of ["s01-t1.wav", "s01-t2.wav", "s01-t3.wav", "s02-t1.wav", "s02-t2.wav"]) w("audio/segs/" + t);
  w("audio/tempos.json", JSON.stringify({ segmentos: { s01: { take: "s01-t2.wav" }, s02: { take: "s02-t1.wav" } } }));
  w("audio/escolhas.json", JSON.stringify({ s02: { take: "s02-t2.wav" } }));
  w("audio/narracao.wav"); w("audio/_asr.json"); w("audio/narrar.log"); w("audio/_v1-inteiros/a.wav");
  w("html/gerar.js"); w("html/cena.html"); w("roteiro.md"); w("cues.js");
  for (const f of ["ep01-v1-som.mp4", "ep01-v1-nosom.mp4", "ep01-v2-som.mp4", "ep01-v2-nosom.mp4", "ep01-v2-upload.mp4", "ep01-v2-som-preview.mp4", "capa.jpg", "CREDITS.txt", "checks/a.png", "chk.jpg"]) w("final/" + f);
  return d;
}
const nomes = (plano) => plano.itens.map((i) => i.rel).sort();

test("versao lê o número da versão do nome", () => {
  assert.strictEqual(versao("ep02-v3-upload.mp4"), 3);
  assert.strictEqual(versao("capa.jpg"), null);
});

test("padrão: só takes não escolhidos, intermediários, cena regerada e temporários", () => {
  const d = episodio();
  const p = planejar(d);
  assert.deepStrictEqual(nomes(p), [
    "audio/_asr.json", "audio/narrar.log", "audio/segs/s01-t1.wav", "audio/segs/s01-t3.wav",
    "final/checks", "final/chk.jpg", "final/ep01-v1-nosom.mp4", "final/ep01-v2-nosom.mp4", "final/ep01-v2-som-preview.mp4", "html/cena.html",
  ].sort());
  assert.ok(!nomes(p).includes("audio/segs/s02-t2.wav"), "take em escolhas.json fica");
  assert.ok(p.intocadas.includes("audio/_v1-inteiros"));
  assert.strictEqual(p.semFinal, false);
});

test("--versoes-antigas leva só as versões abaixo da mais nova", () => {
  const nomesV = nomes(planejar(episodio(), { versoesAntigas: true }));
  assert.ok(nomesV.includes("final/ep01-v1-som.mp4"));
  assert.ok(!nomesV.includes("final/ep01-v2-som.mp4") && !nomesV.includes("final/ep01-v2-upload.mp4"));
  assert.ok(!nomesV.includes("final/capa.jpg") && !nomesV.includes("final/CREDITS.txt"));
});

test("--takes-escolhidos leva a pasta segs inteira e nunca a narração", () => {
  const n = nomes(planejar(episodio(), { takesEscolhidos: true }));
  assert.ok(n.includes("audio/segs"));
  assert.ok(!n.some((x) => x.includes("narracao.wav") || x.includes("tempos.json") || x.endsWith("roteiro.md") || x.endsWith("gerar.js")));
});

test("sem tempos.json os takes ficam; sem vídeo final sobrando, avisa", () => {
  const d = episodio();
  fs.rmSync(path.join(d, "audio", "tempos.json"));
  const p = planejar(d);
  assert.ok(!nomes(p).some((x) => x.startsWith("audio/segs/")));
  assert.ok(p.avisos.length);
  const e = fs.mkdtempSync(path.join(os.tmpdir(), "ep-"));
  fs.mkdirSync(path.join(e, "final"));
  fs.writeFileSync(path.join(e, "final", "ep01-v1-nosom.mp4"), "x");
  assert.strictEqual(planejar(e).semFinal, true);
});

test("planejar não apaga nada", () => {
  const d = episodio();
  planejar(d, { versoesAntigas: true, takesEscolhidos: true });
  assert.ok(fs.existsSync(path.join(d, "audio", "segs", "s01-t1.wav")));
});
