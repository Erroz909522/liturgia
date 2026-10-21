// Operador e telão conversam pelo BroadcastChannel: duas janelas do mesmo navegador, sem servidor no meio.

export type Modo = "slide" | "preto" | "limpo";
export type Estado = { indice: number; modo: Modo };
export type Mensagem = { tipo: "estado"; estado: Estado } | { tipo: "pedir-estado" };

export const canal = (cultoId: string) => new BroadcastChannel(`liturgia-${cultoId}`);
