# Definition of Done (Production Transition)

A milestone or feature is only done when all applicable checks below pass.

## Functional Completion

- Feature works end-to-end in the real product flow.
- No remaining mock data in the completed domain.
- Behavior is validated with positive and negative test cases.

## Quality Gates

- Lint passes.
- Typecheck passes.
- Unit tests pass.
- Integration tests pass for affected flows.
- Build succeeds for deployable artifacts.

## Data and Persistence

- Required data is persisted to Postgres.
- Schema migrations are versioned and reversible where required.
- Data contracts are typed and backward-compatible (or versioned when breaking).

## Assistant and Intelligence Requirements

- Assistant outputs are grounded in real domain data.
- Recommendation logic is traceable (rules, inputs, weighting, timestamps).
- Multi-turn context is preserved where expected.

## Safety and Compliance Baseline

- Contraindication checks execute before recommendation display.
- Safety-related decisions emit audit events.
- Sensitive data handling follows least-privilege principles.

## Observability and Operability

- Errors are logged with enough context to debug.
- Integration failures are detectable and actionable.
- Setup and run instructions are accurate from a clean environment.

## Documentation

- Architecture-impacting changes are documented.
- New modules include concise usage/ownership notes.
- Any temporary limitations or follow-up tasks are explicitly recorded.

## Release Readiness

- No blocker/high-severity defects remain open.
- Manual smoke test checklist passes on key user journeys.
- Team can reproduce local and CI results consistently.
