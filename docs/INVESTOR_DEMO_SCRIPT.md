# Aissisted — Investor Demo Script v0.1

**Status:** Draft skeleton. Ron to refine after dry-run.
**Length target:** 7-8 minutes (DEMO.md target = 7 min).
**Surface:** Path C — Liv (Anam Cara 3) cinematic intro → real Aissisted product walkthrough → Liv close.
**Pre-flight:** `docs/DEMO_CHECKLIST.md` sections 0-1 must pass.

---

## Opening Reset (10 seconds, before you start)

- Browser tab order: `localhost:5173` (Liv) | `app.aissisted.com/login` (or localhost:3000) | `aissisted.me/investor-room`
- Liv is in **READY** state, not streaming yet
- `pnpm seed:demo` already run — `demo@aissisted.health / demo1234!` ready
- Phone in airplane mode
- Water nearby

## Moment 1 — Liv cinematic intro (45 seconds) [Path B layer]

**Visual:** Full-screen Liv (or Jeffrey persona at `8e778d45-...`) on Clawd Face.
**Ron line:** *"Before we open the product, I want you to meet the experience."*
**Click Start.** Liv's avatar comes alive.

**Liv's pre-scripted opening (you type or speak the prompt to Claude in Liv's terminal):**
> "Welcome. I am Jeffrey — the operating intelligence of Aissisted. I learn a single person's body — through their labs, their wearables, the rhythm of how they sleep and recover — and I build what that body actually needs. Not a marketplace. Not a guess. A protocol that adapts every day. Let me show you."

**Why this works:** Sets tone (calm, British, premium). Establishes Jeffrey is the brand voice, not a chatbot. Investor's first thought: *"this feels different."*

**Risk:** Don't speak PHI. Liv is theater only. Pre-script every Liv prompt.

---

## Moment 2 — The Product, Not the Pitch (90 seconds)

**Switch tab → `localhost:3000/login` (or app.aissisted.com).**
**Ron line:** *"This is the actual product, running on real seeded data."*
**Sign in:** `demo@aissisted.health / demo1234!` (PR #67 seed) OR `ron.gibori+pilot01@aissisted.test / demo1234` (DEMO_CHECKLIST.md pilot 01).
**Land on `/dashboard`.**

**What investor sees:**
- Neural AI Core front and center, pulsing in the demo's `idle` state
- Domain tiles: Sleep, Recovery, Stress, Performance, Stack
- Real biomarkers (16 latest: 5 WHOOP + 11 lab) with sparklines
- ApoB at 92 rendering in red — a priority signal
- HealthState widget showing `metabolic_dysfunction` mode at 0.83 confidence

**Ron line:** *"Every signal here is real. Real WHOOP recovery. Real labs. Real engine output. The Neural Core isn't a vibe — it's the live state of the system. Watch what happens when I ask Jeffrey something."*

---

## Moment 3 — Jeffrey Voice in the Product (60 seconds)

**Click the VoiceOrb / open Jeffrey voice modal.**
**Neural Core transitions: idle → listening (aqua ring pulses inward).**

**Ron speaks:** *"Jeffrey, how was my recovery this week?"*

**What investor sees:**
- Core: listening → thinking (aqua signals cross-route, internal compute)
- Jeffrey speaks back, referencing **the actual seeded recovery numbers** — not generic
- Core: thinking → speaking (compression pulse, halo)
- Conversation persists — visible row in `conversations` + `messages`

**Ron line (after Jeffrey finishes):** *"That answer wasn't a template. Jeffrey pulled from this user's last 14 days of WHOOP data, scored it against personal trends, and answered in the brand voice — every time, on every surface."*

---

## Moment 4 — The Adaptive Loop (45 seconds)

**Navigate to `/protocol` or trigger `/protocol/generate`.**
**Show:** Current protocol with timing + rationale. Note `safetyStatus` on every recommendation: `allowed | warning | blocked`.

**Ron line:** *"This protocol regenerated based on last night's HRV. Adherence influenced nudge cadence. Safety pack flagged one item — caffeine timing — because the user's sleep latency is trending. The whole loop closes itself. We're not a marketplace recommending products. We're a system that gets better at one body."*

---

## Moment 5 — Investor Room (60 seconds)

**Switch tab → `aissisted.me/investor-room` (or `localhost:3000/investor-room` against site app).**

**What investor sees:**
- Hero
- Live Metrics (real numbers, not fabricated)
- Comparables row, Projections grid, Data Flywheel
- Valuation Bars
- Market Inevitability strip
- Why Now
- One-Line Punch
- Hard CTA Wrapper with allocation urgency (only renders if `seats_total/seats_filled` env set)

**Ron line:** *"Everything I just showed is in the round. The Investor Room captures intent, scores hot/warm/cold deterministically, fans out via Resend, and lands in HubSpot + Airtable in real time. If you want to dig in tonight, the founder calendar is the next click."*

**Show the InvestorCohortCTA / RequestDeckModal flow.** Don't fill in fake info — show the modal opens and what happens.

---

## Moment 6 — Liv close (30 seconds) [Path B layer]

**Switch back to Liv tab.**
**Ron line:** *"One last thing."*

**Liv's pre-scripted close:**
> "What you saw is one body — one protocol — adapting in real time. Multiply that by the people we already have on the waitlist. That's the round we're closing. The next conversation should be about your check, not our pitch. Thank you."

**Stop Liv.**

---

## Moment 7 — Q&A handoff (open-ended)

Lights up. Go to questions. Open laptop, drive whatever they want to see — the system is real, you don't need slides.

---

## Pre-demo dry run checklist

| | Item | Source |
|---|---|---|
| ☐ | All 5 must-land PRs merged (#68 → #58 → #67 → #69 → #66) | PR triage above |
| ☐ | `pnpm install && pnpm seed:demo && pnpm dev` runs clean | DEMO.md |
| ☐ | `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` all green | DEMO_CHECKLIST §4 |
| ☐ | Pilot 01 (Ron) → /dashboard renders with biomarkers | DEMO_CHECKLIST §2.7 |
| ☐ | Pilot 01 → /jeffrey-system loads, modes cycle, signals flow | DEMO_CHECKLIST §2.8 |
| ☐ | Voice modal: 2 grounded questions answered with pilot's actual data | DEMO_CHECKLIST §2.9 |
| ☐ | `/investor-room` renders with allocation urgency (or hidden if env unset) | apps/site/app/investor-room/page.tsx |
| ☐ | Liv (Clawd Face) opening + closing prompts dialed in | this script, Moments 1 + 6 |
| ☐ | Jeffrey eval suite — DNR + SR pass at 100% (zero-tolerance gates) | JEFFREY_BRAIN_ROADMAP §3 |
| ☐ | `/ultrareview` ran on PR #67's diff before merge | Aissisted stack |
| ☐ | Phone airplane mode, water, second monitor unplugged if desktop is messy | operational |

## Hard guardrails (re-stating)

- **No real PHI in Liv** — Anam servers process audio. Liv prompts must be pre-scripted with synthetic content only.
- **No ad-libbing destructive commands** to Jeffrey — Bypass Permissions is on for clawd-face folder; never extend.
- **Brand voice check** — every line above must pass `lib/brand-rules.ts` forbidden-words scan if it ends up on a public surface.
- **Two-clone protocol** — demo runs from `~/Documents/GitHub/aissisted` (canonical). Don't accidentally launch from `~/aissisted` mid-pitch.
- **Allocation urgency must reflect real seats** — never fabricate scarcity. If `seats_total/seats_filled` not set, the component renders nothing.

## Refinement loop

- v0.1 → dry run alone with timer → tighten Ron lines, drop slow moments
- v0.2 → dry run with one trusted ear (advisor / co-founder) → Q&A pressure test
- v0.3 → demo with one warm investor → real Q&A, refine
- v1.0 → cold-pitch ready
