# Aissisted

AI-driven personalized health platform that turns labs, wearables, intake history, and goals into adaptive daily supplement protocols. Jeffrey, the voice + chat concierge, explains what the data means in plain language.

## Architecture

Monorepo (`pnpm` workspaces + Turbo):

- `apps/web` — Next.js 15 + React 19 + Tailwind v4 frontend
- `apps/api` — Fastify 5 backend with JWT auth, audit logging, rate limiting
- `packages/db` — Drizzle ORM schema and migrations (SQLite local, libsql/Turso in prod)
- `packages/types`, `packages/config`, `packages/ui` — shared modules

Notable subsystems already in place:

- **Health-state engine** — six-domain biomarker analysis, compound risk signals, eight clinical modes (`apps/api/src/services/analysis.service.ts`)
- **Protocol engine** — evidence-based rules across sleep, energy, cognition, hormones, inflammation with interaction and contraindication checks (`apps/api/src/engine/`)
- **Integrations** — full SMART on FHIR (Epic/MyChart) with longitudinal sync, WHOOP OAuth + sync, Apple Health XML upload, all writing through one normalizer pipeline (`apps/api/src/integrations/`)
- **Token encryption** — AES-256-GCM at rest for all OAuth2 credentials (`apps/api/src/utils/token-encryption.ts`)
- **Jeffrey** — Anthropic SDK with prompt caching, intent classification, and live DB context (profile, biomarkers, trends, health state, adherence) (`apps/api/src/services/jeffrey.service.ts`)
- **Neural AI core** — center-stage SVG visualization on the dashboard, animates with health-state mode, confidence, and Jeffrey's voice state (`apps/web/components/neural-core.tsx`)

## Quick start

```bash
pnpm install
cp .env.example .env
# Fill in ANTHROPIC_API_KEY in .env

pnpm exec tsx packages/db/src/migrate.ts   # apply migrations
pnpm seed:demo                             # creates demo profile
pnpm dev                                   # api on :4000, web on :3000
```

Demo credentials:

```
email:    demo@aissisted.health
password: demo1234!
```

After login, the dashboard shows the Neural AI Core with the seeded user's metabolic-concern mode, five domain tiles (Sleep · Recovery · Performance · Stress · Stack), 7-day sparklines for each, an active protocol with 3-5 recommendations, conversation history with Jeffrey, and ~70% adherence over the last 14 days.

## Live OAuth (optional)

The seed gets you a click-through demo without external credentials. To exercise the live OAuth flows, fill in the relevant lines in `.env`:

- **WHOOP** — register at <https://developer.whoop.com/>, set `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`, then click "Connect" on `/integrations`.
- **Epic / MyChart (SMART on FHIR)** — register a SMART app in Epic App Orchard or use the public sandbox, set `FHIR_BASE_URL` and `FHIR_CLIENT_ID`, then click "Connect" on `/integrations`. Initial connect runs a full longitudinal sync.
- **Apple Health** — no credentials needed. On iOS, Settings → Health → Profile → Export All Health Data, then upload the `export.xml` from `/integrations`.

## Voice for Jeffrey

The `/chat` page uses the Web Speech API. Click the mic orb to speak; toggle "Read replies" in the header for TTS playback. Speech recognition is Chromium-only — Safari and Firefox see a disabled mic with a one-line fallback note. Synthesis is universal.

## Commands

```bash
pnpm dev                     # all apps in watch mode (turbo)
pnpm build                   # production builds
pnpm test                    # vitest (api: ~119 unit tests)
pnpm typecheck               # full workspace tsc --noEmit
pnpm lint                    # api tsc + web ESLint v9 flat config
pnpm seed:demo               # idempotent demo profile seed
```

## See also

- `DEMO.md` — 7-minute click-path for showing the platform end to end.
- `.env.example` — every supported environment variable, grouped by subsystem.
