// Tipos de parte da liturgia, na ordem usada pela igreja (modelo vindo do Notion)

export type TipoParte =
  | "convocacao"
  | "confissao"
  | "perdao"
  | "ofertas"
  | "simbolos_fe"
  | "sermao"
  | "batismos"
  | "musica"
  | "livre";

// De onde vem o conteúdo de cada tipo
export const FONTE: Record<TipoParte, "texto" | "musica" | "catecismo" | "sermao" | "livre"> = {
  convocacao: "texto",
  confissao: "texto",
  perdao: "texto",
  ofertas: "texto",
  simbolos_fe: "catecismo",
  sermao: "sermao",
  batismos: "livre",
  musica: "musica",
  livre: "livre",
};

export const NOME_TIPO: Record<TipoParte, string> = {
  convocacao: "Convocação",
  confissao: "Confissão",
  perdao: "Perdão",
  ofertas: "Ofertas",
  simbolos_fe: "Símbolos de fé",
  sermao: "Sermão",
  batismos: "Batismos",
  musica: "Música",
  livre: "Parte livre",
};

export const TIPOS = Object.keys(NOME_TIPO) as TipoParte[];

// Sequência criada em todo culto novo
export const MODELO_PADRAO: TipoParte[] = [
  "convocacao",
  "musica",
  "confissao",
  "perdao",
  "musica",
  "ofertas",
  "simbolos_fe",
  "sermao",
  "batismos",
];

export const STATUS = ["pendente", "preenchido", "revisado"] as const;

export function formatarData(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
}
