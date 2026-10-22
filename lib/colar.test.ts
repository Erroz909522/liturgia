// node --experimental-strip-types --test lib/colar.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerTrechoColado } from "./colar.ts";

test("referência na última linha, como no app da Bíblia", () => {
  const t = lerTrechoColado("“13 O Senhor disse: Visto que este povo se aproxima de mim. 14 Por isso, eis que continuarei. 15 Ai dos que escondem.”\nIsaías 29:13-15 NAA");
  assert.equal(t.referencia, "Isaías 29.13–15");
  assert.equal(t.versao, "NAA");
  assert.deepEqual(t.texto.split("\n"), ["13 O Senhor disse: Visto que este povo se aproxima de mim.", "14 Por isso, eis que continuarei.", "15 Ai dos que escondem."]);
});

test("referência na primeira linha, como no Notion", () => {
  const t = lerTrechoColado("Lucas 2.20 (NAA)\n20 E os pastores voltaram, glorificando a Deus.");
  assert.deepEqual(t, { referencia: "Lucas 2.20", versao: "NAA", texto: "20 E os pastores voltaram, glorificando a Deus." });
});

test("livro com número e versículos sobrescritos", () => {
  const t = lerTrechoColado("1 Crônicas 29:11-12\n¹¹Teu, Senhor, é o poder. ¹²Riquezas e glória vêm de ti.");
  assert.equal(t.referencia, "1 Crônicas 29.11–12");
  assert.equal(t.versao, "NAA");
  assert.equal(t.texto, "11 Teu, Senhor, é o poder.\n12 Riquezas e glória vêm de ti.");
});

test("número no meio do versículo não quebra a linha", () => {
  const t = lerTrechoColado("Salmos 100:1-2 NAA\n1 Celebrem 3 vezes. 2 Sirvam ao Senhor.");
  assert.equal(t.texto, "1 Celebrem 3 vezes.\n2 Sirvam ao Senhor.");
});

test("sem referência: devolve o texto e deixa a referência em branco", () => {
  const t = lerTrechoColado("O Senhor é o meu pastor; nada me faltará.");
  assert.deepEqual(t, { referencia: "", versao: "NAA", texto: "O Senhor é o meu pastor; nada me faltará." });
});

test("livro com nome composto", () => {
  assert.equal(lerTrechoColado("Cântico dos Cânticos 2:1 NAA\n1 Eu sou a rosa de Sarom.").referencia, "Cântico dos Cânticos 2.1");
});
