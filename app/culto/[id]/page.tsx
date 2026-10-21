import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { FONTE, NOME_TIPO, STATUS, TIPOS, type TipoParte } from "@/lib/liturgia";
import { slidesDaParte } from "@/lib/slides";
import {
  adicionarParte,
  excluirCulto,
  moverParte,
  removerParte,
  salvarCabecalho,
  salvarParte,
} from "../../actions";
import Topo from "../../Topo";

export const dynamic = "force-dynamic";

export default async function EditorCulto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const culto = await db.culto.findUnique({
    where: { id },
    include: {
      sermao: true,
      partes: { orderBy: { ordem: "asc" }, include: { textoBiblico: true, musica: true, catecismo: true } },
    },
  });
  if (!culto) notFound();

  const [textos, musicas, sermoes, catecismo] = await Promise.all([
    db.textoBiblico.findMany({ orderBy: { referencia: "asc" } }),
    db.musica.findMany({ orderBy: { titulo: "asc" } }),
    db.sermao.findMany({ orderBy: { criadoEm: "desc" } }),
    db.catecismo.findMany({ orderBy: { numero: "asc" } }),
  ]);

  return (
    <>
      <Topo />
      <main className="pagina">
        <div className="linha">
          <h1 style={{ marginRight: "auto" }}>Liturgia</h1>
          <Link className="botao principal" href={`/culto/${culto.id}/operador`}>Projetar</Link>
        </div>

        <form action={salvarCabecalho.bind(null, culto.id)} className="cartao grade">
          <label>Data</label>
          <input type="date" name="data" defaultValue={culto.data.toISOString().slice(0, 10)} />
          <label>Ocasião</label>
          <input name="ocasiao" defaultValue={culto.ocasiao} />
          <label>Sermão</label>
          <select name="sermaoId" defaultValue={culto.sermaoId ?? ""}>
            <option value="">A definir</option>
            {sermoes.map((s) => <option key={s.id} value={s.id}>{s.titulo}</option>)}
          </select>
          <label>Texto do sermão</label>
          <input name="textoSermao" defaultValue={culto.textoSermao ?? ""} placeholder="Ex.: Sl 79.9" />
          <label>Pregador</label>
          <input name="pregador" defaultValue={culto.pregador ?? ""} />
          <span />
          <div><button>Salvar cabeçalho</button></div>
        </form>

        <h2>Partes do culto</h2>
        {culto.partes.map((parte, i) => {
          const tipo = parte.tipo as TipoParte;
          const fonte = FONTE[tipo] ?? "livre";
          const slides = slidesDaParte(parte, culto).length;
          return (
            <div key={parte.id} className="cartao">
              <div className="linha" style={{ marginBottom: 12 }}>
                <span className="muted">{i + 1}.</span>
                <strong>{parte.titulo || NOME_TIPO[tipo]}</strong>
                <span className={`etiqueta ${parte.status}`}>{parte.status}</span>
                <span className="muted" style={{ marginLeft: "auto" }}>{slides} slide{slides === 1 ? "" : "s"}</span>
                <form action={moverParte.bind(null, parte.id, -1)}><button className="pequeno" disabled={i === 0} title="Subir">↑</button></form>
                <form action={moverParte.bind(null, parte.id, 1)}><button className="pequeno" disabled={i === culto.partes.length - 1} title="Descer">↓</button></form>
                <form action={removerParte.bind(null, parte.id)}><button className="pequeno" title="Remover">Remover</button></form>
              </div>

              <form action={salvarParte.bind(null, parte.id)} className="grade">
                <label>Título</label>
                <input name="titulo" defaultValue={parte.titulo} />

                {fonte === "texto" && (
                  <>
                    <label>Texto bíblico</label>
                    <select name="textoBiblicoId" defaultValue={parte.textoBiblicoId ?? ""}>
                      <option value="">Escolher do banco de textos</option>
                      {textos.map((t) => <option key={t.id} value={t.id}>{t.referencia} ({t.versao})</option>)}
                    </select>
                  </>
                )}
                {fonte === "musica" && (
                  <>
                    <label>Música</label>
                    <select name="musicaId" defaultValue={parte.musicaId ?? ""}>
                      <option value="">Escolher do banco de músicas</option>
                      {musicas.map((m) => <option key={m.id} value={m.id}>{m.titulo}{m.artista ? ` · ${m.artista}` : ""}</option>)}
                    </select>
                  </>
                )}
                {fonte === "catecismo" && (
                  <>
                    <label>Pergunta</label>
                    <select name="catecismoId" defaultValue={parte.catecismoId ?? ""}>
                      <option value="">Escolher do catecismo</option>
                      {catecismo.map((c) => <option key={c.id} value={c.id}>{c.numero}. {c.pergunta}</option>)}
                    </select>
                  </>
                )}
                {fonte === "sermao" && (
                  <>
                    <label>Sermão</label>
                    <span className="muted">{culto.sermao ? culto.sermao.titulo : "Escolha o sermão no cabeçalho"}</span>
                  </>
                )}
                {fonte === "livre" && (
                  <>
                    <label>Conteúdo</label>
                    <textarea name="conteudo" defaultValue={parte.conteudo ?? ""} placeholder="Texto que vai para o telão" />
                  </>
                )}

                <label>Responsável</label>
                <input name="responsavel" defaultValue={parte.responsavel ?? ""} />
                <label>Status</label>
                <select name="status" defaultValue={parte.status}>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <label>Observações</label>
                <input name="observacoes" defaultValue={parte.observacoes ?? ""} placeholder="Não aparece no telão" />
                <span />
                <div><button>Salvar</button></div>
              </form>
            </div>
          );
        })}

        <form action={adicionarParte.bind(null, culto.id)} className="cartao linha">
          <select name="tipo" defaultValue="musica" style={{ width: 220 }}>
            {TIPOS.map((t) => <option key={t} value={t}>{NOME_TIPO[t]}</option>)}
          </select>
          <button>Adicionar parte</button>
        </form>

        <form action={excluirCulto.bind(null, culto.id)} style={{ marginTop: 40 }}>
          <button className="pequeno">Excluir este culto</button>
        </form>
      </main>
    </>
  );
}
