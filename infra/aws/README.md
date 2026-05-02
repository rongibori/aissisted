# aissisted — AWS Infrastructure (HIPAA-eligible)

**Status:** Skeleton — not yet applied. Phase 1 deliverable per `docs/AISSISTED_BETA_LAUNCH_PLAN_v1.md` §3.4.
**Owner:** Ron + Cowork (drafts) → engineer (apply).
**Region:** `us-east-1` (per §6 decision; lowest latency to Eastern US user base; widest service availability for HIPAA-eligible services).

---

## Why this directory exists

The Beta Launch Plan §3 commits us to a HIPAA-defensible AWS posture. This directory is the source of truth for that infrastructure, expressed as Terraform.

**Operating rule:** every PHI-touching resource is created via Terraform. No console clicks for prod. The exception window is the bootstrap account setup (Identity Center, BAA execution, root-user MFA) which is documented in `BOOTSTRAP.md` and run once.

---

## Directory layout

```
infra/aws/
├── README.md                      # This file
├── BOOTSTRAP.md                   # One-time pre-Terraform steps (Org, BAA, SSO)
├── backend.tf                     # S3+DynamoDB remote state (bootstrap-only)
├── versions.tf                    # Terraform + provider pins
├── envs/
│   ├── prod/
│   │   ├── main.tf                # Composes modules for prod
│   │   ├── terraform.tfvars       # env-specific values (no secrets — use AWS Secrets Manager)
│   │   └── outputs.tf
│   ├── staging/
│   │   └── ...                    # Mirrors prod with smaller sizes
│   └── dev/
│       └── ...                    # Single-AZ, smaller instances
├── modules/
│   ├── network/                   # VPC, subnets, NAT, route tables, VPC endpoints
│   ├── compute-api/               # ECS Fargate cluster + service for apps/api
│   ├── database/                  # RDS Postgres Multi-AZ + parameter groups
│   ├── cache/                     # ElastiCache Redis cluster
│   ├── storage-phi/               # S3 buckets for PHI (lab PDFs) with KMS CMK
│   ├── storage-audit/             # S3 bucket for audit-log archive (object-lock)
│   ├── storage-app/               # S3 for non-PHI app artifacts
│   ├── kms/                       # Customer-managed KMS keys (separate per data class)
│   ├── secrets/                   # Secrets Manager structure + rotation Lambda
│   ├── alb-edge/                  # ALB, ACM cert, CloudFront, WAF
│   ├── dns/                       # Route 53 zones + records (DNSSEC enabled)
│   ├── observability/             # CloudWatch dashboards, alarms, log groups, retention
│   ├── ci-oidc/                   # GitHub OIDC provider + role for CI deploys
│   └── compliance/                # Config conformance pack, Security Hub standards, GuardDuty
└── policies/
    ├── ecs-task-role.json         # Task role policy (per-service)
    ├── ecs-execution-role.json    # Execution role policy
    └── ci-deploy-role.json        # Role assumed by GitHub Actions
```

---

## Module dependency graph

Apply order (each row depends on rows above):

```
1. kms                          ← create CMKs first; everything else encrypts with them
2. network                      ← VPC + subnets + endpoints
3. dns                          ← zones (do this early; ACM cert validation needs it)
4. alb-edge                     ← ALB + ACM cert + CloudFront + WAF
5. database, cache              ← RDS, Redis (parallel)
6. storage-phi, storage-audit, storage-app  ← S3 buckets (parallel)
7. secrets                      ← DB credentials + API keys
8. compute-api                  ← ECS service (depends on ALB, DB, cache, secrets)
9. observability                ← CloudWatch (depends on everything else)
10. compliance                  ← Config/Security Hub (cross-cutting; runs last)
11. ci-oidc                     ← OIDC trust + deploy role
```

---

## What this skeleton does NOT include yet (intentional gaps for Phase 1)

| Gap | Reason | Resolution |
|---|---|---|
| Actual `.tf` files | Drafting separately to avoid premature commitments | Per-module work tickets; one engineer applies to dev first |
| Vercel + AWS networking | Vercel functions hitting our API need either VPC peering or public ALB with strict allow-listing | Phase 1 week 2 spike — decide before exposing PHI through Vercel |
| Pre-prod (Phase 1 F-14) | Decision pending: separate AWS account vs separate VPC in dev account | §6 — likely separate account named `aissisted-staging` |
| Vault/secrets rotation cadence | Default 30 days for DB; manual for API keys | Document in `BOOTSTRAP.md` post-apply |
| Disaster-recovery plan | RTO/RPO targets need product input | Phase 4 HIPAA-10 deliverable |

---

## Cost ceilings (rough; for budget gating)

Steady-state monthly estimates for prod at 200 beta users:

| Resource | Sizing | Monthly |
|---|---|---|
| RDS Postgres | db.r6g.large Multi-AZ + 100GB gp3 + 35d backups | ~$400 |
| ElastiCache Redis | cache.r6g.large single-node | ~$140 |
| ECS Fargate (apps/api) | 2 tasks × 1 vCPU/2GB avg | ~$80 |
| ALB + CloudFront + WAF | Standard | ~$60 |
| S3 (PHI + audit + app) | <100GB total | ~$15 |
| KMS | ~6 CMKs + usage | ~$30 |
| CloudWatch + Config + Security Hub + GuardDuty | All-on | ~$150 |
| NAT Gateway | 1 NAT × 730h | ~$33 |
| Secrets Manager | ~10 secrets | ~$5 |
| Route 53 + ACM | Hosted zones + records | ~$5 |
| **Total prod** | | **~$920/mo** |

Staging adds ~$300/mo (smaller RDS, single-AZ, smaller cache, 1 Fargate task).
Dev adds ~$120/mo (db.t4g.small, no Multi-AZ, no cache redundancy).

**Total beta-era infra: ~$1,340/mo.**

This is the Beta Launch Plan §6 implication: HIPAA AWS posture costs ~$1.4k/mo at our scale, plus OpenAI Enterprise (volume-priced), ElevenLabs, Vercel. Total infra run-rate at beta scale: **~$2.5–3k/mo**.

---

## Terraform conventions

- **State backend:** S3 with versioning + KMS encryption + DynamoDB lock table. Bootstrap once via `backend.tf` with hand-applied initial state.
- **Naming:** `aissisted-{env}-{resource-type}-{purpose}`. Example: `aissisted-prod-rds-app`, `aissisted-prod-s3-phi-labs`.
- **Tagging (mandatory):** every resource gets `env`, `data-class` (`phi` | `non-phi` | `public`), `owner`, `cost-center`. Enforced via Service Control Policy in the Org.
- **Module versioning:** internal modules pinned by Git SHA in env composition; no `latest`.
- **`terraform plan` → `apply` flow:** plan output reviewed in PR; apply only after merge. CI runs plan on PR; manual `apply` from a privileged role on main.

---

## Critical questions still open (for Ron + engineer to resolve in Phase 1 week 1)

1. **Vercel BAA path.** Vercel Enterprise BAA covers Vercel Functions + Edge Functions touching PHI. Are we paying for Enterprise, or routing all PHI through ECS Fargate and keeping Vercel as a static + non-PHI layer only? §6 didn't lock this — implications differ by ~$2k/mo and architecture.
2. **OpenAI realtime API region.** Realtime API is currently `us-east-1` only via standard endpoints. If we expand to a non-US region in the future, Realtime falls back to non-Realtime. Acceptable for beta.
3. **ElevenLabs PHI exposure.** ElevenLabs receives Jeffrey's response text for TTS. That text *can* contain PHI (e.g., "your A1c trended down to 5.4 this quarter"). Two paths: (a) sign BAA with ElevenLabs (verify availability — historically not standard); (b) strip biomarker values from TTS-bound text and rephrase in-text only. Option (b) is uglier but safer if (a) is unavailable.
4. **Audit log immutability.** S3 Object Lock + Glacier achieves immutability for archives. For the *hot* tier in Postgres, we need either an append-only table with a trigger blocking UPDATE/DELETE, or a separate audit DB the app cannot write directly. §3.3 commits to "dedicated admin endpoint" — needs spec'ing.

---

## Next steps in order

1. **Apply BOOTSTRAP** (Ron + engineer, 1 day)
2. **Draft `modules/kms`, `modules/network`, `modules/dns` `.tf`** (engineer, 2 days)
3. **Apply to `aissisted-dev` first** (engineer, 1 day; iterate)
4. **Draft `modules/database`, `modules/storage-phi`, `modules/secrets` `.tf`** (engineer, 2 days)
5. **Apply to `aissisted-dev`; smoke test apps/api against dev RDS** (engineer, 2 days)
6. **Draft remaining modules + `envs/staging`, `envs/prod`** (engineer, 4 days)
7. **Apply to `aissisted-staging`; full deploy of apps/api + apps/web + apps/site** (Phase 1 F-14)
8. **Apply to `aissisted-prod`; cutover plan documented; DNS swap last** (Phase 1 F-12)

Total Phase 1 infra: **~2 weeks of one engineer**, matches §2 Phase 1 close-out window.
