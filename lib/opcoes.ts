import { db } from "./db";
import type { Opcao } from "@/components/Tabela";

// Rótulos dos itens dos bancos, como aparecem nas relações
export const rotuloTexto = (t: { referencia: string; versao: string }) => `${t.referencia} (${t.versao})`;
export const rotuloCatecismo = (c: { numero: number; pergunta: string }) => `${c.numero}. ${c.pergunta}`;

export async function opcoesDosBancos(): Promise<Record<string, Opcao[]>> {
  const [textos, musicas, sermoes, catecismo] = await Promise.all([
    db.textoBiblico.findMany({ orderBy: { referencia: "asc" } }),
    db.musica.findMany({ orderBy: { titulo: "asc" } }),
    db.sermao.findMany({ orderBy: { criadoEm: "desc" } }),
    db.catecismo.findMany({ orderBy: { numero: "asc" } }),
  ]);
  return {
    textos: textos.map((t) => ({ id: t.id, rotulo: rotuloTexto(t) })),
    musicas: musicas.map((m) => ({ id: m.id, rotulo: m.titulo })),
    sermoes: sermoes.map((s) => ({ id: s.id, rotulo: s.titulo })),
    catecismo: catecismo.map((c) => ({ id: c.id, rotulo: rotuloCatecismo(c) })),
  };
}
