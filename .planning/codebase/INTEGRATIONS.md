# External Integrations

**Analysis Date:** 2026-05-04

## APIs & External Services

**AI & LLM:**
- OpenAI (GPT models + Realtime Voice) - Canonical brain for all Jeffrey surfaces (intent parsing, protocol synthesis, health chat, investor/onboarding/brand conversations)
  - SDK: `openai` v4.77.0 (`packages/jeffrey/package.json`)
  - Client: `packages/jeffrey/src/client.ts` (singleton factory; cached)
  - Config: `OPENAI_API_KEY` (required)
  - Realtime: `packages/jeffrey/src/bridge/openai-realtime.ts` — streaming voice conversations
  - Note: Legacy Anthropic rollback was retired; OpenAI is sole provider

**Voice & Audio:**
- ElevenLabs (Text-to-Speech) - Streaming TTS for voice endpoint
  - Endpoint: `/v1/jeffrey/voice/tts`
  - Config: `ELEVENLABS_API_KEY`, `ELEVENLABS_JEFFREY_VOICE_ID` (optional)
  - Fallback: When unset, endpoint responds 503; app falls back to OpenAI voice
  - Implementation: Referenced in `apps/api/src/config.ts`

**Health Data Integrations:**

### WHOOP
- **Purpose:** Wearable biometric sync — recovery, sleep, workouts, body measurements
- **Integration Type:** OAuth 2.0 flow
- **Config:**
  - Client: `apps/api/src/integrations/whoop/`
  - ClientID/Secret: `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET` (from developer.whoop.com)
  - Redirect URI: `WHOOP_REDIRECT_URI` (default: `http://localhost:4000/integrations/whoop/callback`)
- **Endpoints:**
  - Auth URL: `https://api.prod.whoop.com/oauth/oauth2/auth`
  - Token URL: `https://api.prod.whoop.com/oauth/oauth2/token`
  - API Base: `https://api.prod.whoop.com/developer/v1`
  - Scopes: `read:recovery read:sleep read:workout read:body_measurement read:profile`
- **Implementation:**
  - OAuth handler: `apps/api/src/integrations/whoop/oauth.ts` — `exchangeCode()`, `refreshToken()`
  - Data normalizer: `apps/api/src/integrations/whoop/normalizer.ts` — Converts WHOOP signals to biomarker session history
  - Client: `apps/api/src/integrations/whoop/client.ts` — API requests with error handling
  - Sync: `apps/api/src/integrations/whoop/sync.ts` — Per-user data fetch
  - Token storage: Encrypted in `integration_tokens` table (AES-256-GCM via `apps/api/src/utils/token-encryption.ts`)
  - Scheduler: Automatic sync every 30 minutes (`apps/api/src/scheduler.ts`)

### FHIR SMART-on-FHIR (Epic, Cerner, etc.)
- **Purpose:** Clinical data access — standards-based EHR integration
- **Integration Type:** OAuth 2.0 SMART on FHIR flow
- **Config:**
  - Base URL: `FHIR_BASE_URL` (e.g., Epic sandbox or production endpoint)
  - ClientID: `FHIR_CLIENT_ID`
  - Redirect URI: `FHIR_REDIRECT_URI` (default: `http://localhost:4000/integrations/fhir/callback`)
- **Implementation:**
  - Client stub: `apps/api/src/integrations/fhir/client.ts` — FHIR R4 + SMART on FHIR requests
  - Data normalizer: `apps/api/src/integrations/fhir/normalizer.ts` — Maps FHIR resources to biomarkers
  - Sync: `apps/api/src/integrations/fhir/sync.ts` — Per-user clinical data fetch
  - Token storage: Encrypted in `integration_tokens` table
  - Testing: `apps/api/src/integrations/fhir/__tests__/normalizer.test.ts`

### Apple Health
- **Purpose:** Patient-imported health data — wearable + phone sensors
- **Integration Type:** XML upload (patient uploads export.xml file)
- **Implementation:**
  - Parser: `apps/api/src/integrations/apple-health/parser.ts` — Parses Apple Health XML structure (minimal, single export.xml)
  - Normalizer: `apps/api/src/integrations/apple-health/normalizer.ts` — Maps `HKQuantityTypeIdentifier` keys to canonical biomarker names
  - Upload: Likely via `/v1/integrations/apple-health/upload` (route in `apps/api/src/routes/integrations.ts`)
  - No OAuth — direct file upload with user context

## Data Storage

**Databases:**

**Primary (Local Dev & Compatible with Prod):**
- SQLite + LibSQL driver
  - Default: `file:./data/aissisted.db` (local SQLite file)
  - Turso Support: Environment variable can point to `libsql://...` URL for managed SQLite
  - Client: `@libsql/client` v0.14.0 (`packages/db/package.json`)
  - ORM: Drizzle ORM v0.38.0

**Production:**
- PostgreSQL (supported via `DATABASE_URL="postgresql://user:pass@host:5432/db"`)
- Connection pooling: Built into Drizzle ORM
- Schema: `packages/db/src/schema.ts` — Drizzle schema definitions (users, sessions, integration_tokens, audit_logs, biomarkers, etc.)
- Migrations: Drizzle Kit (`db:generate`, `db:push`, `db:migrate`)

**Key Tables (Health/Integration Data):**
- `integration_tokens` — Encrypted OAuth tokens per provider per user (AES-256-GCM)
- `biomarkers` — Normalized health metrics from all integrations (WHOOP, FHIR, Apple Health)
- `audit_logs` — HIPAA audit trail (daily pruning scheduled)
- `users`, `sessions` — Identity and authentication
- Others: Inferred from schema but not detailed here

**File Storage:**

**PHI (Protected Health Information):**
- AWS S3 (prod) — `infra/aws/modules/storage-phi/` for lab PDFs and health documents
- Encryption: AWS KMS customer-managed key (separate CMK per data class)
- Access: Bucket policy restricts to authenticated API role

**Audit Logs:**
- AWS S3 (prod) — `infra/aws/modules/storage-audit/` with S3 Object Lock (WORM — Write Once, Read Many) for compliance

**Non-PHI App Artifacts:**
- AWS S3 (prod) — `infra/aws/modules/storage-app/` for public assets, UI builds

**Local Dev:**
- Filesystem only (`./data/`, `./uploads/`) — no explicit file storage integration in code; parsed/normalized to database

## Caching

**Redis:**
- ElastiCache Redis cluster (prod only)
  - Defined in `infra/aws/modules/cache/`
  - Use case: Session cache, rate-limit counters, real-time data cache
  - Implementation: Not yet visible in app code (skeleton phase); will integrate with Fastify plugins

**Local Dev:**
- No caching layer configured

## Authentication & Identity

**Auth Provider:**
- Custom implementation — JWT-based
  - Secret: `JWT_SECRET` environment variable (required; `process.env.JWT_SECRET`)
  - Plugin: `@fastify/jwt` v10.0.0 (`apps/api/package.json`)
  - Encryption for tokens at rest: `TOKEN_ENCRYPTION_KEY` (AES-256-GCM via `apps/api/src/utils/token-encryption.ts`)

**Password Hashing:**
- bcryptjs v3.0.3 (app logic for user registration/login)

**OAuth Integrations (for health data):**
- WHOOP OAuth 2.0 (see WHOOP section above)
- FHIR SMART-on-FHIR OAuth 2.0 (see FHIR section above)
- Apple Health — file upload, no OAuth (patient provides export)

**Token Storage:**
- Encrypted in `integration_tokens` table
- Encryption: AES-256-GCM (Node.js native crypto module)
- Key: `TOKEN_ENCRYPTION_KEY` environment variable (base64-encoded 32 bytes)
- Migration-safe: Legacy plaintext tokens pass through on decryption and are re-encrypted on next refresh (`apps/api/src/utils/token-encryption.ts`)

## Monitoring & Observability

**Error Tracking:**
- Not detected in current codebase
- Candidate: Sentry, Rollbar, or AWS X-Ray (infrastructure skeleton allows for future integration)

**Logs:**
- Fastify default logger (Pino)
- Log output: stdout/stderr (typical for containerized deployments)
- Structured logging: Leveraged by Pino for JSON output
- Example: `log.info("Scheduled WHOOP sync starting")` in `apps/api/src/scheduler.ts`
- Audit logging: `apps/api/src/middleware/audit.ts` — HIPAA-compliant audit trail (logged to database)
- CloudWatch (prod): AWS logs collected via CloudWatch agent or container logs (ECS integration)

**Dashboards & Alarms:**
- CloudWatch dashboards (defined in `infra/aws/modules/observability/`)
- CloudWatch alarms for API health, database performance, Lambda errors

## CI/CD & Deployment

**Hosting:**
- **API:** AWS ECS Fargate (production) — container orchestration via Terraform
  - Docker image: Inferred from apps/api (Node.js base image)
  - Service: `infra/aws/modules/compute-api/` — ECS task + service definition
  - Load balancer: AWS ALB with CloudFront distribution
- **Web:** Vercel (assumed from Next.js stack; referenced in `.env.example` as `NEXT_PUBLIC_API_URL`)
  - Alternative: AWS ECS or S3 + CloudFront
- **Secrets Management:** AWS Secrets Manager (prod)
  - Rotation Lambda: `infra/aws/modules/secrets/` — automatic rotation for database credentials
  - Accessed by: ECS task role + execution role policies (`infra/aws/policies/`)

**CI Pipeline:**
- GitHub Actions (implied by `infra/aws/modules/ci-oidc/` OIDC provider for zero-secret CI)
- Workflows: `.github/workflows/` (not detailed here; GHA-orchestrated Turbo builds)

**Infrastructure as Code:**
- **Tool:** Terraform
- **Region:** `us-east-1` (HIPAA-eligible region, Eastern US latency optimization)
- **State:** Remote S3 + DynamoDB (bootstrap setup in `infra/aws/BOOTSTRAP.md`)
- **Structure:** `infra/aws/` with per-environment (prod/staging/dev) configs and reusable modules
- **Modules:**
  - Network (VPC, subnets, NAT, VPC endpoints)
  - Compute (ECS Fargate for API)
  - Database (RDS PostgreSQL Multi-AZ)
  - Storage (S3 for PHI, audit logs, app artifacts)
  - KMS (customer-managed keys per data class)
  - Secrets Manager (credential rotation)
  - ALB + CloudFront + WAF (edge security)
  - Route 53 (DNS + DNSSEC)
  - Observability (CloudWatch, X-Ray)
  - Compliance (Config conformance pack, Security Hub, GuardDuty)
  - CI/OIDC (GitHub Actions OIDC role for zero-secret deployments)

## Environment Configuration

**Required Environment Variables:**
```
OPENAI_API_KEY                     # LLM brain (required)
DATABASE_URL                        # SQLite or PostgreSQL connection
JWT_SECRET                         # Session signing
TOKEN_ENCRYPTION_KEY               # OAuth token encryption (base64-encoded 32 bytes)
```

**Recommended for Features:**
```
ELEVENLABS_API_KEY                 # TTS (optional; fallback to OpenAI voice)
ELEVENLABS_JEFFREY_VOICE_ID        # ElevenLabs voice ID
WHOOP_CLIENT_ID
WHOOP_CLIENT_SECRET
WHOOP_REDIRECT_URI
FHIR_BASE_URL
FHIR_CLIENT_ID
FHIR_REDIRECT_URI
```

**Optional:**
```
ALLOWED_ORIGINS                    # CORS allowlist (dev permissive, prod explicit)
PORT                              # API server port (default: 4000)
API_HOST                          # API bind address (default: 0.0.0.0)
NODE_ENV                          # "development" or "production"
NEXT_PUBLIC_API_URL               # Frontend API URL (for Next.js)
```

**Secrets Location:**
- Development: `.env` file (local, not committed)
- Production: AWS Secrets Manager (referenced by ECS task role)
- CI: GitHub Actions secrets + OIDC for zero-secret deployment

## Webhooks & Callbacks

**Incoming (OAuth Callbacks):**
- `/integrations/whoop/callback` — WHOOP OAuth redirect
- `/integrations/fhir/callback` — FHIR SMART-on-FHIR redirect
- `/integrations/apple-health/upload` — Apple Health XML upload (assumed from normalizer/parser presence)

**Outgoing:**
- Not detected in current scope
- Candidates: Future webhooks for integration status updates, health alerts

## Data Classification & Compliance

**HIPAA Considerations:**
- **Protected Health Information (PHI):** WHOOP/FHIR/Apple Health metrics, lab documents stored in encrypted S3 buckets (KMS-protected)
- **Encryption in Transit:** HTTPS only (ALB + CloudFront enforce TLS 1.2+)
- **Encryption at Rest:** AES-256-GCM for OAuth tokens in database; KMS CMK for S3 buckets
- **Audit Trail:** Database audit_logs + CloudTrail (AWS API logging)
- **Access Control:** IAM roles (ECS task + execution), resource-based bucket policies, VPC endpoints for private connectivity
- **Data Retention:** Scheduled audit log pruning (daily, see `apps/api/src/scheduler.ts`)

---

*Integration audit: 2026-05-04*
