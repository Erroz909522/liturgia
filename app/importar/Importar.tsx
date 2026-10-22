"use client";

import { useActionState } from "react";
import { importarNotion } from "../actions";

export default function Importar() {
  const [estado, acao, rodando] = useActionState(importarNotion, null);
  return (
    <form action={acao} className="cartao">
      <button className="principal" disabled={rodando}>{rodando ? "Importando…" : "Importar do Notion"}</button>
      {estado && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: estado.ok ? "var(--ok)" : "#b42318" }}>{estado.mensagem}</p>
          {estado.avisos.length > 0 && (
            <ul className="muted">{estado.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
          )}
        </div>
      )}
    </form>
  );
}
