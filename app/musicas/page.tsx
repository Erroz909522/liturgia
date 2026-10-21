import Link from "next/link";
import { db } from "@/lib/db";
import { salvarMusica } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

export default async function Musicas({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const musicas = await db.musica.findMany({ orderBy: { titulo: "asc" } });
  const atual = musicas.find((m) => m.id === editar);

  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Músicas</h1>
        <p className="muted">
          Separe as partes da letra com uma linha em branco. Cada parte vira um slide. Para nomear a parte, escreva o
          nome entre colchetes na primeira linha, como [Refrão].
        </p>

        <form key={atual?.id ?? "nova"} action={salvarMusica.bind(null, atual?.id ?? null)} className="cartao grade">
          <label>Título</label>
          <input name="titulo" defaultValue={atual?.titulo} required />
          <label>Artista</label>
          <input name="artista" defaultValue={atual?.artista ?? ""} />
          <label>Tom</label>
          <input name="tom" defaultValue={atual?.tom ?? ""} style={{ width: 100 }} />
          <label>Letra</label>
          <textarea name="letra" defaultValue={atual?.letra} rows={14} required />
          <span />
          <div className="linha">
            <button className="principal">{atual ? "Salvar" : "Adicionar música"}</button>
            {atual && <Link href="/musicas">Cancelar</Link>}
          </div>
        </form>

        <ul className="lista">
          {musicas.map((m) => (
            <li key={m.id}>
              <Link href={`/musicas?editar=${m.id}`}><strong>{m.titulo}</strong></Link>{" "}
              <span className="muted">{[m.artista, m.tom && `Tom ${m.tom}`].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
