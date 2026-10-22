import Tabela, { type Coluna } from "@/components/Tabela";
import { db } from "@/lib/db";
import { atualizarCelula, excluirLinha, novaLinha } from "../actions";
import Topo from "../Topo";
import Colar from "./Colar";

export const dynamic = "force-dynamic";

const COLUNAS: Coluna[] = [
  { chave: "referencia", titulo: "Referência", tipo: "texto", largura: 180 },
  { chave: "versao", titulo: "Versão", tipo: "texto", largura: 80 },
  { chave: "texto", titulo: "Texto", tipo: "textoLongo", largura: 520 },
];

export default async function Textos() {
  const textos = await db.textoBiblico.findMany({ orderBy: { referencia: "asc" } });
  return (
    <>
      <Topo />
      <main className="pagina larga">
        <h1>Textos bíblicos</h1>
        <p className="muted">Usados em Convocação, Confissão, Perdão e Ofertas. No texto, um versículo por linha, começando pelo número.</p>
        <Colar />
        <Tabela
          colunas={COLUNAS}
          linhas={textos.map((t) => ({ id: t.id, valores: { referencia: t.referencia, versao: t.versao, texto: t.texto } }))}
          rotuloNova="Novo texto"
          salvar={atualizarCelula.bind(null, "texto")}
          novaLinha={novaLinha.bind(null, "texto")}
          excluirLinha={excluirLinha.bind(null, "texto")}
        />
      </main>
    </>
  );
}
