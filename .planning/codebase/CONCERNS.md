<!-- refreshed: 2026-05-04 -->
# Codebase Concerns

**Analysis Date:** 2026-05-04

## Tech Debt

**Integration Adapters Not Fully Implemented:**
- Issue: Apple Health, WHOOP, and FHIR adapters have multiple `TODO` comments indicating placeholder implementations.
- Files: 
  - `packages/integrations/src/appleHealthAdapter.ts` lines 7, 12 (HealthKit bridge, real ingestion pipeline)
  - `packages/integrations/src/whoopAdapter.ts` lines 7, 12 (OAuth connection, real API call)
  - `packages/integrations/src/fhirAdapter.ts` lines 10, 15 (SMART on FHIR OAuth2, real FHIR API)
- Impact: These adapters currently return mock data. Real data synchronization depends on completing these stubs before production use.
- Fix approach: Implement real OAuth2 flows for WHOOP and FHIR (already scaffolded in `apps/api/src/integrations/`), and implement HealthKit bridge or XML import handler for Apple Health. The real implementations exist in routes and sync modules; adapters need to delegate to them.

**Jeffrey Evals Not Wired for Execution:**
- Issue: Test cases in `packages/jeffrey-evals/src/jeffrey.eval.test.ts` have TODOs for actual Jeffrey execution against test cases.
- Files: `packages/jeffrey-evals/src/score.ts` lines 1–2, `jeffrey.eval.test.ts` line ~20 (marked as TODO in execute.ts)
- Impact: Evaluation framework exists but cannot run full end-to-end Jeffrey agent testing. Scoring against OpenAI gpt-4o-mini is stubbed.
- Fix approach: Wire jeffrey service execution into the test harness; implement structured JSON output scoring via OpenAI. See `apps/api/src/services/jeffrey.service.ts` for production chat path.

**Onboarding Flow Incomplete:**
- Issue: Multi-step onboarding state machine still in transition.
- Files: `apps/web/app/onboarding/page.tsx` lines 22–26 (TODO: replace OnboardingStep + voicePreference state, cover + jeffrey-intro pre-authentication)
- Impact: Voice preference collection and early-flow authentication boundaries need refactoring before production.
- Fix approach: Consolidate onboarding state management; clarify which surfaces run pre-auth vs post-auth (per schema: cover + jeffrey-intro are pre-authentication).

**Biomarker Persistence Not Batched:**
- Issue: `persistRawBiomarkers()` in `apps/api/src/services/biomarker.service.ts` (lines 112–132) loops through entries individually, issuing one INSERT per entry.
- Files: `apps/api/src/services/biomarker.service.ts` lines 112–132
- Impact: Large Apple Health exports (2MB XML → 1000+ biomarker entries) will execute 1000+ sequential DB inserts, causing I/O blocking and slow sync response.
- Fix approach: Batch entries using Drizzle's bulk insert or batch the loop into chunks of 50–100 inserts per await.

---

## Security Considerations

**Legacy Plaintext Token Migration Path:**
- Risk: `decrypt()` in `apps/api/src/utils/token-encryption.ts` (lines 82–86) allows plaintext tokens to pass through for backward compatibility. If an old plaintext token is retrieved from the database, it remains unencrypted in memory and is decrypted on every API call.
- Files: `apps/api/src/utils/token-encryption.ts` lines 82–86
- Current mitigation: Migration-safe fallback allows existing unencrypted tokens to work. New tokens are encrypted. Tokens are re-encrypted on refresh.
- Recommendations:
  1. Add a background job to scan `integration_tokens` and re-encrypt any plaintext tokens (check if they match `ENCRYPTED_PATTERN`).
  2. Set a deprecation deadline (e.g., 30 days) to force all users to refresh their tokens.
  3. Log warnings when plaintext tokens are encountered in production.

**State Parameter in OAuth Callbacks Embedded with User ID:**
- Risk: WHOOP and FHIR OAuth callbacks extract user ID from the `state` parameter without validating the full state signature. Format: `"{userId}:{nonce}"`. An attacker could craft a callback with a different `userId` and potentially claim tokens for another user.
- Files: 
  - `apps/api/src/routes/integrations.ts` lines 77, 185 (state parsing)
  - `apps/api/src/integrations/whoop/oauth.ts` (no state validation)
  - `apps/api/src/integrations/fhir/sync.ts` (no state validation)
- Current mitigation: Simple nonce split. State is generated per request but never validated against a server-side store (session/Redis).
- Recommendations:
  1. Store state in a server-side session or signed JWT with expiration (5 min).
  2. Validate the full state before extracting userId.
  3. Use constant-time comparison for state tokens.

**PHI Boundary: Plaintext JSON Fields in Schema:**
- Risk: Protected health information (PHI) is stored in JSON fields (`goals`, `conditions`, `medications`, `supplements`, `metadata`, etc.) in the database. These are not encrypted at rest. If database backups are leaked or database is accessed directly, PHI is exposed.
- Files: `packages/db/src/schema.ts` (health_profiles, protocols, recommendations, metadata fields in multiple tables)
- Current mitigation: Token encryption only covers OAuth tokens. Health data is unencrypted.
- Recommendations:
  1. Implement field-level encryption for JSON columns containing PHI (e.g., health_profiles.goals, conditions, medications).
  2. Use AWS KMS CMK (if deployed on AWS) or equivalent for column encryption keys.
  3. Add encryption to biomarker values and observation data.
  4. Consider moving sensitive data to a separate encrypted store with key rotation.

**Audit Log Missing Sensitive Field Masking:**
- Risk: Audit logs capture `detail` as JSON (schema line 271) but do not mask sensitive values. If an admin queries audit logs, they may see unredacted PHI in change history.
- Files: `packages/db/src/schema.ts` line 265–273 (auditLog table)
- Current mitigation: Logging occurs but fields are not sanitized.
- Recommendations:
  1. Implement audit log sanitization in `apps/api/src/services/audit.service.ts` to mask PHI before persistence.
  2. Provide audit log views with role-based access (only admins/compliance can see full logs).

**Env Variable Fallback for Encryption Key:**
- Risk: `TOKEN_ENCRYPTION_KEY` has a hardcoded fallback key in development (`aissisted-dev-token-encryption-k`). If this code path is accidentally used in production, all tokens are encrypted with a weak, publicly known key.
- Files: `apps/api/src/utils/token-encryption.ts` lines 19–44
- Current mitigation: Explicit check for `NODE_ENV === "production"` throws an error if key is missing. However, `NODE_ENV` can be misconfigured.
- Recommendations:
  1. Remove fallback entirely; make the key required in all non-test environments.
  2. Add startup validation that enforces KMS key presence in production.

**Apple Health XML Parsing Regex Injection:**
- Risk: `parseAppleHealthXml()` uses a regex to extract attributes and does not validate or escape extracted values. If Apple Health export contains specially crafted XML attributes, arbitrary strings could be injected into the record structure.
- Files: `apps/api/src/integrations/apple-health/parser.ts` lines 21–43
- Current mitigation: Regex is passive; values are extracted but not evaluated. However, no schema validation on parsed records.
- Recommendations:
  1. Validate extracted fields against expected types (e.g., value must be numeric, unit must be a known string).
  2. Add a whitelist of expected Apple Health `type` identifiers.
  3. Consider using a proper XML parser (e.g., xml2js with schema validation) instead of regex.

**CORS Allowlist Not Enforced for Development:**
- Risk: In development (`NODE_ENV === "development"`), all CORS origins are allowed (per .env.example comments). If an unintended frontend app is running on localhost, it can make requests to the API.
- Files: `.env.example` lines 23–29, `apps/api/src/config.ts` (CORS configuration)
- Current mitigation: Comment warns that staging/test/preview use explicit allowlist.
- Recommendations:
  1. Always enforce CORS allowlist; remove the "allow all in development" exception.
  2. Use `ALLOWED_ORIGINS` in all environments.

**JWT Secret Default Not Changed:**
- Risk: `JWT_SECRET` defaults to `"change-me-in-production"` in `.env.example`. If someone deploys without changing this, JWT signing is predictable and tokens can be forged.
- Files: `.env.example` line 14
- Current mitigation: Comment says to change in production.
- Recommendations:
  1. Remove default; make JWT_SECRET required and throw on startup if missing.
  2. Validate secret length (minimum 32 characters).

---

## Fragile Areas

**WHOOP Token Refresh Race Condition:**
- Problem: In `apps/api/src/integrations/whoop/oauth.ts` (`getAccessToken()`, lines 130–148), the token expiration check is done without locking. If two requests happen simultaneously, both may decide to refresh, resulting in two token refresh calls and potential inconsistency.
- Files: `apps/api/src/integrations/whoop/oauth.ts` lines 130–148
- Safe modification: Add a distributed lock (e.g., Redis) around the refresh operation. Use a key like `whoop-refresh:{userId}` with short TTL.
- Test coverage: No mutex/concurrency tests in integration token refresh paths.

**FHIR Token Refresh Without Locking:**
- Problem: Same as WHOOP. `getFhirAccessToken()` in `apps/api/src/integrations/fhir/sync.ts` (lines 113–137) has a race condition when checking expiration and refreshing.
- Files: `apps/api/src/integrations/fhir/sync.ts` lines 113–137
- Safe modification: Use the same distributed lock pattern.
- Test coverage: No concurrency tests.

**Apple Health XML Parser Unbounded Memory:**
- Problem: `parseAppleHealthXml()` in `apps/api/src/integrations/apple-health/parser.ts` loads the entire XML string into memory and runs a global regex. For very large exports (approaching 2MB limit), the regex engine may exhibit pathological backtracking or memory bloat.
- Files: `apps/api/src/integrations/apple-health/parser.ts` lines 49–62, route constraint `maxLength: 2_000_000` in `apps/api/src/routes/integrations.ts` line 125
- Safe modification: Stream-parse the XML instead of loading into memory. Split by newline and process records in chunks.
- Test coverage: No large payload tests.

**AI Brain Prompt Injection in Health Surface:**
- Problem: User health context (biomarkers, conditions, medications, goals) is injected into Jeffrey prompts without escaping. If a biomarker value or condition name contains prompt injection text, the LLM output could be manipulated.
- Files: `apps/api/src/services/jeffrey.service.ts` (not fully read but inferred from routing), `apps/api/src/routes/jeffrey.ts` lines 88–99
- Safe modification: Sanitize/escape all health data before inclusion in prompts. Use structured prompt templates with clear boundaries between system, context, and user input.
- Test coverage: Evals framework exists (`packages/jeffrey-evals/`) but is not yet executable; no prompt injection tests.

**Biomarker Trends Computation Not Idempotent:**
- Problem: `computeBiomarkerTrends()` in `apps/api/src/services/trends.service.ts` computes rolling averages and slopes. If called twice with the same data, the second call may produce different results if the algorithm is not purely deterministic (e.g., floating-point precision).
- Files: `apps/api/src/services/trends.service.ts` (line 221 uses `.get()`)
- Safe modification: Ensure trend computation is fully deterministic. Use fixed-precision arithmetic for slope calculations. Upsert trends by biomarker name (idempotent).
- Test coverage: Trend tests exist (`apps/api/src/engine/__tests__/`) but do not test idempotency.

**Drizzle Migration Safety:**
- Problem: Migrations are generated via `drizzle-kit generate` but schema changes are applied via `drizzle-kit push` for SQLite (development) or `migrate()` for production. No down migrations are versioned.
- Files: `packages/db/src/migrate.ts` lines 14–37, `packages/db/drizzle.config.ts`
- Impact: Schema rollback is manual; if a migration is bad, operators must manually undo DDL.
- Fix approach: 
  1. Always use version-controlled migration files, even for SQLite.
  2. Generate reversible migrations with both up and down SQL.
  3. Add migration validation tests that verify data integrity after each migration.

**Analysis Service Complexity Without Instrumentation:**
- Problem: `apps/api/src/services/analysis.service.ts` is very large (800+ lines estimated) and computes complex domain scoring with many edge cases. No internal metrics or logs for debugging when health state changes.
- Files: `apps/api/src/services/analysis.service.ts`
- Impact: When a user's health state snapshot is wrong, it's difficult to trace which scoring logic failed.
- Fix approach: Add structured logging at key checkpoints (e.g., "scored {biomarker} → {score}") with DEBUG level. Include trace IDs for end-to-end correlation.

---

## Performance Bottlenecks

**Sequential Biomarker Insert Loop:**
- Problem: `persistRawBiomarkers()` in `apps/api/src/services/biomarker.service.ts` (lines 112–132) iterates through entries and calls `db.insert().onConflictDoNothing()` for each one. For 1000+ entries from Apple Health, this is 1000+ await cycles.
- Files: `apps/api/src/services/biomarker.service.ts` lines 112–132
- Cause: No batch insert API in the current Drizzle setup; falling back to loop.
- Improvement path: 
  1. Use Drizzle's bulk `insertMany()` if available, or chunk into batches of 50 and insert in parallel.
  2. Measure impact: a 2MB Apple Health export might have 5000 records; going from 5000 sequential inserts to 100 batch inserts cuts latency by 50×.

**Health State Analysis Called Synchronously on Every Sync:**
- Problem: After every biomarker sync (WHOOP, FHIR, Apple Health), `maybeReanalyze()` is called (e.g., `apps/api/src/integrations/whoop/sync.ts` line 47). If analysis takes 2+ seconds and user expects fast sync feedback, the response is blocked.
- Files: `apps/api/src/integrations/whoop/sync.ts` line 47, `apps/api/src/integrations/fhir/sync.ts` (similar pattern)
- Cause: Synchronous `.catch(() => {})` suggests async but unclear if it's awaited.
- Improvement path: 
  1. Fire-and-forget analysis via a background queue (Bull, RabbitMQ).
  2. Return sync result immediately; persist analysis result separately.
  3. Frontend can poll health state or use WebSocket for updates.

**Potential N+1 Queries in Biomarker Fetching:**
- Problem: `getBiomarkers()` and `getLatestBiomarkers()` in `apps/api/src/services/biomarker.service.ts` fetch 100–1000 raw rows and process in JavaScript. If biomarkers are joined with other tables (e.g., trend data), each row may trigger another query.
- Files: `apps/api/src/services/biomarker.service.ts` lines 69–88, 136–156
- Cause: Drizzle queries use `.select().from()` without explicit joins; if a route calls this in a loop per user, it's N+1.
- Improvement path: 
  1. Audit routes that call `getBiomarkers()` in a loop. Use batch queries.
  2. Preload trends/signals alongside biomarkers in a single query with joins.

**FHIR Full History Sync on Initial Connect:**
- Problem: `syncFhirForUser(userId, true)` in `apps/api/src/routes/integrations.ts` (line 197) does a full historical backfill on first connect. For a patient with 10+ years of health records, this can fetch 1000+ FHIR resources and persist them, blocking the callback for minutes.
- Files: `apps/api/src/integrations/fhir/sync.ts` (full history flag), `apps/api/src/routes/integrations.ts` line 197
- Cause: FHIR spec allows unbounded queries; no pagination hardlimit.
- Improvement path: 
  1. Paginate FHIR queries; set a max request count (e.g., 100 resources per sync).
  2. Move full sync to background job; return early from callback and queue the backfill.
  3. Cache FHIR resources by syncBatchId to avoid re-processing duplicates.

**AI Brain Latency Not Monitored:**
- Problem: Jeffrey's OpenAI calls (intent parser, protocol synthesis, health chat) depend on network round-trip. No timeout, retry policy, or circuit breaker is visible in the routes.
- Files: `apps/api/src/routes/jeffrey.ts` lines 85–122 (try/catch swallows errors)
- Cause: OpenAI API can be slow or fail; no backpressure mechanism.
- Improvement path: 
  1. Add request timeout (5–10 sec) via fetch AbortController.
  2. Implement exponential backoff + circuit breaker (e.g., 3 retries, 1-second delays).
  3. Track latency histogram (p50, p95, p99) and alert if > 2 seconds.

---

## Test Coverage Gaps

**No Integration Tests for OAuth Flows:**
- What's not tested: WHOOP, FHIR, and Apple Health OAuth callbacks; token storage and refresh.
- Files: `apps/api/src/integrations/whoop/`, `apps/api/src/integrations/fhir/`, `apps/api/src/routes/integrations.ts`
- Risk: Race conditions in token refresh, state parameter forging, and token expiration edge cases are untested.

**No Tests for Large Apple Health Uploads:**
- What's not tested: Parsing and persisting 1000+ biomarker entries; memory usage under load.
- Files: `apps/api/src/integrations/apple-health/parser.ts`, `apps/api/src/services/biomarker.service.ts`
- Risk: Parser may fail on edge cases (malformed XML, huge payloads).

**Jeffrey Evals Cannot Execute:**
- What's not tested: End-to-end Jeffrey surfaces (investor, brand, onboarding, health). Scoring is stubbed.
- Files: `packages/jeffrey-evals/src/score.ts`, `packages/jeffrey-evals/src/jeffrey.eval.test.ts`
- Risk: New Jeffrey versions may degrade quality without detection.

**No Tests for Prompt Injection:**
- What's not tested: User input escaping in Jeffrey prompts; malicious health profile data.
- Files: `apps/api/src/services/jeffrey.service.ts` (inferred)
- Risk: LLM output could be hijacked via crafted biomarker values or condition names.

**No Concurrent Token Refresh Tests:**
- What's not tested: Two simultaneous requests to `getAccessToken()` with an expiring token.
- Files: `apps/api/src/integrations/whoop/oauth.ts`, `apps/api/src/integrations/fhir/sync.ts`
- Risk: Double-refresh, inconsistent state.

**No Audit Log Sanitization Tests:**
- What's not tested: Audit logs do not expose PHI; sensitive fields are masked.
- Files: `apps/api/src/services/audit.service.ts` (inferred)
- Risk: HIPAA violation if audit logs leak PHI to admins.

---

## Known Broken State

**Current Branch Is Design System v0.1 (Not Main):**
- Status: Working directory is on branch `design-system-v0.1`, not `main`.
- Files: All files in the repo are on this branch.
- Impact: Feature and bug fixes merged to `main` are not present locally. Integration, FHIR, and WHOOP handlers wired in `main` may not be on this branch.
- Recommendation: Rebase or merge `main` into `design-system-v0.1` to ensure all production handlers are included.

**Jeffrey Evals Package Incomplete:**
- Status: Evaluation test cases exist but cannot be executed. Scoring is stubbed.
- Files: `packages/jeffrey-evals/src/`, `packages/jeffrey-evals/src/score.ts` lines 1–2
- Impact: Quality gates for Jeffrey surfaces cannot run in CI.
- Next step: Wire `execute.ts` to call the production `jeffrey.service.chat()` and implement scoring via OpenAI.

**Onboarding Surface Authentication Boundary Unclear:**
- Status: `apps/web/app/onboarding/page.tsx` lines 22–26 have TODOs for refactoring state machine.
- Impact: It's unclear which onboarding steps run pre-auth vs post-auth. Current routing may allow auth bypass or lock users out prematurely.
- Next step: Clarify authentication gates; implement in-flight route guards.

---

## Scaling Limits

**SQLite Not Suitable for Production Multi-User Load:**
- Current: Development uses SQLite (`file:./data/aissisted.db`). Production should use Turso (libsql remote) or PostgreSQL.
- Files: `packages/db/src/index.ts` line 7 (DATABASE_URL defaults to SQLite)
- Limit: SQLite is single-writer; concurrent writes to the database will block.
- Scaling path: 
  1. Set up Turso (managed libsql) or RDS PostgreSQL.
  2. Update `DATABASE_URL` in production deployment.
  3. Run schema migrations via `drizzle-kit migrate` (not `push`) against the production database.

**Biomarker Trends Computation Not Indexed:**
- Current: `biomarker_trends` table has no indexes on `(userId, biomarkerName)`.
- Files: `packages/db/src/schema.ts` lines 470–494
- Limit: Queries like "fetch all trends for user" will full-table scan.
- Scaling path: Add indexes on `(userId, biomarkerName)` and `(userId, computedAt DESC)`.

**Raw FHIR Resources Not Indexed for Deduplication:**
- Current: `raw_fhir_resources` table has unique constraint on `(userId, provider, resourceType, resourceId)` but no index on `syncBatchId`.
- Files: `packages/db/src/schema.ts` lines 286–310
- Limit: Queries like "find resources from syncBatch X" will full-table scan.
- Scaling path: Add index on `(userId, syncBatchId)` for efficient sync reprocessing.

**Audit Log Not Indexed:**
- Current: `audit_log` table has no indexes.
- Files: `packages/db/src/schema.ts` lines 265–273
- Limit: Compliance queries like "find all actions by user Y on resource Z" will be slow.
- Scaling path: Add indexes on `(userId, createdAt DESC)` and `(resource, action, createdAt DESC)`.

---

## Dependencies at Risk

**OpenAI API Dependency for Core Jeffrey Brain:**
- Risk: Jeffrey surfaces (health chat, protocol synthesis, intent parsing) all call OpenAI gpt-4o or gpt-4o-mini. If OpenAI API is unavailable, all health features are down.
- Impact: No fallback; requests will timeout or error.
- Migration plan: 
  1. Implement fallback routing to Anthropic Claude API (already integrated in prior phases per git log).
  2. Cache common intents and responses locally.
  3. Add circuit breaker with graceful degradation (e.g., return canned response or queue for async processing).

**ElevenLabs TTS Optional But Not Documented:**
- Risk: Voice output falls back to OpenAI voice if ElevenLabs is unavailable. Router at `apps/api/src/routes/jeffrey.ts` (lines 149–162) returns 503 if key is missing, but frontend behavior is unclear.
- Files: `apps/api/src/routes/jeffrey.ts` lines 149–162
- Impact: Feature is soft-optional but not clearly advertised as such.
- Recommendations: 
  1. Document fallback behavior in API spec.
  2. Return 200 with a `voiceAvailable: false` flag instead of 503.

**Drizzle ORM Version Lock Risk:**
- Risk: `drizzle-orm` and `drizzle-kit` are tightly coupled. Version mismatch can cause migration failures or schema generation bugs.
- Files: `packages/db/package.json` (inferred)
- Scaling path: Pin Drizzle versions together; test migrations on every minor version bump before deploying.

---

## Missing Critical Features

**No Rate Limiting on Integrations:**
- Problem: WHOOP sync, FHIR sync, and Apple Health upload endpoints have no rate limiting. A user or attacker could spam sync requests, exhausting API quota and blocking other users.
- Files: `apps/api/src/routes/integrations.ts` (routes 95–108, 210–225 have no rate limit middleware)
- Blocks: Cannot safely expose integrations to untrusted clients.
- Fix: Add rate limiter middleware (e.g., `@fastify/rate-limit`) with per-user limits (e.g., 10 syncs/hour per provider).

**No Session Timeout for FHIR/WHOOP Tokens:**
- Problem: OAuth tokens are stored indefinitely. If a token is compromised, it remains valid until the user manually disconnects.
- Files: `apps/api/src/integrations/fhir/sync.ts`, `apps/api/src/integrations/whoop/oauth.ts`
- Blocks: PHI is at risk if a token leaks.
- Fix: Add `revokedAt` or `validUntil` field to `integration_tokens` and invalidate tokens after a fixed duration (e.g., 1 year) or on manual disconnect.

**No Webhook Handler for FHIR Push Updates:**
- Problem: Syncs are pull-based (user initiates). FHIR providers (Epic, Cerner) can push updates via subscription webhooks. No handler is implemented.
- Files: `apps/api/src/routes/integrations.ts` (no webhook route)
- Blocks: Real-time health data updates are not possible; only manual sync works.
- Fix: Implement a webhook endpoint that validates FHIR subscription notifications and enqueues a sync job.

**No Health Data Retention Policy:**
- Problem: Biomarkers and FHIR resources are stored indefinitely. HIPAA does not mandate deletion, but a data retention policy should exist for compliance audit trails.
- Files: `packages/db/src/schema.ts` (no TTL or archival fields)
- Blocks: Cannot demonstrate data governance.
- Fix: Add an optional `archivedAt` field to biomarkers and raw FHIR resources; implement a background job to archive stale data (e.g., > 7 years old) to cold storage.

**No Encryption Key Rotation Mechanism:**
- Problem: `TOKEN_ENCRYPTION_KEY` is static. If the key is ever compromised, all historical tokens are exposed.
- Files: `apps/api/src/utils/token-encryption.ts`
- Blocks: Cannot meet advanced HIPAA requirements for key rotation.
- Fix: 
  1. Add a `keyVersion` field to `integration_tokens` and ciphertext.
  2. Implement key rotation job that re-encrypts old tokens with a new key.
  3. Keep old keys in a versioned keystore for decryption.

---

## Architectural Constraints & Trade-Offs

**Single Jeffrey Instance, Multiple Surfaces:**
- Constraint: One OpenAI model serves all surfaces (investor, brand, onboarding, health, concierge). Surfaces are demarcated by prompt templates only, not separate deployments.
- Impact: A prompt injection in one surface can affect all surfaces. Performance bottleneck if multiple surfaces are hit simultaneously.
- Mitigation: Add circuit breaker and request isolation; validate prompt templates before deployment.

**Health Profile Demographics Not Versioned:**
- Constraint: `health_profiles` table has no history; updates overwrite. If a user's DOB or sex changes, the old value is lost.
- Impact: Biomarker interpretation may be incorrect if demographics change (e.g., hormone range shifts with age).
- Mitigation: Add `versionedAt` and archive old profiles to a history table.

**Biomarker Ranges Hardcoded:**
- Constraint: `BIOMARKER_RANGES` in `apps/api/src/engine/biomarker-ranges.ts` are constants. No per-user customization based on lab provider or local reference ranges.
- Impact: FHIR resources from Epic may have different reference ranges than hardcoded values; scores will be inaccurate.
- Mitigation: Extract reference ranges from FHIR Observation resources and store alongside biomarkers.

---

*Concerns audit: 2026-05-04*
