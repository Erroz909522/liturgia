# Liturgia

App web para montar a liturgia do culto (estilo Notion) e projetar no telão (estilo Holyrics).

## Como funciona

1. **Tabelas estilo Notion**: a tela inicial é a tabela de liturgias, uma linha por culto, com as colunas da base do Notion da igreja (Data, Ocasião, Sermão, Texto do Sermão, Pregador, Convocação, Músicas, Confissão, Perdão, Ofertas, Símbolos de fé, Batismos). Cada célula edita no lugar. As colunas de relação buscam nos bancos, que também são tabelas: textos bíblicos (NAA), músicas, sermões e catecismo. Dá para criar um item novo direto do seletor.
2. **Ordem do culto**: quem projeta abre a liturgia (clique na data) e monta a ordem das partes.
3. **Projeção**: a tela do operador lista todos os slides gerados da liturgia; o botão *Abrir telão* abre a janela que vai para o projetor. As duas janelas conversam pelo navegador (BroadcastChannel), sem internet.

Atalhos do operador: setas ou espaço avançam, **B** liga/desliga a tela preta. Duplo clique no telão alterna tela cheia.

## Rodar localmente

```bash
npm install
npx prisma db push   # cria o banco SQLite em prisma/dev.db
npm run db:seed      # opcional: culto de exemplo de 25/10/2026
npm run dev          # http://localhost:3000
```

Precisa de um arquivo `.env` com `DATABASE_URL="file:./dev.db"`.

## Estrutura

- `prisma/schema.prisma`: modelo de dados
- `lib/liturgia.ts`: tipos de parte e modelo padrão do culto
- `lib/slides.ts`: transforma a liturgia em slides
- `app/culto/[id]`: editor da liturgia, `operador` e `telao`
- `app/textos`, `app/musicas`, `app/sermoes`, `app/catecismo`: bancos
