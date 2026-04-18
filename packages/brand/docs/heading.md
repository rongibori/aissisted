# Heading

**File:** `apps/site/components/heading.tsx`

Polymorphic heading component. Routes to H1–H4 type-scale roles.

## Props

| Prop        | Type                   | Default |
|-------------|------------------------|---------|
| `level`     | `1 \| 2 \| 3 \| 4`    | `1`     |
| `as`        | `ElementType`          | —       |
| `className` | `string`               | —       |
| `children`  | `ReactNode`            | required |

## Type scale mapping

| Level | Size (desktop) | Weight | Tracking   | Font         |
|-------|---------------|--------|------------|--------------|
| 1     | 60px          | 700    | -0.01em    | IBM Plex Sans |
| 2     | 48px          | 700    | -0.01em    | IBM Plex Sans |
| 3     | 36px          | 600    | -0.01em    | IBM Plex Sans |
| 4     | 30px          | 600    | -0.005em   | IBM Plex Sans |

## Usage

```tsx
// Page title
<Heading level={1}>Your Body. Understood.</Heading>

// Section header
<Heading level={2}>How it works</Heading>

// Sub-section
<Heading level={3}>Your protocol, adapted weekly</Heading>

// As override — H2 scale on a div (aria-labelledby pattern)
<Heading level={2} as="div">Rendered as div</Heading>
```

## Do

- Use in hierarchical document order. Don't skip levels (h1 → h3).
- Prefer `<Heading>` over importing `H1/H2/H3/H4` directly — the level prop ensures semantic element and scale are always in sync.

## Don't

```tsx
// ✗ Never override font-family or weight inline
<Heading level={1} className="font-mono">...</Heading>

// ✗ Never use heading for non-heading text
<Heading level={3}>This is a paragraph</Heading>

// ✗ Never all-caps (Brand Bible rule)
<Heading level={1} className="uppercase">...</Heading>
```

## Accessibility

- Default element matches semantic level (`level={2}` → `<h2>`).
- `as` prop allows decorative use without creating landmark confusion.
- Color contrast: default `text-ink` (#1C1C1E) on white exceeds WCAG AA for all sizes.
