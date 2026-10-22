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

## Importar do Notion

1. Em https://www.notion.so/profile/integrations crie uma integração interna e copie o token (começa com `ntn_`).
2. No Notion, abra a base de liturgias e, em `•••` > Conexões, adicione a integração. Faça o mesmo nas bases de textos bíblicos, sermões, catecismo e músicas, para que as relações possam ser lidas.
3. Copie o id da base de liturgias: é o trecho de 32 caracteres no link da base, antes do `?v=`.
4. Preencha no `.env`:

```bash
NOTION_TOKEN="ntn_..."
NOTION_LITURGIA_DB="0123456789abcdef0123456789abcdef"
```

5. Abra **Importar do Notion** no app e clique no botão.

O importador lê as propriedades pelo nome: Data, Ocasião, Sermão, Texto do Sermão, Pregador, Convocação, Confissão, Perdão, Ofertas, Símbolos de fé e Batismos. Qualquer relação com "Música", "Louvor", "Cântico" ou "Hino" no nome vira música; a primeira entra depois da Convocação e as demais depois do Perdão. Textos bíblicos são lidos do título (`Lucas 2.20 (NAA) 20 E os pastores...`) ou do corpo da página; letras de música vêm do corpo da página, com linha em branco separando as partes.

## Estrutura

- `prisma/schema.prisma`: modelo de dados
- `lib/liturgia.ts`: tipos de parte e modelo padrão do culto
- `lib/slides.ts`: transforma a liturgia em slides
- `lib/notion.ts` e `lib/notion-parse.ts`: importação do Notion (`node --experimental-strip-types --test lib/notion-parse.test.ts`)
- `app/culto/[id]`: editor da liturgia, `operador` e `telao`
- `app/textos`, `app/musicas`, `app/sermoes`, `app/catecismo`: bancos
