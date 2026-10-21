import Tabela, { type Coluna } from "@/components/Tabela";
import { db } from "@/lib/db";
import { atualizarCelula, excluirLinha, novaLinha } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

const COLUNAS: Coluna[] = [
  { chave: "numero", titulo: "Nº", tipo: "numero", largura: 60 },
  { chave: "pergunta", titulo: "Pergunta", tipo: "texto", largura: 320 },
  { chave: "resposta", titulo: "Resposta", tipo: "textoLongo", largura: 420 },
];

export default async function Catecismo() {
  const perguntas = await db.catecismo.findMany({ orderBy: { numero: "asc" } });
  return (
    <>
      <Topo />
      <main className="pagina larga">
        <h1>Catecismo</h1>
        <p className="muted">Perguntas usadas em Símbolos de fé.</p>
        <Tabela
          colunas={COLUNAS}
          linhas={perguntas.map((c) => ({ id: c.id, valores: { numero: String(c.numero), pergunta: c.pergunta, resposta: c.resposta } }))}
          rotuloNova="Nova pergunta"
          salvar={atualizarCelula.bind(null, "catecismo")}
          novaLinha={novaLinha.bind(null, "catecismo")}
          excluirLinha={excluirLinha.bind(null, "catecismo")}
        />
      </main>
    </>
  );
}
