import { notFound } from "next/navigation";
import Telao from "@/components/Telao";
import { carregarSlides } from "@/lib/carregar";

export const dynamic = "force-dynamic";

export default async function PaginaTelao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dados = await carregarSlides(id);
  if (!dados) notFound();
  return <Telao cultoId={id} slides={dados.slides} />;
}
