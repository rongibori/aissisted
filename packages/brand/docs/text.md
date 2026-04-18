# Text

**File:** `apps/site/components/text.tsx`

Body text component with variant routing. Maps to the correct typography role automatically.

## Props

| Prop        | Type                                                              | Default   |
|-------------|-------------------------------------------------------------------|-----------|
| `variant`   | `"body" \| "body-sm" \| "lede" \| "label" \| "data" \| "jeffrey" \| "system"` | `"body"` |
| `as`        | `ElementType`                                                     | —         |
| `className` | `string`                                                          | —         |
| `children`  | `ReactNode`                                                       | required  |

## Variants

| Variant    | Font         | Size | Notes                                      |
|------------|-------------|------|---------------------------------------------|
| `body`     | Plex Sans   | 16px | Default prose. `<p>` element.               |
| `body-sm`  | Plex Sans   | 14px | Secondary prose, metadata.                  |
| `lede`     | Plex Sans   | 18px | Intro paragraphs, directly after headings.  |
| `label`    | Plex Mono   | 12px | Uppercase tracked labels, form labels.      |
| `data`     | Plex Mono   | 13px | Metric values, tabular numerics.            |
| `jeffrey`  | Plex Sans   | 16px | Jeffrey voice prose (approved deviation).   |
| `system`   | Plex Mono   | 12px | Timestamps, citations, system affordances.  |

## Usage

```tsx
// Default body prose
<Text>
  Your formula adapts every 14 days based on updated biomarkers
  and behavioral signals.
</Text>

// Intro paragraph
<Text variant="lede">
  Precision health built around your biology, not an average.
</Text>

// Form label
<Text variant="label" as="label" htmlFor="email">
  Email address
</Text>

// Metric value
<Text variant="data" className="text-3xl text-data">128</Text>

// Timestamp
<Text variant="system">Updated 2 minutes ago</Text>
```

## Don't

```tsx
// ✗ Never wire font-family at call sites
<p className="font-mono">System text</p>

// ✓ Use variant instead
<Text variant="system">System text</Text>

// ✗ Never use label/data variants for prose
<Text variant="label">
  Long paragraph about your health outcomes and formula changes.
</Text>
```

## Accessibility

- All variants use legible sizes with adequate line-height.
- `label` variant: `text-ink/70` at 12px — verify contrast in context if used over non-white backgrounds.
- `data` variant: tabular-nums for number alignment in tables/lists.
