import Tabela, { type Coluna, type Linha, type Opcao } from "@/components/Tabela";
import { db } from "@/lib/db";
import { opcoesDosBancos, rotuloCatecismo, rotuloTexto } from "@/lib/opcoes";
import { atualizarCelula, atualizarRelacao, criarItemDoBanco, excluirLinha, novaLinha } from "./actions";
import Topo from "./Topo";

export const dynamic = "force-dynamic";

const texto = (chave: string, titulo: string) =>
  ({ chave, titulo, tipo: "relacao", fonte: "textos", multiplo: true, hrefFonte: "/textos", largura: 220 }) as const;

// As colunas seguem a base de liturgias do Notion da igreja
const COLUNAS: Coluna[] = [
  { chave: "data", titulo: "Data", tipo: "data", largura: 120 },
  { chave: "ocasiao", titulo: "Ocasião", tipo: "selecao", opcoes: ["Domingo - Manhã", "Domingo - Noite", "Culto especial"], largura: 150 },
  { chave: "sermao", titulo: "Sermão", tipo: "relacao", fonte: "sermoes", multiplo: false, hrefFonte: "/sermoes", largura: 200 },
  { chave: "textoSermao", titulo: "Texto do Sermão", tipo: "texto", largura: 130 },
  { chave: "pregador", titulo: "Pregador", tipo: "texto", largura: 150 },
  texto("convocacao", "Convocação"),
  { chave: "musica", titulo: "Músicas", tipo: "relacao", fonte: "musicas", multiplo: true, hrefFonte: "/musicas", largura: 220 },
  texto("confissao", "Confissão"),
  texto("perdao", "Perdão"),
  texto("ofertas", "Ofertas"),
  { chave: "simbolos_fe", titulo: "Símbolos de fé", tipo: "relacao", fonte: "catecismo", multiplo: true, hrefFonte: "/catecismo", largura: 240 },
  { chave: "batismos", titulo: "Batismos", tipo: "textoLongo", largura: 160 },
];

export default async function Liturgias() {
  const [cultos, opcoes] = await Promise.all([
    db.culto.findMany({
      orderBy: { data: "desc" },
      include: {
        sermao: true,
        partes: { orderBy: { ordem: "asc" }, include: { textoBiblico: true, musica: true, catecismo: true } },
      },
    }),
    opcoesDosBancos(),
  ]);

  const linhas: Linha[] = cultos.map((c) => {
    const doTipo = (tipo: string) => c.partes.filter((p) => p.tipo === tipo);
    const rel = (tipo: string): Opcao[] =>
      doTipo(tipo).flatMap((p) => {
        if (p.textoBiblico) return [{ id: p.textoBiblico.id, rotulo: rotuloTexto(p.textoBiblico) }];
        if (p.musica) return [{ id: p.musica.id, rotulo: p.musica.titulo }];
        if (p.catecismo) return [{ id: p.catecismo.id, rotulo: rotuloCatecismo(p.catecismo) }];
        return [];
      });
    return {
      id: c.id,
      valores: {
        data: c.data.toISOString().slice(0, 10),
        ocasiao: c.ocasiao,
        sermao: c.sermao ? [{ id: c.sermao.id, rotulo: c.sermao.titulo }] : [],
        textoSermao: c.textoSermao,
        pregador: c.pregador,
        convocacao: rel("convocacao"),
        musica: rel("musica"),
        confissao: rel("confissao"),
        perdao: rel("perdao"),
        ofertas: rel("ofertas"),
        simbolos_fe: rel("simbolos_fe"),
        batismos: doTipo("batismos")[0]?.conteudo ?? null,
      },
    };
  });

  return (
    <>
      <Topo />
      <main className="pagina larga">
        <h1>Liturgias</h1>
        <p className="muted">
          Clique numa célula para editar. As relações buscam nos bancos de textos, músicas, sermões e catecismo, e dá para
          criar um item novo direto daqui. Quem projeta abre a liturgia, monta a ordem e projeta.
        </p>
        <Tabela
          colunas={COLUNAS}
          linhas={linhas}
          opcoes={opcoes}
          hrefLinha="/culto/{id}"
          acoesLinha={[{ href: "/culto/{id}/operador", rotulo: "Projetar" }]}
          rotuloNova="Nova liturgia"
          salvar={atualizarCelula.bind(null, "culto")}
          salvarRelacao={atualizarRelacao}
          criarOpcao={criarItemDoBanco}
          novaLinha={novaLinha.bind(null, "culto")}
          excluirLinha={excluirLinha.bind(null, "culto")}
        />
      </main>
    </>
  );
}
