import Tabela, { type Coluna } from "@/components/Tabela";
import { db } from "@/lib/db";
import { atualizarCelula, excluirLinha, novaLinha } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

const COLUNAS: Coluna[] = [
  { chave: "titulo", titulo: "Título", tipo: "texto", largura: 240 },
  { chave: "textoBase", titulo: "Texto base", tipo: "texto", largura: 130 },
  { chave: "topicos", titulo: "Tópicos", tipo: "textoLongo", largura: 440 },
];

export default async function Sermoes() {
  const sermoes = await db.sermao.findMany({ orderBy: { criadoEm: "desc" } });
  return (
    <>
      <Topo />
      <main className="pagina larga">
        <h1>Sermões</h1>
        <p className="muted">Nos tópicos, um por linha: cada tópico ou citação vira um slide durante a pregação.</p>
        <Tabela
          colunas={COLUNAS}
          linhas={sermoes.map((s) => ({ id: s.id, valores: { titulo: s.titulo, textoBase: s.textoBase, topicos: s.topicos } }))}
          rotuloNova="Novo sermão"
          salvar={atualizarCelula.bind(null, "sermao")}
          novaLinha={novaLinha.bind(null, "sermao")}
          excluirLinha={excluirLinha.bind(null, "sermao")}
        />
      </main>
    </>
  );
}
