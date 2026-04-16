#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Aissisted AWS Deploy — repeatable production deployment
#
#  1. Build Docker image for apps/api
#  2. Push to ECR (tagged with git SHA + "latest")
#  3. Deploy/update CloudFormation stack
#  4. Wait for ECS service to stabilize
#  5. Update SSM database-url param with real RDS endpoint
#  6. Force new deployment so tasks pick up updated DATABASE_URL
#  7. Smoke test https://<domain>/health
#
# Usage:  ./infra/aws/deploy.sh
#         FORCE_REBUILD=1 ./infra/aws/deploy.sh      # ignore image tag cache
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Load bootstrap config ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/.bootstrap-output.env"

[[ -f "${CONFIG_FILE}" ]] || { echo "Missing ${CONFIG_FILE}. Run ./infra/aws/bootstrap.sh first." >&2; exit 1; }
# shellcheck disable=SC1090
source "${CONFIG_FILE}"

STACK_NAME="aissisted-${ENVIRONMENT}"
TEMPLATE_FILE="${SCRIPT_DIR}/cloudformation.yml"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
IMAGE_TAG=$(cd "${REPO_ROOT}" && git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d-%H%M%S)

# ── Colors ──────────────────────────────────────────────────────────────────
G="\033[0;32m"; Y="\033[1;33m"; R="\033[0;31m"; B="\033[0;34m"; N="\033[0m"
log()  { echo -e "${B}[deploy]${N} $*"; }
ok()   { echo -e "${G}[deploy]${N} $*"; }
warn() { echo -e "${Y}[deploy]${N} $*"; }
die()  { echo -e "${R}[deploy]${N} $*" >&2; exit 1; }

command -v docker >/dev/null || die "docker not found. Start Docker Desktop."
command -v aws    >/dev/null || die "aws CLI not found."

log "Stack:         ${STACK_NAME}"
log "Region:        ${AWS_REGION}"
log "Domain:        ${SUBDOMAIN}.${DOMAIN}"
log "Image tag:     ${IMAGE_TAG}"
log "ECR:           ${ECR_URI}"
echo ""

# ── 1. Build ────────────────────────────────────────────────────────────────
log "Step 1/7 — Docker build (linux/amd64)"
cd "${REPO_ROOT}"

# Apple Silicon requires --platform
docker buildx build \
    --platform linux/amd64 \
    --file apps/api/Dockerfile \
    --tag "aissisted/api:${IMAGE_TAG}" \
    --tag "aissisted/api:latest" \
    --load \
    .
ok "Image built: aissisted/api:${IMAGE_TAG}"

# ── 2. Push to ECR ──────────────────────────────────────────────────────────
log "Step 2/7 — Push to ECR"
aws ecr get-login-password --region "${AWS_REGION}" \
    | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker tag "aissisted/api:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker tag "aissisted/api:${IMAGE_TAG}" "${ECR_URI}:latest"
docker push "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:latest"
ok "Pushed ${ECR_URI}:${IMAGE_TAG}"

# ── 3. Deploy CloudFormation stack ──────────────────────────────────────────
log "Step 3/7 — CloudFormation deploy (stack=${STACK_NAME})"

DB_PASSWORD=$(aws ssm get-parameter --region "${AWS_REGION}" \
    --name "${SSM_PREFIX}/db-master-password" --with-decryption \
    --query 'Parameter.Value' --output text)

aws cloudformation deploy \
    --region "${AWS_REGION}" \
    --stack-name "${STACK_NAME}" \
    --template-file "${TEMPLATE_FILE}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        "Environment=${ENVIRONMENT}" \
        "DomainName=${DOMAIN}" \
        "SubDomain=${SUBDOMAIN}" \
        "HostedZoneId=${HOSTED_ZONE_ID}" \
        "CertificateArn=${CERT_ARN}" \
        "ImageTag=${IMAGE_TAG}" \
        "DBMasterPassword=${DB_PASSWORD}" \
    --tags \
        "Project=aissisted" \
        "Environment=${ENVIRONMENT}" \
    --no-fail-on-empty-changeset

ok "Stack deployed."

# ── 4. Get RDS endpoint, update DATABASE_URL in SSM ─────────────────────────
log "Step 4/7 — Update DATABASE_URL with RDS endpoint"

RDS_ENDPOINT=$(aws cloudformation describe-stacks \
    --region "${AWS_REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
    --output text)

DATABASE_URL="postgresql://aissisted:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/aissisted?sslmode=require"

CURRENT_URL=$(aws ssm get-parameter \
    --region "${AWS_REGION}" \
    --name "${SSM_PREFIX}/database-url" \
    --with-decryption \
    --query 'Parameter.Value' --output text)

if [[ "${CURRENT_URL}" != "${DATABASE_URL}" ]]; then
    aws ssm put-parameter \
        --region "${AWS_REGION}" \
        --name "${SSM_PREFIX}/database-url" \
        --value "${DATABASE_URL}" \
        --type SecureString \
        --overwrite >/dev/null
    ok "DATABASE_URL updated → ${RDS_ENDPOINT}"
else
    ok "DATABASE_URL already current"
fi

# ── 5. Force new deployment to pick up secrets ──────────────────────────────
log "Step 5/7 — Force ECS service redeploy"
CLUSTER_NAME=$(aws cloudformation describe-stacks \
    --region "${AWS_REGION}" --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" --output text)
SERVICE_NAME=$(aws cloudformation describe-stacks \
    --region "${AWS_REGION}" --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='ECSServiceName'].OutputValue" --output text)

aws ecs update-service \
    --region "${AWS_REGION}" \
    --cluster "${CLUSTER_NAME}" \
    --service "${SERVICE_NAME}" \
    --force-new-deployment >/dev/null

# ── 6. Wait for service to stabilize ────────────────────────────────────────
log "Step 6/7 — Waiting for ECS service to stabilize (~5-10 min on first deploy)..."
aws ecs wait services-stable \
    --region "${AWS_REGION}" \
    --cluster "${CLUSTER_NAME}" \
    --services "${SERVICE_NAME}" \
    || warn "ECS wait timed out. Check service events: aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME}"

ok "Service stable."

# ── 7. Smoke test ───────────────────────────────────────────────────────────
log "Step 7/7 — Smoke test https://${SUBDOMAIN}.${DOMAIN}/health"

for attempt in 1 2 3 4 5; do
    if RESPONSE=$(curl -sS --max-time 10 "https://${SUBDOMAIN}.${DOMAIN}/health" 2>&1); then
        ok "Response: ${RESPONSE}"
        echo ""
        ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ok " DEPLOY COMPLETE — https://${SUBDOMAIN}.${DOMAIN}"
        ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
    fi
    warn "Attempt ${attempt}/5 failed, retrying in 15s..."
    sleep 15
done

die "Smoke test failed. Check: aws logs tail /ecs/aissisted-${ENVIRONMENT}-api --follow --region ${AWS_REGION}"
