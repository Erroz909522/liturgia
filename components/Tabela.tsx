"use client";

// Tabela estilo Notion: cada célula edita no lugar e salva sozinha.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

export type Opcao = { id: string; rotulo: string };

export type Coluna = { chave: string; titulo: string; largura?: number } & (
  | { tipo: "texto" | "textoLongo" | "data" | "numero" }
  | { tipo: "selecao"; opcoes: string[] }
  | { tipo: "relacao"; fonte: string; multiplo: boolean; hrefFonte: string }
);

export type Linha = { id: string; valores: Record<string, string | Opcao[] | null> };

type Props = {
  colunas: Coluna[];
  linhas: Linha[];
  opcoes?: Record<string, Opcao[]>;
  hrefLinha?: string; // a primeira coluna abre a linha; "{id}" vira o id da linha
  acoesLinha?: { href: string; rotulo: string }[];
  rotuloNova: string;
  salvar: (id: string, chave: string, valor: string | null) => Promise<void>;
  salvarRelacao?: (id: string, chave: string, ids: string[]) => Promise<void>;
  criarOpcao?: (fonte: string, rotulo: string) => Promise<Opcao>;
  novaLinha: () => Promise<void>;
  excluirLinha: (id: string) => Promise<void>;
};

export default function Tabela(props: Props) {
  const { colunas, hrefLinha, acoesLinha, rotuloNova } = props;
  const [linhas, setLinhas] = useState(props.linhas);
  const [opcoes, setOpcoes] = useState(props.opcoes ?? {});
  const [editando, setEditando] = useState<{ id: string; chave: string } | null>(null);
  const [, iniciar] = useTransition();

  // O servidor revalida depois de cada gravação; adota a versão nova
  useEffect(() => setLinhas(props.linhas), [props.linhas]);
  useEffect(() => setOpcoes(props.opcoes ?? {}), [props.opcoes]);

  const mudarLocal = (id: string, chave: string, valor: Linha["valores"][string]) =>
    setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, valores: { ...l.valores, [chave]: valor } } : l)));

  const gravar = (id: string, chave: string, valor: string | null) => {
    mudarLocal(id, chave, valor);
    setEditando(null);
    iniciar(() => props.salvar(id, chave, valor));
  };

  const gravarRelacao = (id: string, chave: string, selecionadas: Opcao[]) => {
    mudarLocal(id, chave, selecionadas);
    iniciar(() => props.salvarRelacao!(id, chave, selecionadas.map((o) => o.id)));
  };

  const criar = async (fonte: string, rotulo: string) => {
    const nova = await props.criarOpcao!(fonte, rotulo);
    setOpcoes((o) => ({ ...o, [fonte]: [...(o[fonte] ?? []), nova] }));
    return nova;
  };

  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} style={{ minWidth: c.largura ?? 160 }}>{c.titulo}</th>
            ))}
            <th style={{ minWidth: 90 }} />
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id}>
              {colunas.map((c, i) => {
                const ativo = editando?.id === linha.id && editando.chave === c.chave;
                return (
                  <td key={c.chave} className={ativo ? "ativa" : ""} onClick={ativo ? undefined : () => setEditando({ id: linha.id, chave: c.chave })}>
                    <Celula
                      coluna={c}
                      valor={linha.valores[c.chave] ?? null}
                      ativo={ativo}
                      href={i === 0 && hrefLinha ? hrefLinha.replace("{id}", linha.id) : undefined}
                      opcoes={c.tipo === "relacao" ? opcoes[c.fonte] ?? [] : []}
                      fechar={() => setEditando(null)}
                      gravar={(v) => gravar(linha.id, c.chave, v)}
                      gravarRelacao={(sel) => gravarRelacao(linha.id, c.chave, sel)}
                      criar={criar}
                    />
                  </td>
                );
              })}
              <td className="acoes">
                {acoesLinha?.map((a) => (
                  <Link key={a.href} href={a.href.replace("{id}", linha.id)} className="botao pequeno">{a.rotulo}</Link>
                ))}
                <button
                  className="pequeno discreto"
                  title="Excluir linha"
                  onClick={() => {
                    if (!confirm("Excluir esta linha?")) return;
                    setLinhas((ls) => ls.filter((l) => l.id !== linha.id));
                    iniciar(() => props.excluirLinha(linha.id));
                  }}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="nova-linha" onClick={() => iniciar(() => props.novaLinha())}>+ {rotuloNova}</button>
    </div>
  );
}

type PropsCelula = {
  coluna: Coluna;
  valor: string | Opcao[] | null;
  ativo: boolean;
  href?: string;
  opcoes: Opcao[];
  fechar: () => void;
  gravar: (v: string | null) => void;
  gravarRelacao: (sel: Opcao[]) => void;
  criar: (fonte: string, rotulo: string) => Promise<Opcao>;
};

function formatar(coluna: Coluna, valor: string | null) {
  if (!valor) return "";
  if (coluna.tipo === "data") {
    const [a, m, d] = valor.slice(0, 10).split("-");
    return `${d}/${m}/${a}`;
  }
  return valor;
}

function Celula({ coluna, valor, ativo, href, opcoes, fechar, gravar, gravarRelacao, criar }: PropsCelula) {
  if (coluna.tipo === "relacao") {
    const sel = (valor as Opcao[] | null) ?? [];
    return (
      <div className="celula">
        <div className="chips">
          {sel.map((o) => <span key={o.id} className="chip">{o.rotulo}</span>)}
        </div>
        {ativo && (
          <Seletor coluna={coluna} selecionadas={sel} opcoes={opcoes} fechar={fechar} gravar={gravarRelacao} criar={criar} />
        )}
      </div>
    );
  }

  const texto = valor as string | null;
  if (!ativo) {
    const mostrado = formatar(coluna, texto);
    return (
      <div className={`celula ${coluna.tipo === "textoLongo" ? "longa" : ""}`}>
        {href && mostrado ? (
          <Link href={href} className="titulo-linha" onClick={(e) => e.stopPropagation()}>{mostrado}</Link>
        ) : coluna.tipo === "selecao" && mostrado ? (
          <span className="chip">{mostrado}</span>
        ) : (
          mostrado
        )}
      </div>
    );
  }

  return <Editor coluna={coluna} valor={texto} fechar={fechar} gravar={gravar} />;
}

function Editor({ coluna, valor, fechar, gravar }: { coluna: Coluna; valor: string | null; fechar: () => void; gravar: (v: string | null) => void }) {
  const [rascunho, setRascunho] = useState(coluna.tipo === "data" ? valor?.slice(0, 10) ?? "" : valor ?? "");
  const confirmar = () => {
    const v = rascunho.trim() ? rascunho : null;
    if (v === (valor ?? null) || (coluna.tipo === "data" && v === valor?.slice(0, 10))) fechar();
    else gravar(v);
  };
  const tecla = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") fechar();
    if (e.key === "Enter" && (coluna.tipo !== "textoLongo" || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      confirmar();
    }
  };

  if (coluna.tipo === "selecao") {
    return (
      <select autoFocus className="editor" value={rascunho} onChange={(e) => gravar(e.target.value || null)} onBlur={fechar} onKeyDown={tecla}>
        <option value="" />
        {coluna.opcoes.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  if (coluna.tipo === "textoLongo") {
    return (
      <div className="editor-longo">
        <textarea autoFocus value={rascunho} onChange={(e) => setRascunho(e.target.value)} onBlur={confirmar} onKeyDown={tecla} rows={10} />
        <span className="muted">Ctrl+Enter salva · Esc cancela</span>
      </div>
    );
  }
  return (
    <input
      autoFocus
      className="editor"
      type={coluna.tipo === "data" ? "date" : coluna.tipo === "numero" ? "number" : "text"}
      value={rascunho}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={confirmar}
      onKeyDown={tecla}
    />
  );
}

function Seletor({ coluna, selecionadas, opcoes, fechar, gravar, criar }: {
  coluna: Extract<Coluna, { tipo: "relacao" }>;
  selecionadas: Opcao[];
  opcoes: Opcao[];
  fechar: () => void;
  gravar: (sel: Opcao[]) => void;
  criar: (fonte: string, rotulo: string) => Promise<Opcao>;
}) {
  const [busca, setBusca] = useState("");
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) fechar();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [fechar]);

  const filtradas = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return opcoes.filter((o) => !b || o.rotulo.toLowerCase().includes(b)).slice(0, 50);
  }, [busca, opcoes]);

  const marcada = (o: Opcao) => selecionadas.some((s) => s.id === o.id);
  const alternar = (o: Opcao) => {
    if (!coluna.multiplo) {
      gravar(marcada(o) ? [] : [o]);
      fechar();
    } else {
      gravar(marcada(o) ? selecionadas.filter((s) => s.id !== o.id) : [...selecionadas, o]);
    }
  };
  const existeIgual = opcoes.some((o) => o.rotulo.toLowerCase() === busca.trim().toLowerCase());

  return (
    <div className="seletor" ref={caixa} onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        placeholder="Buscar ou criar…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") fechar();
          if (e.key === "Enter" && filtradas[0]) alternar(filtradas[0]);
        }}
      />
      <ul>
        {filtradas.map((o) => (
          <li key={o.id} className={marcada(o) ? "marcada" : ""} onClick={() => alternar(o)}>
            <span className="marca">{marcada(o) ? "✓" : ""}</span>
            {o.rotulo}
          </li>
        ))}
        {busca.trim() && !existeIgual && (
          <li className="criar" onClick={async () => { alternar(await criar(coluna.fonte, busca.trim())); setBusca(""); }}>
            + Criar “{busca.trim()}”
          </li>
        )}
        {filtradas.length === 0 && !busca.trim() && <li className="muted">Nada cadastrado ainda</li>}
      </ul>
      <Link href={coluna.hrefFonte} className="muted" style={{ fontSize: 12 }}>Abrir a tabela completa</Link>
    </div>
  );
}
