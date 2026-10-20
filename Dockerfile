# syntax=docker/dockerfile:1

# ---------------------------------------------------------
# Estágio 1: Base (Node.js 22 LTS Bookworm Slim)
# ---------------------------------------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app

# Ativa Corepack com a versão do pnpm correspondente ao repositório
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate

# ---------------------------------------------------------
# Estágio 2: Dependências (Instalação e Cache)
# ---------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------
# Estágio 3: Compilação (Build do TanStack Start / Nitro)
# ---------------------------------------------------------
FROM deps AS builder
WORKDIR /app

COPY . .

ENV NODE_ENV=production
RUN pnpm build

# Limpa devDependencies mantendo apenas dependências de produção para scripts/migrações
RUN pnpm prune --prod

# ---------------------------------------------------------
# Estágio 4: Runtime de Produção (Enxuto e Seguro)
# ---------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Cria usuário e grupo não-root para execução segura
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs ofertapronta

# Copia os artefatos compilados pelo Nitro (.output/server e .output/public)
COPY --from=builder --chown=ofertapronta:nodejs /app/.output ./.output

# Copia migrações do Drizzle e scripts operacionais
COPY --from=builder --chown=ofertapronta:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=ofertapronta:nodejs /app/scripts ./scripts
COPY --from=builder --chown=ofertapronta:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ofertapronta:nodejs /app/package.json ./package.json

# Garante permissões de execução no entrypoint
RUN chmod +x /app/scripts/docker-entrypoint.sh

USER ofertapronta

EXPOSE 3000

# Healthcheck nativo usando o runtime Node.js 22 (dispensa curl)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => { if (!r.ok && r.status >= 500) process.exit(1); }).catch(() => process.exit(1))"

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
