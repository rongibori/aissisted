# Changelog

All notable changes to the Aissisted monorepo are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-05-04

First tagged release. Aligns the monorepo on a single version (root + apps + packages)
and captures the foundation built from project start through M3 Phase 2.

### Added — apps/api
- Fastify server: 11 route groups, 14 services, 20 DB tables, JWT auth, rate limiting, audit log, request-ID propagation
- Integrations: WHOOP OAuth with 30-min sync scheduler, FHIR/Epic longitudinal sync with compliance + audit + demographics hydration, Apple Health ingestion
- Safety layer: drug-interaction + allergy checks, rules engine across sleep / inflammation / hormones / energy / cognition
- Jeffrey Realtime WS proxy (#45) — OpenAI Realtime relay for browser voice

### Added — apps/web
- Next.js 15 authenticated surfaces: dashboard, chat (text + voice), /jeffrey-live, labs, profile, stack, adherence, integrations, onboarding, login/register
- Voice modality on /chat via JeffreyVoicePanel (#48)
- /jeffrey-live demo (#46)
- Brand Bible v1.1 token migration across pages and components (#32, #34)

### Added — apps/site
- M1 scaffold (#35) — Next.js 15 public surface
- M2 design system (#36) — token system + brand primitives
- M3 Phase 1 — shell + homepage (#62)
- M3 Phase 2 — Morning / Day / Night formula pages (#63)
- Investor Room v1 — chapters + live Jeffrey console (#39)
- Investor Room v2–v6 — luxury posture, founder credibility, hard CTA, lead capture, scoring + email + admin pipeline + allocation urgency + calendar (#44)

### Added — apps/landing
- Public landing site at aissisted.me (#57)
- Auto-sync workflow: aissisted-app.html → apps/landing/preview.html on push to main

### Added — packages
- @aissisted/brand v1.1 tokens — palette swap to #EE2B37 red
- @aissisted/jeffrey — canonical operating-intelligence brain (#37, #38)
- @aissisted/jeffrey-evals — eval suite with DNR + SR zero-tolerance, wired into CI fast/full gates (#60)

### Changed
- LLM provider migration: intent parser (#50) and protocol synthesis (#51) moved from Anthropic to OpenAI; Anthropic rollback retired
- Jeffrey Voice v1.1 — locked "calm dial-up" voice profile (#65)
- apps/landing canonical URL — apex-to-www redirect to match Vercel behavior

### Infrastructure
- CI: typecheck + test + build + lint + Jeffrey evals (fast on PR, full on main) — `.github/workflows/main.yml`
- Deploy preflight: CORS allowlist, env.example sync, vercel.json, runbook (#47)
- Two-clone development protocol documented in CLAUDE.md (#61)
- Roadmap v3 canonical (#52)

### Notes
- All workspace packages are `private: true`. No npm publish occurs from this tag.
- `@aissisted/brand` was previously at `0.2.0` (independent bump during M2 ship) and is realigned to `0.3.0` here.

[0.3.0]: https://github.com/rongibori/aissisted/releases/tag/v0.3.0
