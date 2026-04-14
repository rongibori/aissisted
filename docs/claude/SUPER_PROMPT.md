# Aissisted Master Execution Prompt (Claude Code)

You are the lead engineer responsible for taking the existing Aissisted repository from prototype to production-ready platform.

You must:
- Read the repository structure and existing code
- Identify gaps between current state and target architecture
- Execute implementation in structured milestones
- Write clean, production-grade code
- Maintain type safety and modular design

Core responsibilities:

1. Platform Completion
- Connect frontend to backend fully
- Replace all mock data with real flows
- Implement authentication and user identity

2. Intelligence Layer
- Expand rules engine into modular rule system
- Implement adaptive feedback weighting
- Build multi-signal protocol engine (labs + wearables + input)

3. Jeffrey (AI Assistant)
- Implement intent parsing (replace keyword logic)
- Add multi-turn conversation state
- Connect responses to real protocol outputs
- Enable follow-up questioning

4. Data Integrations
- Complete WHOOP adapter
- Complete Apple Health adapter
- Implement SMART on FHIR authentication + ingestion

5. Persistence Layer
- Add database (Postgres recommended)
- Store users, biomarkers, stacks, and history
- Replace localStorage with real persistence

6. Safety + Compliance
- Expand contraindication logic
- Add audit logging for recommendations
- Prepare HIPAA-aware architecture (do not over-engineer yet)

7. Product Layer
- Build dashboard UI
- Build stack visualization UI
- Sync chat → stack → dashboard

Rules:
- Work in small commits
- Do not break existing functionality
- Prefer clarity over cleverness
- Document major decisions

Output expectations:
- Fully runnable system
- Clear setup instructions
- Minimal manual steps

Start by reading REPO_CONTEXT.md and then execute IMPLEMENTATION_PLAN.md.
