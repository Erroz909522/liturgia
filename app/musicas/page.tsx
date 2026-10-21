import Tabela, { type Coluna } from "@/components/Tabela";
import { db } from "@/lib/db";
import { atualizarCelula, excluirLinha, novaLinha } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

const COLUNAS: Coluna[] = [
  { chave: "titulo", titulo: "Título", tipo: "texto", largura: 220 },
  { chave: "artista", titulo: "Artista", tipo: "texto", largura: 160 },
  { chave: "tom", titulo: "Tom", tipo: "texto", largura: 70 },
  { chave: "letra", titulo: "Letra", tipo: "textoLongo", largura: 440 },
];

export default async function Musicas() {
  const musicas = await db.musica.findMany({ orderBy: { titulo: "asc" } });
  return (
    <>
      <Topo />
      <main className="pagina larga">
        <h1>Músicas</h1>
        <p className="muted">
          Na letra, separe as partes com uma linha em branco: cada parte vira um slide. Para nomear a parte, escreva o
          nome entre colchetes na primeira linha, como [Refrão].
        </p>
        <Tabela
          colunas={COLUNAS}
          linhas={musicas.map((m) => ({ id: m.id, valores: { titulo: m.titulo, artista: m.artista, tom: m.tom, letra: m.letra } }))}
          rotuloNova="Nova música"
          salvar={atualizarCelula.bind(null, "musica")}
          novaLinha={novaLinha.bind(null, "musica")}
          excluirLinha={excluirLinha.bind(null, "musica")}
        />
      </main>
    </>
  );
}
