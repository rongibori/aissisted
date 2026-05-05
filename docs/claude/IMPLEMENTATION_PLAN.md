# Implementation Plan (Milestone-Driven)

This plan is intentionally incremental to reduce regressions.

## Milestone 0: Baseline and Safety Rails

### Tasks

- Complete repository discovery from `REPO_CONTEXT.md`.
- Add or verify lint, typecheck, test, and build commands.
- Establish a baseline CI workflow (or local equivalent if CI is absent).
- Add feature flags for risky migrations if needed.

### Exit Criteria

- Green baseline checks
- Clear module ownership map
- Prioritized backlog with dependencies

## Milestone 1: Auth + Persistence Foundation

### Tasks

- Implement/complete authentication and user identity flow.
- Introduce Postgres and migration tooling.
- Create core schema: users, profiles, biomarker records, recommendation records, chat sessions/messages, audit logs.
- Replace localStorage state for user-critical flows with API + DB persistence.

### Exit Criteria

- User can sign in and resume persistent session data.
- Core entities persist and can be queried reliably.
- Migration scripts run cleanly from scratch.

## Milestone 2: Intelligence Engine Refactor

### Tasks

- Refactor rules into modular rule system with explicit interfaces.
- Implement adaptive signal weighting.
- Add multi-signal protocol engine (labs + wearables + user input).
- Attach recommendation provenance metadata.

### Exit Criteria

- Recommendation generation uses modular rules and weighted inputs.
- Explainability metadata is available for each recommendation.
- Unit/integration tests cover high-risk decision paths.

## Milestone 3: Jeffrey Assistant Upgrade

### Tasks

- Replace keyword logic with intent parsing pipeline.
- Add multi-turn conversation state and memory.
- Connect Jeffrey responses to real protocol outputs and persisted history.
- Implement follow-up question flow for missing context.

### Exit Criteria

- Multi-turn conversation works with coherent context carryover.
- Assistant responses are grounded in real user/protocol data.
- Chat interactions are persisted and auditable.

## Milestone 4: Integrations Completion

### Tasks

- Finish WHOOP adapter.
- Finish Apple Health adapter.
- Implement SMART on FHIR auth + ingestion pipeline.
- Normalize external payloads into canonical domain model.

### Exit Criteria

- All three integration paths ingest data end-to-end.
- Failures are observable and retriable.
- Ingested data is usable by recommendation engine.

## Milestone 5: Product Surfaces and Synchronization

### Tasks

- Build/complete dashboard UI.
- Build stack visualization UI.
- Ensure chat -> stack -> dashboard synchronization.
- Remove remaining mocks from user-visible flows.

### Exit Criteria

- User sees consistent state across chat, stack, dashboard.
- UI reflects persisted and computed data only.
- Core UX passes manual regression checklist.

## Milestone 6: Safety, Audit, and Hardening

### Tasks

- Expand contraindication logic and test coverage.
- Finalize audit logging for recommendation lifecycle.
- Add guardrails for unsafe/conflicting suggestions.
- Run production-readiness checks and cleanup.

### Exit Criteria

- Safety checks run before recommendation delivery.
- Audit logs are queryable and complete.
- Deployment package is reproducible with clear setup docs.

## Working Agreements

- Use small, focused commits.
- Keep backward compatibility where practical.
- Prefer explicit interfaces over hidden coupling.
- Document key architecture decisions during implementation.
