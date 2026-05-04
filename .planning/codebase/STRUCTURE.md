# Codebase Structure

**Analysis Date:** 2026-05-04

## Directory Layout

```
aissisted/ (monorepo root)
├── .planning/
│   └── codebase/                    # GSD codebase analysis output
│
├── apps/                            # End-user applications (Turbo workspace)
│   ├── api/                         # Fastify backend API & brain
│   │   ├── src/
│   │   │   ├── index.ts             # Server entry point (bootstrap)
│   │   │   ├── config.ts            # Environment variable parsing
│   │   │   ├── scheduler.ts         # Background jobs (WHOOP sync, audit pruning)
│   │   │   ├── routes/              # HTTP route handlers
│   │   │   │   ├── auth.ts          # User signup/login
│   │   │   │   ├── profile.ts       # Health profile CRUD
│   │   │   │   ├── biomarkers.ts    # Biomarker CRUD, trends
│   │   │   │   ├── protocol.ts      # Protocol generation & fetch
│   │   │   │   ├── jeffrey.ts       # /v1/jeffrey/ask (multi-surface chat)
│   │   │   │   ├── jeffrey-realtime.ts # OpenAI Realtime WebSocket proxy
│   │   │   │   ├── integrations.ts  # OAuth callbacks, token management
│   │   │   │   ├── chat.ts          # Legacy chat (transitioning to jeffrey.ts)
│   │   │   │   ├── adherence.ts     # Supplement adherence tracking
│   │   │   │   ├── health-state.ts  # Health analysis endpoints
│   │   │   │   └── __tests__/       # Route integration tests
│   │   │   ├── services/            # Business logic layer
│   │   │   │   ├── jeffrey.service.ts  # Multi-surface orchestration
│   │   │   │   ├── protocol.service.ts # Protocol synthesis
│   │   │   │   ├── biomarker.service.ts # Biomarker CRUD + validation
│   │   │   │   ├── conversation.service.ts # Message history
│   │   │   │   ├── analysis.service.ts # Health state computation
│   │   │   │   ├── auth.service.ts  # User identity
│   │   │   │   ├── audit.service.ts # HIPAA logging
│   │   │   │   ├── adherence.service.ts # Supplement tracking
│   │   │   │   ├── trends.service.ts # Biomarker trends
│   │   │   │   ├── jeffrey-memory.adapter.ts # DB-backed memory
│   │   │   │   ├── intent.ts        # Intent parsing utility
│   │   │   │   └── [others: conditions, medications, profile]
│   │   │   ├── middleware/          # Request/response handlers
│   │   │   │   ├── auth.ts          # JWT registration & requireAuth
│   │   │   │   └── audit.ts         # Request/response logging hook
│   │   │   ├── integrations/        # External system adapters
│   │   │   │   ├── whoop/           # WHOOP wearable sync
│   │   │   │   │   ├── client.ts    # OAuth + API calls
│   │   │   │   │   ├── normalizer.ts # Metric → biomarker transform
│   │   │   │   │   └── sync.ts      # User sync entry point
│   │   │   │   ├── apple-health/    # Apple HealthKit adapter
│   │   │   │   ├── fhir/            # FHIR Observation parser
│   │   │   │   │   ├── normalizer.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   └── [others]
│   │   │   ├── engine/              # Domain business rules (no AI)
│   │   │   │   ├── biomarker-ranges.ts # Reference range validation
│   │   │   │   ├── evaluator.ts     # Biomarker interpretation
│   │   │   │   ├── interactions.ts  # Drug/supplement interactions
│   │   │   │   ├── unit-converter.ts # Unit normalization
│   │   │   │   ├── registry.ts      # Known biomarker registry
│   │   │   │   ├── types.ts         # Engine type definitions
│   │   │   │   ├── rules/           # Specialized rule sets
│   │   │   │   │   ├── sleep.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   └── __tests__/       # Engine unit tests
│   │   │   ├── utils/               # Utility functions
│   │   │   │   ├── retry.ts         # Retry logic with backoff
│   │   │   │   ├── token-encryption.ts # OAuth token AES encryption
│   │   │   │   └── __tests__/
│   │   │   └── dist/                # TypeScript output (git-ignored)
│   │   ├── drizzle.config.ts        # Drizzle Kit configuration
│   │   ├── package.json             # Dependencies: fastify, @aissisted/*, openai
│   │   └── tsconfig.json
│   │
│   ├── web/                         # Next.js customer app (authenticated users)
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router pages
│   │   │   │   ├── page.tsx         # Dashboard entry point
│   │   │   │   ├── layout.tsx       # Root layout
│   │   │   │   └── [feature]/       # Feature routes
│   │   │   ├── components/          # React components
│   │   │   │   ├── Dashboard.tsx    # Main dashboard view
│   │   │   │   ├── JeffreyChat.tsx  # Health chat UI (low-level)
│   │   │   │   ├── ConnectedJeffreyChat.tsx # Chat with API integration
│   │   │   │   ├── StackView.tsx    # Supplement stack display
│   │   │   │   ├── ConnectedStackView.tsx  # Stack with API integration
│   │   │   │   └── [others]
│   │   │   ├── hooks/               # React custom hooks
│   │   │   │   ├── useJeffreyProtocol.ts # Protocol generation hook
│   │   │   │   ├── useProtocol.ts   # Protocol fetch hook
│   │   │   │   ├── useSessionHistory.ts # Conversation history hook
│   │   │   │   └── [others]
│   │   │   ├── lib/                 # Utilities & helpers
│   │   │   │   ├── api.ts           # Fetch wrapper with token
│   │   │   │   └── [others]
│   │   │   ├── styles/              # CSS (Tailwind)
│   │   │   └── .next/               # Build output (git-ignored)
│   │   ├── public/                  # Static assets
│   │   ├── package.json             # Next.js 15, React 19
│   │   └── tsconfig.json
│   │
│   ├── site/                        # Next.js brand & investor site
│   │   ├── src/
│   │   │   ├── app/                 # Pages: landing, investor, onboarding
│   │   │   ├── components/          # Shared UI (brand-heavy)
│   │   │   ├── lib/                 # API client, utilities
│   │   │   └── styles/
│   │   ├── public/                  # Brand assets
│   │   ├── package.json             # Dependencies: @aissisted/jeffrey, @aissisted/brand
│   │   └── tsconfig.json
│   │
│   └── landing/                     # Static HTML landing page
│       ├── index.html
│       ├── contact.html
│       ├── privacy.html
│       ├── terms.html
│       ├── aissisted-logo.svg
│       ├── favicon.svg
│       ├── robots.txt
│       └── sitemap.xml
│
├── packages/                        # Shared libraries (Turbo workspace)
│   ├── jeffrey/                     # SERVER-ONLY AI brain
│   │   ├── src/
│   │   │   ├── index.ts             # Public barrel export (surfaces, personality, voice)
│   │   │   ├── client.ts            # OpenAI client singleton
│   │   │   ├── config.ts            # Jeffrey config (API keys, model)
│   │   │   ├── session.ts           # Session factory & memory management
│   │   │   ├── types.ts             # Core type definitions (JeffreyMessage, JeffreySurface)
│   │   │   ├── errors.ts            # Custom error classes
│   │   │   ├── personality.ts       # British persona, tone, forbidden words
│   │   │   ├── voice.ts             # ElevenLabs voice ID, OpenAI Realtime config
│   │   │   ├── memory.ts            # Memory adapters (DB-backed & noop)
│   │   │   ├── investor.ts          # Investor surface (topic detection, context)
│   │   │   ├── onboarding.ts        # Onboarding surface & step tracking
│   │   │   ├── health-tools.ts      # Health surface tools (biomarker families, escalation)
│   │   │   ├── competitive.ts       # Competitive analysis surface
│   │   │   ├── bridge/              # External integrations
│   │   │   │   ├── index.ts         # Public bridge exports
│   │   │   │   ├── openai-realtime.ts # WebSocket proxy to OpenAI Realtime API
│   │   │   │   ├── audio-pipeline.ts # Audio encoding/decoding
│   │   │   │   └── elevenlabs-tts.ts # ElevenLabs text-to-speech streaming
│   │   │   ├── prompts/             # System prompts & instructions
│   │   │   │   └── index.ts
│   │   │   ├── data/                # Lookup tables
│   │   │   │   ├── brand-bible.ts   # Brand facts
│   │   │   │   ├── investor-facts.ts # Investment info
│   │   │   │   ├── competitors.ts   # Competitor diffs
│   │   │   │   └── integrations.ts  # Integration details
│   │   │   ├── system-prompt.md     # Markdown system prompt (imported as string)
│   │   │   └── __tests__/           # Unit tests
│   │   ├── README.md
│   │   ├── package.json             # Dependencies: openai, zod | Dev: typescript, vitest
│   │   └── tsconfig.json
│   │
│   ├── db/                          # Drizzle ORM & schema
│   │   ├── src/
│   │   │   ├── index.ts             # Drizzle client + schema export
│   │   │   ├── schema.ts            # All table definitions & relations
│   │   │   ├── migrate.ts           # Utility to manually run migrations
│   │   │   └── [migrations not in src]
│   │   ├── drizzle.config.ts        # Drizzle Kit config
│   │   ├── package.json             # Dependencies: drizzle-orm, @libsql/client
│   │   └── tsconfig.json
│   │
│   ├── domain/                      # Clinical domain logic (no AI, no DB)
│   │   ├── src/
│   │   │   ├── adaptiveEngine.ts    # Adaptive protocol logic
│   │   │   ├── clinicalSafety.ts    # Safety validation
│   │   │   ├── healthProfile.ts     # Profile logic
│   │   │   ├── protocol.ts          # Protocol data model
│   │   │   ├── biomarker.ts         # Biomarker interpretation
│   │   │   ├── stackBuilder.ts      # Supplement stack construction
│   │   │   ├── stackOptimizer.ts    # Stack optimization
│   │   │   ├── rulesEngine.ts       # Rule evaluation
│   │   │   └── jeffrey.ts           # Jeffrey domain model
│   │   └── tsconfig.json
│   │
│   ├── integrations/                # Integration adapters (facades for external systems)
│   │   ├── src/
│   │   │   ├── wearableProvider.interface.ts # Base interface
│   │   │   ├── whoopAdapter.ts      # WHOOP implementation
│   │   │   ├── appleHealthAdapter.ts
│   │   │   ├── fhirAdapter.ts
│   │   │   ├── labNormalizer.ts     # Lab result normalization
│   │   │   └── [others]
│   │   └── tsconfig.json
│   │
│   ├── types/                       # Shared TypeScript interfaces
│   │   ├── src/
│   │   │   └── index.ts             # All exported types
│   │   └── tsconfig.json
│   │
│   ├── ui/                          # Shared React components (client-side only)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── brand/                       # Brand design system
│   │   ├── src/
│   │   │   ├── colors.ts
│   │   │   ├── typography.ts
│   │   │   └── tokens.ts
│   │   └── tsconfig.json
│   │
│   ├── config/                      # Shared config
│   │   ├── src/
│   │   │   └── index.ts             # Env var parsing, shared config
│   │   └── tsconfig.json
│   │
│   ├── jeffrey-evals/               # Jeffrey evaluation suite
│   │   └── [evaluation test suites]
│   │
│   └── [other packages as needed]
│
├── infra/                           # Infrastructure-as-Code
│   ├── aws/                         # AWS Terraform / CDK / CloudFormation
│   │   ├── BOOTSTRAP.md             # Setup guide
│   │   └── README.md
│   └── [other cloud providers]
│
├── docs/                            # Documentation
│   ├── specs/                       # Feature specs & requirements
│   ├── design-system/               # Brand guidelines
│   ├── superpowers/                 # Feature documentation
│   ├── claude/                      # Claude-specific docs
│   └── brand/
│
├── scripts/                         # Utility scripts
├── tools/                           # Specialized tools
│   └── figma-foundation-builder/    # Figma design token sync
│
├── .github/                         # GitHub Actions CI/CD
│   ├── workflows/                   # GitHub Actions
│   └── ISSUE_TEMPLATE/
│
├── .planning/                       # GSD planning output
│   └── codebase/                    # This directory
│
├── .claude/                         # Claude agent configuration
├── cowork-briefs/                   # Work coordination docs
├── package.json                     # Root pnpm workspace config
├── pnpm-workspace.yaml              # Workspace definitions
├── turbo.json                       # Turbo task orchestration
├── tsconfig.base.json               # Root TypeScript config (extended by all)
├── .gitignore
├── .eslintrc                        # ESLint config (if present)
└── README.md
```

## Directory Purposes

**Root Workspace:**
- Purpose: Monorepo coordination, shared dependencies
- Key files: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`

**apps/api:**
- Purpose: Fastify HTTP server, all backend business logic
- Contains: Routes, services, integrations, engine, middleware, utilities, scheduler
- Key files: `src/index.ts` (entry), `src/routes/*.ts`, `src/services/*.ts`, `src/integrations/`

**apps/web:**
- Purpose: Next.js SPA for authenticated users
- Contains: Pages, components, hooks, API client
- Key files: `src/app/page.tsx` (dashboard), `src/components/`, `src/hooks/`, `src/lib/api.ts`

**apps/site:**
- Purpose: Next.js marketing/investor site with embedded Jeffrey chat
- Contains: Brand-heavy components, pitch content, onboarding surface
- Key files: `src/app/page.tsx`, imported from `@aissisted/jeffrey` (type defs & safe exports only)

**apps/landing:**
- Purpose: Static HTML marketing landing page
- Contains: Pure HTML/SVG (no build process)
- Deployment: Vercel static hosting

**packages/jeffrey:**
- Purpose: Server-only AI brain — personality, voice, surfaces, memory, integrations
- Contains: OpenAI client, ElevenLabs bridge, personality/tone, surface contexts
- Key files: `src/index.ts` (barrel), `src/client.ts`, `src/bridge/`, `src/{personality,voice,memory}.ts`
- WARNING: Never import into browser code; server-only

**packages/db:**
- Purpose: Drizzle ORM configuration, schema definitions, migrations
- Contains: Table definitions, relations, migration files
- Key files: `src/schema.ts`, `src/index.ts` (db client export)

**packages/domain:**
- Purpose: Clinical domain logic — biomarker interpretation, safety, rules
- Contains: Business logic with no external dependencies (no AI, no DB direct calls)
- Key files: `src/{clinicalSafety,biomarker,protocol,rulesEngine}.ts`

**packages/integrations:**
- Purpose: Adapter interfaces for external systems (WHOOP, Apple Health, FHIR)
- Contains: Provider interfaces, adapter implementations, normalizers
- Key files: `src/wearableProvider.interface.ts`, `src/{whoopAdapter,appleHealthAdapter,fhirAdapter}.ts`

**packages/types:**
- Purpose: Shared TypeScript type definitions across workspace
- Contains: Interfaces used by multiple packages
- Key files: `src/index.ts`

**packages/ui:**
- Purpose: Shared React components for web and site apps
- Contains: Reusable component library
- Key files: `src/components/`, `src/hooks/`

**packages/brand:**
- Purpose: Design system (colors, fonts, tokens)
- Contains: Tailwind config exports, color palettes, typography
- Key files: `src/{colors,typography,tokens}.ts`

**infra/aws:**
- Purpose: Cloud infrastructure definitions
- Contains: Terraform/CDK for Lambda, RDS, S3, etc.
- Key files: `README.md`, `BOOTSTRAP.md`

**docs/**
- Purpose: Project documentation
- Contains: Feature specs, brand guidelines, API docs
- Key files: Markdown specs under `specs/`, `design-system/`

## Key File Locations

**Entry Points:**
- API: `apps/api/src/index.ts` — Fastify bootstrap
- Web: `apps/web/src/app/page.tsx` — Next.js dashboard
- Site: `apps/site/src/app/page.tsx` — Next.js pitch
- Landing: `apps/landing/index.html` — Static HTML
- Jeffrey: `packages/jeffrey/src/index.ts` — Public barrel

**Configuration:**
- API env: `apps/api/src/config.ts`
- Jeffrey env: `packages/jeffrey/src/config.ts`
- DB: `packages/db/drizzle.config.ts`
- Turbo: `turbo.json`
- TypeScript: `tsconfig.base.json`

**Core Logic:**
- Routes: `apps/api/src/routes/` (auth.ts, biomarkers.ts, protocol.ts, jeffrey.ts)
- Services: `apps/api/src/services/` (jeffrey.service.ts, protocol.service.ts, biomarker.service.ts)
- Integrations: `apps/api/src/integrations/` (whoop/, apple-health/, fhir/)
- Engine: `apps/api/src/engine/` (biomarker-ranges.ts, evaluator.ts, interactions.ts)
- Database: `packages/db/src/schema.ts`

**Testing:**
- API tests: `apps/api/src/**/__tests__/*.test.ts` (vitest)
- Jeffrey tests: `packages/jeffrey/src/__tests__/*.test.ts`

## Naming Conventions

**Files:**
- Route handlers: `{feature}.ts` (e.g., `biomarkers.ts`, `protocol.ts`)
- Services: `{feature}.service.ts` (e.g., `biomarker.service.ts`)
- Adapters: `{system}Adapter.ts` (e.g., `WhoopAdapter.ts`)
- Tests: `{file}.test.ts` or `{file}.spec.ts` (collocated in `__tests__/`)
- Configuration: `{feature}.config.ts` or `config.ts`
- Utilities: `{operation}.ts` (e.g., `retry.ts`, `token-encryption.ts`)

**Directories:**
- Route handlers: `routes/` (plural)
- Services: `services/` (plural)
- Middleware: `middleware/` (plural)
- Utilities: `utils/` (plural)
- Integrations: `integrations/` (plural, nested by provider: `integrations/whoop/`)
- Components: `components/` (plural)
- Hooks: `hooks/` (plural)
- Tests: `__tests__/` (double underscore, trailing slash)

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `JeffreyMessage`, `BiomarkerRange`)
- Types: `PascalCase` (e.g., `JeffreySurface = "health" | "investor"`)
- Enums: `PascalCase` (e.g., `RangeStatus`)
- Functions: `camelCase` (e.g., `createJeffreySession()`, `addBiomarker()`)
- Variables: `camelCase` (e.g., `userID`, `biomarkerList`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `ALLOWED_SURFACES`, `TIME_SLOTS`)

## Where to Add New Code

**New Feature (e.g., "Add wearable sync for Oura"):**
- Create adapter: `packages/integrations/src/ouraAdapter.ts` (implements `WearableProvider`)
- Create sync logic: `apps/api/src/integrations/oura/` (client.ts, normalizer.ts, sync.ts)
- Add route: `apps/api/src/routes/integrations.ts` (OAuth callback endpoint)
- Add service: `apps/api/src/services/integrations.service.ts` (token management)
- Add scheduler job: Update `apps/api/src/scheduler.ts` (cron for sync)
- Add schema: `packages/db/src/schema.ts` (integrationTokens row for "oura" provider)
- Add tests: `apps/api/src/integrations/oura/__tests__/normalizer.test.ts`

**New Route (e.g., "POST /protocol/compare"):**
- Create route: `apps/api/src/routes/protocol.ts` (add handler)
- Implement service: `apps/api/src/services/protocol.service.ts` (add function)
- Add schema validation: In route handler (Fastify schema)
- Add tests: `apps/api/src/routes/__tests__/protocol.test.ts`

**New Component (e.g., "BiomarkerTrendChart"):**
- Create component: `packages/ui/src/components/BiomarkerTrendChart.tsx` (or `apps/web/src/components/` if web-only)
- Create hook: `packages/ui/src/hooks/useBiomarkerTrend.ts` (if data-fetching required)
- Import in app: `apps/web/src/app/page.tsx` or feature page

**New Service (e.g., "notificationService"):**
- Create file: `apps/api/src/services/notification.service.ts`
- Export functions: `export async function sendAlert(userId, message) { ... }`
- Call from routes or scheduler

**New Integration Surface (e.g., "Jeffrey 'wellness coach' mode"):**
- Add surface file: `packages/jeffrey/src/wellness.ts`
- Export context builder: `export function wellnessContextFor(profile) { ... }`
- Export surface config: `export const wellnessSurface: JeffreySurface = { ... }`
- Add to allowlist: `apps/api/src/routes/jeffrey.ts` line ~25
- Export from barrel: `packages/jeffrey/src/index.ts`

## Special Directories

**apps/api/src/engine:**
- Purpose: Pure domain rules (no I/O, no AI)
- Generated: No
- Committed: Yes
- Examples: `biomarker-ranges.ts` (validation), `interactions.ts` (drug combos)

**apps/api/src/integrations:**
- Purpose: External system adapters (OAuth, API clients, normalizers)
- Generated: No
- Committed: Yes
- Nested structure: `{provider}/{client,normalizer,sync}.ts`

**packages/db/drizzle:**
- Purpose: Database migration SQL files
- Generated: Yes (via `drizzle-kit generate`)
- Committed: Yes (migrations are source-controlled)
- Auto-run on startup via `apps/api/src/index.ts` line ~121

**apps/api/src/routes/__tests__:**
- Purpose: Integration tests for route handlers
- Generated: No
- Committed: Yes
- Pattern: `{feature}.test.ts`, uses vitest + Fastify .inject()

**packages/jeffrey/src/prompts:**
- Purpose: LLM system prompts and tool schemas
- Generated: No
- Committed: Yes
- Content: Text exported as strings; markdown file `system-prompt.md`

**apps/web/.next:**
- Purpose: Next.js build output
- Generated: Yes (via `next build`)
- Committed: No (git-ignored)

**apps/api/dist:**
- Purpose: TypeScript compile output
- Generated: Yes (via `tsc`)
- Committed: No (git-ignored)

---

*Structure analysis: 2026-05-04*
