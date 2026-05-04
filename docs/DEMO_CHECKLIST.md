# Aissisted Pilot Demo Checklist

**Purpose:** Single-page pass/fail walkthrough for the 10-person user-testing pilot.
**Audience:** Anyone running the demo (engineering or non-engineering).
**Last updated:** 2026-05-03

---

## 0. Pre-flight (one-time)

| | Step | Pass criteria |
|---|---|---|
| ☐ | Node 20+ installed | `node --version` ≥ v20 |
| ☐ | pnpm installed | `pnpm --version` runs |
| ☐ | Repo cloned to `/Users/rongibori/Documents/GitHub/aissisted` | `pwd` matches |
| ☐ | `OPENAI_API_KEY` set in `apps/api/.env` | non-empty after `grep OPENAI_API_KEY apps/api/.env` |
| ☐ | (For real Epic) Epic sandbox client_id + redirect URL configured in `.env` | `EPIC_FHIR_BASE_URL` populated |
| ☐ | (For real WHOOP) WHOOP client_id + secret configured | `WHOOP_CLIENT_ID` populated |

---

## 1. Bootstrap

| | Step | How | Pass criteria |
|---|---|---|---|
| ☐ | Install all workspaces | `pnpm install` from repo root | exits 0, no peer-dep blockers |
| ☐ | Run migrations | `pnpm --filter @aissisted/db db:migrate` | DB file at `apps/api/data/aissisted.db` |
| ☐ | Seed pilot cohort | double-click `seed-pilot-cohort.command` | console shows `✓ Pilot cohort ready.` and 10 users seeded |
| ☐ | Start API | `pnpm --filter @aissisted/api dev` | listens on :3001 (Fastify ready log) |
| ☐ | Start web | `pnpm --filter @aissisted/web dev` | listens on :3000 |

---

## 2. Demo flow (per pilot user)

Use any pilot user (01-10). Password: `demo1234`. Suggested flow uses **pilot 01 (Ron)**.

### 2.1 Test profile

| | Step | Pass criteria |
|---|---|---|
| ☐ | Sign in at `/login` with `ron.gibori+pilot01@aissisted.test` / `demo1234` | redirected to `/dashboard`, no console errors |
| ☐ | Profile page loads `/profile` | header shows "Ron Gibori", goals "recovery, longevity, cognition" |

### 2.2 Integration status

| | Step | Pass criteria |
|---|---|---|
| ☐ | `/integrations` page shows three providers | WHOOP, FHIR, Apple Health visible |
| ☐ | Pilot 01 shows all three connected with sentinel timestamps | green/aqua status indicator |
| ☐ | Pilot 09 (fresh user) shows zero connected | "Not connected" labels for all |

### 2.3 Epic / MyChart (SMART on FHIR)

| | Step | Pass criteria |
|---|---|---|
| ☐ | Click "Connect MyChart" while signed in as pilot 09 | redirects to Epic sandbox auth screen |
| ☐ | Authorize the test patient at Epic sandbox | redirects back to Aissisted |
| ☐ | `/integrations/status` returns `fhir.connectedAt` for pilot 09 | non-null timestamp |
| ☐ | Lab biomarkers populate in `/labs` | at least one Observation row visible |
| ☐ | Audit log gets a `fhir.sync` entry | row in `audit_log` with `action = 'fhir.sync'` |

### 2.4 WHOOP

| | Step | Pass criteria |
|---|---|---|
| ☐ | Click "Connect WHOOP" as pilot 09 | redirects to WHOOP OAuth |
| ☐ | Authorize test account | redirects back |
| ☐ | Recovery, sleep, strain populate in dashboard | wearable rows visible |
| ☐ | Audit log gets a `whoop.sync` entry | row in `audit_log` |

### 2.5 Apple Health

| | Step | Pass criteria |
|---|---|---|
| ☐ | Navigate to `/integrations/apple-health` | upload form visible |
| ☐ | Upload `export.zip` | parser returns count of records |
| ☐ | Steps, HRV, VO₂ max appear in dashboard | apple_health-sourced biomarkers visible |
| ☐ | Audit log gets `apple_health.import` entry | row in `audit_log` |

### 2.6 Lab ingestion (manual)

| | Step | Pass criteria |
|---|---|---|
| ☐ | Pilot 10 (Olivia) shows TSH 5.2 ↑, Free T4 0.8 ↓ | priority red flag rendered |
| ☐ | Manual lab entry form (if exposed) saves to DB | row in `biomarkers` with `source = 'manual'` |

### 2.7 Dashboard

| | Step | Pass criteria |
|---|---|---|
| ☐ | `/dashboard` renders for pilot 01 | no spinner stuck, no error toast |
| ☐ | Latest biomarkers section shows ≥10 rows | each with value + unit |
| ☐ | ApoB (92) renders in red | priority status |
| ☐ | Sparklines visible for biomarkers with ≥2 readings | smooth, no NaN |
| ☐ | Trend chart (`/trends`) renders rolling-30d for at least one biomarker | curve visible |

### 2.8 Neural AI visualization

| | Step | Pass criteria |
|---|---|---|
| ☐ | `/jeffrey-system` route loads | central core + 7 modules + paths visible |
| ☐ | Module values reflect pilot 01's real data | Sleep, Recovery, Stress, etc. show pilot's numbers (not mock Ron-snapshot) |
| ☐ | Mode buttons cycle the simulation | aqua signals flow inward (listening), cross-route (thinking), outward (speaking) |
| ☐ | Reduced-motion respected | `prefers-reduced-motion: reduce` collapses to static frame |

### 2.9 Jeffrey grounded

| | Step | Pass criteria |
|---|---|---|
| ☐ | Open Jeffrey voice modal, ask "How was my recovery this week?" | response references pilot 01's actual recovery numbers |
| ☐ | Ask "What changed in my labs?" | references ApoB priority |
| ☐ | Ask "Why did my supplement stack change?" | references protocol rationale fields |
| ☐ | Ask "What data is missing?" | mentions integrations not yet connected (or "all connected" for pilot 01) |
| ☐ | Conversation persisted | row visible in `conversations` + `messages` for the user |

### 2.10 Protocol generation

| | Step | Pass criteria |
|---|---|---|
| ☐ | `/protocol` shows current protocol for pilot 01 | items listed with timing + rationale |
| ☐ | Trigger regeneration (UI button or `/protocol/generate` POST) | new protocol row appears, prior remains in history |
| ☐ | Recommendations carry `safetyStatus` | every row is `allowed`, `warning`, or `blocked` |

### 2.11 Audit + persistence

| | Step | Pass criteria |
|---|---|---|
| ☐ | Sign out, sign back in | session resumes, all data persists |
| ☐ | Query `audit_log` directly | every state-changing action logged with userId, action, resource |
| ☐ | Pilot rows are isolated per `user_id` | querying pilot 01 returns 0 rows owned by pilot 02 |

---

## 3. 10-pilot schema readiness

| | Check | Pass criteria |
|---|---|---|
| ☐ | All 10 users present | `SELECT COUNT(*) FROM users WHERE id LIKE 'aissisted-pilot-%'` = 10 |
| ☐ | Each has a profile | join `health_profiles` returns 10 |
| ☐ | Each has consent records | `consent_records` rows for at least `hipaa_notice` + `data_processing` |
| ☐ | Connection-status spread matches the seed plan | 01-03 full stack, 04-06 WHOOP+FHIR, 07-08 Apple Health, 09 none, 10 manual |
| ☐ | Re-running the seed is idempotent | second run prints `Clearing prior pilot data…` and finishes without unique-constraint errors |
| ☐ | No cross-user data leakage | Jeffrey response for pilot 01 never references pilot 02's biomarkers |

---

## 4. Quality gates

| | Gate | Command | Pass criteria |
|---|---|---|---|
| ☐ | Lint | `pnpm lint` | exits 0 |
| ☐ | Typecheck | `pnpm typecheck` | exits 0 (apps/api, apps/web, packages/db, packages/jeffrey, packages/jeffrey-evals all clean) |
| ☐ | Unit tests | `pnpm test` | exits 0 |
| ☐ | Build | `pnpm build` | apps/web `.next` artifact + apps/api `dist/` produced without errors |

---

## 5. Sign-off

| | | |
|---|---|---|
| ☐ | Demo lead reviewed steps 1-4 with at least one pilot account | Date: __________ |
| ☐ | Known limitations documented | linked from this checklist |
| ☐ | Pilot users notified of credentials + privacy boundaries | comms sent |

---

## Known limitations / follow-ups

- ⚠️ Apple Health upload UI is currently behind feature-flag (Phase 4 of the implementation plan).
- ⚠️ Jeffrey grounding (Phase 5) injects user data into the system prompt at conversation start — multi-turn factual recall depends on conversation persistence.
- ⚠️ Neural viz wiring (Phase 6) currently uses the mock Ron-snapshot; the per-user hook lands in a follow-up commit.
- ⚠️ Pilot password hash is hard-coded (`demo1234`). Rotate or replace before broader testing.

---

*This document evolves with the implementation. Each phase that lands flips an item from ⚠️ to ✓ here.*
