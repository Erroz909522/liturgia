import Link from "next/link";
import { db } from "@/lib/db";
import { salvarCatecismo } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

export default async function Catecismo({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const perguntas = await db.catecismo.findMany({ orderBy: { numero: "asc" } });
  const atual = perguntas.find((c) => c.id === editar);

  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Catecismo</h1>
        <p className="muted">Perguntas usadas em Símbolos de fé.</p>

        <form key={atual?.id ?? "nova"} action={salvarCatecismo.bind(null, atual?.id ?? null)} className="cartao grade">
          <label>Número</label>
          <input name="numero" type="number" defaultValue={atual?.numero} required style={{ width: 100 }} />
          <label>Pergunta</label>
          <input name="pergunta" defaultValue={atual?.pergunta} required />
          <label>Resposta</label>
          <textarea name="resposta" defaultValue={atual?.resposta} rows={5} required />
          <span />
          <div className="linha">
            <button className="principal">{atual ? "Salvar" : "Adicionar pergunta"}</button>
            {atual && <Link href="/catecismo">Cancelar</Link>}
          </div>
        </form>

        <ul className="lista">
          {perguntas.map((c) => (
            <li key={c.id}>
              <Link href={`/catecismo?editar=${c.id}`}><strong>Pergunta {c.numero}</strong></Link>{" "}
              <span className="muted">{c.pergunta}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
