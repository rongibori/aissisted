# Aissisted — Figma + Cowork Integration Guide

**Goal**: stand up Figma as design source of truth, connect Cowork via MCP, establish a repeatable handoff loop into Claude Code → Aissisted repo.
**Time budget**: ~2 hours for initial setup, then ~30 min per design session.

---

## 0. Prerequisites

Before starting, confirm you have:
- [x] Figma account on **Professional plan** (Variables + Dev Mode + Tokens Studio require paid)
- [x] Anthropic Cowork installed (desktop app)
- [ ] Claude Code installed and authenticated
- [x] Aissisted GitHub repo cloned locally
- [x] Four handoff files committed at `docs/design-system/` and `packages/brand/`:
  - `packages/brand/aissisted-tokens.json` (W3C DTCG)
  - `docs/design-system/aissisted-design-spec.md`
  - `packages/brand/tokens.css` (production source)
  - `docs/design-system/aissisted-figma-cowork-setup.md` (this file)

---

## Phase 1 — Figma Foundation (30 min)

### 1.1 Create the workspace structure

Create one Figma **Team** named `Aissisted`, then create these files in this order:

```
Aissisted (team)
├── 00 — Foundations            ← tokens, primitives, type ramps
├── 01 — Component Library      ← atoms + molecules (publishable library)
├── 02 — Screens — Mobile       ← organisms / actual screens
├── 03 — Prototypes             ← clickable flows for review
└── 04 — Marketing & Brand      ← deferred until product MVP
```

Why this split: separating **Foundations** and **Library** from **Screens** lets you publish the first two as a Team Library, so changes propagate everywhere instantly without polluting screen files.

### 1.2 Install required plugins

Open Figma → Plugins → Browse, install:

| Plugin | Purpose |
|---|---|
| **Tokens Studio for Figma** | Imports `aissisted-tokens.json` as Figma Variables |
| **Variables Import** (built-in, Figma 2024+) | Native fallback if Tokens Studio is overkill |
| **Iconify** | Lucide icon access without managing your own icon file (we don't use icons in product, but useful for marketing) |
| **Content Reel** | Realistic placeholder data (names, emails, biomarker values) |
| **Figma to Code** (optional) | Inspect → React/Tailwind output for cross-check |

### 1.3 Import tokens into Foundations file

Open `00 — Foundations`:
1. Open Tokens Studio plugin (right rail)
2. Click **Settings** → **Add new sync provider** → **JSON file** → load `packages/brand/aissisted-tokens.json` from your local repo
3. Click **Push to Figma** → select all token sets → confirm
4. Verify: open Figma's native Variables panel (right sidebar). You should see collections: `Color/Primitive`, `Color/Semantic`, `Typography`, `Spacing`, `Radius`, `Shadow`, `Motion`, `Layout`

If Tokens Studio errors, fall back to native Variables Import:
- Right-click any frame → **Import variables** → paste JSON contents

### 1.4 Build foundation pages inside `00 — Foundations`

Each page is a single Figma Page (tab at top):
- **Color** — primitive swatches grid + semantic mapping table (mirror `aissisted-system.html` palette card layout: White / Graphite / Soft Graphite / Signal Red / Aqua / Midnight)
- **Type** — wordmark + 7 type styles, each at real size with token name labeled
- **Spacing** — visual grid of all spacing tokens
- **Radius / Shadow** — sample boxes
- **Motion** — animated frames demonstrating each duration/easing combo (use Smart Animate)

This file is documentation. You will reference it constantly. Make it readable.

---

## Phase 2 — Component Library (60 min for atoms, then iterate)

### 2.1 Build atoms first

Inside `01 — Component Library`, create one page per atom category:

```
Pill CTAs
Pill Chips
Number Chips
Inputs
State Pill
Avatars (j-mark)
Tags
Geometric Markers
Voice Orb
Sparkline
Progress Ring (Intelligence Dial)
Dividers
Status Pill Triad
```

For each component:
1. Build the **default** state using **only token variables** — never hard-coded values
2. Convert to a **Component** (Cmd+Opt+K)
3. Add **Variants** for each state (default, hover, pressed, disabled, loading, selected)
4. Add **Properties** (text content, size variant) using Component Properties panel
5. Description field: paste the component spec from `aissisted-design-spec.md` § 3.1

### 2.2 Naming convention (enforce strictly)

```
Pill-CTA/Primary/Default
Pill-CTA/Primary/Hover
Pill-CTA/Primary/Pressed
Pill-CTA/Primary/Disabled
Pill-CTA/Primary/Loading
Pill-CTA/Secondary/Default
...
Pill-Chip/Toggle/Default
Pill-Chip/Toggle/Hover
Pill-Chip/Toggle/Selected
...
Avatar-J/Small/Default
Avatar-J/Medium/Default
Avatar-J/Large/Default
```

This `Type/Variant/State` pattern makes the Figma → Code Connect mapping mechanical later.

### 2.3 Publish as Team Library

When atoms are complete (you don't have to wait for molecules):
1. **Assets** panel → **Library** icon → **Publish**
2. Add changelog: `v0.1.0 — initial atoms (Pill-CTA, Pill-Chip, Number-Chip, State-Pill, Avatar-J, Tag, Geometric-Marker)`
3. Enable library in `02 — Screens — Mobile` and `03 — Prototypes`

Now any change in `01` propagates to every screen automatically.

### 2.4 Build molecules + organisms

Same pattern, in order:
- Molecules → page per pattern (Phone Frame, Score Tile, Metric Tile Paired, Status Pill Triad, Dark Jeffrey Card, Live Card, etc.)
- Organisms → in `02 — Screens — Mobile`, one frame per screen

---

## Phase 3 — Dev Mode + Code Connect (30 min)

### 3.1 Enable Dev Mode

Top-right of any Figma file → toggle **Dev Mode**. Engineers (and Cowork) can now inspect:
- CSS / Tailwind class output per layer
- Token references resolved
- Variant props
- Asset exports

### 3.2 Set up Code Connect (Figma ↔ React mapping)

Code Connect lets Figma show "this component in code is `<PillCTA variant='primary' />`" inline with the design.

```bash
# In your Aissisted repo
cd ~/projects/aissisted
pnpm add -D @figma/code-connect
npx figma connect init
```

Follow the wizard:
- Auth: paste Figma personal access token
- Component framework: React (TypeScript)
- Output dir: `figma.config.json` at repo root

Then for each component in your repo:

```bash
npx figma connect create "https://figma.com/file/XXXX?node-id=YYY" \
  --component apps/web/components/ui/PillCTA.tsx
```

This generates a `PillCTA.figma.tsx` file mapping Figma variants → React props. Commit these.

### 3.3 Configure code output preferences

In Figma → Dev Mode → Settings:
- **Code language**: TypeScript
- **Style framework**: Tailwind CSS
- **Linked styles**: ON (so it outputs `text-ink` not `text-[#1C1C1E]`)

---

## Phase 4 — Cowork Integration (20 min)

Cowork connects to Figma via MCP and bridges design → execution.

### 4.1 Confirm Figma MCP is connected to Cowork

In Cowork → **Settings** → **Connectors** → confirm `Figma` shows **Connected** ✅

If not: click **Add** → search Figma → authorize.

### 4.2 Seed Cowork with Aissisted context

Cowork works best when given persistent project context. Create a Cowork **Project** named `Aissisted` and attach:

1. `docs/design-system/aissisted-design-spec.md`
2. `packages/brand/aissisted-tokens.json`
3. `packages/brand/tokens.css`
4. Direct links to your Figma files:
   - `00 — Foundations` URL
   - `01 — Component Library` URL
   - `02 — Screens — Mobile` URL
5. Link to your GitHub repo `https://github.com/rongibori/aissisted`
6. A short project instruction (paste this verbatim):

```
This is the Aissisted product workspace. Aissisted is an AI-driven
personalized supplement platform with mobile-first UX, integrated with
Epic/MyChart, WHOOP, Apple Health, and Oura.

Stack: Next.js 15 (App Router) / TypeScript / Tailwind v4 / shadcn/ui
primitives where applicable. Monorepo via Turbo + pnpm.

Brand canon source: aissisted-system.html (Claude Design canvas) +
packages/brand/tokens.css (production tokens). Locked palette:
white #FFFFFF (70%), graphite #1C1C1E (20%), signal red #EE2B37 (8%
emphasis only), aqua #00C2D1 (2% data only), midnight #0B1D3A
(cinematic only). Locked type: Briston Bold display, IBM Plex Mono
system, system sans body, Baskerville italic accent, lowercase
serif italic "aissisted" wordmark.

Design source of truth is Figma. Tokens are defined in
aissisted-tokens.json (W3C DTCG format).

When proposing UI: always reference token names, never hex values.
When generating code: use Tailwind utility classes mapped to tokens
(e.g. bg-surface, text-ink, text-brand, text-signal). Never literal
color utilities (no bg-red-500, no text-indigo-400).

When unsure about a component spec: ask before assuming, or check
the design spec section reference.

Default to mobile (390px viewport). Always respect the stagger motion
system for hero/onboarding surfaces (cubic-bezier(0.22, 1, 0.36, 1),
600ms stagger beats).

Brand voice: precise, simple, personal, premium. No exclamation
points. Butler-cadence pacing. Rally cry: "Your Body. Understood."
```

### 4.3 Verify Cowork can see Figma

In Cowork chat, run:

> "Pull the component list from the Aissisted Component Library Figma file and compare against the inventory in aissisted-design-spec.md § 3. Tell me what's missing."

If Cowork returns a structured comparison: integration works. If it can't access Figma: re-auth the connector.

---

## Phase 5 — Daily Handoff Workflow (recurring)

This is the loop you'll run for every design → code session.

```
┌──────────────────────────────────────────────────────────────┐
│  FIGMA                                                       │
│  Design / iterate in 02 — Screens — Mobile                   │
│  → Lock the frame (rename "Ready: <screen>")                 │
│  → Copy frame URL                                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  COWORK                                                      │
│  "Read frame <URL>, summarize component composition, list    │
│   any tokens used that aren't in aissisted-tokens.json,      │
│   and write an implementation brief for Claude Code."        │
│  → Cowork outputs: cowork-briefs/<screen>.md                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  CLAUDE CODE                                                 │
│  cd ~/projects/aissisted                                     │
│  claude code "Implement cowork-briefs/<screen>.md following  │
│   the design spec. Use existing components in apps/web/      │
│   components/ui/ where available. Open a PR."                │
│  → Branch, code, test, push, PR                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  REVIEW                                                      │
│  Visual diff PR preview against Figma frame.                 │
│  Approve or send back with delta notes (Cowork handles).     │
└──────────────────────────────────────────────────────────────┘
```

### 5.1 Cowork prompt template (save this)

```
Frame: <Figma URL>
Spec section: § <ref> in aissisted-design-spec.md
Constraint: <new component? compose existing? bug fix?>

Tasks:
1. Inspect the Figma frame
2. List every component instance and confirm it exists in our library
3. Flag any token mismatches or one-off values
4. Produce: cowork-briefs/<kebab-name>.md with:
   - Goal
   - Component tree (using our naming)
   - Token references
   - State / interaction notes
   - Open questions
5. Do NOT write production code yet
```

### 5.2 Claude Code prompt template

```
Read cowork-briefs/<kebab-name>.md.
Implement against spec. Constraints:
- apps/web/components/ui/* for atoms (use existing)
- apps/web/components/patterns/* for new molecules
- Tailwind v4 with our @theme tokens — never hex
- Mobile-first; 390px viewport default
- Respect stagger system for hero surfaces
- Respect prefers-reduced-motion
- TypeScript strict; no any, no @ts-ignore
- WCAG 2.1 AA compliant

Open PR with screenshots from local dev (npm run dev → /onboarding).
```

---

## 6. Handoff Files — what each one is for

| File | Lives in | Read by | Purpose |
|---|---|---|---|
| `aissisted-tokens.json` | `packages/brand/` + Figma (via Tokens Studio) | Figma, Style Dictionary, Cowork | Single source of truth for design values (W3C DTCG) |
| `aissisted-design-spec.md` | `docs/design-system/` + Cowork project context | Cowork, Claude Code, you, future hires | The "why" doc — philosophy, conventions, component inventory |
| `tokens.css` | `packages/brand/` | Build pipeline (Tailwind v4 `@theme`) | Token bridge into Tailwind utility classes |
| `aissisted-figma-cowork-setup.md` | `docs/design-system/` | Humans (you, future engineers) | Operational runbook for the design→code loop |

All four committed to the Aissisted repo so they version with the codebase.

---

## 7. Rollout sequence — what to do this week

| Day | Goal | Output |
|---|---|---|
| **Today** | Workspace + tokens imported | Foundations file populated; tokens visible as Figma Variables |
| **Day 2** | Atoms — Pill-CTA, Pill-Chip, State-Pill, Avatar-J, Tag, Geometric-Marker | Component library v0.1.0 published |
| **Day 3** | Molecules — Phone Frame, Score Tile, Metric Tile Paired, Dark Jeffrey Card | v0.2.0 published |
| **Day 4** | Port the existing onboarding `aissisted-onboarding.html` cover into Figma using the new system | `02 — Screens` first frame ready |
| **Day 5** | Cowork connected, first handoff brief generated for onboarding cover | First Claude Code PR cut |

If you hit any step that takes more than 2× the budget, stop and re-scope — don't grind.

---

## 8. Common failure modes (and fixes)

| Symptom | Cause | Fix |
|---|---|---|
| Tokens Studio plugin won't sync | Free Figma plan | Confirmed: on Pro — should work |
| Cowork can't see Figma file | Private file or auth scope | Move file to Aissisted team; re-auth Figma connector |
| Code Connect mapping fails | Component naming inconsistent | Enforce `Type/Variant/State` strictly; rename existing |
| Tailwind classes don't resolve to tokens | v4 `@theme` block missing | Confirmed: `@theme` already wired in `packages/brand/tokens.css` |
| Stagger animation drops frames | Layout thrashing on entrance | Animate `opacity` + `transform` only; never `top/left` |
| Figma file becomes slow | Components built without auto-layout | Audit components; convert all to auto-layout |

---

## 9. What this setup buys you

- **One source of truth** for color/type/spacing, mirrored in Figma + code
- **Zero design drift** — token changes propagate to both surfaces
- **Cowork handles brief-writing** — you stop translating Figma → English by hand
- **Claude Code implements against briefs, not screenshots** — fewer guesses, fewer regressions
- **The system survives team growth** — new designers/engineers ramp on the spec, not your head

---

## 10. Cross-references

| Asset | Location |
|---|---|
| Design spec | `docs/design-system/aissisted-design-spec.md` |
| Tokens (DTCG) | `packages/brand/aissisted-tokens.json` |
| Tokens (CSS, production) | `packages/brand/tokens.css` |
| Beta Launch Plan | `docs/AISSISTED_BETA_LAUNCH_PLAN_v1.md` |
| Onboarding visual contract | `jeffrey/CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md` |
| Voice modal visual contract | `jeffrey/CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md` |
| Journal entry visual contract | `jeffrey/CLAUDE_DESIGN_JOURNAL_ENTRY_PROMPTS.md` |
| Analytics visual contract | `jeffrey/CLAUDE_DESIGN_ANALYTICS_PROMPTS.md` |
| Cowork briefs | `cowork-briefs/` |
