# Aissisted Foundation Builder — Figma plugin

A development plugin that builds the design-system foundation pages of the `aissisted` Figma file programmatically. v1 ships the **Color page**; Type, Spacing, Radius & Shadow, and Motion are stubbed for follow-up.

This eliminates the manual click-by-click build of swatch grids, header treatments, and component conversions. Output is deterministic — same v2.1 ratio canon every run, zero drift.

---

## Install (one time, ~60 seconds)

1. Open Figma desktop
2. Top menu: **Plugins → Development → Import plugin from manifest...**
3. Navigate to `~/aissisted/tools/figma-foundation-builder/`
4. Select **`manifest.json`** → Open

The plugin now appears under **Plugins → Development → Aissisted Foundation Builder**.

---

## Run

1. Open the `aissisted` project → `00 — Foundations` file
2. Switch to the **Color** page (left sidebar)
3. Top menu: **Plugins → Development → Aissisted Foundation Builder → Build Color page**

In ~2 seconds you'll see:

- A `Brand Reference` frame (1288×880, white) on the canvas
- Header block: `BRAND REFERENCE` eyebrow + `The system, locked.` headline + `Mirrors packages/brand/tokens.css. No invention.` subline
- 6 swatch components in two rows (White / Graphite / Soft Graphite | Signal Red / Aqua / Midnight)
- Each card: ratio %, name, hex — text inverts on dark fills, 1px graphite-at-8% stroke on the White card
- Each card converted to a `Swatch/{Name}` component, ready for the Assets panel

The plugin notifies in the bottom toast whether it loaded **Briston** (your paid display font) or fell back to **Inter Tight Bold**. If it fell back, you have two options: ignore (Inter Tight is a defensible visual proxy) or upload Briston into Figma and re-run.

---

## Idempotency

The plugin checks for an existing `Brand Reference` frame on the active page before building. If one exists, it bails with a notice rather than stacking duplicates. To rebuild, delete the existing frame and re-run.

---

## Canon

Sources of truth — keep these in sync with the plugin output:

- `docs/design-system/aissisted-design-spec.md` §2.1 — ratio + role table
- `packages/brand/tokens.css` — production CSS tokens
- `packages/brand/aissisted-tokens.json` — DTCG token export

The v2.1 ratio (May 2026):

```
70% white · 8% graphite · 4% soft graphite · 15% red · 2% aqua · 1% midnight
```

If any of these source files change, update `SWATCHES` in `code.js` and bump the plugin version.

---

## Roadmap

- [x] **v0.1** — Color page (current)
- [ ] **v0.2** — Type page (wordmark + 7 type styles at real size)
- [ ] **v0.3** — Spacing page (1/4px → 32/128px visual grid)
- [ ] **v0.4** — Radius & Shadow page
- [ ] **v0.5** — Motion page (animated demos via Smart Animate connectors)
- [ ] **v1.0** — `Build all foundation pages` command (single click → entire library)

When you want a new page, ping with the spec and I'll extend `code.js` with a new builder function + menu command.

---

## Files

| File | Role |
|---|---|
| `manifest.json` | Plugin metadata + menu commands |
| `code.js` | Plugin logic (vanilla JS, no build step) |
| `README.md` | This file |

No `package.json`, no compile step, no dependencies. Pure Figma Plugin API.

---

## Troubleshooting

**"Switch to the 'Color' page first, then run again."**
You're on the wrong page. Click the `Color` page in the left sidebar of `00 — Foundations`.

**"A 'Brand Reference' frame already exists on this page."**
Delete the existing frame, then re-run.

**"Required fonts could not load."**
Figma can't find IBM Plex Mono / Inter Tight / Inter (the resolution chain). Open Figma → Preferences → Font Manager and verify these are present. IBM Plex Mono and Inter are both Google Fonts and should be available by default.

**Briston fallback message**
Expected if Briston isn't uploaded to your Figma org. Either upload it (Org settings → Fonts → upload .otf/.ttf) and re-run, or accept Inter Tight Bold as the visual proxy until Briston is licensed in.
