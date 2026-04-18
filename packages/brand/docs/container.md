# Container

**File:** `apps/site/components/container.tsx`

Single source of page gutters and max-widths. Every section uses one of these.

## Props

| Prop        | Type                                        | Default  |
|-------------|---------------------------------------------|----------|
| `as`        | `ElementType`                               | `"div"`  |
| `width`     | `"narrow" \| "reading" \| "wide" \| "full"` | `"wide"` |
| `className` | `string`                                    | —        |
| `children`  | `ReactNode`                                 | required |

## Width values

| Width     | Max-width | Use case                               |
|-----------|-----------|----------------------------------------|
| `narrow`  | 672px     | Single-column forms, narrow text       |
| `reading` | 768px     | Long-form prose, blog posts            |
| `wide`    | 1024px    | Default sections, hero content         |
| `full`    | 1280px    | Landing pages, investor room, catalog  |

Horizontal padding is always `px-6 md:px-8` — never override this.

## Usage

```tsx
// Default hero section
<Container>
  <Heading level={1}>Your Body. Understood.</Heading>
</Container>

// Narrow form
<Container width="narrow">
  <LeadCaptureForm />
</Container>

// Full-bleed section with internal container
<section className="bg-data">
  <Container width="full" className="py-24">
    <MetricCard ... />
  </Container>
</section>
```

## Don't

```tsx
// ✗ Never set bespoke max-w or px values outside this component
<div className="max-w-3xl px-4 mx-auto">...</div>

// ✗ Never center text globally inside container — let children decide
<Container className="text-center">...</Container>

// ✓ Center text in the specific child that needs it
<Container>
  <H1 className="text-center">...</H1>
</Container>
```
