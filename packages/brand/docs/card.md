# Card

**File:** `apps/site/components/card.tsx`

Minimal content container. One-border, no-shadow aesthetic.

## Props

| Prop        | Type                              | Default     |
|-------------|-----------------------------------|-------------|
| `as`        | `ElementType`                     | `"div"`     |
| `variant`   | `"default" \| "data" \| "ghost"`  | `"default"` |
| `padding`   | `"none" \| "sm" \| "md" \| "lg"` | `"md"`      |
| `className` | `string`                          | —           |
| `children`  | `ReactNode`                       | required    |

## Variants

- **default** — white surface, hairline `border-line`. Standard content panels.
- **data** — midnight blue (`bg-data`) surface, white text. Intelligence and data panels. Counts toward 2% aqua/midnight budget — use sparingly.
- **ghost** — transparent background, hairline border. Subtle separation without mass.

## Do

```tsx
// Standard content card
<Card>
  <H4>Formula insight</H4>
  <Body className="mt-2">Your morning protocol updated.</Body>
</Card>

// Data panel
<Card variant="data">
  <Eyebrow tone="data">Vitamin D</Eyebrow>
  <DataValue className="text-4xl text-white mt-2">128</DataValue>
  <Body className="text-white/70">ng/mL · optimal range</Body>
</Card>
```

## Don't

```tsx
// ✗ Never add drop shadow — premium reads as flat
<Card className="shadow-lg">...</Card>

// ✗ Never add border-radius — squared geometry is intentional
<Card className="rounded-lg">...</Card>

// ✗ Never nest data cards in data cards — one level only
<Card variant="data">
  <Card variant="data">...</Card>
</Card>
```

## Accessibility

- Use `as="article"` or `as="section"` when the card represents a discrete content region.
- Ensure sufficient contrast in `data` variant: white text on `#0B1D3A` passes WCAG AA (contrast ratio > 10:1).
