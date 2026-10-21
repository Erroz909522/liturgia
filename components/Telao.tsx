"use client";

import { useEffect, useState } from "react";
import type { Slide } from "@/lib/slides";
import SlideView from "./SlideView";
import { canal, type Estado, type Mensagem } from "./sincronia";

export default function Telao({ cultoId, slides }: { cultoId: string; slides: Slide[] }) {
  const [estado, setEstado] = useState<Estado>({ indice: 0, modo: "preto" });

  useEffect(() => {
    const c = canal(cultoId);
    c.onmessage = (e: MessageEvent<Mensagem>) => {
      if (e.data.tipo === "estado") setEstado(e.data.estado);
    };
    c.postMessage({ tipo: "pedir-estado" } satisfies Mensagem);
    return () => c.close();
  }, [cultoId]);

  const telaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  return (
    <div className="telao" onDoubleClick={telaCheia}>
      <SlideView slide={slides[estado.indice]} modo={estado.modo} />
    </div>
  );
}
