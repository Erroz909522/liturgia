"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MODELO_PADRAO, NOME_TIPO, type TipoParte } from "@/lib/liturgia";

const txt = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

// ---------- Cultos ----------

export async function criarCulto(f: FormData) {
  const culto = await db.culto.create({
    data: {
      data: new Date(`${txt(f, "data")}T00:00:00Z`),
      ocasiao: txt(f, "ocasiao") ?? "Domingo",
      partes: {
        create: MODELO_PADRAO.map((tipo, ordem) => ({ tipo, ordem, titulo: NOME_TIPO[tipo] })),
      },
    },
  });
  redirect(`/culto/${culto.id}`);
}

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

// ---------- Bancos ----------

export async function salvarTexto(id: string | null, f: FormData) {
  const data = {
    referencia: txt(f, "referencia") ?? "",
    versao: txt(f, "versao") ?? "NAA",
    texto: txt(f, "texto") ?? "",
  };
  if (id) await db.textoBiblico.update({ where: { id }, data });
  else await db.textoBiblico.create({ data });
  revalidatePath("/textos");
  redirect("/textos");
}

export async function salvarMusica(id: string | null, f: FormData) {
  const data = {
    titulo: txt(f, "titulo") ?? "",
    artista: txt(f, "artista"),
    tom: txt(f, "tom"),
    letra: txt(f, "letra") ?? "",
  };
  if (id) await db.musica.update({ where: { id }, data });
  else await db.musica.create({ data });
  revalidatePath("/musicas");
  redirect("/musicas");
}

export async function salvarSermao(id: string | null, f: FormData) {
  const data = {
    titulo: txt(f, "titulo") ?? "",
    textoBase: txt(f, "textoBase"),
    topicos: txt(f, "topicos"),
  };
  if (id) await db.sermao.update({ where: { id }, data });
  else await db.sermao.create({ data });
  revalidatePath("/sermoes");
  redirect("/sermoes");
}

export async function salvarCatecismo(id: string | null, f: FormData) {
  const data = {
    numero: Number(txt(f, "numero") ?? 0),
    pergunta: txt(f, "pergunta") ?? "",
    resposta: txt(f, "resposta") ?? "",
  };
  if (id) await db.catecismo.update({ where: { id }, data });
  else await db.catecismo.create({ data });
  revalidatePath("/catecismo");
  redirect("/catecismo");
}
