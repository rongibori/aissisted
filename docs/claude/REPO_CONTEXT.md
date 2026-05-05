# Repository Context (Aissisted)

This document captures the practical baseline before implementation begins.

## What We Know

- This handoff package currently includes:
  - `SUPER_PROMPT.md`
  - `README.md`
- The broader Aissisted repository must be inspected by Claude Code before coding.
- The target state is production-ready, type-safe, and modular.

## Required Initial Discovery (Do First)

Run these discovery steps at repository root:

1. File and package inventory
- List top-level folders and key config files.
- Identify frontend, backend, shared packages, infra, and scripts.

2. Runtime map
- Determine app entrypoints (web, API, workers, schedulers).
- Confirm local dev commands and current build/test status.

3. Data flow map
- Identify all mock data paths.
- Locate current persistence mechanism(s) (localStorage, JSON files, in-memory).

4. AI and protocol map
- Locate Jeffrey assistant logic.
- Locate rules/protocol engine and scoring logic.

5. Integration map
- Locate WHOOP, Apple Health, and SMART on FHIR code or stubs.

6. Safety/compliance map
- Locate contraindication checks.
- Locate logging/auditing paths.

## Discovery Output Format

Create a concise inventory with these sections:

- Current architecture summary (5-10 bullets)
- Gaps vs target architecture (ranked by risk)
- Critical unknowns and assumptions
- Recommended implementation order

## Constraints

- Preserve current behavior unless intentionally improved.
- Avoid broad rewrites in early milestones.
- Keep all new modules testable and typed.
- Prefer additive changes with migration paths.

## Immediate Deliverables from Discovery

- A validated module map
- A dependency map (internal + external)
- A migration plan for mock data -> real services
- A risk list with mitigation steps
