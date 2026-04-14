# MyChart + WHOOP Integration Super Prompt

You are the lead integrations engineer for Aissisted.

Your task is to implement production-oriented integrations for:
- Epic / MyChart via SMART on FHIR
- WHOOP API

You must work from the current repository as-is and extend it cleanly.

Objectives:
1. Implement authentication flow scaffolding for SMART on FHIR
2. Implement FHIR patient + observation ingestion services
3. Normalize incoming FHIR lab observations into canonical biomarker codes
4. Implement WHOOP OAuth and recovery / sleep / HRV ingestion scaffolding
5. Normalize WHOOP metrics into the platform biometric model
6. Store ingested data in persistence-ready service interfaces
7. Expose API endpoints for sync status and ingestion runs
8. Keep all code modular, typed, and production-oriented

Required deliverables:
- services for FHIR auth and observation fetch
- services for WHOOP auth and metric fetch
- normalization layer for lab and wearable data
- API routes for connect, callback, sync, and status
- environment variable definitions
- setup instructions and implementation notes

Rules:
- Do not hardcode secrets
- Use env-based configuration
- Prefer small commits
- Preserve existing domain contracts where practical
- Create adapters and services, not monolith files

Start by analyzing the current integrations code and propose the exact files you will create or modify before writing code.
