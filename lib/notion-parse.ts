// Leitura dos dados do Notion sem acesso à rede nem ao banco, para poder testar isolado.
// Os formatos seguem a liturgia da igreja (ex.: 25/10/2026):
//   texto bíblico  -> título "Lucas 2.20 (NAA) 20 E os pastores voltaram..."
//   catecismo      -> título "Pergunta 43: O que são sacramentos? Resposta: Os sacramentos..."

type Json = any;

export function normalizar(nome: string) {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const textoRico = (partes: Json[] | undefined) => (partes ?? []).map((p) => p.plain_text ?? "").join("");

// Valor de uma propriedade do Notion como texto simples
export function propTexto(prop: Json): string {
  if (!prop) return "";
  switch (prop.type) {
    case "title":
      return textoRico(prop.title);
    case "rich_text":
      return textoRico(prop.rich_text);
    case "select":
      return prop.select?.name ?? "";
    case "status":
      return prop.status?.name ?? "";
    case "multi_select":
      return (prop.multi_select ?? []).map((s: Json) => s.name).join(", ");
    case "date":
      return prop.date?.start ?? "";
    case "number":
      return prop.number == null ? "" : String(prop.number);
    case "people":
      return (prop.people ?? []).map((p: Json) => p.name ?? "").filter(Boolean).join(", ");
    case "formula":
      return String(prop.formula?.[prop.formula?.type] ?? "");
    case "rollup":
      if (prop.rollup?.type === "array") return (prop.rollup.array ?? []).map(propTexto).filter(Boolean).join(", ");
      return String(prop.rollup?.[prop.rollup?.type] ?? "");
    default:
      return "";
  }
}

export function propRelacoes(prop: Json): string[] {
  return prop?.type === "relation" ? (prop.relation ?? []).map((r: Json) => r.id) : [];
}

export function tituloDaPagina(pagina: Json): string {
  const prop = Object.values(pagina?.properties ?? {}).find((p: Json) => p?.type === "title");
  return propTexto(prop).trim();
}

// Primeiro versículo da referência: "Isaías 29.13–15" -> 13; "Sl 79" -> null
function primeiroVersiculo(referencia: string): number | null {
  const m = referencia.match(/[.:](\d+)/);
  return m ? Number(m[1]) : null;
}

// "13 O Senhor disse... 14 Por isso..." -> um versículo por linha
export function quebrarVersiculos(texto: string, referencia: string): string {
  const inicio = primeiroVersiculo(referencia);
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (inicio == null || !limpo.startsWith(`${inicio} `)) return limpo;
  const linhas: string[] = [];
  let resto = limpo;
  for (let n = inicio + 1; ; n++) {
    const pos = resto.search(new RegExp(`\\s${n}\\s`));
    if (pos < 0) break;
    linhas.push(resto.slice(0, pos).trim());
    resto = resto.slice(pos).trim();
  }
  linhas.push(resto);
  return linhas.join("\n");
}

export function lerTextoBiblico(titulo: string, corpo: string) {
  const m = titulo.match(/^(.+?)\s*\(([^)]+)\)\s*([\s\S]*)$/);
  const referencia = (m ? m[1] : titulo).trim();
  const versao = m ? m[2].trim() : "NAA";
  const texto = corpo.trim() || (m ? m[3] : "");
  return { referencia, versao, texto: quebrarVersiculos(texto, referencia) };
}

export function lerCatecismo(titulo: string, corpo: string) {
  const completo = `${titulo} ${corpo}`.replace(/\s+/g, " ").trim();
  const m = completo.match(/Pergunta\s*(\d+)\s*[:.-]\s*(.+?)\s*Resposta\s*[:.-]\s*(.+)$/i);
  if (!m) return { numero: 0, pergunta: titulo.trim(), resposta: corpo.trim() };
  return { numero: Number(m[1]), pergunta: m[2].trim(), resposta: m[3].trim() };
}

// Blocos do corpo da página -> texto, uma linha por bloco; bloco vazio vira linha em branco
export function blocosParaTexto(blocos: Json[]): string {
  return blocos
    .map((b) => textoRico(b?.[b?.type]?.rich_text))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Tópicos do sermão: itens de lista no corpo da página
export function blocosParaTopicos(blocos: Json[]): string {
  return blocos
    .filter((b) => ["bulleted_list_item", "numbered_list_item", "heading_2", "heading_3"].includes(b?.type))
    .map((b) => textoRico(b[b.type].rich_text).trim())
    .filter(Boolean)
    .join("\n");
}

// Propriedades da liturgia, pelo nome no Notion (sem acento, minúsculo)
export const PARTES_NOTION: { nome: string; tipo: string; titulo: string }[] = [
  { nome: "convocacao", tipo: "convocacao", titulo: "Convocação" },
  { nome: "confissao", tipo: "confissao", titulo: "Confissão" },
  { nome: "perdao", tipo: "perdao", titulo: "Perdão" },
  { nome: "ofertas", tipo: "ofertas", titulo: "Ofertas" },
  { nome: "simbolos de fe", tipo: "simbolos_fe", titulo: "Símbolos de fé" },
];

export const ehPropMusica = (nome: string) => /music|louvor|cantico|hino/.test(normalizar(nome));

export function acharProp(propriedades: Record<string, Json>, nome: string) {
  const chave = Object.keys(propriedades).find((k) => normalizar(k) === nome);
  return chave ? propriedades[chave] : undefined;
}
