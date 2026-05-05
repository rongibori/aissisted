# Aissisted — Vendor Setup, Week 1

**Date:** 2026-04-21
**For:** Ron (hands-on execution — not an Executor task)
**Closes roadmap items:** F-8, F-9, F-10, F-11

---

## Why this is yours and not the Executor's

Every step below happens in a vendor UI (Neon dashboard, Render dashboard, Vercel dashboard, your DNS registrar). There is no local filesystem for the Executor to touch, no code to commit. You click, you paste, you verify.

The estimated time is **90 minutes of focused work** if nothing breaks. Budget 3 hours.

---

## Tension

Everything ships to your laptop. Jeffrey, the investor room, the whole stack — none of it lives anywhere your first paying person can reach.

## Truth

We already wrote the deployment runbook (`docs/deployment.md`). We already Dockerfile'd the API. We already configured Vercel for the web app. The only reason we're not live is that nobody has clicked the buttons.

## Shift

Today you click the buttons. By tonight, `https://app.aissisted.com/jeffrey-live` is real.

---

## Prerequisites (collect before you start)

Open a scratch note — you'll paste these between windows:

- [ ] GitHub account connected to Render + Vercel
- [ ] `OPENAI_API_KEY` from platform.openai.com/api-keys (production key — not the dev one)
- [ ] `ELEVENLABS_API_KEY` + `ELEVENLABS_JEFFREY_VOICE_ID` from elevenlabs.io
- [ ] Domain registrar login for `aissisted.com` (need to add two CNAMEs)
- [ ] Two secrets you will generate now:

```bash
# Run these in Terminal. Save the output.
openssl rand -hex 32
# → paste as JWT_SECRET

openssl rand -base64 32
# → paste as TOKEN_ENCRYPTION_KEY
```

Keep these two secrets somewhere safe — 1Password is ideal. You'll need them once for Render, and anyone who has them can forge sessions.

---

## Step 1 — Postgres (Neon)

**Why Neon:** serverless, free tier is enough for Week 1, separates from Render so you can swap either side independently.

1. Go to neon.tech → Sign in with GitHub → New Project
2. Name: `aissisted-prod`
3. Region: `US East (Ohio)` — we'll match Render region to this
4. Postgres version: latest (17+)
5. Create
6. From the project dashboard → Connection string → Pooled connection → copy the full string
7. That string is your `DATABASE_URL`. Save it.

**Sanity:** The string should start with `postgres://` and include `?sslmode=require` and `?pooler=...`. If it doesn't, you grabbed the direct connection by mistake — use the pooled one.

Migrations run automatically on first API boot. You don't need to run anything here.

---

## Step 2 — API on Render

**Why Render:** WebSocket-capable (Vercel serverless is not — Jeffrey Realtime requires a persistent WS), zero config for Docker, health checks built in.

1. render.com → New → Web Service
2. Connect GitHub → pick `rongibori/aissisted`
3. Settings:
   - **Name:** `aissisted-api`
   - **Region:** `Ohio` (match Neon)
   - **Branch:** `main`
   - **Root directory:** `.` (repo root — the Dockerfile handles the monorepo)
   - **Runtime:** `Docker`
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Instance type:** `Starter` ($7/mo — 512 MB is enough)
   - **Health check path:** `/health`
4. **Environment variables** — paste these in (Add Environment Variable for each):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (paste from Neon, Step 1) |
| `JWT_SECRET` | (paste your `openssl rand -hex 32` output) |
| `TOKEN_ENCRYPTION_KEY` | (paste your `openssl rand -base64 32` output) |
| `OPENAI_API_KEY` | (paste your OpenAI key) |
| `ALLOWED_ORIGINS` | `https://aissisted.com,https://app.aissisted.com` |
| `ELEVENLABS_API_KEY` | (optional — paste if you have it) |
| `ELEVENLABS_JEFFREY_VOICE_ID` | (optional — paste if you have it) |

5. Create Web Service. First build is ~4 minutes.
6. Once deployed, Render gives you a URL like `https://aissisted-api.onrender.com`. Save it.

**Sanity check — paste into Terminal:**

```bash
curl https://aissisted-api.onrender.com/health
```

Expected: `{"status":"ok","timestamp":"...","version":"0.1.0","checks":{"db":"ok"}}`

If `checks.db` is `error` → `DATABASE_URL` is wrong. Go back to Step 1, grab the pooled connection string again.

---

## Step 3 — Web app on Vercel

1. vercel.com → Add New → Project
2. Import `rongibori/aissisted`
3. Configure Project:
   - **Project Name:** `aissisted-web`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/web` ← important, not the repo root
4. Environment Variables (Production + Preview scopes):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://aissisted-api.onrender.com` (no trailing slash — or your custom domain once Step 4 is done) |

5. Deploy. Vercel gives you `https://aissisted-web-<hash>.vercel.app`. Save it.

**Sanity:** Open the Vercel URL. You should land on the login page. If you see a 500, check the Vercel deploy logs — most likely `NEXT_PUBLIC_API_URL` is wrong or the API is asleep.

---

## Step 4 — Custom domains

### 4a. `api.aissisted.com` → Render

1. Render → aissisted-api → Settings → Custom Domain → Add `api.aissisted.com`
2. Render shows a CNAME target like `aissisted-api.onrender.com`
3. At your DNS registrar, create a CNAME:
   - **Name:** `api`
   - **Target:** (Render-provided)
   - **TTL:** `3600`
4. Back on Render → refresh until SSL status shows `Issued` (usually 2–5 min)

### 4b. `app.aissisted.com` → Vercel

1. Vercel → aissisted-web → Settings → Domains → Add `app.aissisted.com`
2. Vercel shows a CNAME target (`cname.vercel-dns.com`)
3. At your DNS registrar, create a CNAME:
   - **Name:** `app`
   - **Target:** `cname.vercel-dns.com`
   - **TTL:** `3600`
4. Back on Vercel → refresh until the domain shows `Valid Configuration`

### 4c. Reconcile env vars

Once both custom domains resolve:

1. **Vercel** → `aissisted-web` → Settings → Environment Variables → edit `NEXT_PUBLIC_API_URL` → `https://api.aissisted.com` → Save → redeploy
2. **Render** → `aissisted-api` → Environment → edit `ALLOWED_ORIGINS` → `https://aissisted.com,https://app.aissisted.com` (no vercel.app origin needed anymore) → Save → it auto-redeploys

---

## Step 5 — End-to-end verification

This is the moment you confirm Jeffrey lives on the internet.

1. Open `https://app.aissisted.com/register`
2. Create a test account (use a real email — we verify magic-link flow)
3. Log in at `https://app.aissisted.com/login`
4. Navigate to `https://app.aissisted.com/jeffrey-live`
5. Click **Start session**
6. Grant microphone permission when the browser asks
7. Watch the state badge: `Requesting access` → `Connecting` → `Connected` → `Listening`
8. Speak one sentence. Jeffrey should respond in voice within ~1 second.

### If it breaks

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 401 on ticket request | Not logged in, or `JWT_SECRET` mismatch | Confirm login worked, re-verify env var on Render |
| WS closes immediately (code 1006) | CORS / origin block | Check `ALLOWED_ORIGINS` on Render includes `https://app.aissisted.com`, redeploy |
| WS closes with code 4003 | Ticket expired (30s TTL) — usually clock skew | Check Render server time; restart the instance |
| No audio back, transcript blank | `OPENAI_API_KEY` invalid or rate-limited | Open platform.openai.com → check key + quota |
| Mic permission denied | Browser needs HTTPS (check) and a real user gesture | Refresh the page and click Start session cleanly |

### Record the verification

Once it works, paste into your scratch note:

- Time it went live: `____`
- Latency (first audio back): `____ ms`
- OpenAI cost per session in dashboard: `____`

That triggers roadmap item **F-12** as done — not in this memo but worth capturing.

---

## Step 6 — Close out

Once all of the above is green:

- [ ] Send me (the Planner) a one-line Slack: "API + web live, /jeffrey-live verified"
- [ ] Mark these roadmap items done in your own tracking: F-8, F-9, F-10, F-11, F-12
- [ ] Queue me to start C-1 (first end-to-end onboarding walkthrough) against the deployed stack — I'll unblock Task #82

---

## System (what you just built)

```
Neon Postgres ──► Render apps/api ──► OpenAI Realtime (WS)
      ▲                  ▲
      │                  │
      └── migrations      └── ALLOWED_ORIGINS
                              (CORS allowlist)
                               ▲
                               │
Vercel apps/web ───────────────┘
  (NEXT_PUBLIC_API_URL → api.aissisted.com)
```

Three vendors. One API key that matters. Two custom CNAMEs. That's the surface area of "live."

---

## Ownership

This is yours, not the team's, not the Executor's, not mine. Every env var in this memo is yours to rotate. Every vendor bill is yours to watch. Every line of the runbook at `docs/deployment.md` is your operating manual.

When you're done, you will have moved Aissisted from "a project on my Mac" to "a service on the internet." That's the shift.
