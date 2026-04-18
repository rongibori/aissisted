# Brand & product design sources — pointer index

This file is a **pointer index**, not a storage location. Large binary design sources (PSDs, Keynote decks, Illustrator files, fonts, and business PDFs) live on the Planner's workstation and are **intentionally not committed** to this repo.

Reasons they stay out of git:
- Binary size (single files range 60–120 MB; total set is ~234 MB)
- Git is the wrong store for iterative visual design files — no meaningful diff, bloats history
- These are source-of-truth working files, not release assets

When one of these needs to be used in product, the appropriate export (PNG, WebP, PDF, SVG) is committed to `docs/brand/assets/` or the relevant app asset folder.

---

## Canonical locations

**WIP design folder** — `~/Desktop/[WIP] Asssisted/`

| File | Type | Size | Purpose |
|------|------|------|---------|
| `AISSISTED {slide Deck.key` | Keynote | ~119 MB | Master pitch / product deck |
| `Aissisted [Flask Water Bottle].psd` | Photoshop | ~61 MB | Flask bottle product mockup source |
| `Aisssited [Water Bottle] Mockup.psd` | Photoshop | ~71 MB | Water bottle product mockup source |
| `Aisssited-[Water-Bottle]-Mockup.jpg` | JPEG | ~1.9 MB | Exported mockup preview |
| `Assisted_BrandingConceptAssets.ai` | Illustrator | ~435 KB | Branding concept asset sheet |
| `Briston.otf` | OpenType font | 163 KB | Display typeface (licensed — do not redistribute) |
| Product mockup PNGs (CBD oil, gummies, honey, mints, muscle gel) | PNG | varies | Product visual exploration |
| `Vitamins and Supplement - Business Brief.pdf` | PDF | — | Business brief |
| `Vitamins and Supplement - Business Plan.pdf` | PDF | — | Business plan draft |
| `Vitamins and Supplement - Market Overview.pdf` | PDF | — | Market overview |
| `Vitamins and Supplement - Projections.pdf` | PDF | — | Financial projections |

**Logo (committed)** — `docs/brand/assets/` holds the horizontal wordmark in four forms, all small enough to ship with the brand docs:

| File | Surface | Ink | Notes |
|------|---------|-----|-------|
| `Aissisted-logo-H.svg` | **primary** (light) | Graphite `#1C1C1E` | Use on 70%-white default surfaces. Matches locked Brand Bible token. |
| `Aissisted-logo-H-dark.svg` | inverse (dark) | White `#FFFFFF` | Use on graphite / midnight / red surfaces. |
| `Aissisted-logo-H-dark.png` | inverse (dark) | White | 455×85 raster fallback of the dark SVG — for email/social clients without SVG support. |
| `Aissisted-logo-H-red.svg` | iconic moment | Medical Red `#EE2B37` | Use sparingly on white for brand moments (campaign hero, cap-press extension). Not a general-purpose alternative to the graphite primary. |

**Gap:** no raster PNG of the primary (light-surface) variant yet. Export from `Aissisted-logo-H.svg` or from the Illustrator source when an email/social asset needs it.

---

## How to add a new design source

1. Drop the working file in `~/Desktop/[WIP] Asssisted/` (or a versioned replacement path).
2. Add a row to the table above with the path, type, size, and purpose.
3. If a committable export is produced (PNG/SVG/PDF under ~1 MB), place it in `docs/brand/assets/` and reference it from the relevant spec.

## How to access from another machine

These files are not backed up to the repo. To access them from another environment, use the owner's cloud backup (Dropbox / iCloud / external drive) — not git.

— Planner (Cowork) · 2026-04-17
