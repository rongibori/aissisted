# Cowork Brief — Jeffrey Introduction (Surface 2)

**Target:** Second surface of onboarding. Introduces Jeffrey via the canonical voice copy + Aqua "j" avatar primitive. Establishes the Jeffrey-identity pattern that propagates across analytics, voice modal, and any future "Jeffrey speaks" moment.
**Source of truth:** `aissisted-system.html` Jeffrey introduction mock + `jeffrey/CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md` Surface 2 spec.
**Builds on:** Surface 1 (cover) — already shipped at `apps/web/app/onboarding/page.tsx`. PhoneFrame, StatusBar, PillCTA, and animations.css all exist; reuse where applicable.
**Phase:** Phase β surface 2/9.
**Owner:** Claude Code session driven by Ron.

---

## 1. Goal

Render the Jeffrey introduction surface — second beat of the onboarding flow — as a production React component. Surface establishes:

1. **Aqua "j" avatar primitive** — reusable across analytics LIVE card, voice modal state pill, Jeffrey recommendation card. **This is the most important deliverable** beyond the surface itself.
2. **Canonical voice copy** — "I'm Jeffrey. / I learn you, then / I get out of the / way." Not paraphrased. Not adapted. Exact.
3. **Code-comment subline pattern** — `// listens. answers. adapts.` / `// never replaces a clinician.` — system-register voice for technical sublines.
4. **Surface-to-surface navigation** — Begin on Cover advances to Jeffrey intro; Continue (or Skip voice) on Jeffrey intro advances to Surface 3.

---

## 2. Component tree

```
<OnboardingShell>                              // already exists (page.tsx)
  <PhoneFrame mode="responsive">               // already exists
    <StatusBar />                              // already exists; show on md+ only
    <JeffreyIntroSurface onAdvance={next} onSkipVoice={skipVoice}>
      <PreLabel variant="aqua">               // NEW variant — Aqua text + leading bullet
        ● VOICE COMPANION · V1.2
      </PreLabel>
      <JeffreyAvatarBlock>                     // NEW primitive
        <JeffreyAvatar size="lg" />            // aqua "j" 56px circle
        <div>                                  // label stack right of avatar
          <span class="jeffrey-label">JEFFREY</span>
          <span class="jeffrey-status">· speaking</span>
        </div>
      </JeffreyAvatarBlock>
      <QuotedHeadline>                         // 4-line Briston Bold quote
        "I'm Jeffrey.
        I learn you, then
        I get out of the
        way."
      </QuotedHeadline>
      <CodeComment>                            // NEW primitive (also reusable)
        // listens. answers. adapts.
        // never replaces a clinician.
      </CodeComment>
      <ControlBar>
        <TextLink onClick={onSkipVoice}>Skip voice</TextLink>
        <PillCTA onClick={onAdvance}>Continue →</PillCTA>
      </ControlBar>
    </JeffreyIntroSurface>
  </PhoneFrame>
</OnboardingShell>
```

---

## 3. Token references (Tailwind utility classes — never hex)

| Element | Class / token |
|---|---|
| Page bg | `bg-surface` (= `--surface` = `#FFFFFF`) — same as cover |
| Pre-label background bullet | `text-signal` (= aqua `#00C2D1`) — the "●" character |
| Pre-label text | `text-signal` (Aqua, the "VOICE COMPANION · V1.2" string) |
| Pre-label font | `font-system` (IBM Plex Mono) |
| Pre-label tracking | `tracking-[0.18em] uppercase text-[11px]` |
| Avatar bg | `bg-signal/20` (aqua at ~20-24% — verify with eye + adjust if too pale) |
| Avatar border | `border-2 border-signal` (2px solid aqua) |
| Avatar "j" character | `text-signal font-display font-bold text-[28px]` (Briston/Inter Tight Bold 28px Aqua) |
| Avatar size | 56px × 56px circle (`w-14 h-14 rounded-full`) |
| Jeffrey label | `font-system text-[13px] tracking-[0.18em] uppercase text-ink font-medium` |
| "· speaking" status | `font-system text-[12px] text-soft italic` |
| Headline | `font-display font-bold text-[32px] tracking-[-0.02em] leading-[1.15] text-ink` |
| Headline color | `text-ink` (= `#1C1C1E` graphite — NO Signal Red on this surface) |
| Code-comment subline | `font-system text-[13px] text-soft leading-relaxed` |
| Code-comment "//" prefix | `text-muted` (slightly dimmer than text — graphite at ~50%) |
| Skip voice link | `font-system text-[14px] text-soft hover:text-ink` |
| Continue CTA | Use existing `<PillCTA>` — same styling as cover Begin |
| Avatar glow on entrance | `shadow-[0_0_24px_rgba(0,194,209,0.32)]` — fades to subtle steady-state |

**Rule (re-emphasized):** No hex values. Reference tokens through utility classes. The Aqua usage on this surface is heavy — that's correct, this IS the "Jeffrey identity" moment, all the aqua earns its place as data/identity emphasis.

---

## 4. Layout / spacing

```
PhoneFrame inner-screen (380px wide on desktop):
  ├── 44px StatusBar (top, md+ only)
  ├── 56px gap (pt-14)
  ├── PreLabel (centered, ~13px height) — "● VOICE COMPANION · V1.2"
  ├── 40px gap (mt-10)
  ├── JeffreyAvatarBlock (centered as flex unit, gap 16px between avatar + label) — ~56px height
  ├── 56px gap (mt-14)
  ├── QuotedHeadline (centered, padding 0 24px) — 4 lines × 32px × 1.15 line-height = ~147px
  ├── 32px gap (mt-8)
  ├── CodeComment (left-aligned inside content, padding 0 32px) — 2 lines × 13px × relaxed = ~42px
  ├── flex spacer
  ├── ControlBar (anchored, 56px from bottom edge, padding 0 24px, flex row gap 16px)
  │     ├── Skip voice (auto width, vertically centered)
  │     └── Continue CTA (flex-1, 56px tall, rounded pill)
```

**Mobile (<768px):** full-viewport, no phone-frame chrome. Same layout, no status bar.
**Desktop (≥768px):** phone-frame mockup, status bar visible.

---

## 5. Motion / state

### Entrance stagger (cubic-bezier(0.22, 1, 0.36, 1))

Add new keyframes to `apps/web/app/onboarding/animations.css` — re-use the existing `cover-fade-in` and `cover-fade-up` keyframes (they're surface-agnostic) but add new delay classes for Surface 2:

| Element | Delay | Keyframe | Notes |
|---|---|---|---|
| PreLabel | 0ms | `cover-fade-in` (720ms) | |
| JeffreyAvatarBlock | 200ms | `cover-fade-up` (from y+12px) + glow pulse | Glow: 0 → 24px aqua-at-32% → settles to 8px aqua-at-16% steady-state |
| Headline | 500ms | `cover-fade-up` (from y+24px, 720ms) | |
| CodeComment | 900ms | `cover-fade-in` (720ms) | |
| ControlBar | 1200ms | `cover-fade-in` (720ms) | |

### Avatar glow keyframes (NEW)

```css
@keyframes jeffrey-avatar-glow {
  0%   { box-shadow: 0 0 0 rgba(0, 194, 209, 0.0); }
  60%  { box-shadow: 0 0 24px rgba(0, 194, 209, 0.32); }
  100% { box-shadow: 0 0 8px rgba(0, 194, 209, 0.16); }
}

.stagger-jeffrey-avatar {
  animation-name: cover-fade-up, jeffrey-avatar-glow;
  animation-delay: 200ms, 200ms;
  animation-duration: 720ms, 1200ms;
  animation-fill-mode: forwards, forwards;
}
```

### Reduced motion

Same pattern as cover — collapse to 320ms cross-fade, no glow pulse, no translate. The existing `@media (prefers-reduced-motion: reduce)` rule in `animations.css` handles `.stagger-base` already; just ensure the new classes inherit `.stagger-base`.

### Page-level state — surface flow controller

This brief introduces multi-surface flow. Add minimal local state to `apps/web/app/onboarding/page.tsx`:

```typescript
"use client";
import { useState } from "react";
import { CoverSurface } from "../../components/onboarding/CoverSurface";
import { JeffreyIntroSurface } from "../../components/onboarding/JeffreyIntroSurface";
import { PhoneFrame } from "../../components/patterns/PhoneFrame";
import "./animations.css";

type OnboardingStep = "cover" | "jeffrey-intro" | /* future */ "identity-goals";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("cover");
  const [voicePreference, setVoicePreference] = useState<"continue" | "skipped" | null>(null);

  const handleAdvanceFromCover = () => setStep("jeffrey-intro");
  const handleAdvanceFromJeffrey = () => {
    if (voicePreference === null) setVoicePreference("continue");
    setStep("identity-goals"); // TODO(surface-3): render Surface 3 when brief lands
  };
  const handleSkipVoice = () => {
    setVoicePreference("skipped");
    setStep("identity-goals");
  };

  return (
    <PhoneFrame>
      {step === "cover" && (
        <CoverSurface onAdvance={handleAdvanceFromCover} showStatusBar />
      )}
      {step === "jeffrey-intro" && (
        <JeffreyIntroSurface
          onAdvance={handleAdvanceFromJeffrey}
          onSkipVoice={handleSkipVoice}
          showStatusBar
        />
      )}
      {step === "identity-goals" && (
        <div className="flex h-full items-center justify-center text-soft p-8">
          {/* TODO(surface-3): Identity + Goals — pending cowork-brief */}
          Surface 3 lands in next brief.
        </div>
      )}
    </PhoneFrame>
  );
}
```

This is a deliberately minimal flow controller — full reducer-based state lands in a later brief once we have 3+ surfaces with captured data. For now, surface 1 → 2 → placeholder works and unblocks Surface 2 review.

---

## 6. Accessibility

- `<JeffreyIntroSurface>` should be wrapped in `<main role="main" aria-label="Voice companion introduction">` or similar
- Avatar: `aria-hidden="true"` on the visual avatar; the surrounding label provides the meaning
- Headline: should be `<h2>` (the page already has `<h1>` for the wordmark). Quoted text inside should NOT use `<blockquote>` — semantically this is the headline of the surface, not a quotation of someone external. Use plain `<h2>` with curly quote characters in the text.
- Code-comment subline: use `<p>` with custom styling. Don't use `<code>` (it's not literal code, it's a stylistic choice). Pass `aria-hidden="true"` on the `//` prefix span — screen readers shouldn't announce "slash slash".
- Skip voice link: `<button type="button">` (not `<a href>` — it's an action, not a navigation)
- Continue CTA: standard `<button>` via `<PillCTA>`
- Focus order on Tab: PreLabel (skip if not interactive) → Avatar (skip, decorative) → Headline (skip, not interactive) → Code-comment (skip) → Skip voice button → Continue button. Keyboard users tabbing should reach exactly two interactive elements.
- Respect `prefers-reduced-motion` (handled in animations.css).

---

## 7. Existing components to reuse vs. create

**Reuse:**
- `<PhoneFrame>` at `apps/web/components/patterns/PhoneFrame.tsx`
- `<StatusBar>` at `apps/web/components/patterns/StatusBar.tsx`
- `<PillCTA>` at `apps/web/components/ui/PillCTA.tsx`

**Create new primitives:**
- `<JeffreyAvatar>` at `apps/web/components/ui/JeffreyAvatar.tsx` — sizes: `sm` (24px), `md` (32px), `lg` (56px). The 56px variant is used here. **This component will be reused across analytics LIVE card, voice modal state pill, and recommendation card** — design it as a reusable primitive, not surface-specific.
- `<PreLabel>` at `apps/web/components/ui/PreLabel.tsx` — accepts `variant: "graphite" | "aqua"` and `bullet?: boolean`. Graphite is the cover's "EST. 2026" style; Aqua is this surface's "● VOICE COMPANION" style. **Will be reused across all 9 onboarding surfaces** + analytics — make it primitive.
- `<CodeComment>` at `apps/web/components/ui/CodeComment.tsx` — accepts an array of lines. Renders `// ` prefix + text per line in IBM Plex Mono. **Will be reused on the voice modal and analytics surfaces**.
- `<TextLink>` at `apps/web/components/ui/TextLink.tsx` — graphite text, hover deepens, no underline by default. The "Skip voice" pattern. Reused across multiple surfaces.

**Create surface composition:**
- `<JeffreyIntroSurface>` at `apps/web/components/onboarding/JeffreyIntroSurface.tsx`

**Update:**
- `apps/web/app/onboarding/page.tsx` — add minimal flow state per §5 above
- `apps/web/app/onboarding/animations.css` — add `jeffrey-avatar-glow` keyframes + Surface 2 stagger delay classes

---

## 8. Open questions (Cowork → Ron before implementation)

1. **`bg-signal/20` opacity utility** — Tailwind v4 supports color-with-alpha via `/N` syntax. Verify it works with our `--color-signal` token; if not, use `bg-[color:var(--signal)]/20` or define a CSS class. Non-blocking; resolve in implementation.
2. **Surface 3 placeholder** — current page.tsx has a TODO placeholder for the identity-goals state. OK to ship as visible placeholder text, or want it to fall back to a "still loading next surface" treatment? **Recommend: visible TODO placeholder for v0.** It's never user-facing in production (Surface 3 brief comes next) but it shouldn't blank-screen during this PR's review.
3. **Voice preference state — sessionStorage v0?** — If user selects "Skip voice" then navigates back to Cover, should the choice persist? **Recommend: in-component state for v0.** Persistence comes when full reducer lands.
4. **Curly-quote characters in JSX** — the headline uses `"` and `"` (U+201C, U+201D). JSX should handle these directly, but if there's any escaping issue, use `{'“'}` and `{'”'}`. Non-blocking.
5. **JeffreyAvatar — inline SVG vs CSS-rendered "j"?** — The Aqua "j" inside the circle: render as a styled `<span>` with Briston Bold 28px Aqua, OR as an inline SVG path. **Recommend: styled `<span>` for v0** — simpler, theme-aware (uses `text-signal` token directly), inherits font-display loading. Switch to SVG only if we need exact control over letterforms.

---

## 9. Acceptance criteria

Before merging the PR:

- [ ] Pixel-match against Claude Design Surface 2 mock (within 2px positioning tolerance; exact match on typography + colors)
- [ ] All hex values replaced by Tailwind utility classes — no `text-[#00C2D1]`, no `bg-[rgb(...)]`
- [ ] **Aqua "j" avatar renders correctly** — circle, aqua border, aqua "j" character at correct size
- [ ] **Canonical voice copy is exact** — "I'm Jeffrey. / I learn you, then / I get out of the / way." with curly quotes. No paraphrasing.
- [ ] Code-comment subline left-aligned (NOT centered), Plex Mono, with `//` prefix in slightly dimmer color
- [ ] Stagger entrance runs cleanly: pre-label 0ms, avatar 200ms with glow pulse, headline 500ms (fade-up), code 900ms, controls 1200ms
- [ ] Avatar glow pulses to peak at ~600ms then settles to subtle steady-state (`8px aqua@16%`)
- [ ] Skip voice text-link works; Continue pill CTA works; both advance to Surface 3 placeholder
- [ ] Voice preference correctly captured: `"continue"` if Continue tapped, `"skipped"` if Skip voice tapped
- [ ] `prefers-reduced-motion` collapses to 320ms cross-fade
- [ ] Mobile: full-viewport, no phone-frame chrome. Desktop: phone-frame mockup.
- [ ] TypeScript: zero `any`, zero `@ts-ignore`. `pnpm --filter @aissisted/web typecheck` exits 0.
- [ ] Smoke renders without console errors at `localhost:3000/onboarding`
- [ ] Begin on Cover → Jeffrey intro renders correctly. Continue on Jeffrey intro → Surface 3 placeholder.

---

## 10. Implementation guidance for Claude Code

```
Read this brief end-to-end. Then:

1. Survey existing components — verify PhoneFrame, StatusBar, PillCTA
   at the paths in §7. Confirm they export the props you'll need.
2. Surface the open questions in §8 — particularly Q1 (bg-signal/20
   syntax). Wait for my answers before writing code.
3. Once unblocked, build in this order:
   a. Primitives first — JeffreyAvatar, PreLabel, CodeComment, TextLink.
      Each ~30-50 lines. Test in isolation by wiring stub usage.
   b. Surface composition — JeffreyIntroSurface.tsx composing all
      primitives per §2 component tree.
   c. Animation extensions — add jeffrey-avatar-glow keyframes + new
      stagger delay classes to animations.css.
   d. Page flow — update page.tsx per §5 with the surface flow state
      machine + Surface 3 placeholder.
4. Verify: pnpm --filter @aissisted/web typecheck (must exit 0).
5. Manual verify at localhost:3000/onboarding — Cover renders → Begin
   advances to Jeffrey intro → Continue advances to Surface 3
   placeholder. Stagger entrance plays on each surface transition.
6. Open PR against design-system-v0.1 with:
   - Screenshot of Cover surface (existing)
   - Screenshot of Jeffrey intro surface
   - DOM-inspection notes on Aqua "j" avatar canon compliance

Stay scoped: only touch apps/web/* — no backend, no jeffrey/* docs,
no packages/jeffrey, no other apps. If you find any backend route
that should exist (auth, voice-preference persistence), leave a
TODO and stub client-side.
```

---

## 11. Surface 3 preview (for Claude Code's awareness — NOT to implement now)

Surface 3 is **Identity + Goals (combined)** per `CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2.md`. It's the "STEP 02 / 06 · IDENTITY" labeled surface that captures:
- User's preferred name (input field with `→ preferred_name` code-comment)
- 1-3 goals selected from 6 chips: Energy / Sleep / Focus / Recovery / Longevity / Resilience

Surface 3 needs `useReducer` flow state because it captures real data. That's when we replace the simple `useState<OnboardingStep>` controller in this brief with a proper reducer. Not now — keep it scoped.

---

## 12. Changelog

| Date | Change | By |
|---|---|---|
| 2026-05-01 | v1 brief drafted. Builds on Cover surface (already shipped). Introduces Aqua "j" avatar primitive + canonical voice copy. Establishes minimal page flow controller for multi-surface onboarding. | Cowork |
