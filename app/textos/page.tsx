import Link from "next/link";
import { db } from "@/lib/db";
import { salvarTexto } from "../actions";
import Topo from "../Topo";

export const dynamic = "force-dynamic";

export default async function Textos({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const textos = await db.textoBiblico.findMany({ orderBy: { referencia: "asc" } });
  const atual = textos.find((t) => t.id === editar);

  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Textos bíblicos</h1>
        <p className="muted">Usados em Convocação, Confissão, Perdão e Ofertas. Um versículo por linha, começando pelo número.</p>

        <form key={atual?.id ?? "novo"} action={salvarTexto.bind(null, atual?.id ?? null)} className="cartao grade">
          <label>Referência</label>
          <input name="referencia" defaultValue={atual?.referencia} placeholder="Ex.: Lucas 2.20" required />
          <label>Versão</label>
          <input name="versao" defaultValue={atual?.versao ?? "NAA"} />
          <label>Texto</label>
          <textarea name="texto" defaultValue={atual?.texto} rows={6} required placeholder={"20 E os pastores voltaram..."} />
          <span />
          <div className="linha">
            <button className="principal">{atual ? "Salvar" : "Adicionar texto"}</button>
            {atual && <Link href="/textos">Cancelar</Link>}
          </div>
        </form>

        <ul className="lista">
          {textos.map((t) => (
            <li key={t.id}>
              <Link href={`/textos?editar=${t.id}`}><strong>{t.referencia}</strong></Link>{" "}
              <span className="muted">({t.versao}) {t.texto.slice(0, 90)}…</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
