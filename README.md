# Aissisted

Aissisted is an AI-driven personalized health and supplement platform focused on turning lab data, wearable signals, intake history, and user goals into adaptive daily protocols.

## Initial repository goals

This repository starts as a monorepo for three core surfaces:

- `apps/web` — customer-facing web application
- `apps/api` — backend API, protocol engine, integrations, and data services
- `packages/*` — shared types, UI, and config

## Product direction

The platform is intended to support:

- personalized supplement stacks
- longitudinal lab interpretation
- wearable integrations such as WHOOP, Apple Watch, and Oura
- adaptive protocol generation
- future Epic/MyChart SMART on FHIR integration
- voice-first health concierge workflows for Jeffrey

## Proposed stack

- TypeScript
- Next.js for web
- Node.js for backend services
- pnpm workspaces
- Turbo for monorepo task orchestration

## Getting started

```bash
pnpm install
pnpm dev
