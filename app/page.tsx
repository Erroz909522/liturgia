import Link from "next/link";
import { db } from "@/lib/db";
import { formatarData } from "@/lib/liturgia";
import { criarCulto } from "./actions";
import Topo from "./Topo";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const cultos = await db.culto.findMany({
    orderBy: { data: "desc" },
    include: { sermao: true, partes: { select: { status: true } } },
  });
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Cultos</h1>
        <p className="muted">Cada culto nasce com a sequência padrão da liturgia. Depois, cada pessoa preenche a sua parte.</p>

        <form action={criarCulto} className="cartao linha">
          <input type="date" name="data" defaultValue={hoje} required style={{ width: 170 }} />
          <select name="ocasiao" style={{ width: 200 }}>
            <option>Domingo - Manhã</option>
            <option>Domingo - Noite</option>
            <option>Culto especial</option>
          </select>
          <button className="principal">Novo culto</button>
        </form>

        <ul className="lista">
          {cultos.map((c) => {
            const prontas = c.partes.filter((p) => p.status !== "pendente").length;
            return (
              <li key={c.id} className="linha">
                <Link href={`/culto/${c.id}`}>
                  <strong>{formatarData(c.data)} · {c.ocasiao}</strong>
                </Link>
                <span className="muted">{c.sermao?.titulo ?? "Sermão a definir"}</span>
                <span className="muted" style={{ marginLeft: "auto" }}>{prontas}/{c.partes.length} partes preenchidas</span>
                <Link className="botao" href={`/culto/${c.id}/operador`}>Projetar</Link>
              </li>
            );
          })}
          {cultos.length === 0 && <li className="muted">Nenhum culto ainda.</li>}
        </ul>
      </main>
    </>
  );
}
