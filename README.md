# Liturgia

App web para montar a liturgia do culto (estilo Notion) e projetar no telão (estilo Holyrics).

## Como funciona

1. **Tabelas estilo Notion**: a tela inicial é a tabela de liturgias, uma linha por culto, com as colunas da base do Notion da igreja (Data, Ocasião, Sermão, Texto do Sermão, Pregador, Convocação, Músicas, Confissão, Perdão, Ofertas, Símbolos de fé, Batismos). Cada célula edita no lugar. As colunas de relação buscam nos bancos, que também são tabelas: textos bíblicos (NAA), músicas, sermões e catecismo. Dá para criar um item novo direto do seletor.
2. **Ordem do culto**: quem projeta abre a liturgia (clique na data) e monta a ordem das partes.
3. **Projeção**: a tela do operador lista todos os slides gerados da liturgia; o botão *Abrir telão* abre a janela que vai para o projetor. As duas janelas conversam pelo navegador (BroadcastChannel), sem internet.

Atalhos do operador: setas ou espaço avançam, **B** liga/desliga a tela preta. Duplo clique no telão alterna tela cheia.

## Colocar online (Vercel + Neon, gratuitos)

1. Crie um banco em https://neon.tech (plano gratuito) e copie a *connection string* (começa com `postgresql://`).
2. Em https://vercel.com, entre com o GitHub, clique em **Add New > Project** e importe este repositório.
3. Antes de clicar em **Deploy**, abra **Environment Variables** e adicione:
   - `DATABASE_URL`: a connection string do Neon
   - `APP_SENHA`: a senha que a equipe vai usar para entrar no app
4. Clique em **Deploy**. O build cria as tabelas no banco sozinho. No fim, a Vercel mostra o link do app.

Ao abrir o link, o navegador pede usuário e senha: o usuário pode ser qualquer um, a senha é a `APP_SENHA`.
Cada merge na branch `main` publica a versão nova automaticamente.

## Rodar localmente

Precisa de um banco Postgres (pode ser outro banco gratuito do Neon, separado do de produção).

```bash
cp .env.example .env   # e preencha DATABASE_URL
npm install
npx prisma db push     # cria as tabelas
npm run db:seed        # opcional: culto de exemplo de 25/10/2026
npm run dev            # http://localhost:3000
```

## Estrutura

- `prisma/schema.prisma`: modelo de dados
- `lib/liturgia.ts`: tipos de parte e modelo padrão do culto
- `lib/slides.ts`: transforma a liturgia em slides
- `app/culto/[id]`: editor da liturgia, `operador` e `telao`
- `app/textos`, `app/musicas`, `app/sermoes`, `app/catecismo`: bancos
