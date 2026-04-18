# `docs/specs/` — Aissisted product & architecture specs

This folder holds canonical product, brand, data, engineering, and safety specifications for the Aissisted platform. Every spec here is **v1.0+ Runtime-Aligned** — i.e., aligned with the current live `apps/api` stack (Fastify · Drizzle/libsql (SQLite) · Claude API · AWS). **PostgreSQL/Drizzle, Redis, and pgvector remain target-stack components planned under `feat/postgres-migration` and are not yet the live runtime.**

---

## Triage provenance

These specs were consolidated on **2026-04-17** from the pre-v2 backup (created 2026-04-16 during the repo consolidation, now archived at `~/Documents/Claude/Projects/_archive/Aissisted-specs-pre-v2/`).

Classification pass used Path B from issue #28: *commit canonical specs as-is, flag conflicts for human review rather than auto-resolving*.

### Triage table

| File | Version | Classification | Rationale |
|------|---------|----------------|-----------|
| `THE_BEGINNING_OF_THE_PLAYBOOK.md` | Origin narrative | **KEEP** | Foundational brand/product thesis. No code conflict. |
| `SHARED_STATE_AND_MEMORY_SPEC.md` | v1.1 Execution-aligned | **KEEP** | Stack-aligned (Fastify/Postgres/Redis). Foundation spec — no deps. |
| `ORCHESTRATOR_ROUTING_SPEC.md` | v1.0 Foundational | **KEEP** | Stack-aligned incl. pgvector. |
| `BRAND_FILTER_SPEC.md` | v1.2 Brand Bible aligned | **KEEP** | Stack-aligned. Blocks all user-facing output. Tone mode union expanded to 5 per Brand Bible v1.0. |
| `AGENT_BRAND_SPEC.md` | v1.2 Brand Bible aligned | **KEEP** | Terminal agent spec. Stack-aligned. Tone union synced to 5 modes. |
| `AGENT_DATA_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Signal engine. Stack-aligned. |
| `AGENT_ENGINEERING_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Protocol validator. Stack-aligned. |
| `AGENT_GROWTH_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Async advisory layer. Stack-aligned. |
| `AGENT_PRODUCT_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Product-routing agent. Stack-aligned. |
| `AGENT_LAYER_IMPLEMENTATION_PLAN.md` | 2026-04-16 | **KEEP** | 5-PR implementation plan for the agent graph. Active roadmap. |
| `PROTOCOL_ENGINE_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Protocol generation + adjustment. Stack-aligned. |
| `SAFETY_RULE_PACK_V1.md` | v1.1 Runtime-Aligned | **KEEP** (clinical sign-off pending) | Requires licensed review before any rule goes live. |
| `JEFFREY_VOICE_LAYER_SPEC.md` | v1.0 Runtime-Aligned | **KEEP** | Voice layer over orchestrator. Stack-aligned. |

**No files classified as UPDATE, CONFLICT, or DROP.** Every spec passed the stack-alignment check on first read.

### Brand assets (in `docs/brand/`)

| File | Classification | Rationale |
|------|----------------|-----------|
| `BRAND_BIBLE.md` | **CANONICAL · v1.0 LOCKED** | Single source of truth for voice, tone, visual identity, architecture, and go-to-market. All brand/product/visual decisions reconcile here. |
| `aissisted-brand-architecture.html` | **KEEP** | Brand system visualization (derivative of Brand Bible §Architecture). |
| `aissisted-brand-brief.html` | **KEEP** | Brand brief reference (derivative of Brand Bible §Creative Brief). |
| `aissisted-website.html` | **KEEP** | Website prototype HTML. |
| `assets/Aissisted-logo-H.svg` | **PRIMARY** | Horizontal wordmark, graphite `#1C1C1E` ink on transparent — light-surface variant. Use on 70%-white default surfaces. |
| `assets/Aissisted-logo-H-dark.svg` | **KEEP** | Horizontal wordmark, white ink on transparent — dark-surface inverse. Use on graphite/midnight/red backgrounds. |
| `assets/Aissisted-logo-H-dark.png` | **KEEP** | 455×85 raster fallback of the dark SVG (13 KB) — for email/social where SVG isn't supported. |
| `assets/Aissisted-logo-H-red.svg` | **KEEP** | Horizontal wordmark, Medical Red `#EE2B37` ink on transparent — iconic-moment variant. Use sparingly on white for brand moments that extend the cap-press red across the wordmark. Not a general-purpose alternative to the graphite primary. |

> **Outstanding:** no raster PNG of the primary (light-surface) variant yet. Generate from `Aissisted-logo-H.svg` or export from the Illustrator source when an email/social asset needs it.
| `DESIGN_SOURCES.md` | **KEEP** | Pointer index to large binary design sources kept off-repo. |

> **Precedence:** when `BRAND_BIBLE.md` conflicts with any derivative (HTML briefs, specs, component copy, or UI), the Bible wins. File a PR to reconcile the derivative — do not edit the Bible to match drift.

### Operational scripts (in `scripts/`)

Recovered from the pre-v2 backup and promoted into the repo:

| File | Classification | Rationale |
|------|----------------|-----------|
| `aissisted-audit.sh` | **KEEP** | Workspace audit helper. |
| `aissisted-consolidate.sh` | **KEEP** | Consolidation helper used during the 2026-04-16 repo merge. |
| `aissisted-guardrails.sh` | **KEEP** | Repo hygiene guardrails. |

### Intentionally excluded from this commit

| Source | Reason |
|--------|--------|
| `~/Desktop/[WIP] Asssisted/*.psd`, `*.key`, `*.ai`, `Briston.otf`, business PDFs | Large binary design sources (~234 MB total). Indexed in `docs/brand/DESIGN_SOURCES.md`; not stored in git. |
| `~/Desktop/SCIENCE + WELL-BEING word.pdf` | External reference material, not Aissisted-authored canonical content. |
| Six Labs files | Separate company; confidential. Does not belong in this repo. |
| Onboarding Flow spec | Planned-but-unwritten. Tracked as a gap, not a lost file. |

---

## Reconciliation with `feat/postgres-migration`

The branch `feat/postgres-migration` has its own `docs/ARCHITECTURE.md`, `docs/EXECUTION_GUIDE.md`, `docs/PHASE_1_EXECUTION.md` — those will land on `main` via the next feat → main merge-up and should be cross-referenced with the specs here. If a conflict surfaces during that merge (e.g., ARCHITECTURE.md diverges from ORCHESTRATOR_ROUTING_SPEC.md), resolve in favor of whichever has the later `Runtime-Aligned` timestamp and note the resolution in that file's changelog section.

## Historical backup

The source backup folder has been archived to `~/Documents/Claude/Projects/_archive/Aissisted-specs-pre-v2/` (archived 2026-04-17 by Planner as part of the spec-triage workflow tracked in Issue #28). It is retained as a read-only reference only. Do not restore from it without Planner approval — the canonical state is this repo.

## How to evolve these specs

1. Open a PR with a clear changelog entry at the top of the file.
2. Bump the `Version:` frontmatter.
3. Update dependency versions in any spec that depends on yours.
4. If a change rewrites more than 20% of a spec, open a governance issue first.

— Planner (Cowork) · last updated 2026-04-17 (Brand Bible v1.1 landing + red swap)
