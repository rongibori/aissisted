# Aissisted — BAA Inventory

**Date:** 2026-04-21
**For:** Ron
**Roadmap ID:** S-17
**Status:** Planner's best read. Every row marked `VERIFY` needs the vendor to confirm in writing before you treat it as fact. BAAs change — training data is not a contract.

---

## Tension

You're standing up vendors today. The tier you pick is not just a cost decision — it gates whether that vendor can legally touch PHI when the first user drops a lab report in. Pick wrong and you rebuild in six months.

## Truth

Aissisted's posture is **"HIPAA+wellness"** — we act HIPAA-compliant while not claiming the regulated category publicly until every vendor touching PHI is covered by a BAA. Today we have zero executed BAAs. The runbook assumes they exist.

## Shift

Before provisioning, run the vendor tier through this table. If you're on a tier that doesn't offer a BAA, either upgrade the tier or don't send PHI to that surface.

---

## Inventory

Every vendor that Aissisted's stack touches, grouped by PHI exposure.

### Tier 1 — Direct PHI storage or transit

These vendors receive biomarker values, symptoms, clinical context, or longitudinal health data. BAA is a hard requirement before any real user.

| Vendor | Role | BAA posture (VERIFY) | Minimum tier | Notes |
| --- | --- | --- | --- | --- |
| **OpenAI** | Every Jeffrey surface (chat, Realtime voice, intent, protocol synthesis) | Offered via Enterprise + Zero Data Retention arrangement | Not the default platform API — requires separate BAA contract + ZDR toggle | Realtime is the newer surface — confirm the BAA explicitly covers Realtime, not just Chat Completions / Responses. `docs/deployment.md §11` already flags this. |
| **Neon** | Postgres hosting — stores profiles, biomarkers, protocols, memory, audit log | Offered on paid tiers | **Not Free tier.** Scale plan or higher historically required for BAA. | Ohio region (default) is fine for US HIPAA. Check encryption at rest is on (default). |
| **Render** | Hosts `apps/api` — all traffic transits, logs include request metadata | Offered on business/enterprise plans | **Not Starter ($7/mo).** Team plan ($19/user/mo) or higher. | Check: can you get a BAA on Team without upgrading to Enterprise? If not, Enterprise is ~$250/mo + sales call. |
| **ElevenLabs** | TTS relay — receives text strings that may contain health content | Historically NOT offered on standard plans | VERIFY — may not be available at all | **If no BAA available**: strip PHI server-side before sending text to ElevenLabs, OR disable voice for anyone typing health content, OR switch to OpenAI TTS (covered under OpenAI BAA). |

### Tier 2 — Indirect PHI exposure

These vendors may incidentally capture PHI in logs, crashes, or runtime artifacts. BAA is strongly recommended; strict configuration can reduce exposure.

| Vendor | Role | BAA posture (VERIFY) | Minimum tier | Notes |
| --- | --- | --- | --- | --- |
| **Vercel** | Hosts `apps/web` — server logs, edge functions | Offered on Enterprise only | **Not Pro.** Enterprise tier (~$20k/yr floor, sales-gated) historically. | If Vercel Enterprise is not happening yet, lock down: no server-side PHI in Next.js route handlers, no PHI in URL params, minimal edge runtime usage. Keep the PHI-heavy surface on `apps/api` (Render) where the BAA lives. |
| **Sentry** | Error reporting (once F-5 ships) | Offered on Business plan and above | **Not Developer/Team free tiers.** Business ($26/mo) historically required. | Configure `beforeSend` to scrub message bodies; mark events with `user.id` only, never email or name. |

### Tier 3 — Upstream sources (covered by their own posture)

These send data TO Aissisted. The BAA question inverts — they are the covered entity or their own HIPAA-compliant service, and Aissisted is the business associate of the user.

| Vendor | Role | BAA relevance | Notes |
| --- | --- | --- | --- |
| **Epic / MyChart (SMART on FHIR)** | Patient-mediated data export from Epic health system | Not an Aissisted BAA; user consents via Epic OAuth | Epic's App Orchard review is the real gate here. Consent flow must capture that Aissisted receives PHI and the user understands the scope. |
| **WHOOP** | Wearable API — receives no PHI from us; sends biometric data | No BAA needed (WHOOP is not a covered entity; biometric data is not PHI until combined with identifying medical context inside Aissisted) | The moment it enters Neon it becomes PHI under our posture. |
| **Apple Health** | User-mediated export.zip upload | No BAA needed on the Apple side | Treat incoming data as PHI from the first byte stored. |

### Tier 4 — No PHI exposure

No action required, documented for completeness.

| Vendor | Role | Why no BAA |
| --- | --- | --- |
| **HubSpot** (investor pipeline, apps/site) | Investor + lead CRM only | Never touches patient data |
| **Resend/Loops/Postmark** (whichever ships for S-4) | Transactional email | Should ship with no PHI in email body — magic-link only. Verify the copy when S-4 lands. |
| **Stripe** (S-1) | Billing | No PHI by design; account metadata only. Still warrants a BAA if you want the safest posture (Stripe does offer one). |
| **GitHub, pnpm, npm** | Code + deps | No user data transits |

---

## System — the operational posture

```
            PHI touches:           BAA required:
            ───────────            ─────────────
User ───► apps/web (Vercel) ───► apps/api (Render) ───► Neon Postgres
             │                         │                      │
             │                         ├──► OpenAI (Jeffrey)   │
             │                         ├──► ElevenLabs (TTS)   │
             │                         └──► Sentry (errors)    │
             │                                                 │
             └──► Static pages, public copy ── no PHI ──────────┘
```

Every arrow into a Tier 1 or Tier 2 vendor needs a BAA. If one is missing, either (a) upgrade the tier, (b) swap the vendor, or (c) strip PHI before it crosses the arrow.

---

## Outcome — what changes in vendor setup today

This memo should change three decisions in `AISSISTED_VENDOR_SETUP_WEEK1.md`:

1. **Neon tier** — do NOT provision on Free tier if you intend to launch to a real user this quarter. Either pay for Scale ($19/mo base) or stand up on Free with an explicit "pre-BAA dev only" label and migrate before launch.
2. **Render tier** — Starter ($7/mo) is fine for the Week 1 deploy if it's internal only. Schedule the upgrade to Team/Enterprise + BAA request **before** your first external user sees `/jeffrey-live` with their own data.
3. **Vercel Enterprise gate** — if this is financially out of reach right now, gate around it: no PHI-processing logic in Next.js server components or route handlers. All PHI handling on `apps/api` where Render's BAA covers it. This is an architectural constraint, not just an ops note.

---

## Ownership — the BAA request queue

This is Ron's to drive. Executor can't email vendors.

**Send these four emails this week (templates below):**

### 1. OpenAI
```
Subject: BAA request — aissisted.com — confirmation of Realtime scope

Hi,

Aissisted is a health-data platform preparing for HIPAA-covered deployment.
We use the OpenAI API for chat, embeddings, and Realtime voice.

Please send:
1. Current BAA template for our org
2. Explicit confirmation that the BAA covers the Realtime WebSocket API,
   not only Chat Completions / Responses
3. Zero Data Retention arrangement for our org-id

Org ID: [paste from platform.openai.com]
Contact: rongibori@gmail.com

Ron Gibori, Founder
```

### 2. Render
```
Subject: BAA request for aissisted.com — tier requirement

Hi,

We're deploying a HIPAA-bound Fastify API on Render.

Please confirm:
1. The minimum Render tier that includes BAA execution
2. Whether a BAA is available on your Team plan, or only Enterprise
3. Standard timeline from request to executed BAA

Ron Gibori
```

### 3. Neon
```
Subject: BAA availability + DB region for aissisted.com

Hi,

Planning to host PHI in a Neon Postgres project for aissisted.com.

Please confirm:
1. BAA availability on Scale plan (or your current minimum tier)
2. US East (Ohio) region is the best match for HIPAA US-data-residency posture

Ron Gibori
```

### 4. Vercel
```
Subject: Enterprise + BAA for aissisted.com

Hi,

Assessing Vercel for production hosting of apps/web on aissisted.com.
Our architecture routes PHI through a Fastify API on a separate host; the
Next.js app does minimal server-side PHI handling by design.

Please confirm:
1. Whether BAA is available on any tier below Enterprise
2. If Enterprise is required, current pricing floor + BAA timeline

Ron Gibori
```

### 5. ElevenLabs (optional, depending on BAA outcome above)
```
Subject: HIPAA / BAA posture for voice synthesis

Hi,

aissisted.com uses ElevenLabs for supplemental TTS beyond OpenAI Realtime.

Please confirm:
1. BAA availability on any current tier
2. If not available, your recommended approach for HIPAA-bound customers

Ron Gibori
```

---

## What the Planner does with the responses

Send me every vendor reply (forward or paste). I'll update this memo and turn it into the `docs/compliance/baa-inventory.md` canonical at the point where every row has a verified status. Until then, this stays an untracked working document.

## Reality check — three risks to name

1. **Vercel Enterprise cost shock.** A $20k/yr floor is not Week 1 money. The architectural fix (zero PHI in Next.js server code) is real work — don't assume it's free.
2. **ElevenLabs gap.** If no BAA path exists, the voice experience Jeffrey was designed around may need to swap to OpenAI TTS, which is covered but sounds different. Product decision, not just a compliance one.
3. **Time-to-BAA is weeks, not days.** You can provision everything today on dev-tier, but first external user launch is gated on the slowest BAA to execute. Start the emails today even if you aren't upgrading tiers today.

---

## Checklist for when every row is resolved

- [ ] OpenAI BAA executed + ZDR confirmed + Realtime in scope
- [ ] Neon on BAA-eligible plan + executed
- [ ] Render on BAA-eligible plan + executed
- [ ] Vercel: either Enterprise BAA executed OR architectural PHI-free-web commitment documented
- [ ] Sentry on BAA-eligible plan + executed + `beforeSend` scrubbing live
- [ ] ElevenLabs: BAA executed OR swap-out decision logged + protocol updated
- [ ] `docs/compliance/baa-inventory.md` committed with verified status
- [ ] Every `.env.example` entry for PHI-touching vendors has a BAA-status comment
- [ ] Medical advisory board formalization tracker updated with "BAAs complete" milestone
