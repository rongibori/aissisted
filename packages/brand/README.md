# @aissisted/brand

Shared Brand Bible v1.1 design tokens. Single source of truth for every Aissisted surface.

## What lives here

- `tokens.css` — color palette, semantic color mapping, Tailwind v4 `@theme` exposure.

## What does NOT live here

- Typography stacks (per-app scope — each surface ships its own font pipeline)
- Font-face declarations
- App-specific utility classes (`.rally-cry`, `.font-display`, scrollbar styles)

## Usage

Consumers import the CSS at the top of their app's `globals.css`:

```css
@import "tailwindcss";
@import "@aissisted/brand/tokens.css";

/* App-specific typography tokens + utilities live below */
```

Both `apps/web` and `apps/site` import from this single file. Any change to the color palette ships to every surface simultaneously — drift cannot happen by accident.

## Source of truth

Every token here is anchored to `docs/brand/BRAND_BIBLE.md` (v1.1 locked). Any change to a token value requires a corresponding Brand Bible update in the same PR.
