# `docs/specs/` — Aissisted product & architecture specs

This folder holds canonical product, brand, data, engineering, and safety specifications for the Aissisted platform. Every spec here is **v1.0+ Runtime-Aligned** — i.e., aligned with the current live `apps/api` stack (Fastify · Drizzle/libsql (SQLite) · Claude API · AWS). **PostgreSQL/Drizzle, Redis, and pgvector remain target-stack components planned under `feat/postgres-migration` and are not yet the live runtime.**

---

## Triage provenance

These specs were consolidated on **2026-04-17** from `Aissisted.backup-20260416-153155/` on the local workstation (pre-v2 backup folder created during the 2026-04-16 repo consolidation).

Classification pass used Path B from issue #28: *commit canonical specs as-is, flag conflicts for human review rather than auto-resolving*.

### Triage table

| File | Version | Classification | Rationale |
|------|---------|----------------|-----------|
| `THE_BEGINNING_OF_THE_PLAYBOOK.md` | Origin narrative | **KEEP** | Foundational brand/product thesis. No code conflict. |
| `SHARED_STATE_AND_MEMORY_SPEC.md` | v1.1 Execution-aligned | **KEEP** | Stack-aligned (Fastify/Postgres/Redis). Foundation spec — no deps. |
| `ORCHESTRATOR_ROUTING_SPEC.md` | v1.0 Foundational | **KEEP** | Stack-aligned incl. pgvector. |
| `BRAND_FILTER_SPEC.md` | v1.1 Execution-aligned | **KEEP** | Stack-aligned. Blocks all user-facing output. |
| `AGENT_BRAND_SPEC.md` | v1.1 Runtime-Aligned | **KEEP** | Terminal agent spec. Stack-aligned. |
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
| `aissisted-brand-architecture.html` | **KEEP** | Brand system visualization. |
| `aissisted-brand-brief.html` | **KEEP** | Brand brief reference. |
| `aissisted-website.html` | **KEEP** | Website prototype HTML. |
| `assets/Aissisted-logo-H.png` | **KEEP** | Horizontal logo lockup (13 KB). |
| `DESIGN_SOURCES.md` | **KEEP** | Pointer index to large binary design sources kept off-repo. |

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

The source backup folder is preserved at `~/Documents/Claude/Projects/Aissisted.backup-20260416-153155/` pending archival (tracked in issue #30 / the follow-up archive task). Do not restore from it without Planner approval.

## How to evolve these specs

1. Open a PR with a clear changelog entry at the top of the file.
2. Bump the `Version:` frontmatter.
3. Update dependency versions in any spec that depends on yours.
4. If a change rewrites more than 20% of a spec, open a governance issue first.

— Planner (Cowork) · 2026-04-17
