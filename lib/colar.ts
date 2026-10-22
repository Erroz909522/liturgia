// Lê um trecho bíblico colado (de um app ou site da Bíblia) e separa referência, versão e versículos.
// Aceita a referência na primeira ou na última linha, como "Isaías 29:13-15 NAA" ou "Lucas 2.20 (NAA)".

const SOBRESCRITOS: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

const REFERENCIA =
  /^((?:[1-3]\s?)?[A-Za-zÀ-ÿ]+(?:\s(?:dos|de|da|do)\s[A-Za-zÀ-ÿ]+)?\.?)\s+(\d+)[:.](\d+)(?:\s*[-–]\s*(\d+))?(?:\s*\(?\s*([A-Z0-9]{2,6})\s*\)?)?$/u;

export type TrechoColado = { referencia: string; versao: string; texto: string };

function lerReferencia(linha: string) {
  const m = linha.trim().replace(/^[“"]|[”"]$/g, "").match(REFERENCIA);
  if (!m) return null;
  const [, livro, cap, ini, fim, versao] = m;
  return {
    referencia: `${livro.trim()} ${cap}.${ini}${fim ? `–${fim}` : ""}`,
    inicio: Number(ini),
    versao: versao ?? null,
  };
}

// "13 O Senhor disse... 14 Por isso..." -> um versículo por linha
export function separarVersiculos(texto: string, inicio: number | null): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const primeiro = inicio ?? Number(limpo.match(/^(\d+)\s/)?.[1] ?? NaN);
  if (Number.isNaN(primeiro) || !limpo.startsWith(`${primeiro} `)) return limpo;
  const linhas: string[] = [];
  let resto = limpo;
  for (let n = primeiro + 1; ; n++) {
    const pos = resto.search(new RegExp(`\\s${n}\\s`));
    if (pos < 0) break;
    linhas.push(resto.slice(0, pos).trim());
    resto = resto.slice(pos).trim();
  }
  linhas.push(resto);
  return linhas.join("\n");
}

export function lerTrechoColado(colado: string, versaoPadrao = "NAA"): TrechoColado {
  const normal = colado.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (s) => ` ${[...s].map((c) => SOBRESCRITOS[c]).join("")} `);
  const linhas = normal.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let ref = linhas.length ? lerReferencia(linhas[0]) : null;
  if (ref) linhas.shift();
  else if (linhas.length > 1 && (ref = lerReferencia(linhas.at(-1)!))) linhas.pop();

  const corpo = linhas.join(" ").replace(/^[“"]\s*/, "").replace(/\s*[”"]$/, "");
  return {
    referencia: ref?.referencia ?? "",
    versao: ref?.versao ?? versaoPadrao,
    texto: separarVersiculos(corpo, ref?.inicio ?? null),
  };
}
