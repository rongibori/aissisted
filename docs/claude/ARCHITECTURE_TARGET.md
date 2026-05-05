# Target Architecture (Production)

## Goals

- End-to-end connected product: chat -> protocols -> dashboard -> persistence
- Modular intelligence layer with explicit boundaries
- Compliance-aware data handling suitable for healthcare-adjacent workflows

## Proposed System Layers

1. Client Layer
- Web app with authenticated user context
- Dashboard, stack visualization, and Jeffrey chat surfaces
- Strict API contracts (typed client)

2. API/Application Layer
- Auth + session management
- Domain services for biomarkers, recommendations, protocol generation
- Integration orchestration (wearables + clinical data)

3. Intelligence Layer
- Intent parser (NLP intent + entity extraction)
- Conversation state manager (multi-turn context)
- Rules engine + weighted signal fusion
- Recommendation composer with explainability fields

4. Integration Layer
- WHOOP adapter (pull + normalize)
- Apple Health adapter (ingest + normalize)
- SMART on FHIR adapter (auth + fetch + transform)
- Unified canonical data model for downstream logic

5. Persistence Layer
- Postgres as source of truth
- Tables for users, profiles, biomarkers, recommendations, protocols, chat events, audit events
- Migration-first schema evolution

6. Safety and Compliance Layer
- Contraindication engine with deterministic checks
- Audit logging for recommendation lifecycle
- Data access boundaries and minimum necessary handling

## Service Boundaries

- Auth service
- User profile service
- Biomarker ingestion service
- Recommendation service
- Protocol service
- Assistant conversation service
- Audit service

Each service should expose stable interfaces and avoid direct cross-layer coupling.

## Data Contracts

- Use shared typed schemas for request/response payloads.
- Add versioning for external integration payload transforms.
- Track recommendation provenance:
  - source signals
  - rule IDs
  - confidence/weighting
  - generated timestamp

## Non-Functional Requirements

- Type safety across frontend/backend/shared contracts
- Test coverage for critical recommendation paths
- Observability for integration failures and assistant outputs
- Reliable migrations and deterministic local setup

## Phased Architecture Validation

At the end of each milestone, verify:

- API contracts compile and match client usage
- No mock data remains in completed domains
- Critical flows pass smoke + integration tests
- Audit events are emitted for recommendation actions
