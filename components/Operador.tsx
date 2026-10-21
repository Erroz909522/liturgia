"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/slides";
import SlideView from "./SlideView";
import { canal, type Estado, type Mensagem, type Modo } from "./sincronia";

export default function Operador({ cultoId, titulo, slides }: { cultoId: string; titulo: string; slides: Slide[] }) {
  const [estado, setEstado] = useState<Estado>({ indice: 0, modo: "slide" });
  const bc = useRef<BroadcastChannel | null>(null);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    const c = canal(cultoId);
    bc.current = c;
    c.onmessage = (e: MessageEvent<Mensagem>) => {
      if (e.data.tipo === "pedir-estado") c.postMessage({ tipo: "estado", estado: estadoRef.current } satisfies Mensagem);
    };
    return () => c.close();
  }, [cultoId]);

  const enviar = useCallback((novo: Estado) => {
    setEstado(novo);
    bc.current?.postMessage({ tipo: "estado", estado: novo } satisfies Mensagem);
  }, []);

  const ir = useCallback(
    (indice: number) => enviar({ indice: Math.max(0, Math.min(slides.length - 1, indice)), modo: "slide" }),
    [enviar, slides.length],
  );
  const modo = (m: Modo) => enviar({ ...estadoRef.current, modo: estadoRef.current.modo === m ? "slide" : m });

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(estadoRef.current.indice + 1); }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); ir(estadoRef.current.indice - 1); }
      if (e.key === "b" || e.key === "B") modo("preto");
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  // Mantém o slide atual visível na lista
  useEffect(() => {
    document.getElementById(`s-${estado.indice}`)?.scrollIntoView({ block: "nearest" });
  }, [estado.indice]);

  const abrirTelao = () => window.open(`/culto/${cultoId}/telao`, `telao-${cultoId}`, "popup,width=1280,height=720");

  return (
    <div className="operador">
      <aside>
        {slides.map((s, i) => (
          <div key={i}>
            {(i === 0 || slides[i - 1].parteId !== s.parteId) && <div className="grupo">{s.parte}</div>}
            <button id={`s-${i}`} className={i === estado.indice ? "atual" : ""} onClick={() => ir(i)}>
              {s.texto}
            </button>
          </div>
        ))}
        {slides.length === 0 && <p className="muted" style={{ padding: 14 }}>Nenhum slide ainda. Preencha as partes do culto.</p>}
      </aside>
      <section>
        <div className="linha">
          <strong style={{ marginRight: "auto" }}>{titulo}</strong>
          <Link href={`/culto/${cultoId}`}>Voltar à liturgia</Link>
          <button className="principal" onClick={abrirTelao}>Abrir telão</button>
        </div>
        <div className="controles">
          <button onClick={() => ir(estado.indice - 1)}>← Anterior</button>
          <button onClick={() => ir(estado.indice + 1)}>Próximo →</button>
          <button className={estado.modo === "preto" ? "ativo" : ""} onClick={() => modo("preto")}>Tela preta (B)</button>
          <button className={estado.modo === "limpo" ? "ativo" : ""} onClick={() => modo("limpo")}>Esconder texto</button>
          <span className="muted" style={{ alignSelf: "center" }}>Slide {slides.length ? estado.indice + 1 : 0} de {slides.length}</span>
        </div>
        <div className="previas">
          <div>
            <p className="muted">No telão agora</p>
            <SlideView slide={slides[estado.indice]} modo={estado.modo} />
          </div>
          <div>
            <p className="muted">Próximo</p>
            <SlideView slide={slides[estado.indice + 1]} />
          </div>
        </div>
        <p className="muted" style={{ marginTop: 20 }}>
          Clique em Abrir telão e arraste a janela para o projetor; dentro dela, clique duas vezes para tela cheia. Use as setas do teclado aqui para avançar.
        </p>
      </section>
    </div>
  );
}
