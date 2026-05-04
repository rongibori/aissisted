# Technology Stack

**Analysis Date:** 2026-05-04

## Languages

**Primary:**
- TypeScript 5.6.0 - Core language for all packages (api, db, jeffrey, ui, web, site)
- JavaScript (ES2022/ESNext) - Backend runtime target
- JSX - React components in `apps/web`, `packages/ui`
- SQL - Database schema and migrations (via Drizzle ORM)

**Secondary:**
- Markdown - Documentation and system prompts (`packages/jeffrey/src/system-prompt.md`)
- YAML - Terraform configurations and GitHub workflows

## Runtime

**Environment:**
- Node.js 20+ (requirement specified in `packages/jeffrey/package.json`: `"engines": {"node": ">=20"}`)
- No explicit `.nvmrc` or `.node-version` file — version pinned in package engines field only

**Package Manager:**
- pnpm 10.0.0 (specified in root `package.json`: `"packageManager": "pnpm@10.0.0"`)
- Workspace monorepo structure with pnpm workspaces
- Lockfile: Present (pnpm-lock.yaml implied by pnpm manager)
- Built-in dependencies optimization via `pnpm.onlyBuiltDependencies` and `peerDependencyRules`

## Frameworks

**Core:**
- Fastify 5.0.0 - HTTP server for `apps/api` (`apps/api/package.json`)
- Next.js 15.0.0 - Web application framework for `apps/web` (`apps/web/package.json`)
- React 19.0.0 - UI rendering (peer dependency for `packages/ui`, direct in `apps/web` and `apps/site`)
- React DOM 19.0.0 - React platform binding for `apps/web`

**ORM & Database:**
- Drizzle ORM 0.38.0 - Type-safe SQL query builder (`packages/db/package.json`, `apps/api/package.json`)
- Drizzle Kit 0.30.0 - Schema generation and migrations tooling
- SQLite + LibSQL driver for local development (default: `file:./data/aissisted.db`)
- PostgreSQL compatible (DATABASE_URL supports `postgresql://` URLs for prod/Docker)

**Styling & UI:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework for `apps/web`
- @tailwindcss/postcss 4.2.2 - PostCSS plugin for Tailwind
- @tailwindcss/typography 0.5.19 - Typography plugin for prose styling

**Testing:**
- Vitest 3.0.0 - Test runner (`apps/api`, `packages/jeffrey`, `packages/jeffrey-evals`)
- Globals mode (vitest/globals used in test suites)
- Node.js environment (isolated per test file)

**Build & Dev:**
- TypeScript 5.6.0 - Language compiler across all packages
- Turbo 2.0.0 - Monorepo orchestration and caching (`root package.json`, `turbo.json`)
- tsx 4.19.0 - TypeScript execution without build step (used in `apps/api` dev mode)
- Zod 3.23.8 - Runtime schema validation (`packages/jeffrey/package.json`)

**Cryptography & Security:**
- bcryptjs 3.0.3 - Password hashing (`apps/api/package.json`)
- Node.js native crypto module - AES-256-GCM encryption for OAuth tokens (`apps/api/src/utils/token-encryption.ts`)

**API Client Libraries:**
- OpenAI SDK 4.77.0 - LLM and voice APIs (`packages/jeffrey/package.json`)
- ElevenLabs SDK (via environment config - API key based) - TTS voice service
- @fastify/cookie 11.0.2 - Cookie handling plugin
- @fastify/cors 10.0.0 - CORS middleware
- @fastify/helmet 13.0.2 - Security headers
- @fastify/jwt 10.0.0 - JWT token validation
- @fastify/rate-limit 10.3.0 - Rate limiting middleware
- @fastify/websocket 11.0.2 - WebSocket support
- @libsql/client 0.14.0 - Turso/LibSQL database client for SQLite
- ws 8.18.0 - WebSocket library (`apps/api/package.json`)
- node-cron 4.2.1 - Scheduler for background jobs (WHOOP sync, audit pruning)
- dotenv 16.4.0 - Environment variable loading

**Other Dependencies:**
- Pino (Fastify logger) - via @fastify stack
- Node-fetch (implicit) - HTTP client for WHOOP/FHIR flows

## Configuration

**Environment Variables:**
- `.env` (not committed) - Local development configuration
- `.env.example` - Template with all required and optional variables
- Key categories (documented in `.env.example`):
  - Database: `DATABASE_URL` (SQLite local dev, PostgreSQL for prod)
  - API: `PORT`, `API_HOST`, `NODE_ENV`
  - Auth: `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` (AES-256 for OAuth tokens)
  - CORS: `ALLOWED_ORIGINS` (comma-separated; permissive in dev, explicit in prod)
  - LLM: `OPENAI_API_KEY` (required — canonical brain for all Jeffrey surfaces)
  - Voice: `ELEVENLABS_API_KEY`, `ELEVENLABS_JEFFREY_VOICE_ID` (optional; TTS)
  - Integrations: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`, `FHIR_BASE_URL`, `FHIR_CLIENT_ID`, `FHIR_REDIRECT_URI`

**TypeScript Configuration:**
- Base config: `tsconfig.base.json` (ES2022 target, ESNext modules, strict mode, Bundler resolution)
- Per-package overrides:
  - `apps/api/tsconfig.json` - Declaration + source maps for distribution
  - `apps/web/tsconfig.json` - JSX preserve, Next.js plugins, DOM lib, incremental
  - `packages/jeffrey/tsconfig.json` - Declaration maps for external consumption
  - `packages/db/tsconfig.json` - Declaration output (schema distribution)
  - `packages/jeffrey-evals/tsconfig.json` - Vitest globals, Node types

**Drizzle ORM:**
- Config: `packages/db/drizzle.config.ts`
- Schema: `packages/db/src/schema.ts`
- Dialect: SQLite (with LibSQL provider for Turso)
- Migrations: `packages/db/src/migrate.ts`
- Commands: `db:generate` (schema introspection), `db:push` (apply to database), `db:studio` (web UI)

**Test Configuration:**
- Vitest config: `apps/api/vitest.config.ts`
- Globals enabled (test, describe, expect available without imports)
- Isolate mode — each test file runs in isolated context
- Verbose reporter

**Monorepo:**
- Workspace definition: `package.json` with turbo tasks
- Turbo v2 orchestration: `turbo.json`
- Shared task definitions:
  - `dev` - Persistent, no cache
  - `build` - Depends on upstream builds, caches `dist/` and `.next/`
  - `test` - No cache, no output caching
  - `db:generate`, `db:push` - Drizzle operations (no cache)

## Platform Requirements

**Development:**
- Node.js 20+ (runtime)
- pnpm 10.0.0 (package manager)
- TypeScript 5.6.0 (compiler)
- Local SQLite database: `./data/aissisted.db` (auto-created on first run)
- Secrets: `.env` file with API keys (see `.env.example`)

**Production:**
- Node.js 20+ (runtime)
- PostgreSQL database (or SQLite with Turso/LibSQL remote)
- Environment variables: `OPENAI_API_KEY`, `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` (required)
- Optional: `ELEVENLABS_API_KEY` for TTS, integration secrets for WHOOP/FHIR
- Deployment target: AWS (HIPAA infrastructure in `infra/aws/`) — Fastify API on ECS Fargate, Next.js web on Vercel or similar

**Build Output:**
- API: `apps/api/dist/` - Compiled JavaScript + source maps
- Web: `apps/web/.next/` - Next.js build output
- Packages: `packages/*/dist/` (if compiled) or published as TypeScript sources

---

*Stack analysis: 2026-05-04*
