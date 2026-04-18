# Aissisted AWS Deployment

HIPAA-ready production stack for `api.aissisted.co`. VPC + RDS Postgres 16 Multi-AZ + ECS Fargate + ALB + ACM + Route 53, all Infrastructure as Code.

---

## What this creates

| Resource | Purpose |
|---|---|
| VPC (10.0.0.0/16) | Isolated network, 2 public + 2 private subnets across 2 AZs |
| NAT Gateways (x2) | Private-subnet egress for ECS tasks |
| RDS Postgres 16 | Multi-AZ, encrypted at rest (KMS), TLS, 35-day backups, deletion-protected |
| ECS Fargate cluster | Runs API containers, Container Insights enabled |
| Application Load Balancer | HTTPS (443) + HTTP→HTTPS redirect (80), ACM cert |
| Route 53 A-record | `api.aissisted.co` → ALB alias |
| CloudWatch Logs | 7-year retention (HIPAA audit compliance) |
| SSM Parameter Store | Encrypted secrets (DB URL, JWT, encryption keys, API keys) |
| ECR repo | `aissisted/api`, immutable tags, scan-on-push |
| IAM roles | Least-privilege execution + task roles |

---

## Prerequisites

1. **AWS CLI installed and configured:** `aws sts get-caller-identity` must return your account ID
2. **BAA signed** in AWS Artifact (required for HIPAA)
3. **Docker Desktop running**
4. **jq installed:** `brew install jq`
5. **Domain registered at GoDaddy:** `aissisted.co`
6. **API runs locally:** `pnpm --filter @aissisted/api dev` + `curl localhost:4000/health` returns `"db":"ok"`

---

## Deploy sequence (first time)

### Step 1 — Regenerate lockfile (one-time cleanup)

The local dev fix used manual symlinks. Before Docker build, regenerate the lockfile so `pnpm install --frozen-lockfile` works inside the container:

```bash
cd ~/Documents/GitHub/aissisted
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml apps/api/package.json
git commit -m "chore: add drizzle-orm and pg to apps/api deps"
```

### Step 2 — Bootstrap (one-time, ~3 min active + 15-60 min DNS wait)

```bash
./infra/aws/bootstrap.sh
```

This will:
1. Create Route 53 hosted zone for `aissisted.co`, print the 4 nameservers
2. Request ACM wildcard certificate `*.aissisted.co`
3. Auto-create DNS validation records in Route 53
4. Create ECR repo `aissisted/api`
5. Generate secure random secrets (DB password, JWT, encryption key) → SSM
6. Prompt for your Anthropic API key (or set it later)
7. Write `.bootstrap-output.env` for `deploy.sh` to consume

**After it prints the 4 nameservers — go to GoDaddy → change nameservers → wait for propagation.**

Check propagation:
```bash
dig NS aissisted.co +short
# Should return the Route 53 nameservers
```

ACM cert validation won't complete until GoDaddy points at Route 53. `bootstrap.sh` blocks on the cert until validated — if it times out, just re-run it after DNS propagates.

### Step 3 — Deploy

```bash
./infra/aws/deploy.sh
```

This will:
1. Build Docker image for `linux/amd64` (works on M1/M2/M3 Macs)
2. Push to ECR (tagged with git SHA + `latest`)
3. Deploy CloudFormation stack
4. Update SSM `DATABASE_URL` with real RDS endpoint
5. Force new ECS deployment to pick up secrets
6. Wait for service to stabilize (~5-10 min on first deploy)
7. Smoke test `https://api.aissisted.co/health`

**First deploy takes ~15-20 min total** (RDS provisioning dominates).

---

## After deploy

Validate:
```bash
curl https://api.aissisted.co/health
# Expected: {"status":"ok","checks":{"db":"ok"}}
```

Tail logs:
```bash
aws logs tail /ecs/aissisted-production-api --follow --region us-east-1
```

Describe service:
```bash
aws ecs describe-services \
  --cluster aissisted-production \
  --services aissisted-production-api \
  --region us-east-1
```

---

## Subsequent deploys

Just re-run:
```bash
./infra/aws/deploy.sh
```

Fully idempotent — builds new image with current git SHA, pushes, updates task definition, rolls tasks.

---

## Estimated monthly cost (us-east-1, idle)

| Resource | Monthly |
|---|---|
| RDS db.t4g.small Multi-AZ (100GB gp3) | ~$55 |
| ECS Fargate (2 tasks × 0.5 vCPU × 1GB, 24/7) | ~$25 |
| Application Load Balancer | ~$20 |
| NAT Gateway (x2) + data transfer | ~$35 |
| CloudWatch Logs (7yr retention, low volume) | ~$5 |
| Route 53 hosted zone + queries | ~$1 |
| ECR storage + ACM + SSM | negligible |
| **Total** | **~$141/mo** |

**Cost levers (post-MVP):**
- Scale ECS to 1 task off-hours → save ~$12
- Consolidate NAT gateways to 1 AZ → save ~$17 (loses HA)
- Single-AZ RDS (NOT HIPAA-recommended for prod)

---

## Rollback

**App-only rollback (no infra change):**
```bash
IMAGE_TAG=<old-git-sha> ./infra/aws/deploy.sh
```

**Destroy the entire stack (⚠️ RDS snapshot retained):**
```bash
# First disable deletion protection on RDS
aws rds modify-db-instance \
  --db-instance-identifier aissisted-production-postgres \
  --no-deletion-protection --apply-immediately --region us-east-1

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name aissisted-production --region us-east-1
```

---

## Known gaps (future work)

- [ ] Migration runner: one-off ECS task for `drizzle-kit migrate`
- [ ] GitHub Actions CI/CD: auto-deploy on push to `main` after tests pass
- [ ] WAF in front of ALB: rate limiting, OWASP rules, geo-blocking
- [ ] AWS Backup plan: cross-region snapshot replication for DR
- [ ] GuardDuty + Security Hub: HIPAA threat detection
- [ ] Secrets Manager rotation: auto-rotate DB password every 90 days

---

## Troubleshooting

### Stack deploy fails with `Certificate must be in <region>`
ACM cert must be in the same region as the ALB. `bootstrap.sh` requests it in `$AWS_REGION`. If you changed regions, re-run bootstrap.

### ECS tasks crash-loop with "Unable to pull secrets"
Task execution role lacks permission to read SSM params. Verify:
```bash
aws ssm describe-parameters --region us-east-1 \
  --parameter-filters "Key=Name,Option=BeginsWith,Values=/aissisted/production/"
```

### Health check fails
- Confirm ALB SG allows 443 from 0.0.0.0/0
- Confirm task SG allows 4000 from ALB SG
- Tail logs: `aws logs tail /ecs/aissisted-production-api --follow`
- Most common cause: `DATABASE_URL` still at placeholder. Re-run `deploy.sh` — it updates the param after RDS is live.

### Image push denied
Re-auth with ECR:
```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
```
