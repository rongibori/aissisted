# Aissisted — Demo Walkthrough

A 7-minute click-path that exercises every major surface of the platform on a fresh checkout.

## Setup (one-time, ~2 min)

```bash
pnpm install
cp .env.example .env       # fill in ANTHROPIC_API_KEY
pnpm exec tsx packages/db/src/migrate.ts
pnpm seed:demo
pnpm dev
```

Open <http://localhost:3000> in **Chrome** or **Edge** (voice input requires Chromium). Other browsers still work for everything except mic input — TTS playback is supported everywhere.

Login: `demo@aissisted.health` / `demo1234!`

## Walkthrough (~5 min)

### 1. Dashboard — the marquee surface (~90 s)

Land on `/dashboard`. Call out:

- **Neural AI Core** in the center. The hue, ring rotation, and orbit-dot density encode mode, confidence, and active signals. Mode is `metabolic_dysfunction` because seeded glucose has trended 92 → 108 mg/dL over three months and HbA1c moved 5.5 → 6.0% — the engine fired the `prediabetes_pattern` compound signal.
- **Five domain tiles** wrapping the core: Sleep (88%), Recovery (72%), Performance (52 ms HRV), Stress (58 bpm RHR), Stack (4 active supplements). Each has a 7-day sparkline and a source badge ("WHOOP" / "Protocol") so the data layering is honest.
- **Right rail Health State widget** — domain bars for cardiovascular, metabolic, hormonal, micronutrient, renal, inflammatory; the active signals list shows which biomarkers fired which rules.
- **Current Protocol** card lists the 3-5 supplements the engine picked.

Toggle macOS Reduce Motion (System Settings → Accessibility → Display) and reload. The Neural Core stops animating but keeps its full visual state. Toggle off again.

### 2. Jeffrey — voice + chat (~2 min)

Click "Jeffrey" in the nav. Header shows a mini neural core mirroring the user's mode and Jeffrey's live state.

- Toggle **Read replies** in the header (enables TTS playback).
- Click the **mic orb**. Say: *"Why is my glucose trending up?"*
- The textarea fills with the interim transcript; on final result, it auto-submits.
- Jeffrey responds with a paragraph grounded in the user's actual biomarker history. The mini neural core shifts through `listening` → `thinking` → `speaking` states. Reply plays through TTS.
- Click "+ New" or in the input box, type *"Build me a cognition stack"* and press Enter. Intent gets classified as `generate_protocol`; the engine regenerates the protocol; reply confirms the new stack is ready.

### 3. Stack & adherence (~60 s)

Click "My Stack" — full view of the regenerated protocol with rationale (click any card to expand) and protocol history.

Click "Adherence" — two ring widgets (week / 30-day) over the seeded 70% adherence baseline, plus today's schedule grouped by time slot. Click "Took it" on one supplement to see the score nudge live.

### 4. Labs (~45 s)

Click "Labs". Every biomarker shows status (Normal/High/Low colored), a 7-day sparkline, the trend direction (↓ worsening = signal-red, ↑ improving = aqua), and a 30-day rolling average for series with three or more readings.

### 5. Integrations (~60 s)

Click "Integrations" to see the three connectors:

- **WHOOP** — if `WHOOP_CLIENT_ID` is set in `.env`, click Connect → developer-portal login → callback returns to `/dashboard` with a "connected" badge. Click "Sync now" to pull the latest recovery, sleep, HRV, and resting-heart-rate readings.
- **Apple Health** — no credentials needed. Use a real iOS export.xml or any file that contains `<HealthData>` records.
- **Epic / MyChart (SMART on FHIR)** — set `FHIR_BASE_URL` (e.g. the public sandbox `https://launch.smarthealthit.org/v/r4/sim/` based URL) and `FHIR_CLIENT_ID`, then click Connect. Initial connect performs a full longitudinal sync, pulling Patient demographics, Conditions, MedicationRequests, AllergyIntolerances, and Observations into the same biomarker pipeline.

### 6. Profile (~30 s)

Click "Profile". The seeded user's goals (energy, longevity, cognition), conditions (prediabetes), and medications (metformin) are all editable. Changes flow into the next protocol generation.

## Reset

To reset everything to the original demo state:

```bash
pnpm seed:demo
```

The seed is idempotent — the user row is preserved (so the password stays valid), all domain data is wiped and reseeded.

## Verification commands

```bash
pnpm typecheck   # 0 errors across api + web
pnpm test        # 119 vitest tests passing
pnpm lint        # api tsc + web eslint, 0 errors
pnpm build       # production build, 14 static routes
```
