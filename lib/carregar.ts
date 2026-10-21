import { db } from "./db";
import { formatarData } from "./liturgia";
import { gerarSlides } from "./slides";

export async function carregarSlides(id: string) {
  const culto = await db.culto.findUnique({
    where: { id },
    include: {
      sermao: true,
      partes: { orderBy: { ordem: "asc" }, include: { textoBiblico: true, musica: true, catecismo: true } },
    },
  });
  if (!culto) return null;
  return { titulo: `${formatarData(culto.data)} · ${culto.ocasiao}`, slides: gerarSlides(culto) };
}
