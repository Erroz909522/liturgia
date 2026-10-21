import { notFound } from "next/navigation";
import Operador from "@/components/Operador";
import { carregarSlides } from "@/lib/carregar";

export const dynamic = "force-dynamic";

export default async function PaginaOperador({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dados = await carregarSlides(id);
  if (!dados) notFound();
  return <Operador cultoId={id} titulo={dados.titulo} slides={dados.slides} />;
}
