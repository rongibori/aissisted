# Aissisted — Deployment Runbook

> Target: get `apps/api` + `apps/web` live so `/jeffrey-live` works end-to-end against the deployed Realtime proxy.

This is a first-time-stand-up runbook. It names platforms for reference — the important thing is what the API needs, what the web needs, and how they connect.

---

## 1. Topology

```
┌────────────────────┐        ┌──────────────────────┐        ┌──────────────────┐
│ apps/site          │        │ apps/web             │        │ apps/api         │
│ marketing + inves- │        │ authenticated app    │  →WS→  │ Fastify + WS     │
│ tor room           │        │ /jeffrey-live etc.   │        │ proxy to OpenAI  │
│ Vercel             │        │ Vercel               │        │ Render / Fly /   │
│ aissisted.com      │        │ app.aissisted.com    │        │ Railway          │
└────────────────────┘        └──────────────────────┘        └──────────────────┘
                                        │                              │
                                        │                      ┌───────┴────────┐
                                        │                      │ Postgres       │
                                        │                      │ Neon / Render  │
                                        │                      └────────────────┘
                                        │
                                        └──(ticket JWT in query)──> wss://api...
```

Two platforms: **Vercel** for the Next.js apps (they're HTTP-only), **a WS-capable Node host** for the Fastify API (OpenAI Realtime is a persistent WebSocket — Vercel serverless is out).

---

## 2. What ships in this repo vs. what you click

**In the repo (done):**

- `apps/api/Dockerfile` — ready to build
- `apps/web/vercel.json` — Vercel reads this on import
- `apps/site/vercel.json` — already live
- `.env.example` — full contract of required and optional vars

**You click (by hand, once):**

- Create the postgres instance
- Create the API service on Render/Fly/Railway
- Create the Vercel project for `apps/web`
- Paste env vars into each platform's UI

---

## 3. Environment variables

### `apps/api` (server host)

**Required:**

| Var | Why | How to generate |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | Copy from Neon/Render postgres page |
| `JWT_SECRET` | Auth token signing | `openssl rand -hex 32` |
| `TOKEN_ENCRYPTION_KEY` | AES-256-GCM for stored OAuth tokens | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Jeffrey brain + Realtime voice | platform.openai.com/api-keys |
| `ALLOWED_ORIGINS` | CORS allowlist for prod | Comma-separated — see below |
| `NODE_ENV` | Toggles prod-only code paths | `production` |

**Optional:**

| Var | Unlocks |
| --- | --- |
| `ANTHROPIC_API_KEY` | Legacy chat path + Haiku intent parser |
| `ELEVENLABS_API_KEY` + `ELEVENLABS_JEFFREY_VOICE_ID` | ElevenLabs streaming TTS |
| `WHOOP_CLIENT_ID` + `WHOOP_CLIENT_SECRET` | WHOOP integration |
| `FHIR_BASE_URL` + `FHIR_CLIENT_ID` | Epic / FHIR integration |
| `OPENAI_JEFFREY_REALTIME_MODEL` | Override Realtime model |

**`ALLOWED_ORIGINS` values:**

Comma-separated list of origins the deployed frontend uses. Example:

```
ALLOWED_ORIGINS=https://aissisted.com,https://app.aissisted.com
```

If left empty in production, the code falls back to `["https://aissisted.com"]`. Vercel preview URLs (`*.vercel.app`) will be blocked unless you add them explicitly.

### `apps/web` (Vercel)

| Var | Scope | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Production + Preview | `https://api.aissisted.com` (or whatever your API origin is) |

That's it for the web app — everything else is served via the API.

### `apps/site` (Vercel, already live)

Unchanged by this PR.

---

## 4. Stand up postgres

Any managed postgres works. Quickest paths:

**Neon** (recommended — serverless postgres, free tier):

1. Create project at neon.tech
2. Copy the connection string (it's the `DATABASE_URL`)
3. Run migrations — `apps/api` does this automatically on boot

**Render postgres** (if the API is already on Render):

1. Dashboard → New → PostgreSQL
2. Copy the Internal Connection String (faster than External)
3. Same migrations-on-boot

---

## 5. Stand up `apps/api`

### Option A — Render (recommended for WS support + zero config)

1. Dashboard → New → Web Service
2. Connect the `rongibori/aissisted` repo
3. **Settings:**
   - Build: `docker` using `apps/api/Dockerfile`
   - Root directory: `.` (the Dockerfile handles monorepo)
   - Instance type: Starter (512 MB RAM is enough for MVP)
   - Region: same as postgres
4. **Environment:** paste the required vars from §3
5. **Health check path:** `/health`
6. Deploy. First build takes ~4 minutes.

### Option B — Fly.io (cheaper at scale, requires CLI)

Not scoped in this PR. Follow-up work.

### Sanity check

Once live:

```bash
curl https://<api-origin>/health
# → {"status":"ok","timestamp":"...","version":"0.1.0","checks":{"db":"ok"}}
```

If `checks.db` is `error`, `DATABASE_URL` is wrong or the db isn't reachable.

---

## 6. Stand up `apps/web` on Vercel

1. Import `rongibori/aissisted` into Vercel (New Project)
2. **Root Directory:** `apps/web` (Vercel auto-detects `vercel.json`)
3. **Framework Preset:** Next.js (auto-detected)
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://<api-origin>` (no trailing slash)
5. Deploy

The `vercel.json` already does the monorepo dance via `pnpm --filter`.

### After first deploy

Add the Vercel origin to `ALLOWED_ORIGINS` on the API service:

```
ALLOWED_ORIGINS=https://aissisted.com,https://app.aissisted.com,https://aissisted-web.vercel.app
```

Redeploy the API so the CORS allowlist picks up the new value.

---

## 7. Verify `/jeffrey-live` end-to-end

1. Log in at `https://app.aissisted.com/login` (create a test account via `/register`)
2. Navigate to `/jeffrey-live`
3. Click **Start session**
4. Browser prompts for mic permission → grant
5. State badge should progress: `Requesting access` → `Connecting` → `Connected` → `Listening`
6. Speak. Jeffrey should reply within ~1s.

### Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 401 on ticket request | Not logged in, or `JWT_SECRET` mismatch | Check login, check env var |
| WS closes immediately with code 1006 | CORS / origin block | Add the web origin to `ALLOWED_ORIGINS` and redeploy API |
| WS closes with code 4003 | Ticket surface mismatch or expired | Usually a clock skew — check server time |
| No audio back, no transcript | `OPENAI_API_KEY` invalid or over quota | Check OpenAI dashboard |
| Mic permission denied | Browser policy | Must be https:// — Vercel gives you this by default |

---

## 8. Custom domains (optional)

When you're ready to drop the `.vercel.app` and `.onrender.com` URLs:

| Service | DNS |
| --- | --- |
| `aissisted.com` | → Vercel apps/site |
| `app.aissisted.com` | → Vercel apps/web (CNAME to `cname.vercel-dns.com`) |
| `api.aissisted.com` | → Render apps/api (CNAME to the Render URL) |

Update `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_URL` to match, then redeploy.

---

## 9. Rollback

Every deploy creates a new immutable build on each platform. Rollback is one click:

- Vercel: Project → Deployments → previous deploy → Promote to Production
- Render: Service → Events → find the previous deploy → Rollback

---

## 10. Governance notes

- **Don't paste prod keys into `.env` committed to the repo.** `.env` is gitignored but the habit matters.
- **Rotate `JWT_SECRET` on any suspected leak** — all existing sessions and realtime tickets invalidate immediately. Users have to log in again. That's the feature.
- **Realtime ticket TTL is 30s** (`apps/api/src/routes/jeffrey-realtime.ts`). Short-lived by design. Do not extend without reviewing the threat model.
- **CORS in prod is an allowlist, not a wildcard.** Every new frontend origin must be added explicitly.
- **Access logs redact the `ticket` query param.** The Fastify request serializer in `apps/api/src/index.ts` rewrites `?ticket=<JWT>` to `?ticket=REDACTED` before logging. If you fork the logger config, preserve that rule.

---

## 11. Before live users — voice/PHI checklist

The voice modality (`/chat` → Voice button, `/jeffrey-live` demo) routes audio transcripts through OpenAI Realtime. That is a newer OpenAI surface — treat these as blocking items before letting real users talk to Jeffrey about health.

- [ ] **OpenAI BAA scope.** Confirm in writing that your BAA covers the Realtime product (not just the Chat Completions / Responses APIs). If it doesn't, either (a) delay the voice path until covered, or (b) gate voice behind a pre-session banner clarifying non-PHI use only, and audit the system prompt so Jeffrey redirects PHI-adjacent volunteered content back to typed chat.
- [ ] **Audit retention.** OpenAI Realtime does not persist audio server-side under normal zero-retention arrangements — verify yours is active. Your own side: transcripts are React-state-only and never hit the Aissisted database (by design, see PR #48).
- [ ] **Rotate `JWT_SECRET` once** before first real user. The dev-fallback secret should never see production traffic.
- [ ] **Set `TOKEN_ENCRYPTION_KEY`** (AES-256-GCM base64, from `openssl rand -base64 32`). Required for OAuth2 token encryption at rest.
- [ ] **Confirm `ALLOWED_ORIGINS`** is exactly the set of hostnames you expect — no trailing commas, no stale preview URLs.
- [ ] **Render log retention policy.** Render's default access logs include request URLs. The serializer above strips tickets, but if you add another token-in-URL pattern, extend the redaction.
- [ ] **Kill switch.** Decide in advance: if voice costs or abuse spike, how do you disable it in < 5 minutes? (Simplest: remove the `/v1/jeffrey/realtime*` routes or flip an env flag. Pick one and document.)
- [ ] **Medical disclaimer.** Voice panel already shows "Not medical advice." Verify it's visible on every entry point.
