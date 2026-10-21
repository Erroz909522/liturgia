import type { Slide } from "@/lib/slides";
import type { Modo } from "./sincronia";

// Letra menor quanto mais texto o slide tem
function tamanho(texto: string) {
  const n = texto.length;
  if (n < 60) return 7;
  if (n < 140) return 5.6;
  if (n < 220) return 4.6;
  return 3.8;
}

export default function SlideView({ slide, modo = "slide" }: { slide?: Slide; modo?: Modo }) {
  const mostrar = modo === "slide" && slide;
  return (
    <div className="slide">
      {mostrar && (
        <>
          {slide.titulo && <div className="slide-titulo">{slide.titulo}</div>}
          <div className="slide-texto" style={{ fontSize: `${tamanho(slide.texto)}cqw` }}>
            {slide.texto}
          </div>
          {slide.rodape && <div className="slide-rodape">{slide.rodape}</div>}
        </>
      )}
    </div>
  );
}
