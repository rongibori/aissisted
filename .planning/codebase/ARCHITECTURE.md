# Architecture

**Analysis Date:** 2026-05-04

## System Overview

Aissisted is a monorepo health AI platform with strict layering: HTTP routes → services → domain adapters → database. The `@aissisted/jeffrey` package (server-only AI brain) is isolated and consumed exclusively by the API layer, enabling multi-surface conversational AI (health, investor, onboarding, brand) while maintaining security and brand voice control.

```text
┌────────────────────────────────────────────────────────────────────┐
│                      Frontend & Web Layer                          │
│  apps/web (Next.js)  │  apps/site (Next.js)  │  apps/landing (HTML) │
│  `apps/web/src`      │  `apps/site/src`      │  `apps/landing/*`    │
└────────┬─────────────┴────────┬──────────────┴──────────┬───────────┘
         │                      │                         │ (Client-side only)
         ▼                      ▼                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                        HTTP Routes Layer                           │
│                  Fastify API Server @ :4000                        │
│             `apps/api/src/routes/*.ts`                             │
│  /auth | /biomarkers | /protocol | /jeffrey/* | /integrations     │
└─────────────────────┬─────────────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────────────────────────────────────────────────────┐
    │         Domain Services Layer                           │
    │    `apps/api/src/services/*.service.ts`                 │
    │  - jeffrey.service (conversational AI, surfaces)        │
    │  - protocol.service (recommendations, rules)            │
    │  - biomarker.service (readings, normalization)          │
    │  - conversation.service (message history)               │
    │  - analysis.service (health state, trends)              │
    │  - auth.service (user identity)                         │
    │  - adherence.service (supplement tracking)              │
    └─────────────────┬──────────────────────────────────────┘
                      │
         ┌────────────┼────────────┬────────────┐
         ▼            ▼            ▼            ▼
    ┌─────────────────────────────────────────────────────────┐
    │           Adapter & Integration Layer                   │
    │                                                          │
    │  Jeffrey Brain (Server-Only)                           │
    │  `packages/jeffrey/src/`                                │
    │  - Surfaces: health, investor, onboarding, brand        │
    │  - OpenAI Realtime voice bridge                         │
    │  - ElevenLabs TTS streaming                             │
    │  - Session memory & long-term memory adapter            │
    │                                                          │
    │  Wearable Adapters                                      │
    │  `apps/api/src/integrations/{whoop,apple-health,fhir}`  │
    │  - WHOOP recovery/sleep sync & normalizer               │
    │  - Apple HealthKit adapter                              │
    │  - FHIR Observation normalizer                          │
    │                                                          │
    │  Domain Logic & Rules                                   │
    │  `packages/domain/src/`                                 │
    │  `apps/api/src/engine/`                                 │
    │  - Clinical safety validation                           │
    │  - Biomarker reference ranges                           │
    │  - Rules engine (sleep, interactions, escalation)       │
    │  - Stack optimization & unit conversion                 │
    │                                                          │
    │  Shared Types & UI                                      │
    │  `packages/types/` | `packages/ui/` | `packages/brand/` │
    └─────────────────┬──────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Data & Persistence Layer                   │
    │           LibSQL + Drizzle ORM                          │
    │         `packages/db/src/schema.ts`                     │
    │                                                          │
    │  Tables:                                                │
    │  - users (identity)                                     │
    │  - healthProfiles (name, goals, conditions)             │
    │  - biomarkers (readings + lab source + confidence)      │
    │  - protocols (recommendations + safety status)          │
    │  - conversations (message history per surface)          │
    │  - supplementStacks (adherence tracking)                │
    │  - integrationTokens (OAuth tokens for WHOOP/etc)       │
    │  - auditLog (HIPAA compliance)                          │
    └────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Fastify Server** | HTTP routing, middleware (auth, CORS, rate-limit), WebSocket proxy, health check | `apps/api/src/index.ts` |
| **Auth Routes** | User signup, login, password change, JWT token issuing | `apps/api/src/routes/auth.ts` |
| **Biomarker Routes** | POST/GET biomarkers, bulk imports, trend queries | `apps/api/src/routes/biomarkers.ts` |
| **Protocol Routes** | Generate protocol, fetch recommendations, fetch latest | `apps/api/src/routes/protocol.ts` |
| **Jeffrey Routes** | POST /v1/jeffrey/ask (health + other surfaces), voice TTS streaming | `apps/api/src/routes/jeffrey.ts` |
| **Jeffrey Realtime Routes** | WebSocket ticket generation, proxy to OpenAI Realtime | `apps/api/src/routes/jeffrey-realtime.ts` |
| **Integrations Routes** | OAuth callbacks, token management for WHOOP/Apple/FHIR | `apps/api/src/routes/integrations.ts` |
| **Jeffrey Service** | Multi-surface conversational AI orchestration; surface-specific context gathering | `apps/api/src/services/jeffrey.service.ts` |
| **Protocol Service** | Rule-based protocol synthesis from biomarkers + health profile | `apps/api/src/services/protocol.service.ts` |
| **Biomarker Service** | Add/fetch biomarker readings; validate against reference ranges | `apps/api/src/services/biomarker.service.ts` |
| **Conversation Service** | Store/retrieve message history per user & surface; intent tracking | `apps/api/src/services/conversation.service.ts` |
| **Analysis Service** | Health state computation, trend detection, trigger reanalysis on new data | `apps/api/src/services/analysis.service.ts` |
| **Auth Service** | User account creation, password hashing (bcryptjs), token management | `apps/api/src/services/auth.service.ts` |
| **Audit Service** | HIPAA-compliant event logging; daily pruning of 90+ day records | `apps/api/src/services/audit.service.ts` |
| **Jeffrey Package** | Server-only AI brain: personality, voice, memory, surfaces (health, investor, onboarding, brand, competitive), prompt management | `packages/jeffrey/src/` |
| **WHOOP Adapter** | Fetch recovery/sleep via OAuth token; normalize to biomarkers | `apps/api/src/integrations/whoop/` |
| **Apple Health Adapter** | HealthKit export normalization | `apps/api/src/integrations/apple-health/` |
| **FHIR Adapter** | FHIR Observation normalization; clinical reference range mapping | `apps/api/src/integrations/fhir/` |
| **Domain Package** | Clinical safety rules, stack optimization, health profile logic | `packages/domain/src/` |
| **Engine/Evaluator** | Biomarker interpretation, interaction detection, escalation rules | `apps/api/src/engine/evaluator.ts` |
| **Biomarker Ranges** | Reference range validation (critical, abnormal, normal) | `apps/api/src/engine/biomarker-ranges.ts` |
| **Drizzle ORM & Schema** | Relational data model + migrations; SQLite/Turso support | `packages/db/src/` |
| **Web App** | Next.js SPA for authenticated users; dashboard, protocol view, chat UI | `apps/web/src/` |
| **Site App** | Next.js investor pitch + brand showcase; surfaces investor/onboarding Jeffrey | `apps/site/src/` |
| **Landing** | Static HTML marketing site | `apps/landing/` |
| **Scheduler** | Cron jobs: WHOOP sync (30 min), audit log pruning (daily 03:00 UTC) | `apps/api/src/scheduler.ts` |

## Pattern Overview

**Overall:** Monorepo workspaces (pnpm) with Turbo orchestration. Strict layering enforces data flow: Routes → Services → Adapters → Database. Jeffrey (server-only package) is the isolated AI brain serving multiple surfaces with brand-controlled personality.

**Key Characteristics:**
- **Workspace separation:** Apps (web, api, landing, site) and packages (db, jeffrey, types, ui, domain, integrations, config) are independently versioned but share root TypeScript & turbo config.
- **Strict API layering:** Routes never directly touch the database; all data access flows through services. Adapters (integrations, engine) handle external system bridging and domain logic.
- **Server-only AI brain:** `@aissisted/jeffrey` is imported only by `apps/api` routes. Never bundled to the client. Enables OpenAI Realtime voice + ElevenLabs TTS without exposing keys.
- **Multi-surface Jeffrey:** One OpenAI brain answering as investor, onboarding coach, brand advocate, health concierge, or competitive analyst — each with its own context isolation and system prompt.
- **Async job scheduling:** Cron-driven background jobs for wearable syncs and audit cleanup. Critical for HIPAA compliance (data retention policies).

## Layers

**Routes Layer:**
- Purpose: Parse HTTP requests, validate schemas (Fastify schema), enforce auth, return JSON responses
- Location: `apps/api/src/routes/`
- Contains: Route handlers (FastifyInstance plugins), inline schema validation
- Depends on: Services, middleware (auth, audit, rate-limit)
- Used by: Client apps (web, site) via HTTP/WebSocket

**Services Layer:**
- Purpose: Orchestrate business logic; coordinate between routes, adapters, and database
- Location: `apps/api/src/services/`
- Contains: User-facing service functions (e.g., `chat()`, `generateProtocol()`, `addBiomarker()`)
- Depends on: Database (via `@aissisted/db`), domain adapters, Jeffrey package, external APIs (OAuth, OpenAI)
- Used by: Routes, scheduler, each other (some cross-service calls like protocol → biomarker)

**Adapter Layer:**
- Purpose: Transform external system data into canonical domain models
- Location: `apps/api/src/integrations/`, `apps/api/src/engine/`, `packages/jeffrey/src/`, `packages/domain/src/`
- Contains: Integration clients (WHOOP OAuth, FHIR parsers), business rules (clinical safety, interaction detection), AI personality (system prompts, voice configs)
- Depends on: External SDKs (openai, @libsql/client, zod), database schema
- Used by: Services, routes

**Database Layer:**
- Purpose: Persist application state with HIPAA-compliant structure
- Location: `packages/db/src/schema.ts`
- Contains: Drizzle ORM table definitions, relations, migrations
- Depends on: LibSQL client, environment (DATABASE_URL pointing to Turso or local SQLite)
- Used by: All services via the `db` export from `@aissisted/db`

## Data Flow

### Primary Request Path: User Asks Health Question

1. **HTTP POST /v1/jeffrey/ask** (`apps/api/src/routes/jeffrey.ts:line ~50`)
   - Validate request schema: `{ surface, message, conversationId?, extraContext?, selfContext? }`
   - Extract JWT `sub` claim (user ID)
   - Check `surface` is in allowlist (health, investor, onboarding, brand, concierge, product-walkthrough)

2. **Call `jeffreyService.chat()`** (`apps/api/src/services/jeffrey.service.ts:line ~60`)
   - Get or create conversation record in DB
   - Parse user's intent (extract topic: "protocol", "trend", "supplement", etc.) via `intent.ts`
   - Save user message to conversation history
   - If `surface === "health"`, gather health context:
     - Fetch user's profile (`profile.service.ts`)
     - Fetch latest biomarkers (`biomarker.service.ts`)
     - Fetch latest health state / analysis (`analysis.service.ts`)
     - Fetch latest protocol if exists (`protocol.service.ts`)
     - Fetch adherence score (`adherence.service.ts`)

3. **Create Jeffrey Session with Context** (`packages/jeffrey/src/session.ts`)
   - Call `createJeffreySession()` from `@aissisted/jeffrey`
   - Initialize session memory (system prompt + health context preamble if self-context enabled)
   - Set OpenAI API client via `getOpenAIClient()` (loads from env OPENAI_API_KEY)

4. **Invoke OpenAI (Standard Chat or Realtime)** (`packages/jeffrey/src/client.ts`)
   - For standard chat: POST to `chat.completions` with conversation history
   - For realtime: WebSocket connection handled separately (jeffrey-realtime routes)
   - Include surface-specific system prompt (personality, voice, scope)
   - Restrict to health content if surface is "health"; investor/onboarding/brand are unrestricted by design

5. **Intent-Based Post-Processing** (`apps/api/src/services/jeffrey.service.ts:line ~95`)
   - If intent is "protocol", call `protocol.service.generateProtocol()`
   - Store Jeffrey's reply in conversation history
   - Return JSON: `{ reply, conversationId, intent, protocolTriggered }`

6. **HTTP Response** (`apps/api/src/routes/jeffrey.ts`)
   - Return 200 with `{ data: { reply, conversationId, intent, protocolTriggered } }`

### Secondary: WHOOP Data Sync

1. **Cron: "*/30 * * * *"** (`apps/api/src/scheduler.ts:line ~10`)
   - Query all users with `integrationTokens.provider === "whoop"`
   - For each user, call `syncWhoopForUser(userId)` with retry logic

2. **Fetch Latest WHOOP Metrics** (`apps/api/src/integrations/whoop/client.ts`)
   - Use stored OAuth token from DB
   - Fetch recovery & sleep data from WHOOP API
   - Return raw metric objects

3. **Normalize to Biomarkers** (`apps/api/src/integrations/whoop/normalizer.ts`)
   - Transform recovery → RHR, HRV, recovery_score
   - Transform sleep → duration, latency, total_sleep_debt
   - Return array of `{ name, value, unit, source: "whoop", measuredAt }`

4. **Persist Biomarkers** (`apps/api/src/services/biomarker.service.ts:line ~140`)
   - Upsert readings into biomarkers table (unique: userId, name, measuredAt, source)
   - Validate values via `biomarker-ranges.ts`
   - Count inserted rows

5. **Trigger Reanalysis** (`apps/api/src/services/analysis.service.ts`)
   - If new readings, call `maybeReanalyze(userId, count)`
   - Recompute health state (trends, escalation patterns, protocol triggers)

**State Management:**
- **Conversation state:** Stored per user per surface in `conversations` table; fetched on each request
- **Biomarker state:** Persisted with confidence scores (1.0 for FHIR, 0.8 for wearable, 0.6 for manual)
- **Protocol state:** Latest protocol stored; recommendations include safety status (allowed, blocked, warning)
- **Integration tokens:** OAuth tokens encrypted at rest (via `token-encryption.ts`)
- **Session memory:** Ephemeral (session-scoped) + optional long-term memory from DB (via `jeffrey-memory.adapter.ts`)

## Key Abstractions

**Surfaces:**
- Purpose: Multi-context Jeffrey personas; same AI backbone, different scope & system prompt
- Examples: `packages/jeffrey/src/{health-tools.ts, investor.ts, onboarding.ts, competitive.ts}`
- Pattern: Each surface exports allowed topics, context constraints, and system prompt specializations

**Adapters:**
- Purpose: Normalize external data into canonical domain model
- Examples: `apps/api/src/integrations/{whoop/normalizer.ts, fhir/normalizer.ts, apple-health/}`
- Pattern: `fetch()` → `normalize()` → persist biomarkers; enables pluggable new sources

**Domain Rules Engine:**
- Purpose: Clinical safety & decision-making
- Examples: `apps/api/src/engine/{biomarker-ranges.ts, evaluator.ts, interactions.ts}, packages/domain/src/`
- Pattern: Lookups + validation functions; no AI required (deterministic rule application)

**Memory Adapters:**
- Purpose: Long-term context for Jeffrey across conversations
- Examples: `apps/api/src/services/jeffrey-memory.adapter.ts` (DB-backed), `packages/jeffrey/src/noopMemoryAdapter` (test/investor surfaces)
- Pattern: Store/retrieve user context; health surface uses DB, others disable memory by policy

## Entry Points

**Fastify Server Bootstrap:**
- Location: `apps/api/src/index.ts`
- Triggers: `pnpm dev` or `pnpm start` in `apps/api/`
- Responsibilities:
  - Register plugins (cors, helmet, jwt, rate-limit, websocket)
  - Set up request logging with token redaction (security)
  - Register all route plugins
  - Run DB migrations (Drizzle)
  - Listen on :4000
  - Start scheduler

**Package Main Exports:**
- `@aissisted/db`: Exports `db` (Drizzle client), `schema`, `sql` utilities
- `@aissisted/jeffrey`: Exports surfaces, personality, voice, client, session factory, memory adapters
- `@aissisted/types`: Exports shared TypeScript interfaces
- `@aissisted/ui`: Exports React components for web/site apps
- `@aissisted/brand`: Exports brand colors, fonts, design tokens
- `@aissisted/config`: Exports env var parsing

**Web App Entry:**
- Location: `apps/web/src/app/page.tsx` (Next.js)
- Triggers: `pnpm dev` in `apps/web/`
- Renders authenticated user dashboard; calls `/api/*` endpoints to Fastify server

**Site App Entry:**
- Location: `apps/site/src/app/page.tsx` (Next.js)
- Triggers: `pnpm dev` in `apps/site/`
- Renders investor pitch + onboarding Jeffrey chat; imports from `@aissisted/jeffrey` + `@aissisted/brand` (client-safe exports only)

**Landing Entry:**
- Location: `apps/landing/index.html`
- Static HTML marketing site; served via Vercel

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop with async/await; no worker threads currently used
- **Global state:** Fastify app instance is global in `index.ts`; config singleton in `apps/api/src/config.ts`; Jeffrey client & session cache in `packages/jeffrey/src/client.ts`
- **Circular imports:** None detected; strict layering prevents reverse dependencies (routes cannot import services that import routes)
- **Database migrations:** Auto-run on startup (Drizzle); idempotent via migration folder tracking
- **jeffreyPackage isolation:** Never bundle to client; routes import surfaces but only use them server-side
- **Token redaction:** Fastify logger serializer redacts `ticket=...` from WebSocket upgrade URLs to prevent leaking short-lived JWT in logs
- **Rate limiting:** Global 100 req/min per IP; stricter limits (10 req/15 min) on auth routes via Fastify schema config

## Anti-Patterns

### AI Brain Exported to Client

**What happens:** `@aissisted/site` imports from `@aissisted/jeffrey` to render the onboarding surface. Early versions bundled the full brain to the browser.
**Why it's wrong:** OpenAI API key in client code = security incident. System prompts & long-term memory exposed in network traffic.
**Do this instead:** `apps/site/src/` imports only safe exports from `@aissisted/jeffrey` (system prompt text, personality traits, type definitions). Actual chat calls go to `/v1/jeffrey/ask` on the backend API. See `apps/site/src/components/ChatWidget.tsx` which proxies through the API.

### Direct Database Queries in Routes

**What happens:** Some early route handlers may have tried `db.query()` directly without a service layer.
**Why it's wrong:** Makes testing hard; couples routes to schema changes; violates layering.
**Do this instead:** All routes call service functions (e.g., `biomarkerService.addBiomarker()`). Services own the query logic.

## Error Handling

**Strategy:** Two-tier: client-facing error JSON + server logging

**Patterns:**
- Routes catch service errors and return HTTP status + `{ error: { message, code } }` JSON
- Services throw custom errors with `.code` field for client-safe categorization (e.g., "INVALID_BIOMARKER_VALUE")
- Scheduler catches Promise rejections and logs; continues with other users
- Jeffrey service catches OpenAI provider errors, logs, returns fallback reply
- Database errors are not caught at route level; Fastify returns 500

**HIPAA-relevant:**
- Auth errors are never verbose (401 generic, no user existence leaks)
- Biomarker errors include validation details (range, unit mismatch) but not user health history
- Audit service logs all data access; pruned daily to 90-day retention

## Cross-Cutting Concerns

**Logging:** Fastify built-in pino-based logger with configurable level (dev=info, prod=warn). Serializers redact tokens.

**Validation:** Fastify schema-based validation on route payloads. Service-level validation via zod (`packages/jeffrey/src/` uses zod for LLM tool schemas).

**Authentication:** JWT issued on login (7-day expiry). Checked via `requireAuth` middleware; payload extracted from `request.user.sub`. No session cookies; stateless design.

**Authorization:** Currently role-agnostic (authenticated = authorized for all routes). Future: multi-tenant support or role-based endpoints.

---

*Architecture analysis: 2026-05-04*
