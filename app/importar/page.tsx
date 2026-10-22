import { notionConfigurado } from "@/lib/notion";
import Topo from "../Topo";
import Importar from "./Importar";

export const dynamic = "force-dynamic";

export default function PaginaImportar() {
  return (
    <>
      <Topo />
      <main className="pagina">
        <h1>Importar do Notion</h1>
        <p className="muted">
          Traz as liturgias da base do Notion, com os textos bíblicos, músicas, sermões e perguntas do catecismo
          ligados a elas. Pode rodar quantas vezes quiser: o que já foi importado é atualizado, não duplicado. As partes
          de um culto importado são substituídas pelo que está no Notion.
        </p>
        {notionConfigurado() ? (
          <Importar />
        ) : (
          <div className="cartao">
            Falta configurar <code>NOTION_TOKEN</code> e <code>NOTION_LITURGIA_DB</code> no arquivo <code>.env</code>. O
            README explica como.
          </div>
        )}
      </main>
    </>
  );
}
