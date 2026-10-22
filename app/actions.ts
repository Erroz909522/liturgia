"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FONTE, MODELO_PADRAO, NOME_TIPO, type TipoParte } from "@/lib/liturgia";

const txt = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

// ---------- Cultos ----------

export async function salvarCabecalho(id: string, f: FormData) {
  await db.culto.update({
    where: { id },
    data: {
      data: new Date(`${txt(f, "data")}T00:00:00Z`),
      ocasiao: txt(f, "ocasiao") ?? "Domingo",
      pregador: txt(f, "pregador"),
      textoSermao: txt(f, "textoSermao"),
      sermaoId: txt(f, "sermaoId"),
    },
  });
  revalidatePath(`/culto/${id}`);
}

export async function excluirCulto(id: string) {
  await db.culto.delete({ where: { id } });
  redirect("/");
}

// ---------- Partes do culto ----------

export async function adicionarParte(cultoId: string, f: FormData) {
  const tipo = (txt(f, "tipo") ?? "livre") as TipoParte;
  const ultima = await db.parteCulto.findFirst({ where: { cultoId }, orderBy: { ordem: "desc" } });
  await db.parteCulto.create({
    data: { cultoId, tipo, titulo: NOME_TIPO[tipo], ordem: (ultima?.ordem ?? -1) + 1 },
  });
  revalidatePath(`/culto/${cultoId}`);
}

export async function salvarParte(id: string, f: FormData) {
  const parte = await db.parteCulto.update({
    where: { id },
    data: {
      titulo: txt(f, "titulo") ?? "",
      textoBiblicoId: txt(f, "textoBiblicoId"),
      musicaId: txt(f, "musicaId"),
      catecismoId: txt(f, "catecismoId"),
      conteudo: txt(f, "conteudo"),
      responsavel: txt(f, "responsavel"),
      observacoes: txt(f, "observacoes"),
      status: txt(f, "status") ?? "pendente",
    },
  });
  revalidatePath(`/culto/${parte.cultoId}`);
}

export async function moverParte(id: string, direcao: -1 | 1) {
  const parte = await db.parteCulto.findUniqueOrThrow({ where: { id } });
  const partes = await db.parteCulto.findMany({ where: { cultoId: parte.cultoId }, orderBy: { ordem: "asc" } });
  const i = partes.findIndex((p) => p.id === id);
  const j = i + direcao;
  if (j < 0 || j >= partes.length) return;
  [partes[i], partes[j]] = [partes[j], partes[i]];
  await db.$transaction(partes.map((p, ordem) => db.parteCulto.update({ where: { id: p.id }, data: { ordem } })));
  revalidatePath(`/culto/${parte.cultoId}`);
}

export async function removerParte(id: string) {
  const parte = await db.parteCulto.delete({ where: { id } });
  revalidatePath(`/culto/${parte.cultoId}`);
}

// ---------- Tabelas (edição célula a célula) ----------

type Tabela = "culto" | "texto" | "musica" | "sermao" | "catecismo";

const PAGINA: Record<Tabela, string> = {
  culto: "/",
  texto: "/textos",
  musica: "/musicas",
  sermao: "/sermoes",
  catecismo: "/catecismo",
};

// Campos que cada tabela deixa editar direto na célula
const CAMPOS: Record<Tabela, Record<string, "texto" | "data" | "numero">> = {
  culto: { data: "data", ocasiao: "texto", pregador: "texto", textoSermao: "texto" },
  texto: { referencia: "texto", versao: "texto", texto: "texto" },
  musica: { titulo: "texto", artista: "texto", tom: "texto", letra: "texto" },
  sermao: { titulo: "texto", textoBase: "texto", topicos: "texto" },
  catecismo: { numero: "numero", pergunta: "texto", resposta: "texto" },
};

const OBRIGATORIOS = new Set(["data", "ocasiao", "referencia", "versao", "texto", "titulo", "letra", "numero", "pergunta", "resposta"]);

function revalidarTudo() {
  revalidatePath("/", "layout");
}

export async function atualizarCelula(tabela: Tabela, id: string, campo: string, valor: string | null) {
  // Batismos é texto livre guardado na parte do culto
  if (tabela === "culto" && campo === "batismos") {
    await definirTextoDaParte(id, "batismos", valor);
    return revalidarTudo();
  }
  const tipo = CAMPOS[tabela]?.[campo];
  if (!tipo) throw new Error(`Campo não editável: ${tabela}.${campo}`);
  let v: string | number | Date | null = valor?.trim() || null;
  if (v === null && OBRIGATORIOS.has(campo)) return; // célula obrigatória não fica vazia
  if (v !== null && tipo === "data") v = new Date(`${v}T00:00:00Z`);
  if (v !== null && tipo === "numero") v = Number(v);
  const data = { [campo]: v };
  const modelos = { culto: db.culto, texto: db.textoBiblico, musica: db.musica, sermao: db.sermao, catecismo: db.catecismo };
  // @ts-expect-error cada modelo valida os próprios campos; o nome vem da lista CAMPOS acima
  await modelos[tabela].update({ where: { id }, data });
  revalidarTudo();
}

export async function novaLinha(tabela: Tabela) {
  switch (tabela) {
    case "culto": {
      const hoje = new Date().toISOString().slice(0, 10);
      await db.culto.create({
        data: {
          data: new Date(`${hoje}T00:00:00Z`),
          ocasiao: "Domingo - Manhã",
          partes: { create: MODELO_PADRAO.map((tipo, ordem) => ({ tipo, ordem, titulo: NOME_TIPO[tipo] })) },
        },
      });
      break;
    }
    case "texto":
      await db.textoBiblico.create({ data: { referencia: "Nova referência", texto: "" } });
      break;
    case "musica":
      await db.musica.create({ data: { titulo: "Nova música", letra: "" } });
      break;
    case "sermao":
      await db.sermao.create({ data: { titulo: "Novo sermão" } });
      break;
    case "catecismo": {
      const ultima = await db.catecismo.findFirst({ orderBy: { numero: "desc" } });
      await db.catecismo.create({ data: { numero: (ultima?.numero ?? 0) + 1, pergunta: "Nova pergunta", resposta: "" } });
      break;
    }
  }
  revalidatePath(PAGINA[tabela]);
}

export async function excluirLinha(tabela: Tabela, id: string) {
  // Itens dos bancos em uso numa liturgia são desligados das partes antes de excluir
  switch (tabela) {
    case "culto":
      await db.culto.delete({ where: { id } });
      break;
    case "texto":
      await db.parteCulto.updateMany({ where: { textoBiblicoId: id }, data: { textoBiblicoId: null, status: "pendente" } });
      await db.textoBiblico.delete({ where: { id } });
      break;
    case "musica":
      await db.parteCulto.updateMany({ where: { musicaId: id }, data: { musicaId: null, status: "pendente" } });
      await db.musica.delete({ where: { id } });
      break;
    case "sermao":
      await db.culto.updateMany({ where: { sermaoId: id }, data: { sermaoId: null } });
      await db.sermao.delete({ where: { id } });
      break;
    case "catecismo":
      await db.parteCulto.updateMany({ where: { catecismoId: id }, data: { catecismoId: null, status: "pendente" } });
      await db.catecismo.delete({ where: { id } });
      break;
  }
  revalidarTudo();
}

// Cria um item no banco a partir do seletor de uma relação ("+ Criar …")
export async function criarItemDoBanco(fonte: string, rotulo: string) {
  let item: { id: string; rotulo: string };
  switch (fonte) {
    case "textos": {
      const t = await db.textoBiblico.create({ data: { referencia: rotulo, texto: "" } });
      item = { id: t.id, rotulo: `${t.referencia} (${t.versao})` };
      break;
    }
    case "musicas": {
      const m = await db.musica.create({ data: { titulo: rotulo, letra: "" } });
      item = { id: m.id, rotulo: m.titulo };
      break;
    }
    case "sermoes": {
      const s = await db.sermao.create({ data: { titulo: rotulo } });
      item = { id: s.id, rotulo: s.titulo };
      break;
    }
    case "catecismo": {
      const ultima = await db.catecismo.findFirst({ orderBy: { numero: "desc" } });
      const c = await db.catecismo.create({ data: { numero: (ultima?.numero ?? 0) + 1, pergunta: rotulo, resposta: "" } });
      item = { id: c.id, rotulo: `${c.numero}. ${c.pergunta}` };
      break;
    }
    default:
      throw new Error(`Banco desconhecido: ${fonte}`);
  }
  revalidarTudo();
  return item;
}

const CAMPO_DA_FONTE = { texto: "textoBiblicoId", musica: "musicaId", catecismo: "catecismoId" } as const;

// Uma coluna de relação da tabela de liturgias = as partes daquele tipo no culto.
// Preenche as partes que já existem na ordem; as que sobram ficam vazias e as que faltam
// entram logo depois da última parte do mesmo tipo (ou na posição do modelo).
export async function atualizarRelacao(cultoId: string, coluna: string, ids: string[]) {
  if (coluna === "sermao") {
    await db.culto.update({ where: { id: cultoId }, data: { sermaoId: ids[0] ?? null } });
    return revalidarTudo();
  }
  const tipo = coluna as TipoParte;
  const fonte = FONTE[tipo];
  if (fonte !== "texto" && fonte !== "musica" && fonte !== "catecismo") throw new Error(`Coluna sem relação: ${coluna}`);
  const campo = CAMPO_DA_FONTE[fonte];

  const partes = await db.parteCulto.findMany({ where: { cultoId }, orderBy: { ordem: "asc" } });
  const doTipo = partes.filter((p) => p.tipo === tipo);
  const noModelo = MODELO_PADRAO.filter((t) => t === tipo).length;
  const operacoes = [];

  for (const [i, parte] of doTipo.entries()) {
    const id = ids[i] ?? null;
    if (id === null && i >= Math.max(noModelo, 1)) {
      operacoes.push(db.parteCulto.delete({ where: { id: parte.id } }));
    } else {
      operacoes.push(db.parteCulto.update({ where: { id: parte.id }, data: { [campo]: id, status: id ? "preenchido" : "pendente" } }));
    }
  }

  const extras = ids.slice(doTipo.length);
  if (extras.length) {
    // Abre espaço na ordem e cria as novas partes
    type Item = { id: string } | { novoId: string };
    const ordem: Item[] = partes.map((p) => ({ id: p.id }));
    const pos = doTipo.length
      ? partes.indexOf(doTipo.at(-1)!) + 1
      : posicaoNoModelo(partes.map((p) => p.tipo as TipoParte), tipo);
    ordem.splice(pos, 0, ...extras.map((novoId) => ({ novoId })));
    for (const [i, item] of ordem.entries()) {
      if ("id" in item) operacoes.push(db.parteCulto.update({ where: { id: item.id }, data: { ordem: i } }));
      else operacoes.push(db.parteCulto.create({
        data: { cultoId, tipo, titulo: NOME_TIPO[tipo], [campo]: item.novoId, status: "preenchido", ordem: i },
      }));
    }
  }

  await db.$transaction(operacoes);
  revalidarTudo();
}

// Onde entra um tipo que o culto ainda não tem: antes da primeira parte que vem depois dele no modelo
function posicaoNoModelo(tipos: TipoParte[], tipo: TipoParte) {
  const rank = (t: TipoParte) => {
    const i = MODELO_PADRAO.indexOf(t);
    return i < 0 ? MODELO_PADRAO.length : i;
  };
  const i = tipos.findIndex((t) => rank(t) > rank(tipo));
  return i < 0 ? tipos.length : i;
}

async function definirTextoDaParte(cultoId: string, tipo: TipoParte, conteudo: string | null) {
  const parte = await db.parteCulto.findFirst({ where: { cultoId, tipo }, orderBy: { ordem: "asc" } });
  const data = { conteudo: conteudo?.trim() || null, status: conteudo?.trim() ? "preenchido" : "pendente" };
  if (parte) await db.parteCulto.update({ where: { id: parte.id }, data });
  else {
    const tipos = (await db.parteCulto.findMany({ where: { cultoId }, orderBy: { ordem: "asc" } }));
    await db.parteCulto.create({ data: { cultoId, tipo, titulo: NOME_TIPO[tipo], ordem: tipos.length, ...data } });
  }
}

// ---------- Colar trecho bíblico ----------

export async function salvarTrechoColado(dados: { referencia: string; versao: string; texto: string }) {
  const referencia = dados.referencia.trim();
  const texto = dados.texto.trim();
  if (!referencia || !texto) throw new Error("Informe a referência e o texto.");
  await db.textoBiblico.create({ data: { referencia, versao: dados.versao.trim() || "NAA", texto } });
  revalidarTudo();
}
