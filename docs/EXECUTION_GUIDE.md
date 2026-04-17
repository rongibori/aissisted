# Aissisted: Post-Migration Execution Guide

**Date**: April 15, 2026
**Context**: PostgreSQL migration is in place. Fastify remains the API framework. AWS deployment assets are present.
**Goal**: Get the app running on PostgreSQL locally, verify core flows, then prepare for AWS deployment.

---

## What Was Changed (Summary)

These are the key migration-related files currently present in the repo:

| File | Change |
|------|--------|
| `packages/db/src/schema.ts` | Full migration: `sqliteTable` -> `pgTable`, `uuid` PKs, `timestamp` columns, `pgEnum`, `jsonb`, `doublePrecision`, `boolean` |
| `packages/db/src/index.ts` | Switched from `@libsql/client` -> `pg.Pool` (node-postgres) with connection pooling + SSL |
| `packages/db/src/migrate.ts` | Changed migrator import to `drizzle-orm/node-postgres/migrator` |
| `packages/db/src/encryption.ts` | **NEW** - AES-256-GCM field-level encryption for HIPAA PII protection |
| `packages/db/drizzle.config.ts` | Dialect changed from `sqlite` to `postgresql` |
| `packages/db/package.json` | Removed `@libsql/client`, added `pg` + `@types/pg` |
| `apps/api/src/index.ts` | Updated migrator import + health check (`db.execute(sql\`SELECT 1\`)`) |
| `.env.example` | Default `DATABASE_URL` now points to PostgreSQL |
| `infra/aws/cloudformation.yml` | **NEW** - Full CloudFormation: VPC, RDS, ECS, ALB, security groups |
| `infra/aws/ecs-task-definition.json` | **NEW** - Fargate task definition |
| `infra/aws/README.md` | **NEW** - AWS deployment guide |
| `infra/docker-compose.prod.yml` | **NEW** - Production-like local PG config |
| `docs/ARCHITECTURE.md` | **NEW** - Updated architecture doc |
| `docs/PHASE_1_EXECUTION.md` | **NEW** - Updated Phase 1 plan |

---

## Verified Repo Snapshot

The following facts are confirmed from the current repository:

- The API is already using **Fastify** and registers auth, profile, biomarker, protocol, chat, integrations, adherence, and health-state routes.
- The database package is already using **Drizzle + PostgreSQL** via the `pg` driver.
- Root workspace scripts include `dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, and `db:push`.
- AWS deployment assets exist under the AWS infrastructure folder.

**Implication**: the immediate job is not framework replacement — it is local PostgreSQL bring-up, timestamp/date cleanup, smoke testing, and then deployment hardening.

---

## PHASE A: Get Running Locally (30 minutes)

### Step 1: Clean Up Old SQLite Artifacts

Open your terminal in the project root (`aissisted/`):

```bash
# Delete old SQLite migration files (incompatible with PG)
rm -rf packages/db/drizzle

# Delete old SQLite data files if they exist
rm -rf apps/api/data/aissisted.db
```

### Step 2: Create Your `.env` File

```bash
# Copy the updated example
cp .env.example .env
```

Open `.env` and verify these values:

```env
DATABASE_URL="postgresql://aissisted:aissisted@localhost:5432/aissisted"
PORT=4000
API_HOST="0.0.0.0"
JWT_SECRET="change-me-in-production"
ANTHROPIC_API_KEY="sk-ant-..."   # <-- ADD YOUR KEY
```

The `TOKEN_ENCRYPTION_KEY` and `FIELD_ENCRYPTION_KEY` are optional for local dev (a fallback key is used automatically).

### Step 3: Start PostgreSQL

```bash
# Start PG using the existing docker-compose
docker compose up -d postgres
```

Verify it's running:

```bash
docker compose ps
# Should show postgres as "healthy"

# Test the connection
docker exec -it aissisted-postgres-1 psql -U aissisted -c "SELECT 1"
# Should return: 1
```

If the container name differs, check with `docker ps`.

### Step 4: Install Dependencies

```bash
# This will:
# - Remove @libsql/client from node_modules
# - Install pg + @types/pg
# - Regenerate the lockfile
pnpm install
```

**Expected**: You'll see `@libsql/client` removed and `pg` added. The lockfile will update.

### Step 5: Push Schema to PostgreSQL

```bash
# This applies the schema directly (no migration files needed for dev)
pnpm --filter @aissisted/db db:push
```

**Expected output**: Drizzle will create all tables, enums, and indexes. You should see output like:

```
[info] Creating enum "sex"
[info] Creating enum "biomarker_source"
...
[info] Creating table "users"
[info] Creating table "health_profiles"
...
```

**If it fails**: Check that PostgreSQL is running and `DATABASE_URL` is correct in `.env`.

### Step 6: Fix Date Type Mismatches

This is the **one manual code change** required. The schema now uses `timestamp` columns (which expect JavaScript `Date` objects), but the existing service files pass ISO strings (`new Date().toISOString()`).

**The fix is mechanical**: Change `new Date().toISOString()` to `new Date()` everywhere it's used for database inserts/updates.

Run this to see all affected files:

```bash
grep -rn "new Date().toISOString()" apps/api/src/services/ apps/api/src/middleware/ apps/api/src/routes/ apps/api/src/integrations/
```

**Files that need changes** (approximately 15 files, 30 instances):

For each file, the pattern is the same:

```typescript
// BEFORE (SQLite - stored dates as text)
const now = new Date().toISOString();
await db.insert(schema.users).values({ ..., createdAt: now, updatedAt: now });

// AFTER (PostgreSQL - timestamp columns expect Date objects)
const now = new Date();
await db.insert(schema.users).values({ ..., createdAt: now, updatedAt: now });
```

**Specific files to update:**

| File | What to change |
|------|---------------|
| `services/auth.service.ts` | `const now = new Date().toISOString()` -> `const now = new Date()` (lines 22, 94) |
| `services/profile.service.ts` | Same pattern (line 35) |
| `services/biomarker.service.ts` | Same pattern (lines 28, 111) |
| `services/protocol.service.ts` | Same pattern (line 164) |
| `services/conversation.service.ts` | Same pattern (lines 17, 50) |
| `services/adherence.service.ts` | Same pattern (line 21). **Special case line 43**: `new Date().toISOString().slice(0, 10)` is for date comparison (YYYY-MM-DD string), NOT a DB insert. **Leave this one as-is** or change to a date comparison query. |
| `services/jeffrey.service.ts` | Same pattern (line 82) — but this is `takenAt`, which may be nullable |
| `services/audit.service.ts` | Same pattern (line 51) |
| `services/conditions.service.ts` | Same pattern (line 41) |
| `services/medications.service.ts` | Same pattern (line 42) |
| `services/trends.service.ts` | Same pattern (line 179) |
| `services/analysis.service.ts` | Same pattern (line 719) |
| `middleware/audit.ts` | Same pattern (line 61) |
| `integrations/whoop/oauth.ts` | Same pattern (lines 76, 96) |
| `integrations/fhir/sync.ts` | Same pattern (lines 51, 142, 208, 231, 257, 317, 351) |
| `integrations/fhir/normalizer.ts` | Line 102: This returns a date string from FHIR data. Wrap in `new Date(...)`: `return new Date(obs.effectiveDateTime ?? obs.effectivePeriod?.start ?? new Date().toISOString())` |
| `integrations/apple-health/normalizer.ts` | Line 62: Same — wrap in `new Date(...)` |
| `routes/adherence.ts` | Line 44: Change `new Date().toISOString()` to `new Date()` |

**Quick way to do most of them** (find-and-replace in your editor):

Find: `const now = new Date().toISOString();`
Replace: `const now = new Date();`

This catches ~70% of the instances. The remaining ones are inline uses or special cases — handle those individually.

**TypeScript will catch any you miss.** After making changes, run:

```bash
pnpm --filter @aissisted/api typecheck
```

Any remaining type errors will point to exactly where a `string` is being passed where a `Date` is expected.

### Step 7: Start the API

```bash
pnpm --filter @aissisted/api dev
```

**Expected output**:

```
Aissisted API running on http://0.0.0.0:4000
```

### Step 8: Smoke Test

```bash
# Health check (should show db: "ok")
curl http://localhost:4000/health

# Register a user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@aissisted.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@aissisted.com","password":"Test123!"}'
# Copy the JWT token from the response

# Create a biomarker (replace YOUR_TOKEN)
curl -X POST http://localhost:4000/biomarkers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Vitamin D, 25-OH","value":45,"unit":"ng/mL","source":"manual"}'
```

If all three return 200-level responses, **you're running on PostgreSQL**.

### Step 9: Verify Data in PG

```bash
docker exec -it aissisted-postgres-1 psql -U aissisted -c "SELECT id, email FROM users;"
docker exec -it aissisted-postgres-1 psql -U aissisted -c "SELECT name, value, unit FROM biomarkers;"
```

---

## PHASE B: Generate New Migration Files (5 minutes)

Once everything works with `db:push`, generate proper migration files for production:

```bash
# Generate SQL migration files from the current schema
pnpm --filter @aissisted/db db:generate
```

This creates files in `packages/db/drizzle/` — these are the production migration files that will be applied by the API on startup (or via `db:migrate`).

```bash
# Commit the new migrations
git add packages/db/drizzle/
git commit -m "feat: add PostgreSQL migration files"
```

---

## PHASE C: Run Tests (15 minutes)

```bash
# Type check first so remaining Date mismatches are surfaced clearly
pnpm --filter @aissisted/api typecheck

# Then run API tests
pnpm --filter @aissisted/api test
```

Some tests may fail if they were written against SQLite-specific behavior. Common fixes:

1. **Date comparisons in tests**: Tests that compare ISO strings need to compare `Date` objects or formatted dates instead.
2. **ID format**: Tests that create IDs as custom strings need to use UUIDs (or let the DB generate them by omitting the `id` field on inserts).
3. **JSON fields**: Tests that stored JSON as `JSON.stringify(...)` in text columns — with `jsonb`, you can pass objects directly.

---

## PHASE D: AWS Deployment (When Ready)

The full AWS deployment guide is at `infra/aws/README.md`. High-level steps:

### Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** configured (`aws configure`)
3. **Docker** installed
4. **ACM Certificate** for your domain (e.g., `api.aissisted.com`)

### Step 1: Sign the AWS BAA

This is the HIPAA requirement. Go to AWS Artifact in the console and sign the Business Associate Addendum (BAA). This must be done BEFORE storing any PHI.

### Step 2: Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name aissisted-staging \
  --template-body file://infra/aws/cloudformation.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=AccountId,ParameterValue=YOUR_ACCOUNT_ID \
    ParameterKey=CertificateArn,ParameterValue=YOUR_CERT_ARN \
    ParameterKey=DBMasterPassword,ParameterValue=YOUR_SECURE_PASSWORD \
  --capabilities CAPABILITY_IAM
```

Wait for stack creation (~10-15 minutes):

```bash
aws cloudformation wait stack-create-complete --stack-name aissisted-staging
```

### Step 3: Set SSM Parameters (Secrets)

```bash
# Database URL (get RDS endpoint from CloudFormation outputs)
aws ssm put-parameter --name "/aissisted/prod/database-url" \
  --type SecureString \
  --value "postgresql://aissisted:PASSWORD@RDS_ENDPOINT:5432/aissisted?sslmode=require"

# JWT Secret
aws ssm put-parameter --name "/aissisted/prod/jwt-secret" \
  --type SecureString \
  --value "$(openssl rand -hex 32)"

# Anthropic API Key
aws ssm put-parameter --name "/aissisted/prod/anthropic-api-key" \
  --type SecureString \
  --value "sk-ant-..."

# Field/Token Encryption Key
aws ssm put-parameter --name "/aissisted/prod/token-encryption-key" \
  --type SecureString \
  --value "$(openssl rand -base64 32)"
```

### Step 4: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t aissisted-api .

# Tag
docker tag aissisted-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/aissisted-api:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/aissisted-api:latest
```

### Step 5: Run Migrations on RDS

```bash
# Use SSM Session Manager or a bastion to connect
# Or temporarily open RDS to your IP in the security group

DATABASE_URL="postgresql://aissisted:PASSWORD@RDS_ENDPOINT:5432/aissisted?sslmode=require" \
  pnpm --filter @aissisted/db db:migrate
```

### Step 6: Force ECS Deployment

```bash
aws ecs update-service --cluster aissisted-cluster --service aissisted-api-service --force-new-deployment
```

### Step 7: Verify

```bash
# Get ALB DNS from CloudFormation outputs
curl https://YOUR_ALB_DNS/health
```

---

## PHASE E: Remaining Phase 1 Tasks

After local PostgreSQL is running, the remaining Phase 1 work is:

| Task | Status | Est. Time |
|------|--------|-----------|
| PostgreSQL schema push + validation | In progress | 30 min |
| Date object fixes in service layer | In progress | 1 hour |
| Backend API (Fastify routes) | Verified present | -- |
| Auth (JWT + register/login) | Verified present | -- |
| Audit logging | Verified present | -- |
| Frontend dashboard (Next.js) | Needs completion | 2-3 days |
| Frontend onboarding flow | Needs completion | 1-2 days |
| Biomarker CRUD UI | Needs completion | 1-1.5 days |
| Protocol display UI | Needs completion | 1-1.5 days |
| Integration tests for PG flow | Needs verification/update | 0.5 day |
| Deploy to staging | After AWS setup | 0.5 day |

**Execution reality**: the backend foundation is already substantially in place. The main delivery risk now is connecting and finishing the frontend against the live API.

---

## Quick Reference: Key Commands

```bash
# Start PostgreSQL
docker compose up -d postgres

# Start API (dev mode with hot reload)
pnpm --filter @aissisted/api dev

# Start frontend (Next.js)
pnpm --filter @aissisted/web dev

# Push schema changes (dev)
pnpm --filter @aissisted/db db:push

# Generate migration files (for production)
pnpm --filter @aissisted/db db:generate

# Run migrations (production)
pnpm --filter @aissisted/db db:migrate

# Type check
pnpm --filter @aissisted/api typecheck

# Type check
pnpm --filter @aissisted/api typecheck

# Run tests
pnpm --filter @aissisted/api test

# Open Drizzle Studio (DB browser)
pnpm --filter @aissisted/db db:studio

# Generate encryption keys
openssl rand -hex 32          # JWT_SECRET
openssl rand -base64 32       # FIELD_ENCRYPTION_KEY
```

---

**Document Owner**: Ron Gibori
**Prepared by**: Claude (April 15, 2026)
**Status**: Execution-ready and aligned to the current repo

## Rollback Strategy

If the Postgres migration fails in production, follow this procedure to restore the previous SQLite-backed state.

### Prerequisites

- AWS RDS snapshot taken immediately before cutover (tag: `pre-postgres-cutover`)
- Previous SQLite database file preserved at `apps/api/data/aissisted.db.pre-migration`
- Environment variable rollback plan documented in `.env.rollback`

### Rollback procedure

1. **Stop all application traffic.** Scale the Fastify API deployment to 0 replicas. Confirm no active connections to Postgres.
2. **Restore the RDS snapshot.** Run:
3. **Revert environment variables.** Copy `.env.rollback` over `.env` in the API deployment. This restores `DATABASE_URL` to the SQLite path.
4. **Restore the SQLite file.** Copy `apps/api/data/aissisted.db.pre-migration` to `apps/api/data/aissisted.db`.
5. **Redeploy the previous API build.** Use the pinned `pre-postgres-cutover` Docker image tag.
6. **Scale traffic back up.** Verify the `/health` endpoint returns 200 before opening to users.

### Post-rollback

- File a postmortem within 24 hours documenting root cause and detection gap.
- Do not re-attempt the migration until the postmortem identifies the failure mode and a corrected cutover plan is approved.
- Keep the restored SQLite database as the source of truth until the next migration window.

