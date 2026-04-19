# Pill

**File:** `apps/site/components/pill.tsx`

IBM Plex Mono, uppercase, small. Sequence tags, status badges, category chips.

## Props

| Prop        | Type                                           | Default   |
|-------------|------------------------------------------------|-----------|
| `tone`      | `"ink" \| "brand" \| "data" \| "signal" \| "ok" \| "warn"` | `"ink"` |
| `className` | `string`                                       | —         |
| `children`  | `ReactNode`                                    | required  |

## Tones

- **ink** — neutral, `bg-surface-2 text-soft`. Default for category labels.
- **brand** — soft red tint. Use within 8% red budget. New features, alerts.
- **data** — midnight blue, white text. Intelligence/system category signals.
- **signal** — aqua tint. Activation states, live indicators.
- **ok** — green tint. Success, active, healthy states.
- **warn** — amber tint. Caution, review, pending states.

## Do

```tsx
// Sequence tag
<Pill tone="data">01 / 10</Pill>

// Status badges
<Pill tone="signal">Live</Pill>
<Pill tone="ok">Active</Pill>
<Pill tone="warn">Review</Pill>

// Category
<Pill>Science</Pill>
<Pill>Longevity</Pill>
```

## Don't

```tsx
// ✗ Never use for primary navigation
<nav>
  <Pill>Home</Pill>
  <Pill>About</Pill>
</nav>

// ✗ Never use as a button substitute
<Pill onClick={...}>Click me</Pill>

// ✗ Never use sentence case or punctuation
<Pill>This is a pill.</Pill>

// ✓ Uppercase short label, no punctuation
<Pill>BETA</Pill>
```

## Accessibility

- Purely presentational — `<span>` element. Not focusable by default.
- If a pill conveys status, ensure surrounding context provides the same info for screen readers (don't rely solely on pill color).
- 11px Mono at 0.08em tracking meets minimum legibility at 100% zoom.
