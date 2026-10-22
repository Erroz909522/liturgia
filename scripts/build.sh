#!/bin/sh
# Só a produção (ou um build local) altera o banco: as prévias de PR na Vercel não têm DATABASE_URL
# e não podem mexer nas tabelas de produção.
set -e
if [ -z "$VERCEL_ENV" ] || [ "$VERCEL_ENV" = "production" ]; then
  prisma db push --skip-generate
fi
next build
