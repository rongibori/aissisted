# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Aissisted API — production image
# Multi-stage, non-root, tini init, pnpm workspace aware.
#
# NOTE: workspace packages (@aissisted/db, /config, /types) export TS source
# directly (main = "src/index.ts"), so the runtime runs via `tsx` rather than
# compiled JS. Keeps the monorepo simple; switch to compiled packages later.
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=22-alpine

# ── deps: install workspace deps with frozen lockfile ───────────────────────
FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app

# Copy manifests first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json              apps/api/
COPY packages/db/package.json           packages/db/
COPY packages/config/package.json       packages/config/
COPY packages/types/package.json        packages/types/
COPY packages/domain/package.json       packages/domain/
COPY packages/integrations/package.json packages/integrations/
COPY packages/ui/package.json           packages/ui/

# Install only what the API needs, with frozen lockfile for reproducibility
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter @aissisted/api... --frozen-lockfile

# ── source: copy runtime source (workspace packages consumed as TS) ──────────
FROM deps AS source
COPY tsconfig.base.json ./
COPY apps/api        apps/api
COPY packages/db     packages/db
COPY packages/config packages/config
COPY packages/types  packages/types

# ── runtime: minimal image, non-root, tini for PID 1 ────────────────────────
FROM node:${NODE_VERSION} AS runtime
RUN apk add --no-cache tini curl
WORKDIR /app

# Copy resolved workspace (node_modules + src)
COPY --from=source --chown=node:node /app /app

ENV NODE_ENV=production \
    PORT=4000 \
    API_HOST=0.0.0.0 \
    NODE_OPTIONS="--enable-source-maps"

USER node
EXPOSE 4000

# Container-level healthcheck (ALB has its own on /health too)
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# Run the API via tsx so workspace .ts imports resolve correctly
CMD ["node", "--import", "tsx/esm", "apps/api/src/index.ts"]
