"use client";

import { useState, useTransition } from "react";
import { lerTrechoColado } from "@/lib/colar";
import { salvarTrechoColado } from "../actions";

// Cola um trecho de qualquer app ou site da Bíblia; a referência e os versículos são separados sozinhos
export default function Colar() {
  const [colado, setColado] = useState("");
  const [trecho, setTrecho] = useState({ referencia: "", versao: "NAA", texto: "" });
  const [aviso, setAviso] = useState("");
  const [salvando, iniciar] = useTransition();

  const colar = (valor: string) => {
    setColado(valor);
    setTrecho(lerTrechoColado(valor));
    setAviso("");
  };

  const salvar = () =>
    iniciar(async () => {
      try {
        await salvarTrechoColado(trecho);
        setAviso(`${trecho.referencia} adicionado.`);
        setColado("");
        setTrecho({ referencia: "", versao: "NAA", texto: "" });
      } catch (e) {
        setAviso(e instanceof Error ? e.message : String(e));
      }
    });

  return (
    <div className="cartao colar">
      <strong>Colar trecho</strong>
      <p className="muted" style={{ margin: "4px 0 10px" }}>
        Copie o trecho no app ou site da Bíblia (com a referência, como “Isaías 29:13-15 NAA”) e cole aqui.
      </p>
      <textarea value={colado} onChange={(e) => colar(e.target.value)} rows={4} placeholder="Cole o trecho aqui" />
      {colado.trim() && (
        <div className="grade" style={{ marginTop: 12 }}>
          <label>Referência</label>
          <input value={trecho.referencia} onChange={(e) => setTrecho({ ...trecho, referencia: e.target.value })} placeholder="Ex.: Lucas 2.20" />
          <label>Versão</label>
          <input value={trecho.versao} onChange={(e) => setTrecho({ ...trecho, versao: e.target.value })} style={{ width: 100 }} />
          <label>Versículos</label>
          <textarea value={trecho.texto} onChange={(e) => setTrecho({ ...trecho, texto: e.target.value })} rows={Math.min(10, trecho.texto.split("\n").length + 1)} />
          <span />
          <div className="linha">
            <button className="principal" onClick={salvar} disabled={salvando || !trecho.referencia.trim() || !trecho.texto.trim()}>
              {salvando ? "Salvando…" : "Adicionar ao banco"}
            </button>
          </div>
        </div>
      )}
      {aviso && <p className="muted" style={{ marginTop: 8 }}>{aviso}</p>}
    </div>
  );
}
