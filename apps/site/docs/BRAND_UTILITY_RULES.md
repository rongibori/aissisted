# apps/site · Brand utility rules

Living reference for reviewers. Updated alongside primitive changes.
Source of truth for palette budget, typography role mapping, forbidden
utilities, and rally-cry integrity.

**Version:** M2 · 2026-04-18
**Brand Bible:** v1.1 (locked)

---

## 1 · 70/20/8/2 palette budget

Every public page must visually respect this ratio. Measured at a glance —
not pixel-precise, but any page that feels off this split is wrong.

| Band         | Weight | Intent                              | Tokens                                           |
|--------------|--------|-------------------------------------|--------------------------------------------------|
| Neutral      | 70%    | Surface + ink                       | `--color-surface`, `--color-ink`                 |
| Secondary    | 20%    | Supporting structure                | `--brand-midnight` (investor), `--color-muted`   |
| Data         | 8%     | Data affordances, system cues       | `--color-data` (aqua)                            |
| Signal       | 2%     | Rally cry, primary CTA, one beat    | `--color-brand` (brand red)                      |

**Investor Room deviation (approved):** midnight may run +10pp. So investor
surfaces read ~60/30/8/2. Public pages stay strict.

**Checklist per page:**

- One primary CTA per hero beat (signal band).
- Brand red appears at most twice per viewport.
- Aqua is reserved for data/metric values, focus rings, system dots.
- Midnight is reserved for investor surfaces + the Jeffrey dock.
- No decorative color. If a color isn't earning meaning, it's wrong.

---

## 2 · Typography role mapping

Locked by Ron 2026-04-18. Do not invent new roles — if a layout demands a
new voice, escalate; do not hand-roll a new weight/tracking combo inline.

| Role                      | Family         | Weight    | Notes                              |
|---------------------------|----------------|-----------|------------------------------------|
| H1                        | IBM Plex Sans  | 700       | `tracking-[-0.01em]` · `leading-[1.05]` |
| H2                        | IBM Plex Sans  | 700       | `tracking-[-0.01em]` · `leading-[1.1]` |
| H3                        | IBM Plex Sans  | 600       | `tracking-[-0.01em]` when ≥48px    |
| H4                        | IBM Plex Sans  | 600       | `tracking-[-0.005em]` when ≥48px   |
| Body prose                | IBM Plex Sans  | 400       | `leading-[1.6]`                    |
| Lede                      | IBM Plex Sans  | 400       | one size up from body              |
| UI label                  | IBM Plex Mono  | 500       | uppercase · `tracking-[0.18em]`    |
| Data value                | IBM Plex Mono  | 600       | tabular numerics                   |
| Emotional accent          | IBM Plex Serif | 400/600   | italic · one beat per page max     |
| Jeffrey prose             | IBM Plex Sans  | 400       | locked deviation from "AI = mono"  |
| Jeffrey system affordance | IBM Plex Mono  | 400       | dock status, timestamps            |

**Usage rule:** always import a role helper from `@/components/typography`.
Never hand-wire `font-display`, `font-system`, or `font-accent` alongside a
bespoke weight/size combo at the call site.

---

## 3 · Rally cry integrity

The rally cry is `Your Body. Understood.` — **period**, not comma, not em-dash.

- Only use the `<RallyCry />` component. It calls `assertRallyCry` which
  throws in dev on any drift.
- Never underline, italicize, or all-caps the rally cry.
- One rally cry per page. Footer suppresses its closer when the page hero
  already used one — pass `<Footer muted />`.
- The "Understood." clause takes `--color-brand` — that is the 2% signal.
  Do not move brand red onto the first clause.

---

## 4 · Forbidden words

Brand Bible v1.1 rejects these on sight. Reviewer fails the PR on any
occurrence in user-facing copy. Programmatic source of truth:
`@/lib/brand-rules` → `FORBIDDEN_WORDS`.

- users
- customers
- consumers
- revolutionary
- cutting-edge
- miracle
- cure
- game-changer
- unlock
- next-level
- hack
- powered by AI
- AI-driven

**Investor-specific lock:** no raise size, band, or valuation copy —
anywhere. Not even in the Investor Room. Jeffrey routes raise intent to
the founder-meeting ask.

---

## 5 · Forbidden utilities

These Tailwind patterns break brand discipline. Reviewer blocks them on sight.

### Color

- `bg-red-500`, `text-red-500`, any raw Tailwind palette name.
  → Use token-backed utilities: `bg-brand`, `text-ink`, `text-data`.
- Inline hex values in `style` props.
  → Use CSS custom properties via `bg-[color:var(--brand-midnight)]` only
  where semantic tokens don't yet exist.
- Gradients with brand red (`bg-gradient-to-r from-brand to-data`).
  → Brand red is a flat signal, never a decorative wash.

### Typography

- `font-bold` / `font-semibold` without a role helper.
  → Compose via `<H1 />`, `<UILabel />`, etc.
- Mixed `font-serif` inline outside `<ValueProp />` or `<PullQuote />`.
- ALL CAPS on body copy.
  → Uppercase is reserved for UI labels at tracking `0.16–0.18em`.

### Motion

- `animate-*` decorative utilities (bounce, pulse, spin on non-loading).
  → Motion is earned. Use `transition()` from `@/lib/motion` for meaning.
- Motion without honoring `prefers-reduced-motion`.
  → Use `usePrefersReducedMotion()` for any non-trivial transition.

### Layout

- Ad-hoc `max-w-*` on section wrappers.
  → Use `<Container width="narrow|reading|wide|full" />`.
- Bespoke `px-*` on page-level sections.
  → Gutters live in `<Container />`.

---

## 6 · Review checklist (per PR)

Reviewers run through this before approving any brand-touching PR:

- [ ] Rally cry (if present) uses `<RallyCry />` — not a hand-rolled `<h1>`.
- [ ] Palette reads 70/20/8/2 at a glance. Screenshot if in doubt.
- [ ] No raw Tailwind color names (`bg-blue-*`, `text-gray-*`, etc.).
- [ ] Typography uses role helpers from `@/components/typography`.
- [ ] No words from `FORBIDDEN_WORDS` in any user-facing copy.
- [ ] Motion, if present, routes through `@/lib/motion` and respects reduced-motion.
- [ ] Page gutters via `<Container />`. No bespoke `max-w-*` / `px-*`.
- [ ] One primary CTA per hero beat. No second brand-red element.
- [ ] Serif accent used once per page at most.
- [ ] Investor-room content: no raise size, band, or valuation language.

---

## 7 · Milestone 3+ — what moves next

- **M3 (copy pass, Home):** Narrative lands. This doc's forbidden-words
  check becomes a real CI step.
- **M7:** Session security (HMAC + 14d expiry). Middleware replaces the
  placeholder cookie check.
- **M10:** Jeffrey wired. `JeffreyDock` gets the real panel — the opener
  and dimensions stay, so no visual regression.
- **M12:** HubSpot pipeline for `/api/lead`. The LeadCaptureForm success
  state becomes real routing, not stub.
- **M13:** Brand audit + a11y + perf pass. Forbidden-words check, palette
  audit, motion audit all graduate to automated enforcement.
