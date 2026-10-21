// Dados de exemplo baseados na liturgia de 25/10/2026 do Notion da igreja.
// Os textos bíblicos estão só com o início: cole o texto completo pela tela de Textos bíblicos.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const texto = (referencia, inicio) =>
  db.textoBiblico.create({ data: { referencia, versao: "NAA", texto: `${inicio}…` } });

const convocacao = await texto("Lucas 2.20", "20 E os pastores voltaram, glorificando e louvando a Deus por tudo o que");
const confissao = await texto("Isaías 29.13–15", "13 O Senhor disse: “Visto que este povo se aproxima de mim e com a");
const perdao = await texto("Efésios 2.13–14", "13 Mas agora, em Cristo Jesus, vocês, que antes estavam longe, foram");
const ofertas = await texto("1Crônicas 29.11–18", "11 Teu, Senhor, é o poder, a grandeza, a honra, a vitória e a majestade");

const catecismo = await db.catecismo.create({
  data: {
    numero: 43,
    pergunta: "O que são sacramentos ou ordenanças?",
    resposta: "Os sacramentos ou ordenanças… (cole a resposta completa)",
  },
});

const sermao = await db.sermao.create({
  data: { titulo: "Glória somente a Deus", textoBase: "Sl 79.9" },
});

const musica = await db.musica.create({
  data: {
    titulo: "Música de exemplo",
    letra: "[Estrofe 1]\nPrimeira linha da estrofe\nSegunda linha da estrofe\n\n[Refrão]\nLinha do refrão\nOutra linha do refrão",
  },
});

const partes = [
  { tipo: "convocacao", titulo: "Convocação", textoBiblicoId: convocacao.id, status: "preenchido" },
  { tipo: "musica", titulo: "Música", musicaId: musica.id, status: "preenchido" },
  { tipo: "confissao", titulo: "Confissão", textoBiblicoId: confissao.id, status: "preenchido" },
  { tipo: "perdao", titulo: "Perdão", textoBiblicoId: perdao.id, status: "preenchido" },
  { tipo: "ofertas", titulo: "Ofertas", textoBiblicoId: ofertas.id, status: "preenchido" },
  { tipo: "simbolos_fe", titulo: "Símbolos de fé", catecismoId: catecismo.id, status: "preenchido" },
  { tipo: "sermao", titulo: "Sermão", status: "preenchido" },
  { tipo: "batismos", titulo: "Batismos" },
];

await db.culto.create({
  data: {
    data: new Date("2026-10-25T00:00:00Z"),
    ocasiao: "Domingo - Manhã",
    pregador: "Gabriel Flores",
    textoSermao: "Sl 79.9",
    sermaoId: sermao.id,
    partes: { create: partes.map((p, ordem) => ({ ...p, ordem })) },
  },
});

console.log("Dados de exemplo criados.");
await db.$disconnect();
