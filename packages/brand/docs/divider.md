# Divider

**File:** `apps/site/components/divider.tsx`

Hairline horizontal rule in `border-line`. Structural or decorative.

## Props

| Prop          | Type      | Default |
|---------------|-----------|---------|
| `decorative`  | `boolean` | `true`  |
| `className`   | `string`  | —       |

## Usage

```tsx
// Decorative (default) — between sections, visually separates without semantic weight
<Divider />

// Structural — between genuinely distinct content regions
<Divider decorative={false} />

// With explicit spacing
<Divider className="my-8" />
```

## Do

- Use between sections to create breathing room without adding color mass.
- Apply spacing via `className` — the component carries no intrinsic margin so callers control breathing explicitly.

## Don't

```tsx
// ✗ Never color the divider with brand red or signal — it becomes noise
<Divider className="border-brand" />

// ✗ Never thicken — hairline only (1px)
<Divider className="border-t-2" />
```

## Accessibility

- `decorative={true}` (default): `aria-hidden="true"` + `role="presentation"` — screen readers skip it.
- `decorative={false}`: renders a plain `<hr>` which has implicit `role="separator"`. Use when the horizontal rule marks a meaningful section boundary.
