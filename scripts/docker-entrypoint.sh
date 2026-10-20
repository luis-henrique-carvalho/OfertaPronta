#!/bin/sh
set -e

# Executa migrações de banco automaticamente se DATABASE_URL estiver configurada
if [ -n "$DATABASE_URL" ] && [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "[entrypoint] Executando migrações do banco de dados Drizzle..."
  node scripts/migrate.mjs || {
    echo "[entrypoint] Falha ao aplicar migrações!"
    exit 1
  }
fi

echo "[entrypoint] Iniciando servidor OfertaPronta na porta ${PORT:-3000}..."
exec "$@"
