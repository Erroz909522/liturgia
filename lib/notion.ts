import { db } from "./db";
import {
  PARTES_NOTION,
  acharProp,
  blocosParaTexto,
  blocosParaTopicos,
  ehPropMusica,
  lerCatecismo,
  lerTextoBiblico,
  propRelacoes,
  propTexto,
  tituloDaPagina,
} from "./notion-parse";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const API = process.env.NOTION_API_URL ?? "https://api.notion.com/v1";
const VERSAO_API = "2022-06-28";

export function notionConfigurado() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_LITURGIA_DB);
}

// A API do Notion aceita cerca de 3 pedidos por segundo
let ultimoPedido = 0;
async function notion(caminho: string, init?: RequestInit): Promise<Json> {
  for (let tentativa = 0; ; tentativa++) {
    const espera = ultimoPedido + 340 - Date.now();
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimoPedido = Date.now();
    const res = await fetch(`${API}${caminho}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": VERSAO_API,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (res.status === 429 && tentativa < 5) {
      await new Promise((r) => setTimeout(r, Number(res.headers.get("Retry-After") ?? 1) * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Notion respondeu ${res.status} em ${caminho}: ${await res.text()}`);
    return res.json();
  }
}

async function paginasDaBase(baseId: string): Promise<Json[]> {
  const paginas: Json[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion(`/databases/${baseId}/query`, {
      method: "POST",
      body: JSON.stringify({ start_cursor: cursor, page_size: 100, sorts: [{ timestamp: "created_time", direction: "ascending" }] }),
    });
    paginas.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return paginas;
}

async function blocos(paginaId: string): Promise<Json[]> {
  const todos: Json[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion(`/blocks/${paginaId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`);
    todos.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return todos;
}

// Página relacionada: título + corpo, lida uma vez por importação
type Relacionada = { id: string; titulo: string; blocos: Json[] };

export type Resultado = {
  cultos: number;
  textos: number;
  musicas: number;
  sermoes: number;
  catecismo: number;
  avisos: string[];
};

export async function importarDoNotion(): Promise<Resultado> {
  if (!notionConfigurado()) throw new Error("Configure NOTION_TOKEN e NOTION_LITURGIA_DB no arquivo .env");

  const cache = new Map<string, Promise<Relacionada>>();
  const relacionada = (id: string) => {
    if (!cache.has(id)) {
      cache.set(id, (async () => {
        const pagina = await notion(`/pages/${id}`);
        return { id, titulo: tituloDaPagina(pagina), blocos: await blocos(id) };
      })());
    }
    return cache.get(id)!;
  };

  const r: Resultado = { cultos: 0, textos: 0, musicas: 0, sermoes: 0, catecismo: 0, avisos: [] };
  const vistos = { textos: new Set<string>(), musicas: new Set<string>(), sermoes: new Set<string>(), catecismo: new Set<string>() };

  const salvarTexto = async (id: string) => {
    const p = await relacionada(id);
    const dados = lerTextoBiblico(p.titulo, blocosParaTexto(p.blocos));
    vistos.textos.add(id);
    return db.textoBiblico.upsert({ where: { notionId: id }, create: { notionId: id, ...dados }, update: dados });
  };
  const salvarMusica = async (id: string) => {
    const p = await relacionada(id);
    const dados = { titulo: p.titulo || "Sem título", letra: blocosParaTexto(p.blocos) };
    vistos.musicas.add(id);
    return db.musica.upsert({ where: { notionId: id }, create: { notionId: id, ...dados }, update: dados });
  };
  const salvarCatecismo = async (id: string) => {
    const p = await relacionada(id);
    const dados = lerCatecismo(p.titulo, blocosParaTexto(p.blocos));
    vistos.catecismo.add(id);
    return db.catecismo.upsert({ where: { notionId: id }, create: { notionId: id, ...dados }, update: dados });
  };
  const salvarSermao = async (id: string, textoBase: string | null) => {
    const p = await relacionada(id);
    const topicos = blocosParaTopicos(p.blocos) || null;
    const dados = { titulo: p.titulo || "Sem título", textoBase, topicos };
    vistos.sermoes.add(id);
    return db.sermao.upsert({ where: { notionId: id }, create: { notionId: id, ...dados }, update: dados });
  };

  for (const pagina of await paginasDaBase(process.env.NOTION_LITURGIA_DB!)) {
    const props: Record<string, Json> = pagina.properties;
    const nome = tituloDaPagina(pagina) || pagina.id;
    const data = propTexto(acharProp(props, "data"));
    if (!data) {
      r.avisos.push(`"${nome}" foi ignorada por não ter Data.`);
      continue;
    }
    const textoSermao = propTexto(acharProp(props, "texto do sermao")) || null;
    const sermaoId = propRelacoes(acharProp(props, "sermao"))[0];
    const sermao = sermaoId ? await salvarSermao(sermaoId, textoSermao) : null;

    // Partes na ordem do modelo; músicas: a primeira depois da Convocação, as demais depois do Perdão
    const musicas = Object.entries(props)
      .filter(([k, p]) => ehPropMusica(k) && p.type === "relation")
      .flatMap(([, p]) => propRelacoes(p));
    const partes: { tipo: string; titulo: string; textoBiblicoId?: string; musicaId?: string; catecismoId?: string; conteudo?: string }[] = [];
    const addMusicas = async (ids: string[]) => {
      for (const id of ids) partes.push({ tipo: "musica", titulo: "Música", musicaId: (await salvarMusica(id)).id });
    };

    for (const def of PARTES_NOTION) {
      const ids = propRelacoes(acharProp(props, def.nome));
      if (ids.length === 0) partes.push({ tipo: def.tipo, titulo: def.titulo });
      for (const id of ids) {
        if (def.tipo === "simbolos_fe") partes.push({ tipo: def.tipo, titulo: def.titulo, catecismoId: (await salvarCatecismo(id)).id });
        else partes.push({ tipo: def.tipo, titulo: def.titulo, textoBiblicoId: (await salvarTexto(id)).id });
      }
      if (def.nome === "convocacao") await addMusicas(musicas.slice(0, 1));
      if (def.nome === "perdao") await addMusicas(musicas.slice(1));
    }
    partes.push({ tipo: "sermao", titulo: "Sermão" });

    const batismosProp = acharProp(props, "batismos");
    const batismos = batismosProp?.type === "relation"
      ? (await Promise.all(propRelacoes(batismosProp).map(relacionada))).map((p) => p.titulo).join("\n")
      : propTexto(batismosProp);
    partes.push({ tipo: "batismos", titulo: "Batismos", conteudo: batismos || undefined });

    const cabecalho = {
      data: new Date(`${data.slice(0, 10)}T00:00:00Z`),
      ocasiao: propTexto(acharProp(props, "ocasiao")) || "Domingo",
      pregador: propTexto(acharProp(props, "pregador")) || null,
      textoSermao,
      sermaoId: sermao?.id ?? null,
    };
    const novasPartes = partes.map((p, ordem) => ({
      ...p,
      ordem,
      status: p.textoBiblicoId || p.musicaId || p.catecismoId || p.conteudo || (p.tipo === "sermao" && sermao) ? "preenchido" : "pendente",
    }));

    // Reimportar substitui as partes do culto pelo que está no Notion
    await db.culto.upsert({
      where: { notionId: pagina.id },
      create: { notionId: pagina.id, ...cabecalho, partes: { create: novasPartes } },
      update: { ...cabecalho, partes: { deleteMany: {}, create: novasPartes } },
    });
    r.cultos++;
  }

  r.textos = vistos.textos.size;
  r.musicas = vistos.musicas.size;
  r.sermoes = vistos.sermoes.size;
  r.catecismo = vistos.catecismo.size;
  return r;
}
