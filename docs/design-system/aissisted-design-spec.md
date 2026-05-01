# Aissisted — Design System Specification

**Version**: 0.1.0 (canon)
**Status**: Phase 2 — Figma source of truth in progress
**Owner**: Ron
**Last updated**: 2026-04-30
**Canon source**: `aissisted-system.html` (Claude Design canvas) + `packages/brand/tokens.css` (production tokens)
**Token reference**: `packages/brand/aissisted-tokens.json` (W3C DTCG format for Figma + Style Dictionary)

---

## 1. Brand Foundation

### 1.1 Voice

Aissisted is **personalized intelligence as a quiet authority**. Not a coach yelling at you. Not a chatbot. A practitioner reading your data and prescribing what you need — calmly, with conviction.

The brand sounds like a clinical-aspirational research platform — Apple Health × WHOOP × an ML research lab — with a butler-cadence register on top. Restraint over enthusiasm. Specificity over hype. Data as the language.

### 1.2 Visual principles

1. **Institutional, not consumer-tech** — clinical white surfaces, structural typography, pattern restraint
2. **Cinematic pacing** — staggered reveals, breath between elements, time as a design material
3. **Aqua is data, never decoration** — the only saturated color earns its place by representing the user's data
4. **Signal red is emphasis, not danger** — bright matte red appears on max 2 elements per surface; the brand's hallmark word ("Understood.") is one of them
5. **Mobile is the canvas** — designed phone-first, every other surface adapts down

### 1.3 What we never do

- Generic SaaS aesthetics (purple gradients, rounded blob illustrations, pastel everything)
- Iconography (no SVG icons, no glyphs that aren't unicode characters used structurally)
- Brand logos for third parties (no WHOOP/Oura/Apple/Epic logos — abstract geometric markers only)
- Decorative aqua (aqua means data; never ornament)
- Off-system colors (no rose, amber, teal, green, sky, indigo)
- Sharp 0px button corners (rounded pills only)
- Stock health imagery
- Emoji-led tone

---

## 2. Tokens

Tokens live in `packages/brand/aissisted-tokens.json` (W3C DTCG format) AND `packages/brand/tokens.css` (production source for Tailwind v4 `@theme`). Both files are the single source of truth — keep in sync. This section explains the *why*.

### 2.1 Color (canon, locked)

| Token | Hex | Ratio | Role |
|---|---|---|---|
| `white` | `#FFFFFF` | 70% | Default app background — clean institutional ground |
| `graphite-800` | `#1C1C1E` | 20% | Primary text, primary CTA fill, dark Jeffrey card background |
| `graphite-700` | `#2E2E2E` | — | Soft Graphite — secondary surfaces, button hover, elevation |
| `signalRed-700` | `#EE2B37` | 8% | Bright matte red — emphasis only (max 2 elements per surface, destructive intent) |
| `aqua-500` | `#00C2D1` | 2% | Data, intelligence, key metrics, Jeffrey "j" avatar |
| `midnight-700` | `#0B1D3A` | — | Voice orb gradient outer edge, cinematic transitions only |

**Rationale**: white-first interface mirrors clinical research platforms. Graphite as primary text (not pure black) reads as institutional rather than brutalist. Signal Red `#EE2B37` is bright + matte; emphatic but controlled. Aqua `#00C2D1` is the platform's data signature — every primary trend line, key metric value, and "your data" indicator is aqua. Midnight blue is reserved for cinematic moments (voice orb, transition surfaces) and not used in standard tile chrome.

**Color ratio (enforced via design review):** 70% white · 20% graphite/black · 8% red · 2% aqua. If a surface drifts outside this ratio, the design fails review.

### 2.2 Typography

Four families, each with a clear job:

- **Display** (Briston Bold) — display headlines, hero typography. Bold weight only. Letter-spacing -0.025em standard.
- **System** (IBM Plex Mono) — pre-headline labels, micro-text, button labels, code-comment sublines, table headers, data tags. The structural register that makes the brand feel "platform" not "app". *Note: apps/web currently ships Source Code Pro as a temporary stack; planned migration to IBM Plex Mono.*
- **Body** (system sans — San Francisco / Segoe / Roboto fallback) — long-form text, chat captions, prose explanations
- **Accent** (Baskerville italic) — single accent moment per surface ("Built from your data.", "Carry it forward", "Got it. Talk soon."). Never decorative.
- **Logotype** — lowercase serif italic "aissisted" rendered in Baskerville italic 24px standard. Never IBM Plex Mono uppercase.

**Type scale**:

| Style | Family | Size | Use |
|---|---|---|---|
| Cover headline | Display Bold | 56px | "Your Body. Understood." cover |
| Section headline | Display Bold | 32px | "What should Jeffrey call you?" |
| Mid headline | Display Bold | 24px | Sub-section ("Three quick reads.") |
| Score-large | Display Bold | 56px (aqua) | Composite score values ("82") |
| Score-mid | Display Bold | 28px | Mid-size data values |
| Body | Body Sans | 16px | Default text |
| Body caption | Body Sans | 14px | Secondary text |
| Chat caption (Jeffrey) | Body Sans | 18px | Voice modal Jeffrey-side caption |
| Chat caption (user) | IBM Plex Mono | 14px | Voice modal user-side caption |
| Pre-headline label | IBM Plex Mono Medium | 11px / 0.18em / uppercase | "EST. 2026 · PERSONALIZED INTELLIGENCE" |
| Tag | IBM Plex Mono Medium | 11px / 0.12em / uppercase | "REQUIRED", "OPTIONAL", "PREVIEW" |
| Button | IBM Plex Mono Medium | 14px / 0.06em | Pill CTA labels |
| Code-comment | IBM Plex Mono | 13px | "// listens. answers. adapts." |
| Logotype | Baskerville italic | 24px | "aissisted" wordmark |
| Accent | Baskerville italic | 17px | Single accent line per surface |

### 2.3 Spacing

4px grid. Critical anchors from the onboarding spec:

| Token | Value | Use |
|---|---|---|
| `2` | 8px | Tight chip gaps |
| `3` | 12px | Component internal padding |
| `4` | 16px | Standard row gap |
| `6` | 24px | Surface horizontal padding standard |
| `8` | 32px | Section vertical breathing |
| `14` | 56px | CTA button height standard |
| `16` | 64px | Section accent gap |
| `20` | 80px | Footer anchor from screen bottom |
| `22` | 88px | Eyebrow lockup gap |

### 2.4 Motion — the stagger system

The signature interaction is **paced reveal**. Elements enter on a choreographed timeline rather than appearing at once.

**Onboarding hero stagger** (canonical — used on every hero / cover surface):

| Step | Time | Element |
|---|---|---|
| step-1 | 0ms | Wordmark fade-in |
| step-2 | 200ms | Pre-headline label |
| step-3 | 320ms | Headline line 1 ("Your Body.") fades up from y+24px |
| step-4 | 600ms | Headline line 2 ("Understood." in Signal Red) fades up |
| step-5 | 900ms | Baskerville accent line |
| step-6 | 1100ms | CTA + footer micro-text |

**Standard easing**: `cubic-bezier(0.22, 1, 0.36, 1)` — soft deceleration that lands rather than bouncing. This is the aissisted-system standard. (Legacy production tokens use a slightly different curve; both are documented.)

**Standard durations**:
- 120ms — chip / tile hover
- 160ms — button hover, transitions
- 200ms — micro-dismissals
- 240ms — surface fade-out
- 320ms — surface fade-in, standard reveal
- 600ms — hero word-stagger beat
- 720ms — hero fade-up, full surface entrance
- 1200ms — final hold/settle
- 4000ms — voice orb idle breath cycle

### 2.5 Radius

| Token | Value | Use |
|---|---|---|
| `md` | 12px | Inputs, dashed-border drop zones |
| `lg` | 16px | Tiles, cards, recommendation cards |
| `2xl` | 32px | Bottom-sheet top corners |
| `pill` | 9999px | **All CTAs, chips, pill-shaped affordances** |
| `phone-outer` | 56px | Phone-frame device chrome (Claude Design canvas mockup) |
| `phone-inner` | 44px | Phone-frame inner-screen bezel |

**Sharp 0px corners are forbidden on buttons and CTAs.** The brand uses rounded pills with sharp typography to balance precision and warmth.

### 2.6 Shadow

Elevation is rare. Shadows only appear on:
- Bottom sheets / modals (`shadow-lg`)
- Floating biomarker tooltips (`shadow-md`)
- State pill subtle elevation (`shadow-sm`)
- **Voice orb glow** (`shadow-lg` — aqua-shadowed presence: `0 24px 64px rgba(0, 194, 209, 0.32)`)

Tiles in-flow are flat with subtle 1px graphite-at-10% borders, not elevated shadows.

---

## 3. Component Inventory

Three tiers. Build in this order.

### 3.1 Atoms (Foundations)

Build first. Every other component composes these.

| Component | Variants | States | Notes |
|---|---|---|---|
| **Pill CTA** | primary, secondary (outlined), data-active (aqua on dark cards) | default, hover, pressed, disabled, loading | `pill` radius (999px), graphite filled default, IBM Plex Mono 14px label |
| **Pill Chip** | toggle, multi-select | default, hover, selected, disabled | `pill` radius, 1.5px border default, filled graphite when selected, transition 160ms ease-out |
| **Number Chip** | 1–10 scale | default, selected | Compact register: smaller padding 6px 0, IBM Plex Mono 12px |
| **Input** | text, email, near-borderless display | default, focus, error, disabled | Near-borderless: 1px graphite-at-12% bottom border only |
| **Textarea** | default | default, focus, error | Auto-grow up to 4 lines, 12px border-radius |
| **Toggle / Switch** | default | off, on, disabled | Graphite filled when on |
| **Tag** | required, optional, preview | — | IBM Plex Mono 11px / 0.12em / uppercase |
| **Avatar** | "j" (Jeffrey), initials, image | small (24px), medium (32px), large (56px) | Aqua "j" avatar = lowercase "j" Briston Bold inside aqua-at-24% circle with aqua border |
| **State Pill** | idle, listening, thinking, speaking, error | — | "j" mark + state-dot + label; integrates Jeffrey identity |
| **Spinner** | small, default | — | Single rotation, no bounce |
| **Progress Ring** | intelligence dial | — | SVG arc with rAF ease-out-cubic draw-in; aqua stroke; large variant for composite score |
| **Sparkline** | tile inline | — | Aqua 1.5px stroke + aqua-at-16% fill area; last point larger 3px circle |
| **Divider** | hairline | — | 1px graphite at 8% |
| **Geometric Marker** | square, ring, diamond, circle | — | Abstract data-source category indicators (32px outline, 1.5px graphite stroke); replaces brand logos |

### 3.2 Molecules (Patterns)

Build once atoms are stable.

| Component | Composition | Notes |
|---|---|---|
| **Phone Frame** | Frame + status bar + safe areas | Claude Design canvas mockup standard (max-width 380px, height 820px) |
| **Wordmark Lockup** | Logotype (lowercase serif italic "aissisted") + pre-headline label | Reusable across onboarding, splash, marketing |
| **Score Tile (Composite)** | Pre-label + trend indicator + large aqua score + breakdown row | Reflection layer hero tile |
| **Metric Tile (Paired)** | Label + mid-size value + sparkline + detail row | Two side-by-side; SLEEP / RECOVERY pattern |
| **Status Pill Triad** | Three categorical pills (Optimized / Stable / Needs Support) | Single active at a time |
| **Dark Jeffrey Card** | Graphite background + aqua "j" header + butler-cadence prose + aqua pill CTA | "Jeffrey speaks AT you in a moment of importance" register — used in analytics LIVE notification, Causal recommendation card, voice modal error overlay |
| **Live Card (Light)** | White background + 1px graphite-at-10% border + 16px radius + 24px padding | Standard tile chrome |
| **Plan Row** | Time label (AM/PM) + items prose + status (PENDING/DONE in aqua) | Tile content for daily protocol |
| **CTA Footer** | Pill button + duration line | "Begin / ~4 min · interrupted anytime" pattern |
| **Bottom Sheet** | Drag handle + header + content + safe-area | Modals on mobile |
| **State Pill Header** | "j" avatar + state-dot + label | Voice modal top-chrome; matches Jeffrey identity pattern |
| **Voice Orb** | Core (aqua → midnight radial) + ring (amplitude-reactive) + bloom (speaking state) | Voice modal centerpiece |
| **Chip Grid** | Multi-select chips with FIFO max-N constraint | Goals (max 3 of 6), notable events (multi-select unbounded) |
| **Geometric Marker Row** | Marker + name + type tag + status | Connect step (Health Records / Wearable / Phone / Ring) |
| **Brushable Timeline** | Master timeline + brush overlay + range readout | Trend layer linking primitive |
| **Attribution Row** | Name + effect label + Why? affordance + center-anchored bar | Causal layer per-ingredient table row |
| **Empty State** | Icon-free header + body + optional CTA | First-load states for charts, lists |
| **Toast** | IBM Plex Mono message + optional action | Non-blocking system feedback |

### 3.3 Organisms (Screens)

Compose these last. Each is a full surface.

**Onboarding flow** (per `CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md`)
- Surface 1: Cover ("Your Body. Understood.")
- Surface 2: Jeffrey introduction ("VOICE COMPANION · V1.2" + Aqua "j" avatar + canonical voice copy)
- Surface 3: Identity + Goals (combined STEP 02 / 06)
- Surface 4: Data Layer (STEP 03 / 06 — geometric markers)
- Surface 5: Labs (STEP 04 / 06)
- Surface 6: Baseline (STEP 05 / 06)
- Surface 7: Building (cinematic typographic stagger on Midnight)
- Surface 8: Reveal ("Meet your formula, [Name].")
- Surface 9: Subscription + Jeffrey first-meet

**Voice modal** (per `CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md`)
- State machine: idle / listening / thinking / speaking / error / closing
- Voice orb centerpiece + State Pill + live captions + bottom controls
- Dark-card error register (graphite bg + aqua "j" + aqua pill CTAs)
- Baskerville italic session-end accent ("Got it. Talk soon.")

**Journal entry MVP** (per `CLAUDE_DESIGN_JOURNAL_ENTRY_PROMPTS.md`)
- Single scrollable surface with 4 sections (Adherence / Symptoms / Notable Events / Reflection)
- Bottom-fixed submit dock
- "Got it." confirmation state with Baskerville accent

**Analytics** (per `CLAUDE_DESIGN_ANALYTICS_PROMPTS.md` — extends existing `aissisted-analytics-01.html`)
- **Reflection layer** (existing): Intelligence dial + Status pill triad + Dark Jeffrey LIVE card + Core Metrics tiles + Ask Jeffrey input
- **Trend layer** (new, Phase 3): Brushable master timeline + HRV/Sleep/Recovery panel + Lab biomarker overlay + Symptom heatmap + Adherence calendar
- **Causal layer** (new, Phase 4): "What's actually working." attribution table + Inline drill-down + Counterfactual slider + Predictive forecast + Dark Jeffrey recommendation card

**Connections** (Phase 2)
- Service connect — MyChart (SMART on FHIR)
- Service connect — WHOOP / Oura
- Service connect — Apple Watch / HealthKit (deferred to v1.1)
- Manual lab upload

---

## 4. Layout System

### 4.1 Mobile-first breakpoints

| Breakpoint | Min width | Notes |
|---|---|---|
| `mobile` | 0 | Default — design here first, always |
| `tablet` | 768px | Two-column layouts begin |
| `desktop` | 1024px | Full nav + multi-column data views |
| `wide` | 1440px | Cap content at `--max-w-container` (1200px) |

### 4.2 Mobile screen rules

- Horizontal margin: 24px standard (per surface), 32px on cover/hero surfaces
- Footer anchor: 80px from bottom (`spacing-20`)
- Safe areas: 44px top (notch), 34px bottom (home indicator)
- CTA: full-width minus 32px horizontal margin → effective width = viewport − 64px
- Phone-frame mockup canvas (Claude Design): max-width 380px, height 820px, border-radius 56px outer / 44px inner

### 4.3 Vertical rhythm

Hero compositions use the eyebrow rhythm: 88px between wordmark and pre-headline, 32px between pre-headline and headline, 64px between headline and accent. **This rhythm is the brand signature — preserve it.**

---

## 5. Motion System

### 5.1 Principles

1. **Purposeful, not decorative** — every animation answers a question (where did this come from? what changed? what should I look at?)
2. **Pace, don't accelerate** — 320ms is the floor for hero entrances. 200ms is for dismissals. We never do 100ms snappy SaaS micro-interactions.
3. **Easing lands, doesn't bounce** — `cubic-bezier(0.22, 1, 0.36, 1)` decelerates softly. No spring, no bounce.

### 5.2 Standard transitions

| Action | Duration | Easing |
|---|---|---|
| Chip / tile hover | 120ms | ease-out |
| Button hover | 160ms | ease-out |
| Modal close | 200ms | ease-in |
| Surface fade-out | 240ms | ease-in |
| Surface fade-in | 320ms | ease-out |
| Hero word stagger | 200–1100ms | ease-out (per stagger token) |
| Voice orb breath | 4000ms loop | ease-in-out |
| Voice orb amplitude pulse | 1200ms loop | ease-out |

### 5.3 Cinematic moments

The brand has specific cinematic beats earned by the surface:
- **Cover stagger** (per §2.4) — onboarding entrance
- **Surface 7 typographic stagger** — "Sleep · HRV · Vitamin D · Cortisol · Adaptation · You" with "You" landing in aqua on Midnight background
- **Voice orb breath** — 4s breath cycle when modal is in idle state
- **Intelligence dial fill** — composite score ring draws in via rAF ease-out-cubic on first render

### 5.4 Reduced motion

All stagger reveals respect `prefers-reduced-motion: reduce` — replace with cross-fade only, no translate. Hero stagger collapses to all-at-once 320ms fade.

---

## 6. Accessibility Floor

Non-negotiable.

- **Contrast**: graphite `#1C1C1E` on white = 18.5:1. Signal Red `#EE2B37` on white = 4.5:1 (AA pass for normal text). Aqua `#00C2D1` on graphite = 4.6:1 (AA pass on dark surfaces). All semantic combinations exceed WCAG AA.
- **Touch targets**: minimum 44 × 44px on mobile. Most CTAs are 56px tall.
- **Focus rings**: 3px aqua-at-25% offset shadow, never `outline: none`.
- **Semantic HTML**: buttons are `<button>`, links are `<a>`, headings follow document order.
- **Screen reader**: every icon-free button has `aria-label`. Loading states use `aria-busy`.
- **Keyboard**: every interactive surface reachable via Tab. Modal traps focus. Esc closes overlays.
- **Motion**: respect `prefers-reduced-motion`.

---

## 7. Naming Conventions

### 7.1 Figma layers

- Components named `Type/Variant/State` — e.g. `Pill-CTA/Primary/Default`, `Pill-CTA/Primary/Hover`, `Pill-Chip/Toggle/Selected`
- Frames named `Screen/Section` — e.g. `Onboarding/Cover`, `Analytics/Reflection-Score-Tile`
- Auto-layout used for all components — no absolute positioning except for stagger choreography

### 7.2 Code

- Tailwind utility classes preferred — bg-surface, text-ink, bg-brand, text-signal, bg-data
- Component files: `PascalCase.tsx` in `apps/web/components/`
- Atoms in `components/ui/` (shadcn convention)
- Molecules in `components/patterns/`
- Organisms / screens in `app/(routes)/.../page.tsx`

### 7.3 Tokens

- Primitive tokens: `category-name-step` → `color.primitive.signalRed.700`
- Semantic tokens: `category-role` → `color.semantic.fg.emphasis`
- Always reference semantic tokens in components, never primitives directly

---

## 8. Versioning & Change Process

- Token changes ship as a minor version (0.x.0) when additive, major (x.0.0) when breaking
- Component additions are additive — they don't bump the system version
- Deprecation: mark in Figma description AND in this doc, keep for 1 release cycle, then remove
- Every published Figma library version maps to a tagged commit of this spec doc

---

## 9. Open Questions

To resolve before locking v1.0:

- [ ] **Sans family** — apps/web currently ships Source Code Pro for system register; planned migration to **IBM Plex Mono** (per packages/brand comment + voice modal spec). Confirm migration timing.
- [ ] **Briston webfont licensing** — verify production licensing for the canonical display font; Inter Tight is the documented fallback
- [ ] **Dark mode** — defer to v1.1 or include in v1.0?
- [ ] **Voice UI** — Jeffrey's visual identity beyond the orb + "j" avatar (any avatar variants for in-app moments?)
- [ ] **Data viz library** — Observable Plot recommended (per analytics spec) over Recharts for brushable + linked views; commit?
- [ ] **Söhne sans** — if/when we add Söhne for marketing site brand polish, scope: marketing only or product + marketing?

---

## 10. Cross-references

| Spec | Path | Owns |
|---|---|---|
| Beta Launch Plan v2 | `docs/AISSISTED_BETA_LAUNCH_PLAN_v1.md` | 17-decision matrix, phase deliverables |
| Voice Layer Spec | `docs/specs/JEFFREY_VOICE_LAYER_SPEC.md` | Voice runtime, brand voice §8.1, latency targets §11 |
| Journal & Analytics Spec | `docs/specs/JOURNAL_AND_ANALYTICS_SPEC_V1.md` | Daily engagement loop, canonical signal layer, causal inference |
| Lab Ingestion Spec | `docs/specs/LAB_INGESTION_SPEC_V1.md` | LabCorp/Quest pipeline, 80-biomarker catalog |
| Security & Compliance | `docs/specs/SECURITY_AND_COMPLIANCE_V1.md` | HIPAA control mapping |
| Onboarding prompts | `jeffrey/CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md` | 9-surface onboarding visual contract |
| Voice modal prompts | `jeffrey/CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md` | Voice modal visual contract |
| Journal entry prompts | `jeffrey/CLAUDE_DESIGN_JOURNAL_ENTRY_PROMPTS.md` | Phase 2 MVP journal entry |
| Analytics prompts | `jeffrey/CLAUDE_DESIGN_ANALYTICS_PROMPTS.md` | Phase 3-4 analytics extension |

---

## Changelog

| Date | Version | Change |
|---|---|---|
| 2026-04-30 | v0.1.0 | Canon design system locked from `aissisted-system.html` (Claude Design canvas) + `packages/brand/tokens.css` (production). Mirrors institutional-aqua palette + Briston Bold/IBM Plex Mono/Baskerville italic type system. Component inventory enumerated across atoms / molecules / organisms. Cross-referenced to all surface-level specs. |
