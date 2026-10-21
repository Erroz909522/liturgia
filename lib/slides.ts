import { FONTE, NOME_TIPO, type TipoParte } from "./liturgia";

export type Slide = {
  parteId: string;
  parte: string; // nome da parte, para a tela do operador
  titulo?: string; // linha pequena no topo do telão
  texto: string;
  rodape?: string; // referência bíblica, autor etc.
};

type ParteComDados = {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string | null;
  textoBiblico: { referencia: string; versao: string; texto: string } | null;
  musica: { titulo: string; artista: string | null; letra: string } | null;
  catecismo: { numero: number; pergunta: string; resposta: string } | null;
};

type CultoComDados = {
  textoSermao: string | null;
  sermao: { titulo: string; textoBase: string | null; topicos: string | null } | null;
  partes: ParteComDados[];
};

const MAX_CARACTERES = 280;

// Junta linhas em blocos que cabem num slide, sem quebrar uma linha no meio
export function agrupar(linhas: string[], max = MAX_CARACTERES): string[] {
  const blocos: string[] = [];
  let atual = "";
  for (const linha of linhas.map((l) => l.trim()).filter(Boolean)) {
    if (atual && atual.length + linha.length + 1 > max) {
      blocos.push(atual);
      atual = linha;
    } else {
      atual = atual ? `${atual}\n${linha}` : linha;
    }
  }
  if (atual) blocos.push(atual);
  return blocos;
}

// Letra: partes separadas por linha em branco; "[Refrão]" na primeira linha vira o nome da parte
export function partesDaLetra(letra: string): { nome?: string; texto: string }[] {
  return letra
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const linhas = bloco.split("\n");
      const marcador = linhas[0].match(/^\[(.+)\]$/);
      return marcador
        ? { nome: marcador[1], texto: linhas.slice(1).join("\n").trim() }
        : { texto: bloco };
    })
    .filter((p) => p.texto);
}

export function slidesDaParte(parte: ParteComDados, culto: CultoComDados): Slide[] {
  const tipo = parte.tipo as TipoParte;
  const nome = parte.titulo || NOME_TIPO[tipo] || parte.tipo;
  const base = { parteId: parte.id, parte: nome };

  switch (FONTE[tipo] ?? "livre") {
    case "texto": {
      const t = parte.textoBiblico;
      if (!t) return [];
      const rodape = `${t.referencia} (${t.versao})`;
      return agrupar(t.texto.split("\n")).map((texto) => ({ ...base, titulo: nome, texto, rodape }));
    }
    case "musica": {
      const m = parte.musica;
      if (!m) return [];
      return partesDaLetra(m.letra).map((p) => ({ ...base, parte: m.titulo, titulo: m.titulo, texto: p.texto }));
    }
    case "catecismo": {
      const c = parte.catecismo;
      if (!c) return [];
      const titulo = `${nome} · Pergunta ${c.numero}`;
      return [
        { ...base, titulo, texto: c.pergunta },
        ...agrupar(c.resposta.split(/(?<=[.;:])\s+/)).map((texto) => ({ ...base, titulo, texto })),
      ];
    }
    case "sermao": {
      const s = culto.sermao;
      if (!s) return [];
      const texto = s.textoBase || culto.textoSermao || undefined;
      const topicos = (s.topicos ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
      return [
        { ...base, titulo: nome, texto: s.titulo, rodape: texto },
        ...topicos.map((t) => ({ ...base, titulo: s.titulo, texto: t })),
      ];
    }
    default: {
      if (!parte.conteudo?.trim()) return [];
      return agrupar(parte.conteudo.split("\n")).map((texto) => ({ ...base, titulo: nome, texto }));
    }
  }
}

export function gerarSlides(culto: CultoComDados): Slide[] {
  return culto.partes.flatMap((p) => slidesDaParte(p, culto));
}
