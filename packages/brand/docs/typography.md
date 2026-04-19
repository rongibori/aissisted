# Typography

## Font roles

| Role | Family | Usage |
|---|---|---|
| Display / Headline | **Briston Bold** → IBM Plex Sans Variable Bold (fallback) | H1 rally cries, hero headlines, specimen moments |
| Body / Prose | IBM Plex Sans Variable | Running text, paragraphs, UI copy |
| System / Mono | IBM Plex Mono | Code, data labels, Pill components, `UILabel` |
| Accent / Serif | IBM Plex Serif | Pull-quotes, editorial asides |

## Briston Bold (display font)

Briston Bold is the Aissisted wordmark face — confident, medical-grade, and unambiguous. It carries the display weight of the brand and should only appear at large sizes where its character reads clearly.

**Current status:** `@font-face` stub present in `apps/site/app/globals.css`. Font files (`Briston-Bold.woff2`, `Briston-Bold.woff`) must be placed at `apps/site/public/fonts/`. Until files are present, `font-display: swap` automatically renders IBM Plex Sans Variable Bold as the fallback — no layout shift, no broken headline.

### CSS variable

```css
/* packages/brand/tokens.css */
--font-display: "Briston Bold", "IBM Plex Sans Variable", "IBM Plex Sans",
  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### TypeScript constant

```ts
import { fontFamily } from "@aissisted/brand/tokens";

fontFamily.display;
// "Briston Bold", "IBM Plex Sans Variable", "IBM Plex Sans", -apple-system, …
```

### Tailwind utility

```tsx
<h1 className="font-display font-bold text-[72px] tracking-[-0.025em] leading-[1.02]">
  Your body is the signal.
</h1>
```

Briston Bold should ONLY appear in `font-display` role. Do not use it for body text, UI labels, or at sizes below 32px — it becomes illegible and undermines the system weight.

## IBM Plex Sans Variable (body)

Self-hosted via `@fontsource/ibm-plex-sans`. Variable axes: `wght` 100–700. Use `font-sans` Tailwind utility. No CDN dependency.

**Do:** paragraphs, hero subheadings, navigation labels, form labels.  
**Do not:** code snippets, timestamps, data values — those belong to IBM Plex Mono.

## IBM Plex Mono (system)

Self-hosted via `@fontsource/ibm-plex-mono`. Use `font-system` Tailwind utility (mapped in `apps/site/app/globals.css`). Powers all `Pill` components, `UILabel`, `DataValue`, and inline code spans.

Tracking: `0.08em` uppercase for Pill/label, `0.01em` for inline data values.

## IBM Plex Serif (accent)

Self-hosted via `@fontsource/ibm-plex-serif`. Use `font-serif` Tailwind utility. Reserved for editorial pull-quotes and `JeffreyText` variant only. Not a primary typographic role — budget it like the aqua accent color (2% palette share).

## Type scale

All sizes are defined as CSS custom properties in `packages/brand/tokens.css` and mirrored in `tokens.ts`. Never use raw `px` or `rem` values at component call sites.

| Token | Size | Role |
|---|---|---|
| `--font-size-display` | 72px (4.5rem) | Rally cry, hero headline |
| `--font-size-h1` | 48px (3rem) | Page titles |
| `--font-size-h2` | 32px (2rem) | Section headings |
| `--font-size-h3` | 24px (1.5rem) | Sub-section |
| `--font-size-h4` | 20px (1.25rem) | Card headings, lede labels |
| `--font-size-body-lg` | 18px (1.125rem) | Lede / intro paragraphs |
| `--font-size-body` | 16px (1rem) | Default prose |
| `--font-size-body-sm` | 14px (0.875rem) | Secondary prose, captions |
| `--font-size-mono-lg` | 15px (0.9375rem) | Prominent UI labels |
| `--font-size-mono` | 13px (0.8125rem) | Inline system affordances |
| `--font-size-caption` | 12px (0.75rem) | Timestamps, footnotes |

## Components that apply these roles

- `Heading` — polymorphic `level={1|2|3|4}`, maps to H1–H4 typography roles
- `Text` — `variant` prop routes to Body / Lede / UILabel / DataValue / JeffreyText / JeffreySystem
- `Pill` — always `font-system` (IBM Plex Mono), 11px, `tracking-[0.08em]`, uppercase
- `RallyCry` — `font-display` at `--font-size-display`, only one per page
