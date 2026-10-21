// node --experimental-strip-types --test lib/notion-parse.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerCatecismo, lerTextoBiblico, propTexto, quebrarVersiculos, blocosParaTexto } from "./notion-parse.ts";

test("texto bíblico pelo título, como no Notion da igreja", () => {
  const t = lerTextoBiblico("Isaías 29.13–15 (NAA) 13 O Senhor disse: “Visto que este povo se aproxima de mim. 14 Por isso, eis que. 15 Ai dos que", "");
  assert.equal(t.referencia, "Isaías 29.13–15");
  assert.equal(t.versao, "NAA");
  assert.deepEqual(t.texto.split("\n"), [
    "13 O Senhor disse: “Visto que este povo se aproxima de mim.",
    "14 Por isso, eis que.",
    "15 Ai dos que",
  ]);
});

test("corpo da página tem prioridade sobre o título", () => {
  const t = lerTextoBiblico("Lucas 2.20 (NAA)", "20 E os pastores voltaram, glorificando a Deus.");
  assert.equal(t.texto, "20 E os pastores voltaram, glorificando a Deus.");
});

test("número dentro do versículo não quebra a linha errada", () => {
  assert.equal(quebrarVersiculos("11 Teu é o poder, 12 riquezas e 3 coisas", "1Crônicas 29.11–12"), "11 Teu é o poder,\n12 riquezas e 3 coisas");
});

test("catecismo", () => {
  const c = lerCatecismo("Pergunta 43: O que são sacramentos ou ordenanças? Resposta: Os sacramentos são sinais.", "");
  assert.deepEqual(c, { numero: 43, pergunta: "O que são sacramentos ou ordenanças?", resposta: "Os sacramentos são sinais." });
});

test("propriedades", () => {
  assert.equal(propTexto({ type: "select", select: { name: "Domingo - Manhã" } }), "Domingo - Manhã");
  assert.equal(propTexto({ type: "rollup", rollup: { type: "array", array: [{ type: "title", title: [{ plain_text: "Sl 79.9" }] }] } }), "Sl 79.9");
});

test("letra com linha em branco entre partes", () => {
  const p = (t: string) => ({ type: "paragraph", paragraph: { rich_text: t ? [{ plain_text: t }] : [] } });
  assert.equal(blocosParaTexto([p("linha 1"), p("linha 2"), p(""), p("refrão")]), "linha 1\nlinha 2\n\nrefrão");
});
