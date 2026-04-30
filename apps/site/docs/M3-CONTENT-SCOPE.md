# M3 · Content scope (draft)

`apps/site` — investor + presentation site. Distinct from `apps/landing` (live at aissisted.me, untouched). Draft for Ron, no code. Brand Bible v1.1. Rally cry: Your Body. Understood. Pricing: $69 / $99 / $149.

---

## 1 · Page list

10 routes scaffolded. `/investor-room` fully built. Eight shells await copy. Below trims to what earns its place, adds the product pages M3 has been waiting for.

| Path | Status | Recommendation |
|---|---|---|
| `/` | EXISTS-NEEDS-CONTENT | Hero · wedge · the three Formulas · Jeffrey beat · proof · CTA |
| `/how-it-works` | EXISTS-NEEDS-CONTENT | The four-move walk: signal · interpretation · formula · evolution |
| `/morning` | NEW | Morning Formula — energy, focus, clarity start |
| `/day` | NEW | Day Formula — sustain, recovery, cognitive load |
| `/night` | NEW | Night Formula — sleep depth, repair, calm |
| `/pricing` | EXISTS-NEEDS-CONTENT | $69 / $99 / $149 ladder, freemium read, what's included |
| `/jeffrey` | NEW | The persona surface — what Jeffrey is, how he speaks, what he won't do |
| `/about` | NEW | Founder posture, belief, the team, why now |
| `/request-access` | EXISTS-NEEDS-CONTENT | Invite-code path, the freemium read |
| `/legal/privacy`, `/legal/terms` | NEW | Required for commercial launch |
| `/investor-room` | EXISTS-DONE | Untouched — v6 ships |
| `/for-you`, `/science`, `/faq`, `/longevity`, `/contact` | RETIRE/FOLD | Into `/`, `/how-it-works`, `/pricing`, `/request-access` |

Net: 5 keeps · 5 retires · 7 new · 1 done.

---

## 2 · Per page — sections, copy, components, SEO

### `/` Home

**Sections:** Hero (rally cry) · Wedge · Three Formulas preview · Jeffrey beat · Proof · CTA.

> *Hero.* Your Body. Understood.
> A formula built from your data. Refined by intelligent science. Yours alone.
> *Wedge.* The supplement shelf was built on averages. You aren't one. Aissisted listens to your biology, reads your data, and designs a formula that adapts as you do.
> *Formulas preview.* Three formulas. One system. Morning to start, Day to sustain, Night to repair — each one shaped to what your body asked for this week.
> *Jeffrey beat.* Jeffrey is the quiet intelligence behind it. He answers questions, explains adjustments, and never speaks louder than the science requires.
> *CTA.* Request your invitation.

**Components:** `<RallyCry />`, `<H2>`, `<Lede>`, `<Body>`, three `<Card>`s, `<JeffreyText>`, `<Button variant="primary">`. **Image:** hero (brand red on "Understood." only); three Formula stills. **SEO:** *Aissisted — Your Body. Understood.* / *Built from your data. Refined by intelligent science. A formula that adapts as you do.*

### `/how-it-works`

**Sections:** Signal · Interpretation · Formula · Evolution · Safety footnote.

> *Signal.* Your wearable. Your bloodwork. Your habits. The body is already speaking — Aissisted reads what was always there.
> *Interpretation.* Your data is read against the science we trust: peer-reviewed evidence, clinical reference ranges, established interactions. Nothing decorative.
> *Formula.* From that reading, a precise formula. Designed for your body, in this season, under these conditions.
> *Evolution.* You re-test. The wearable updates. The formula evolves. The system learns you, week by week.
> *Footnote.* Aissisted is a supplement system, not medical advice. We flag interactions, escalate red flags, and stay inside what the evidence supports.

**Components:** `<H2>`, `<Lede>`, `<Body>`, `<Divider>`, `<Pill>`. **Image:** four-step diagram (aqua for data only). **SEO:** *How Aissisted works* / *Signal. Interpretation. Formula. Evolution. Built from your data, refined as you change.*

### `/morning`, `/day`, `/night`

Same template per page: What it does · What's inside · Who it's for · What changes when your data does.

> *Morning.* Designed for the first hours — clarity, energy, a clean start. Adjusted as your sleep, training load, and bloodwork tell us to. Yours alone.
> *Day.* Designed for sustain — focus through cognitive load, recovery between sessions, steady through what the day demands. Adjusted as your week unfolds.
> *Night.* Designed for repair — depth of sleep, parasympathetic ease, the quiet work the body does in the dark. Adjusted as your recovery scores move.

**Components:** `<H1>`, `<Lede>`, `<Card>` ingredient panel, `<DataValue>` adjustment cadence, `<Button>`.
**Image asks:** one product still per page; soft natural light.
**SEO:** *[Morning|Day|Night] Formula — Aissisted*; descriptions echo opener.

### `/pricing`

**Sections:** Three tiers · Always included · Freemium read · FAQ (folded from old `/faq`).

> One Formula · $69 / month. Two Formulas · $99 / month. All three · $149 / month.
> Every tier includes adaptive re-formulation, Jeffrey, lab-import, wearable sync, and shipping.
> Aissisted is free to try. The conversation, the lab read, your first protocol design — all yours before any payment moves. You only pay when a formula is shipped.

**Components:** Three `<Card>`s, `<DataValue>`, `<UILabel>`, `<Pill variant="signal">` on recommended tier. **SEO:** *Pricing — Aissisted* / *$69, $99, or $149. Adaptive formulas, Jeffrey, lab-import, shipping. Free to try.*

### `/jeffrey`

**Sections:** What he is · How he speaks · What he will not do · Short transcript.

> Jeffrey is the voice of the system. Calm. Precise. Quiet by default. He explains what your formula does, why it changed, and what your data is saying. He answers questions in the register of someone who has read the science. He does not diagnose, prescribe, or pretend certainty he has not earned. When the question outruns him, he routes you to the founder.

**Components:** `<JeffreyText>`, `<JeffreySystem>`, `<PullQuote>`, `<Divider>`. Typographic page, no imagery. **SEO:** *Jeffrey — the voice of Aissisted* / *Calm. Precise. Quiet by default.*

### `/about`

**Sections:** Belief · Founder posture (carries from investor room) · Team · Why now.

> *Belief.* No two bodies are the same, and no two formulas should be either. We are building the operating system for one person's biology, and the discipline to keep it honest.
> *Why now.* Wearable signal is dense, lab access is open, and the science of personalization has finally caught up to its language. The shelf has not. We are.

**Components:** `<H2>`, `<Lede>`, `<ValueProp>` (one accent), `<Body>`. **Image:** founder portrait; team grid placeholder. **SEO:** *About — Aissisted* / *A formula built from your data. A discipline built on the science.*

### `/request-access`

**Sections:** What you get · Invite-code field · Freemium promise · What happens next.

> A private invitation to design your formula. Connect your wearable. Bring your last labs. Talk with Jeffrey. Your first protocol is yours to keep — paid only if you choose to ship it. Enter your invite code below, or join the wait, and we will write when a seat opens.

**Components:** `<LeadCaptureForm>`, `<UILabel>`, `<Button>`, `<JeffreySystem>`. **SEO:** *Request access — Aissisted* / *A private invitation. Free to design. Paid only when a formula ships.*

### `/legal/privacy`, `/legal/terms`

Standard. Counsel-drafted; surface uses `<Body>`, `<H2>`, `<Container width="reading">`. See open question 5.

---

## 3 · Forbidden-words check

Ran the v1.1 list (`lib/brand-rules.ts` → `FORBIDDEN_WORDS`) against every drafted copy block above. **0 hits.** Repeated owned language: *Yours, Built, Designed, Understood, Precision, Adaptive, Evolving, Simple, Clear, Intelligent, Effortless.*

## 4 · Brand canon check

- **Rally cry** once, on `/` only, via `<RallyCry />`. Footer runs `muted` elsewhere.
- **Palette** — brand red on "Understood." and the primary CTA per hero. Aqua reserved for data. Midnight stays inside `/investor-room` and `<JeffreyDock />`.
- **Voice** — calm/clear/assured default; inspirational beat on `/`; functional on `/pricing` + `/request-access`; conversational in Jeffrey lines.
- **Investor lock** — no raise size, band, or valuation language anywhere on the public surface.

## 5 · Open questions for Ron

1. **Three Formula pages, or fold into `/pricing`?** I recommend three pages — they earn the surface, give SEO a target per Formula, and let asset asks be specific. Confirm before commitment.
2. **Drop `/for-you`, `/science`, `/faq`, `/longevity`, `/contact` permanently?** Recommend yes; value folds into `/`, `/how-it-works`, `/pricing`, `/request-access`. Need explicit kill before route deletion.
3. **Freemium phrasing** — is "free to design, pay only when a formula ships" the canonical line, or do you want a tighter version owned across `/`, `/pricing`, `/request-access`?
4. **Jeffrey on the public surface** — live console (investor-room treatment), transcript only, or text-only? Affects M10.
5. **Legal copy** — counsel-drafted, or should I stage industry templates marked for legal review?

## 6 · PR breakdown — shell-first, then page-by-page

1. **Shell + retire.** Nav, footer, route list. Retire 5 routes (301 to nearest kept page). Empty shells for the 7 new routes.
2. **`/`** — hero, wedge, Formulas preview, Jeffrey beat, proof, CTA.
3. **`/how-it-works`.**
4. **`/morning`, `/day`, `/night`** — one PR, shared template.
5. **`/pricing`.**
6. **`/jeffrey` + `/about`.**
7. **`/request-access` + `/legal/*`.**

**Why not a mega-PR.** Each page carries its own brand-canon review — palette, forbidden-words, rally-cry integrity, motion. Mega-PRs blur those checks. Shell-first lands nav cleanly so the rest are pure content diffs. Each PR reversible.

## 7 · Out of scope

Wearable UI · FHIR · auth · admin · ingestion · `/investor-room` · `apps/landing` · Jeffrey wiring (M10) · HubSpot (M12) · session HMAC (M7) · brand audit (M13).
