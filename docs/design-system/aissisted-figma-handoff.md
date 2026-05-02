# Aissisted — Figma Workspace Handoff

**Status:** Phase 1 setup complete. Workspace structure ready for design execution.
**Date:** 2026-05-01
**Owner:** Ron + designer (TBD or Ron driving)

---

## What's done

### ✅ Team + 5 files

Inside the `aissisted` project under Ron Gibori's Pro team, these files exist:

| # | File | Status | Purpose |
|---|---|---|---|
| 0 | `00 — Foundations` | ✅ Created + 5 reference pages scaffolded | Token visualization, type ramp, spacing/radius/shadow/motion reference |
| 1 | `01 — Component Library` | ✅ Created + 8 atom category pages scaffolded | Publishable team library (atoms → molecules) |
| 2 | `02 — Screens — Mobile` | ✅ Created (empty) | Organism / actual screen mocks |
| 3 | `03 — Prototypes` | ✅ Created (empty) | Clickable flows for review |
| 4 | `04 — Marketing & Brand` | ✅ Created (empty) | Deferred until product MVP |

### ✅ Foundation reference pages (in `00 — Foundations`)

Five pages scaffolded, ready for designer to populate:

| Page | Expected content |
|---|---|
| **Color** | Primitive swatches grid (white/graphite/soft-graphite/signal-red/aqua/midnight) + semantic mapping table |
| **Type** | Wordmark + 7 type styles each rendered at real size with token name labeled |
| **Spacing** | Visual grid of all spacing tokens (1/4px → 32/128px) |
| **Radius & Shadow** | Sample boxes at every radius + every shadow token |
| **Motion** | Animated frames demonstrating each duration/easing combo (use Smart Animate) |

### ✅ Component Library atom pages (in `01 — Component Library`)

Eight pages scaffolded, ready for atom design + variants:

| Page | Notes |
|---|---|
| **Pill CTAs** | primary, secondary, ghost, destructive, icon-only variants. Each with default/hover/pressed/disabled/loading states. |
| **Pill Chips** | toggle, multi-select. default/hover/selected/disabled. |
| **Number Chips** | 1–10 scale. default/selected. Smaller register than pill chips. |
| **Inputs** | text, email, near-borderless display variants. |
| **State Pill** | idle/listening/thinking/speaking/error states for voice modal chrome. |
| **Avatars (j-mark)** | sm (24px), md (32px), lg (56px). Aqua "j" identity primitive. |
| **Tags** | required/optional/preview variants. |
| **Geometric Markers** | square/ring/diamond/circle outlined variants for data-source category indicators. |

---

## What's NOT done (your next moves — or designer's)

### 🟡 Tokens Studio import — deferred

The DTCG token file lives at `packages/brand/aissisted-tokens.json` in the repo. To import:

1. Open `00 — Foundations`
2. Plugins menu → **Tokens Studio for Figma** → Run
3. Tokens Studio Settings → **Add new sync provider** → choose **"Local document"** (NOT JSONBin — that requires API key)
4. Import the JSON content from `packages/brand/aissisted-tokens.json`
5. Push to Figma → verify Variables panel populates (Color/Primitive, Color/Semantic, Typography, Spacing, Radius, Shadow, Motion, Layout)

If Local document doesn't load the file, fall back to:
- Figma's **native Variables import** — right-click on Foundations canvas → Local variables → Import → paste the JSON content directly

Once tokens land as Figma Variables, every component built in `01 — Component Library` can bind to them. Single source of truth = `packages/brand/aissisted-tokens.json` (synced from `packages/brand/tokens.css` which is the production source).

### 🟡 Foundation page content (5 pages × 30 min each = ~2.5 hours of design work)

The pages exist but are empty. Each needs:

**Color page:** swatch grid following the canvas-system reference style (six color cards with hex + percent ratio labels).

**Type page:** wordmark, headline, title, body, caption, eyebrow, data — each rendered with real token-sized text and a label showing the token name + size.

**Spacing page:** horizontal/vertical bars at each spacing value, each labeled (e.g. "spacing-8 = 32px — screen h-margin").

**Radius & Shadow page:** boxes at every radius (xs/sm/md/lg/xl/2xl/pill), and elevation samples at each shadow.

**Motion page:** trigger frames + Smart Animate connections demonstrating each duration/easing combo.

### 🟡 Component Library atoms (8 pages × ~30-60 min each = ~5-7 hours)

Each atom page needs:
1. Default state built using ONLY token variables (never hard-coded values)
2. Component conversion (Cmd+Opt+K)
3. Variants for each state (default/hover/pressed/disabled/loading/selected as applicable)
4. Component Properties (text, icon, size) via the Properties panel
5. Description with the spec reference (paste from `aissisted-design-spec.md` § 3.1)

Strict naming: `Type/Variant/State` — e.g. `Pill-CTA/Primary/Default`. This makes Code Connect mapping mechanical later.

### 🟡 Publish as Team Library

Once atoms are stable (don't have to wait for molecules):
1. Assets panel → Library icon → **Publish**
2. Changelog: `v0.1.0 — initial atoms (Pill-CTA, Pill-Chip, Number-Chip, State-Pill, Avatar-J, Tag, Geometric-Marker)`
3. Enable library in `02 — Screens — Mobile` and `03 — Prototypes`

After publish, every screen file inherits library updates automatically.

### 🟡 Code Connect setup (engineer-side, 30 min)

Once the library is published:

```bash
cd ~/aissisted
pnpm add -D @figma/code-connect
npx figma connect init
# follow wizard: paste Figma personal access token, framework=React TS, output=figma.config.json
```

Then for each component already in code:

```bash
npx figma connect create "https://figma.com/file/XXXX?node-id=YYY" \
  --component apps/web/components/ui/PillCTA.tsx
```

This generates `PillCTA.figma.tsx` mapping Figma variants → React props. Commit those.

---

## Cross-reference

| Asset | Location |
|---|---|
| Design spec (canon) | `docs/design-system/aissisted-design-spec.md` |
| Figma + Cowork setup runbook (full) | `docs/design-system/aissisted-figma-cowork-setup.md` |
| Tokens (W3C DTCG) | `packages/brand/aissisted-tokens.json` |
| Tokens (CSS production source) | `packages/brand/tokens.css` |
| Cowork brief format | `cowork-briefs/onboarding-cover.md` (first example, shipped) |

---

## What's already in code (ahead of Figma)

The cover surface (Surface 1) is already shipped in `apps/web` with canon-aligned styling — Tailwind v4 utilities working, Inter Tight + IBM Plex Mono + Libre Baskerville italic loaded, logo SVG rendering. This means the production code is **ahead of the Figma library** — the Figma library should match what's already shipped.

When you (or a designer) start building atoms in Figma, reference these production files as the source of truth for visual treatment:

- `apps/web/components/ui/PillCTA.tsx` — pill button reference
- `apps/web/components/ui/JeffreyAvatar.tsx` — Aqua j-mark reference
- `apps/web/components/ui/PreLabel.tsx` — pre-headline label (graphite + aqua variants)
- `apps/web/components/ui/CodeComment.tsx` — system-register subline pattern
- `apps/web/components/ui/TextLink.tsx` — secondary text-button
- `apps/web/components/onboarding/CoverSurface.tsx` — composition pattern
- `apps/web/components/onboarding/JeffreyIntroSurface.tsx` — composition pattern (Surface 2)
- `apps/web/components/patterns/PhoneFrame.tsx` — responsive canvas
- `apps/web/components/patterns/StatusBar.tsx` — phone-frame chrome

The canonical brand reference (palette swatches, type ramp, etc.) is in the existing `aissisted-system.html` Claude Design file — that file is the visual source of truth that `00 — Foundations` should mirror.

---

## Phase β workflow (recurring) — once library lands

Per `aissisted-figma-cowork-setup.md` §5, the loop for each subsequent surface:

```
Figma (designer iterates on a frame in 02 — Screens — Mobile)
   ↓ (designer renames frame "Ready: <screen>" + copies URL)
Cowork (drafts cowork-briefs/<screen>.md from the frame)
   ↓
Claude Code (implements brief into apps/web/*)
   ↓
Visual review (Chrome MCP DOM check + designer eyeball)
   ↓
PR + merge
```

The cover surface (Surface 1) was the proof-of-loop. Surface 2 (Jeffrey intro) is in flight as I write this.

---

## Estimated effort to design-system v0.1.0 complete

- ~2.5 hrs: Foundation pages content (designer)
- ~5-7 hrs: Component Library atoms (designer)
- ~30 min: Tokens Studio import (designer)
- ~30 min: Library publish + permissions
- ~30 min: Code Connect setup (engineer)

**Total: ~10 hours of design + 30 min of engineering** before v0.1.0 of the published library exists.

This is a multi-day effort spread across the week. Suggested order:

1. **Day 1:** Tokens Studio import + Foundation pages (Color + Type — the most-referenced)
2. **Day 2:** Foundation pages (Spacing + Radius/Shadow + Motion) + start atoms (Pill CTA + Pill Chip)
3. **Day 3:** Atoms (Number Chip + Input + Tag + Avatar)
4. **Day 4:** Atoms (State Pill + Geometric Markers) + publish library v0.1.0
5. **Day 5:** Code Connect mapping + first molecule (Phone Frame)

If Ron is driving solo without a designer, this is realistically 1-2 weeks of part-time work alongside engineering.

---

## Changelog

| Date | Event |
|---|---|
| 2026-04-30 | Workspace setup begun. Files 00 + 01 created via teach-mode + computer-use. |
| 2026-05-01 (early) | Files 02, 03, 04 created manually by Ron. |
| 2026-05-01 (late) | 5 Foundation reference pages + 8 Component Library atom category pages scaffolded by Cowork via direct Figma drive. Tokens Studio plugin installed but tokens import still deferred. |
| TBD | Designer (or Ron) populates pages with content; library publishes as v0.1.0. |

---

**Next concrete move for Ron:** decide between (a) running through Foundation page content yourself (~2.5 hrs design work) or (b) hiring a contract designer for ~1 week to ship the full v0.1.0 library while you focus on engineering surfaces 3-9 + Phase 2 backend work. Either is viable. The setup is now ready for either path.
