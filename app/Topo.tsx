import Link from "next/link";

export default function Topo() {
  return (
    <nav className="topo">
      <strong><Link href="/">Liturgia</Link></strong>
      <Link href="/">Cultos</Link>
      <Link href="/textos">Textos bíblicos</Link>
      <Link href="/musicas">Músicas</Link>
      <Link href="/sermoes">Sermões</Link>
      <Link href="/catecismo">Catecismo</Link>
      <Link href="/importar">Importar do Notion</Link>
    </nav>
  );
}
