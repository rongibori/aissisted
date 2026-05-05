# Aissisted Pilot Demo Runbook

**Goal:** boot the full Aissisted stack on a clean clone in under 15 minutes and walk a tester (or yourself) through the 12-step demo. Pairs with `docs/DEMO_CHECKLIST.md` for pass/fail.

**Last updated:** 2026-05-05.

---

## 0. Prerequisites

- macOS with Homebrew, or Linux with equivalent.
- Node 20+ (`node --version` ≥ v20).
- pnpm 10+ (`pnpm --version` runs; `brew install pnpm` if missing).
- Repo cloned to `/Users/rongibori/Documents/GitHub/aissisted` (the canonical clone — see `CLAUDE.md` two-clone protocol).

You do **not** need Postgres for the local pilot. The default DB is libsql/sqlite at `apps/api/data/aissisted.db` and the API auto-creates the file at boot.

---

## 1. Configure `.env`

Copy the template:

```bash
cp .env.example .env
```

Then fill in the values you have. The runbook is segmented by required-vs-optional:

### Required for the local pilot

| var | how to get | notes |
|---|---|---|
| `DATABASE_URL` | leave default `file:./data/aissisted.db` | resolves relative to `apps/api/` cwd at runtime |
| `JWT_SECRET` | `openssl rand -hex 32` | any non-empty string works in dev |
| `OPENAI_API_KEY` | platform.openai.com/api-keys | required for Jeffrey to actually answer; without it `/chat` falls back to a degraded response |

### Required for live integrations (skip = use Apple Health upload + manual labs only)

| var | demo path | source |
|---|---|---|
| `FHIR_BASE_URL`, `FHIR_CLIENT_ID`, `FHIR_REDIRECT_URI` | Epic / MyChart connect flow | Epic App Orchard or sandbox: <https://fhir.epic.com/> |
| `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI` | WHOOP connect flow | <https://developer.whoop.com/> |

### Optional

| var | what breaks if unset |
|---|---|
| `ELEVENLABS_API_KEY` + `ELEVENLABS_JEFFREY_VOICE_ID` | `/v1/jeffrey/voice/tts` returns 503; voice surface falls back to OpenAI Realtime |
| `TOKEN_ENCRYPTION_KEY` | required only when `NODE_ENV=production`; dev uses a fallback automatically |

---

## 2. Install + boot

```bash
pnpm install                           # ~30s on a warm cache
pnpm --filter @aissisted/db seed:pilot # one-time pilot cohort seed
pnpm dev                               # runs API + web + site + landing in parallel via turbo
```

What you should see:

- API on **http://localhost:4000** — Fastify boot log + `/health` returns `{"status":"ok","checks":{"db":"ok"}}`.
- Web on **http://localhost:3000** — Next.js dev server, register/login at `/`.
- Two background-only workspaces (site, landing) on their own ports if you launched all of `pnpm dev`. Stop them with `Ctrl-C` if you only need API + web.

If `pnpm dev` is too noisy, run them in separate terminals:

```bash
pnpm --filter @aissisted/api dev    # terminal 1
pnpm --filter @aissisted/web dev    # terminal 2
```

---

## 3. Pilot cohort

The seed script populates 10 fixture users matched by the `aissisted-pilot-` user-id prefix. They co-exist with real registrations — re-running the seed only touches its own rows.

| pilot | email | shape |
|---|---|---|
| 01 | `ron.gibori+pilot01@aissisted.test` | full stack: WHOOP + FHIR + Apple Health, ApoB priority, recovery suppressed |
| 02 | `marcus.chen+pilot02@aissisted.test` | full stack, pre-diabetic |
| 03 | `sarah.kane+pilot03@aissisted.test` | full stack |
| 04 | `james.tate+pilot04@aissisted.test` | WHOOP + FHIR (no Apple Health), hypertension |
| 05 | `priya.shah+pilot05@aissisted.test` | WHOOP + FHIR |
| 06 | `diego.alvarez+pilot06@aissisted.test` | WHOOP + FHIR |
| 07 | `tomas.berg+pilot07@aissisted.test` | Apple Health only |
| 08 | `ana.lopez+pilot08@aissisted.test` | Apple Health only |
| 09 | `leo.fournier+pilot09@aissisted.test` | no integrations connected (tests onboarding empty state) |
| 10 | `olivia.kerr+pilot10@aissisted.test` | lab-only, Hashimoto's |

Password for every pilot: **`demo1234`**.

To re-seed (idempotent — wipes and rebuilds the 10 pilot rows only):

```bash
pnpm --filter @aissisted/db seed:pilot
```

Real testers register via `/register` with their own email; their data lives outside the pilot prefix and is untouched by re-seeds.

---

## 4. Demo flow (the 12 steps)

Pair this with `docs/DEMO_CHECKLIST.md` to track pass/fail. Suggested narration:

1. **Open `/register`** in an incognito window. New email, password, submit.
2. **Onboarding cover surface** — name, goals, integration picker.
3. **Land on `/dashboard`** — empty state with Connect CTAs.
4. **Switch to `/integrations`** → `Connect Epic` → SMART-on-FHIR sandbox login → redirected back with `Last synced just now` and the biomarker count.
5. **Upload Apple Health export.xml** (testers should unzip `export.zip` first; the parser only accepts `export.xml` ≤ 2 MB). "Imported N of M records" toast.
6. **Manual lab entry** at `/labs` — confirm at least one biomarker persists.
7. **Dashboard** now shows real per-user biomarkers, sparklines, last-sync timestamp.
8. **`/jeffrey-system`** — neural visualization animates on the active user's `SystemSnapshot`. Modules with no source data render `priority` + "no data" Connect CTA.
9. **`/chat`** — ask the 5 grounding questions:
   - How was my recovery this week?
   - What changed in my labs?
   - Why did my supplement stack change?
   - What data is missing?
   - What should I focus on today?
   Answers cite real persisted values. Each turn writes a `chat.route` audit entry with `routedTo` + `safetyDecision`.
10. **Trigger protocol generation** — "Generate my supplement protocol". `protocolTriggered=true` in the response; `/dashboard` reflects the new recommendations on reload.
11. **Audit log inspection** — `sqlite3 apps/api/data/aissisted.db "SELECT action, resource, datetime(created_at) FROM audit_log ORDER BY created_at DESC LIMIT 20;"` — see auth.login, fhir.sync, whoop.sync, apple_health.import, chat.route, protocol.create entries scoped to the active user.
12. **Multi-tester isolation** — open a second incognito window, register pilot tester 2, confirm zero data bleed.

---

## 5. Operational knobs

- **`USE_LEGACY_CHAT=1`** in the API env — bypasses the orchestrator and falls back to the pre-J3 chat pipeline. Use during the demo if the orchestrator regresses on a critical case.
- **`OPENAI_API_KEY` unset** — `/chat` returns a degraded fallback reply instead of erroring. Useful for offline runs.
- **Reset everything** — `rm apps/api/data/aissisted.db && pnpm --filter @aissisted/db seed:pilot` brings the DB back to a clean cohort.
- **Restart the API to clear rate-limit state** — fastify-rate-limit is in-memory and resets on process exit.

---

## 6. Known limitations (not blocking the pilot)

- **Pilot 09's "fresh user" claim is loose.** The seed gives every pilot a baseline biomarker spread + protocol so the dashboard never reads as completely empty. To exercise the truly-fresh-user onboarding flow, register a brand-new account via `/register` — that's the actual tester experience anyway.
- **WHOOP path is built but off the demo critical path** if `WHOOP_CLIENT_ID` is unset. The card on `/integrations` still renders; the Connect button shows "Configure WHOOP credentials to connect".
- **Apple Health upload accepts `.xml` only.** Testers must unzip `export.zip` first. A future revision will accept the zip directly.
- **Jeffrey grounding** depends on `OPENAI_API_KEY`. Without it, replies fall back to deterministic copy and the demo's grounding step (#9) fails — flag this in the runbook for the operator.
- **Neural visualization fallback.** When unauthenticated, `/jeffrey-system` falls back to the in-component `RON_SNAPSHOT` mock. Logged-in users see their own per-user snapshot from `GET /v1/system/snapshot`.

---

## 7. Quick health check

If anything feels off:

```bash
# API healthy + db connected
curl -s http://localhost:4000/health | python3 -m json.tool

# pilot logins all work
for n in 01 02 03 04 05 06 07 08 09 10; do
  email=$(sqlite3 apps/api/data/aissisted.db \
    "SELECT email FROM users WHERE id = 'aissisted-pilot-${n}';")
  echo "${n}: ${email}"
done

# audit log of recent activity
sqlite3 apps/api/data/aissisted.db \
  "SELECT datetime(created_at), action, resource FROM audit_log
   ORDER BY created_at DESC LIMIT 20;"
```

The live runbook for any deeper issue: `docs/deployment.md` (production deploy reference, more comprehensive than the local pilot needs).
