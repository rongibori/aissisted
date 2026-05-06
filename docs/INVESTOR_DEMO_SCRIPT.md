# Aissisted — Investor Pitch Architecture v0.2

**Status:** v0.2 — integrated slides + live product + Liv bookends. Refined after master deck v3 landed.
**Owner:** Ron Gibori
**Master deck:** `docs/decks/AISSISTED_Investor_Presentation_Master_v3.md` (36 slides + appendices)
**Pre-flight:** `docs/DEMO_CHECKLIST.md` sections 0-1 must pass.

---

## Three pitch lengths

| Length | Use | Slides | Live product moments | Liv bookends | Total time |
|---|---|---|---|---|---|
| **Full pitch** | Cold investor, first meeting, no prior context | All 36 | 3 (Dashboard, Jeffrey voice, Investor Room) | Optional opening + close | 25–30 min |
| **Short pitch** | Warm investor, second meeting, deck already seen | Highlights: 1, 2, 7, 11, 14, 20, 22, 23, 24, 31, 33, 36 | 2 (Jeffrey voice + Investor Room) | Optional close | 12–15 min |
| **Live demo only** | Diligence, post-pitch, "show me it works" | None | All 5 (per original v0.1 script) | Optional bookends | 7–8 min |

---

## Architecture — the slide arc + live moment insertion points

The master deck has **5 narrative acts**. Live product moments slot in at the seams.

### Act I — Belief (Slides 1–9, ~5 min)
Problem, market shift, why now, solution, how it works, product experience.
**Goal:** investor leans forward.

### Act II — Economics (Slides 10–13, ~3 min)
Business model, market opportunity, traction trajectory, unit economics.
**Goal:** investor sees the math.

→ **🎬 LIVE MOMENT 1 — Dashboard + Neural Core** (90 sec)
Insert AFTER slide 13. The slide says "Daily habit creates high retention." Now prove it.
*See "Live Moment 1" section below.*

### Act III — Differentiation (Slides 14–15, ~3 min)
Why we win, competitive landscape.
**Goal:** investor stops comparing us to Ritual / Care/of.

→ **🎬 LIVE MOMENT 2 — Jeffrey voice grounded** (60 sec)
Insert AFTER slide 15. Slide 15's claim: "We personalize continuously." Prove it.
*See "Live Moment 2" section below.*

### Act IV — Pattern Recognition (Slides 16–23, ~5 min)
Validated playbook (Hims, Function of Beauty, Care/of, Curology), how winners are built, valuation narrative.
**Goal:** investor pattern-matches us to billion-dollar exits.

### Act V — Expansion (Slides 24–32, ~5 min)
"And then... Peptides", expansion thesis, data flywheel, true endgame.
**Goal:** investor sees the platform, not the product.

→ **🎬 LIVE MOMENT 3 — Investor Room** (60 sec)
Insert AFTER slide 31 (Data Flywheel). Show the conversion system is live, scoring real, capturing intent in real time.
*See "Live Moment 3" section below.*

### Act VI — The Ask (Slides 33–36, ~3 min)
Use of funds, Series A readiness, vision, close.
**Goal:** investor asks "what's the wire instructions."

---

## OPTIONAL — Liv bookends (Path C theater layer)

Use only if you have screen real estate and 60 extra seconds. Otherwise skip.

### 🎭 LIV OPENING (45 sec) — before Slide 1
**Visual:** Full-screen Liv (Anam Cara 3) on Clawd Face. Persona: your Jeffrey Assistant (`8e778d45-4e52-4580-b241-566b660dfcc4`).
**Ron line:** *"Before we open the deck, I want you to meet the system."*
**Click Start in Clawd Face.**
**Pre-scripted Liv prompt (you type into Liv's terminal):**
> "Welcome. I am Jeffrey — the operating intelligence of Aissisted. I learn a single person's body — their labs, their wearables, the rhythm of how they sleep and recover — and I build what their body actually needs. Not a marketplace. Not a guess. A protocol that adapts every day. Let me show you."
**Why this works:** sets the brand register before the deck. Investor's first impression: *"This feels different."*

### 🎭 LIV CLOSE (30 sec) — after Slide 36
**Switch back to Liv tab.**
**Ron line:** *"One last thing."*
**Pre-scripted Liv close:**
> "What you saw today is one body — one protocol — adapting in real time. Multiply that by the people we already have on the waitlist. That is the round we are closing. The next conversation should be about your check, not our pitch. Thank you."
**Stop Liv.**

**Hard guardrail:** never speak PHI through Liv. Anam servers process audio. Demo-only until BAA signed.

---

## 🎬 LIVE MOMENT 1 — Dashboard + Neural Core

**Insertion point:** after Slide 13 (Unit Economics).
**Time budget:** 90 seconds.

**Ron transition line:**
> *"Slide 13 says 'daily habit creates high retention'. That's a claim. Let me show you the daily habit."*

**Switch tab → http://localhost:3000/login**
- Sign in: `demo@aissisted.health / demo1234!` (PR #67 seed) OR `ron.gibori+pilot01@aissisted.test / demo1234`
- Land on `/dashboard`

**What investor sees (annotate as you go):**
- Neural AI Core front and center, idle pulse
- Domain tiles: Sleep / Recovery / Stress / Performance / Stack
- 16 latest biomarkers with sparklines (5 WHOOP + 11 lab)
- ApoB at 92 in red (priority signal)
- HealthState widget: `metabolic_dysfunction` mode at 0.83 confidence

**Ron callouts (~3 of these, not all):**
- *"Every signal here is real seeded data. Real WHOOP recovery. Real labs. Real engine output."*
- *"The Neural Core isn't a vibe. It's the live state of the system — listening, thinking, speaking. You'll see it react in a moment."*
- *"This screen is the daily habit. Open it in the morning, glance at the protocol, take the dose, close it. That's the loop slide 9 promised."*

**Return to deck on Slide 14.**

---

## 🎬 LIVE MOMENT 2 — Jeffrey voice grounded

**Insertion point:** after Slide 15 (Competitive Landscape).
**Time budget:** 60 seconds.

**Ron transition line:**
> *"Slide 15's claim is 'we personalize continuously'. Watch the difference between continuous and a quiz."*

**On the Aissisted dashboard, click VoiceOrb / open Jeffrey voice modal.**
- Neural Core: idle → listening (aqua ring pulses inward)

**Ron speaks (live, not pre-recorded):** *"Jeffrey, how was my recovery this week?"*

**What investor sees:**
- Core: listening → thinking (aqua signals cross-route, internal compute)
- Jeffrey speaks back **referencing the actual seeded recovery numbers** — not a template
- Core: thinking → speaking (compression pulse + halo)
- Conversation persists (visible in `conversations` + `messages` tables)

**Ron callout after Jeffrey finishes:**
> *"That answer wasn't a template. Jeffrey pulled this user's last 14 days of WHOOP data, scored against personal trends, and answered in the brand voice — every time, on every surface."*

**Return to deck on Slide 16.**

---

## 🎬 LIVE MOMENT 3 — Investor Room (live conversion system)

**Insertion point:** after Slide 31 (Data Flywheel).
**Time budget:** 60 seconds.

**Ron transition line:**
> *"The flywheel slide just said 'every customer makes the system smarter.' The Investor Room is the same flywheel applied to capital."*

**Switch tab → http://localhost:3001/investor-room**

**What investor sees (point + click through):**
- Hero
- Live Metrics — real numbers, not fabricated
- Big Stat
- Comparables row, Projections grid, Data Flywheel diagram
- Valuation Bars
- Market Inevitability strip
- One-Line Punch
- Founder Posture
- Hard CTA Wrapper with allocation urgency (only renders if `seats_total/seats_filled` env set — never fabricated)

**Ron callout:**
> *"Every interaction here scores hot/warm/cold deterministically — that's the `lib/investor-scoring` module. Captures fan out via Resend, land in HubSpot + Airtable in real time. The room itself is the same data flywheel logic, applied to the round."*

**Show the InvestorCohortCTA / RequestDeckModal flow.** Don't fill in fake info — show the modal opens and what happens.

**Return to deck on Slide 32.**

---

## Spoken bridges (Ron lines per slide group)

These are connective tissue — the lines that make slide transitions feel cinematic, not academic.

### Between Act I and Act II (Slide 9 → Slide 10)
> *"Slide 9 was the experience. Slide 10 is the math behind why it compounds."*

### Between Act II and Live Moment 1 (Slide 13 → Live)
> *"Slide 13 says 'daily habit creates high retention'. That's a claim. Let me show you the daily habit."*

### Between Act III and Live Moment 2 (Slide 15 → Live)
> *"Slide 15's claim is 'we personalize continuously'. Watch the difference between continuous and a quiz."*

### Between Act IV and Act V (Slide 23 → Slide 24)
> *"Slide 23 stops at $10 billion. There's a reason it stops there — and a reason it doesn't end there."*
> [Pause for Slide 24 — "And then... Peptides"]

### Between Slide 24 and 25 (the pivot)
> *"This is the moment most supplement companies don't survive. We started here because we built for it."*

### Between Slide 31 and Live Moment 3
> *"The flywheel slide just said 'every customer makes the system smarter'. The Investor Room is the same flywheel applied to capital."*

### Between Slide 32 and 33 (vision → ask)
> *"That's the destination. This is the round that gets us there."*

### Final close (after Slide 36)
> [If using Liv close, transition: "One last thing."]
> [Otherwise:] *"Three things you should know walking out of this room. We're a system, not a supplement. Every winner in adjacent categories used this exact playbook. The seed proves it; the Series A wins it. Thank you."*

---

## Pre-pitch checklist (combined: dev + script + brand)

| | Item | Source |
|---|---|---|
| ☐ | All 5 must-land PRs merged (#68 → #58 → #67 → #69 → #66) | PR triage, Aissisted stack |
| ☐ | Aissisted dev servers running: web :3000, site :3001, api :4000 | confirmed live in this session |
| ☐ | `pnpm seed:demo` ran clean — `demo@aissisted.health` exists with rich biomarker history | DEMO.md from PR #67 |
| ☐ | DB migration warning resolved (`db:generate` + `db:push`) | this session note |
| ☐ | `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` all green | DEMO_CHECKLIST §4 |
| ☐ | Pilot 01 → /dashboard renders; Neural Core animates | DEMO_CHECKLIST §2.7, §2.8 |
| ☐ | Voice modal: 2 grounded questions answered with pilot's actual data | DEMO_CHECKLIST §2.9 |
| ☐ | `/investor-room` renders with allocation urgency (or hidden if env unset — NEVER fabricated) | apps/site/app/investor-room/page.tsx |
| ☐ | Liv (Clawd Face) opening + closing prompts dialed in (only if using bookends) | this script |
| ☐ | Jeffrey eval suite — DNR + SR pass at 100% | JEFFREY_BRAIN_ROADMAP §3 |
| ☐ | `/ultrareview` ran on PR #67 before merge | Aissisted stack |
| ☐ | Master deck (`docs/decks/AISSISTED_Investor_Presentation_Master_v3.md`) finalized in Claude Design per the design rules at end of file | master deck |
| ☐ | Forbidden-words scan on every slide + spoken line passes 0 hits | `apps/site/lib/brand-rules.ts` |
| ☐ | Phone airplane mode, water nearby, second monitor unplugged if desktop is messy | operational |

---

## Brand voice check — every spoken line

The master deck specifies design rules but the **spoken** layer needs the same discipline. Apply this filter to every Ron line in this script before delivery:

- **Voice register:** confident, calm, declarative. No hedges ("kind of", "I think", "maybe").
- **Tense:** present tense for what exists, future tense ONLY for the seed → Series A arc.
- **Forbidden words check:** run `apps/site/lib/brand-rules.ts` against every line in this doc before pitch day.
- **Clarity:** every claim either has a number, a name, or a working demo behind it. Strip vague claims.
- **British register reminder for Liv:** Received Pronunciation, male, lower register, "senior London physician at end of rounds" energy.

---

## Surface map — what's open in which window during the pitch

```
Window 1 (primary):   Slides (Keynote / Claude Design / web)
Window 2 (live):      Three browser tabs:
                        Tab A — http://localhost:3000/dashboard  (logged in as pilot 01)
                        Tab B — http://localhost:3001/investor-room
                        Tab C — http://localhost:5173 (Clawd Face / Liv) — only if using bookends
Window 3 (escape):    Terminal with `tail -f /tmp/aissisted-dev.log` (in case anything dies)
```

**Switch via Cmd+Tab + Cmd+\` — practice the muscle memory in dry run.**

---

## Refinement loop

| Stage | What | Who | Goal |
|---|---|---|---|
| **v0.2 (now)** | Slides + live + Liv bookends integrated | This document | Architecture set |
| **v0.3** | Solo timed dry run with stopwatch on each act | Ron alone | Tighten Ron lines, kill slow moments, lock surface transitions |
| **v0.4** | Dry run with one trusted ear | Ron + advisor / co-founder | Pressure test Q&A, verify deck flow, refine |
| **v0.5** | Demo with one warm investor | Ron + warm investor | Real Q&A patterns, refine objection handling |
| **v1.0** | Cold-pitch ready | — | Lock for the round |

---

## Quick reference — slide → live moment cross-walk

| Slide | Claim | Live proof |
|---|---|---|
| 7 (Solution) | "AI builds your formula. Data evolves it." | Live Moment 1: dashboard shows engine-generated protocol |
| 9 (Product Experience) | "Daily ritual" | Live Moment 1: dashboard is the daily ritual surface |
| 13 (Unit Economics) | "Daily habit supports retention" | Live Moment 1: investor sees the habit |
| 14 (Why We Win) | "Adaptive AI personalization" | Live Moment 2: Jeffrey grounded answer |
| 15 (Competitive Landscape) | "We personalize continuously" | Live Moment 2: voice + per-user grounding |
| 31 (Data Flywheel) | "Every customer makes the system smarter" | Live Moment 3: Investor Room is the meta-flywheel |
| 32 (True Endgame) | "Personal operating system" | Live Moment 1+2 already proved this is being built |

---

## Things this document deliberately does NOT do

- Does not duplicate the master deck content. The deck is canonical at `docs/decks/AISSISTED_Investor_Presentation_Master_v3.md`. This script is the **delivery layer** on top of it.
- Does not script every word. The Ron lines are scaffolding. Discover your voice in the dry run.
- Does not over-engineer the Liv bookends. They're optional and additive. If they slow the deck or fail, drop them.
- Does not fabricate metrics. Every number in the deck and in the live demo must be traceable to the seed data, the engine, or the cohort. If a number isn't real, cut it.
