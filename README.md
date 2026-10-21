# Liturgia

App web para montar a liturgia do culto (estilo Notion) e projetar no telão (estilo Holyrics).

## Como funciona

1. **Bancos** reaproveitados de um culto para outro: textos bíblicos (NAA), músicas, sermões e catecismo.
2. **Culto**: nasce com a sequência padrão (Convocação, Música, Confissão, Perdão, Música, Ofertas, Símbolos de fé, Sermão, Batismos). Cada parte aponta para um item do banco, tem responsável e status.
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
