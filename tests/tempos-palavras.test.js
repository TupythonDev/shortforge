const test = require("node:test");
const assert = require("node:assert");
const { alinhar, palavrasDoTexto } = require("../scripts/tempos-palavras");

test("palavrasDoTexto tira tags do TTS e mantém a pontuação na palavra", () => {
  assert.deepStrictEqual(palavrasDoTexto("[sigh] Eu ouvi — de novo... a [[Nevada|Nuh-VAD-uh]]."), ["Eu", "ouvi —", "de", "novo...", "a", "Nevada."]);
});

test("alinhar usa o texto do roteiro e o tempo do que foi ouvido", () => {
  const ouvidas = [
    { p: " A", inicio: 0.1, fim: 0.3 },
    { p: " porta", inicio: 0.3, fim: 0.7 },
    { p: " abril.", inicio: 0.7, fim: 1.2 },
  ];
  assert.deepStrictEqual(alinhar(["A", "porta", "abriu."], ouvidas, 1.4), [
    { p: "A", inicio: 0.1, fim: 0.3 },
    { p: "porta", inicio: 0.3, fim: 0.7 },
    { p: "abriu.", inicio: 0.7, fim: 1.4, estimado: true },
  ]);
});

test("alinhar divide o intervalo entre palavras não reconhecidas, pelo tamanho", () => {
  const ouvidas = [
    { p: "Às", inicio: 0, fim: 0.2 },
    { p: "3", inicio: 0.2, fim: 0.5 },
    { p: "e", inicio: 0.5, fim: 0.6 },
    { p: "3", inicio: 0.6, fim: 1.0 },
    { p: "acordei", inicio: 1.2, fim: 1.8 },
  ];
  const r = alinhar(["Às", "três", "e", "três", "acordei"], ouvidas, 2);
  assert.deepStrictEqual(r[2], { p: "e", inicio: 0.5, fim: 0.6 });
  assert.deepStrictEqual(r[1], { p: "três", inicio: 0.2, fim: 0.5, estimado: true });
  assert.deepStrictEqual(r[3], { p: "três", inicio: 0.6, fim: 1.2, estimado: true });
});

test("alinhar junta a palavra com hífen que o Whisper partiu", () => {
  const ouvidas = [
    { p: " do", inicio: 0, fim: 0.2 },
    { p: " guarda", inicio: 0.2, fim: 0.5 },
    { p: " -roupa.", inicio: 0.5, fim: 0.9 },
  ];
  assert.deepStrictEqual(alinhar(["do", "guarda-roupa."], ouvidas, 1.5)[1], { p: "guarda-roupa.", inicio: 0.2, fim: 0.9 });
});

test("alinhar sem nada ouvido espalha as palavras pela duração do take", () => {
  const r = alinhar(["ab", "cd"], [], 2);
  assert.deepStrictEqual(r.map((w) => [w.inicio, w.fim]), [[0, 1], [1, 2]]);
});
