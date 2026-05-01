# Cowork Brief — Onboarding Cover (Surface 1)

**Target:** First brand-defining surface. Port to production React in `apps/web/app/onboarding/page.tsx` (or `apps/web/components/onboarding/CoverSurface.tsx` as part of a multi-surface flow).
**Source of truth:** `aissisted-system.html` (Claude Design canvas) + `jeffrey/CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md` Surface 1 spec.
**Phase:** Phase 2 — first end-to-end Figma → Cowork → Claude Code → PR loop.
**Owner:** Claude Code session driven by Ron.

---

## 1. Goal

Render the cover surface ("Your Body. Understood.") as a production React component in `apps/web`, using locked brand tokens from `packages/brand/tokens.css` (Tailwind v4 `@theme`) and ready to slot into the broader onboarding flow.

This is the brand-defining moment. If this surface is wrong, every downstream surface is wrong.

---

## 2. Component tree

```
<OnboardingShell>                          // page-level wrapper, full viewport white bg
  <PhoneFrame mode="responsive">           // mobile-first; phone-frame chrome on ≥768px viewport
    <StatusBar time="9:41" />              // 9:41 / WiFi / battery
    <CoverSurface>
      <Wordmark />                         // lowercase serif italic "aissisted", 24px Baskerville italic, centered, ~80px from top
      <PreLabel>EST. 2026 · PERSONALIZED INTELLIGENCE</PreLabel>
      <HeadlineStack>
        <span className="text-ink">Your Body.</span>
        <span className="text-brand">Understood.</span>
      </HeadlineStack>
      <AccentLines>
        <p>Built from your data.</p>
        <p>Designed for your life.</p>
      </AccentLines>
      <PillCTA variant="primary" onClick={advance}>Begin</PillCTA>
      <FooterMicro>~ 4 min · interrupted anytime</FooterMicro>
    </CoverSurface>
  </PhoneFrame>
</OnboardingShell>
```

---

## 3. Token references (use Tailwind utility classes — NEVER hex)

| Element | Token / utility class |
|---|---|
| Page background | `bg-surface` (= `--surface` = `#FFFFFF`) |
| Wordmark color | `text-ink` (= `#1C1C1E`) |
| Wordmark font | `font-accent italic` (Baskerville italic) |
| Wordmark size | `text-[24px]` (or define `text-logotype` utility if not present) |
| PreLabel font | `font-system` (IBM Plex Mono) |
| PreLabel size | `text-[11px]` with `tracking-[0.18em] uppercase` |
| PreLabel color | `text-soft` (= 70% graphite equivalent) |
| Headline font | `font-display` (Briston Bold) |
| Headline size | `text-[56px]` with `tracking-[-0.025em]` and `leading-[0.92]` |
| Headline line 1 color | `text-ink` |
| Headline line 2 color | **`text-brand`** (= `#EE2B37`) — the canonical Signal Red moment |
| Accent font | `font-accent italic` (Baskerville italic) |
| Accent size | `text-[17px]` with `leading-[1.45]` |
| Accent color | `text-soft` (~80% graphite) |
| CTA shape | `rounded-pill` (= 999px) |
| CTA fill | `bg-ink` |
| CTA text | `text-surface` (= white) |
| CTA hover | `hover:bg-muted` (transitions to soft graphite #2E2E2E) |
| CTA font | `font-system font-medium text-[14px] tracking-[0.06em]` |
| CTA padding | `py-[18px] w-full` (full-width content area) |
| Footer micro | `font-system text-[11px] tracking-[0.06em] text-soft` |

**Rule:** No raw hex values. No `text-[#1C1C1E]`. Always reference tokens through utility classes. If a token isn't exposed as a utility, either define it in `packages/brand/tokens.css` `@theme` block or use a CSS variable directly (`text-[color:var(--ink)]`).

---

## 4. Layout / spacing

```
PhoneFrame inner-screen:
  ├── 44px StatusBar (top)
  ├── 56px gap
  ├── Wordmark (centered, ~24px display height)
  ├── 88px gap                                       (spacing-22 — eyebrow lockup gap, brand signature)
  ├── PreLabel (centered, ~13px display height)
  ├── 32px gap
  ├── HeadlineStack (centered, ~104px display height — two lines at 56px × line-height 0.92)
  ├── 64px gap                                       (spacing-16 — section accent gap, brand signature)
  ├── AccentLines (centered, ~48px display height — two lines at 17px × line-height 1.45)
  ├── flex spacer
  ├── PillCTA (anchored, 56px tall, 32px from bottom edge or 80px depending on safe-area)
  ├── 24px gap
  └── FooterMicro (centered, 80px from bottom — spacing-20 footer anchor)
```

Mobile (<768px viewport): full-viewport canvas, no phone-frame chrome, status bar replaced by browser/native chrome.
Desktop (≥768px viewport): phone-frame mockup canvas centered (max-width 380px, height 820px, border-radius 56px outer / 44px inner, padding 12px).

---

## 5. Motion / state notes

### Entrance stagger (cubic-bezier(0.22, 1, 0.36, 1), per design spec §2.4)

| Element | Delay | Animation |
|---|---|---|
| Wordmark | 0ms | fade-in 720ms |
| PreLabel | 200ms | fade-in 720ms |
| Headline line 1 ("Your Body.") | 320ms | fade-up from y+24px, 720ms |
| Headline line 2 ("Understood.") | 600ms | fade-up from y+24px, 720ms |
| Accent | 900ms | fade-in 720ms |
| CTA | 1100ms | fade-in 720ms |
| FooterMicro | 1300ms | fade-in 720ms |

Implementation: pure CSS `@keyframes` with `animation-delay` per element. **No framer-motion** for v0 (keeps deps lean per the port plan).

### Reduced motion

`@media (prefers-reduced-motion: reduce)` collapses all stagger to a single 320ms cross-fade. No translate.

### CTA interaction

- Default: graphite filled, white text
- Hover: background transitions to soft graphite (`bg-muted`) over 200ms ease-out, no transform
- Active/press: scale(0.98) for 120ms then return
- Disabled: opacity 40%, cursor not-allowed (this surface's CTA is never disabled — Begin is always available)

### onClick behavior

`Begin` advances to Surface 2 (Jeffrey introduction). Implementation depends on whether the onboarding flow is single-page (component state) or routed (Next.js `useRouter`). Per `CLAUDE_CODE_ONBOARDING_PORT_PLAN.md` §2.3, single-page surface-as-component is recommended. Use `useReducer` flow state from `apps/web/app/onboarding/hooks/useOnboardingFlow.ts`.

---

## 6. Accessibility

- Wordmark + PreLabel + Headline are decorative for the first surface — no ARIA labels needed; semantic structure (`<h1>` for headline, `<p>` for accent) sufficient
- CTA: `<button type="button">` with default semantics; aria-label optional since visible text "Begin" is clear
- Status bar: `aria-hidden="true"` (decorative chrome, not informational)
- Phone frame chrome (rounded device frame): `aria-hidden="true"` on all decorative elements
- Skip-to-content link should appear at top of `<OnboardingShell>` for keyboard users (jumps focus past the wordmark to the CTA)
- Focus state on CTA: 3px aqua-at-25% offset shadow ring (`focus-visible:ring-2 focus-visible:ring-signal/25`)
- Test with VoiceOver: announces "Your Body. Understood. Begin button" without reading decorative chrome

---

## 7. Existing components to reuse vs. create

**Reuse (verify these exist; if not, this brief implies creating them as atoms):**
- `<PhoneFrame>` — likely doesn't exist; create at `apps/web/components/patterns/PhoneFrame.tsx`
- `<StatusBar>` — likely doesn't exist; create at `apps/web/components/patterns/StatusBar.tsx`
- `<PillCTA>` — check `apps/web/components/ui/`. If shadcn `<Button>` is wired, extend with `variant="primary-pill"` matching this spec.

**Create:**
- `<CoverSurface>` — surface-specific composition; lives in `apps/web/components/onboarding/`
- `<Wordmark>`, `<PreLabel>`, `<HeadlineStack>`, `<AccentLines>`, `<FooterMicro>` — primitives in `apps/web/components/ui/` if reused across other onboarding surfaces; else inline as styled spans within `CoverSurface`

Recommend extracting all primitives — they'll be reused on Surface 8 (Reveal), Surface 9 (Subscription), and analytics surfaces.

---

## 8. Open questions (Cowork → Ron before implementation)

1. **Does `apps/web` already have `font-accent` (Baskerville) loaded?** Check `apps/web/app/layout.tsx` for font imports. If not, add via `next/font/local` or `next/font/google` (Libre Baskerville is the open-source equivalent). Block implementation until confirmed.
2. **Briston webfont license** — confirm production licensing per design spec §9. If not yet licensed, fall back to `Inter Tight` per `packages/brand/tokens.css` comment.
3. **Routing pattern** — single-page surface-as-component (recommended in port plan) vs. nested routes? Implementation differs.
4. **`<PillCTA>` exists or new?** — verify before recreating; if shadcn `<Button>` is the existing primitive, extend it rather than introducing a new component.
5. **Onboarding state persistence** — sessionStorage fallback for v0, or wire to `/api/onboarding/state` endpoint immediately? Port plan recommends sessionStorage for v0.

---

## 9. Acceptance criteria

Before merging the PR:

- [ ] Pixel-match against Claude Design Surface 1 mock (within 2px tolerance on positioning; exact match on typography + colors)
- [ ] All hex values replaced by Tailwind utility classes
- [ ] Stagger animation matches the 6-step timeline above (verify with screen recording at 30fps)
- [ ] `prefers-reduced-motion` collapses stagger correctly
- [ ] Focus state visible on CTA via keyboard Tab
- [ ] Mobile (<768px) renders full-viewport without phone-frame chrome
- [ ] Desktop (≥768px) renders inside phone-frame mockup
- [ ] TypeScript: no `any`, no `@ts-ignore`
- [ ] `pnpm --filter @aissisted/web typecheck` exits 0
- [ ] Smoke test (`apps/web/app/onboarding/page.tsx` renders) passes
- [ ] Brand color ratio respected: Signal Red appears on exactly ONE element (the word "Understood.")

---

## 10. Implementation guidance for Claude Code

```
Read this brief end-to-end. Then:

1. Survey apps/web/components/ to identify reusable primitives
2. Survey apps/web/app/onboarding/ for existing scaffolding
3. Identify any missing dependencies (Baskerville font loading, etc.)
4. Surface the open questions in §8 to Ron before writing code
5. Only after questions resolved, implement:
   - Primitives in apps/web/components/ui/
   - Surface composition in apps/web/components/onboarding/CoverSurface.tsx
   - Page-level wrapper in apps/web/app/onboarding/page.tsx
6. Add CSS keyframes for entrance stagger in apps/web/app/onboarding/animations.css
7. Open PR with screenshots from local dev server (npm run dev → http://localhost:3000/onboarding)

Stay scoped: only touch apps/web/* and packages/brand/* if needed.
DO NOT touch packages/jeffrey, packages/jeffrey-evals, or backend
routes. If backend integration is needed (auth, identity capture),
leave a TODO comment and stub client-side.
```

---

## 11. Changelog

| Date | Change | By |
|---|---|---|
| 2026-04-30 | v1 brief drafted. First Cowork → Claude Code loop test. | Cowork |
