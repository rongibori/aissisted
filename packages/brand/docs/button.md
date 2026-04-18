# Button

**File:** `apps/site/components/button.tsx`

Three tones, three sizes. The only interactive primitive in M2.

## Props

| Prop        | Type                              | Default       |
|-------------|-----------------------------------|---------------|
| `tone`      | `"primary" \| "secondary" \| "ghost"` | `"secondary"` |
| `size`      | `"sm" \| "md" \| "lg"`           | `"md"`        |
| `disabled`  | `boolean`                         | `false`       |
| `className` | `string`                          | —             |
| `children`  | `ReactNode`                       | required      |

All other `ButtonHTMLAttributes` pass through.

## Tones

- **primary** — brand red (`bg-brand`). Conversion actions only: hero CTA, lead form submit, access request. One per page beat. Lives in the 8% red budget.
- **secondary** — ink ring on white. Navigation, secondary CTAs, supporting actions.
- **ghost** — no border, subtle hover. Inline or tertiary contexts.

## Sizes

- **sm** — `h-9 px-4` — compact lists, table rows
- **md** — `h-11 px-6` — default
- **lg** — `h-14 px-8` — hero beats, prominent CTAs

## Do

```tsx
// Hero: one primary, one supporting ghost
<Button tone="primary" size="lg">Begin your protocol</Button>
<Button tone="ghost">Learn how it works</Button>

// Form submit
<Button tone="primary" type="submit">Request access</Button>
```

## Don't

```tsx
// ✗ Never two primary buttons in one beat
<Button tone="primary">Primary one</Button>
<Button tone="primary">Primary two</Button>

// ✗ Never literal hex or Tailwind color overrides
<Button className="bg-red-500">...</Button>

// ✗ Never copy that prompts ("Click here", "Submit now")
<Button tone="primary">Click here</Button>

// ✓ Butler cadence — specific, earned, quiet
<Button tone="primary">Continue</Button>
```

## Accessibility

- Focus ring in `ring-data` (midnight blue) — distinct from brand red.
- `disabled` applies `pointer-events-none opacity-50`. Always include `aria-disabled` if a disabled button must remain focusable for screen readers.
- Minimum 44×44px touch target on `md` and `lg` sizes.
