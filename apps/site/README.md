# @aissisted/site

Aissisted presentation + investor site. Premium. Voice-led. Brand-disciplined.

## What this is

The public-facing presentation site and the gated Investor Room. Built alongside `apps/web` (the member product) but distinct in purpose: `apps/site` is the storefront + the investor-grade narrative; `apps/web` is the logged-in member experience.

Both surfaces share Brand Bible v1.1 tokens via `@aissisted/brand`. Typography diverges — `apps/site` ships IBM Plex, `apps/web` keeps its fallback stack until a dedicated migration lands.

## Stack

- Next.js 15 · App Router
- React 19
- TypeScript 5.6
- Tailwind v4.2 (CSS-first, `@theme` directive)
- IBM Plex Sans / Mono / Serif — self-hosted via `@fontsource` (SIL OFL 1.1)

## Routes (10)

| # | Path                | Status | Notes                                           |
|---|---------------------|--------|-------------------------------------------------|
| 1 | `/`                 | shell  | Home — rally cry surface                         |
| 2 | `/how-it-works`     | shell  | Page 2 per v2 site copy                          |
| 3 | `/for-you`          | shell  | Page 3 — the person we built for                 |
| 4 | `/science`          | shell  | Page 4 — method + evidence posture               |
| 5 | `/pricing`          | shell  | Page 5 — Formula tier cards                      |
| 6 | `/faq`              | shell  | Page 6                                           |
| 7 | `/request-access`   | shell  | Page 7 — invite-code + magic-link (was "Start")  |
| 8 | `/longevity`        | shell  | Page 8 — teaser for the next Formula             |
| 9 | `/contact`          | shell  | Page 9 — founder meeting route                   |
| 10| `/investor-room`    | gated  | Middleware-enforced. Milestone 8 builds surface. |

## API routes

- `POST /api/jeffrey` — 501 stub. Milestone 10 wires the persona + retrieval.
- `POST /api/lead` — 501 stub. Milestone 12 wires HubSpot investor pipeline.

## Middleware

`middleware.ts` guards `/investor-room/*`. Scaffold checks only for cookie presence; Milestone 7 adds HMAC signature + expiry verification. Session lifetime is env-driven (`SITE_SESSION_EXPIRY`, default `14d`) so Ron can tighten or extend without a redeploy.

## Scripts

```bash
pnpm --filter @aissisted/site dev        # localhost:3001
pnpm --filter @aissisted/site build
pnpm --filter @aissisted/site typecheck
```

## Brand discipline

- Color tokens come from `@aissisted/brand`. Do NOT redeclare palette values here.
- Typography utilities: `font-display`, `font-system`, `font-accent`. Do NOT import Google Fonts or any CDN-hosted font.
- Rally cry styling: `.rally-cry` class. Never underline, italicize, or all-caps.
- Forbidden words (Brand Bible v1.1): users, customers, consumers, revolutionary, cutting-edge, miracle, cure, game-changer, unlock, next-level, hack, "powered by AI", "AI-driven". Reviewer will fail the PR on any of these.
- No raise size, band, or valuation language — anywhere. Not even in Investor Room. Jeffrey routes raise-specific intent to the founder-meeting ask.

## Milestones

- **M1** ✅ Scaffold + shared tokens + Vercel preview (this PR)
- **M2** Design-system anchor — primitives, nav, footer, rally-cry composition
- **M3** Home page copy pass (Page 1 — hero, wedge, proof, four moves, thesis, who-it's-for)
- **M4–M9** Pages 2–9 copy + composition
- **M7** Invite-code + magic-link auth, middleware session verification (14d default)
- **M8** Investor Room build
- **M10** Jeffrey chat UI + prompt + retrieval layer
- **M11** Jeffrey voice mode (TTS, British register)
- **M12** HubSpot CRM lead capture
- **M13** Brand audit + a11y + perf pass
