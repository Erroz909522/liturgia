import Link from "next/link";
import { db } from "@/lib/db";
import { salvarSermao } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

export default async function Sermoes({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const sermoes = await db.sermao.findMany({ orderBy: { criadoEm: "desc" } });
  const atual = sermoes.find((s) => s.id === editar);

  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Sermões</h1>
        <p className="muted">O pregador cadastra o sermão aqui; cada tópico vira um slide durante a pregação.</p>

        <form key={atual?.id ?? "novo"} action={salvarSermao.bind(null, atual?.id ?? null)} className="cartao grade">
          <label>Título</label>
          <input name="titulo" defaultValue={atual?.titulo} required placeholder="Ex.: Glória somente a Deus" />
          <label>Texto base</label>
          <input name="textoBase" defaultValue={atual?.textoBase ?? ""} placeholder="Ex.: Sl 79.9" />
          <label>Tópicos</label>
          <textarea name="topicos" defaultValue={atual?.topicos ?? ""} rows={6} placeholder="Um tópico ou citação por linha" />
          <span />
          <div className="linha">
            <button className="principal">{atual ? "Salvar" : "Adicionar sermão"}</button>
            {atual && <Link href="/sermoes">Cancelar</Link>}
          </div>
        </form>

        <ul className="lista">
          {sermoes.map((s) => (
            <li key={s.id}>
              <Link href={`/sermoes?editar=${s.id}`}><strong>{s.titulo}</strong></Link>{" "}
              <span className="muted">{s.textoBase}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
