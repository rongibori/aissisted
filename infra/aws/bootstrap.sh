#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Aissisted AWS Bootstrap — ONE-TIME setup before first deploy
#
# Creates resources that must exist BEFORE the CloudFormation stack runs:
#   1. Route 53 hosted zone (for aissisted.co)
#   2. ACM TLS certificate (for *.aissisted.co)
#   3. ECR repository (aissisted/api)
#   4. SSM Parameter Store secrets (DB password, JWT, encryption key, API keys)
#
# Idempotent: safe to re-run. Skips what already exists.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
DOMAIN="${DOMAIN:-aissisted.co}"
SUBDOMAIN="${SUBDOMAIN:-api}"
ECR_REPO="${ECR_REPO:-aissisted/api}"
SSM_PREFIX="/aissisted/${ENVIRONMENT}"

# ── Colors ──────────────────────────────────────────────────────────────────
G="\033[0;32m"; Y="\033[1;33m"; R="\033[0;31m"; B="\033[0;34m"; N="\033[0m"
log()  { echo -e "${B}[bootstrap]${N} $*"; }
ok()   { echo -e "${G}[bootstrap]${N} $*"; }
warn() { echo -e "${Y}[bootstrap]${N} $*"; }
die()  { echo -e "${R}[bootstrap]${N} $*" >&2; exit 1; }

# ── Preflight ───────────────────────────────────────────────────────────────
command -v aws >/dev/null || die "aws CLI not found. Install: brew install awscli"
command -v jq  >/dev/null || die "jq not found. Install: brew install jq"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) \
    || die "AWS credentials not configured. Run: aws configure"

log "AWS Account:  ${ACCOUNT_ID}"
log "Region:       ${AWS_REGION}"
log "Environment:  ${ENVIRONMENT}"
log "Domain:       ${SUBDOMAIN}.${DOMAIN}"
log ""

# ── 1. Route 53 Hosted Zone ─────────────────────────────────────────────────
log "Step 1/4 — Route 53 hosted zone for ${DOMAIN}"

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name "${DOMAIN}." \
    --max-items 1 \
    --query "HostedZones[?Name=='${DOMAIN}.'].Id | [0]" \
    --output text 2>/dev/null | sed 's|/hostedzone/||' || echo "")

if [[ -z "${HOSTED_ZONE_ID}" || "${HOSTED_ZONE_ID}" == "None" ]]; then
    log "Creating hosted zone..."
    CREATE_OUTPUT=$(aws route53 create-hosted-zone \
        --name "${DOMAIN}" \
        --caller-reference "aissisted-$(date +%s)" \
        --hosted-zone-config "Comment=Aissisted ${ENVIRONMENT},PrivateZone=false")
    HOSTED_ZONE_ID=$(echo "${CREATE_OUTPUT}" | jq -r '.HostedZone.Id' | sed 's|/hostedzone/||')
    ok "Created hosted zone: ${HOSTED_ZONE_ID}"
else
    ok "Hosted zone exists: ${HOSTED_ZONE_ID}"
fi

NAMESERVERS=$(aws route53 get-hosted-zone \
    --id "${HOSTED_ZONE_ID}" \
    --query "DelegationSet.NameServers" \
    --output text | tr '\t' '\n')

echo ""
warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
warn " ACTION REQUIRED: Update nameservers at GoDaddy"
warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${NAMESERVERS}" | sed 's/^/   /'
warn "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Go to: GoDaddy → aissisted.co → DNS → Nameservers → 'I'll use my own'"
echo "  Paste the 4 values above. Save. Propagation: 5-60 min (usually)."
echo ""

# ── 2. ACM Certificate ──────────────────────────────────────────────────────
log "Step 2/4 — ACM TLS certificate"

CERT_ARN=$(aws acm list-certificates \
    --region "${AWS_REGION}" \
    --query "CertificateSummaryList[?DomainName=='*.${DOMAIN}'].CertificateArn | [0]" \
    --output text 2>/dev/null || echo "")

if [[ -z "${CERT_ARN}" || "${CERT_ARN}" == "None" ]]; then
    log "Requesting certificate for *.${DOMAIN} and ${DOMAIN}..."
    CERT_ARN=$(aws acm request-certificate \
        --region "${AWS_REGION}" \
        --domain-name "*.${DOMAIN}" \
        --subject-alternative-names "${DOMAIN}" \
        --validation-method DNS \
        --key-algorithm RSA_2048 \
        --tags "Key=Name,Value=aissisted-${ENVIRONMENT}" \
        --query CertificateArn --output text)
    ok "Cert requested: ${CERT_ARN}"

    log "Waiting 15s for DNS validation records to be available..."
    sleep 15

    # Auto-create DNS validation records in Route 53
    VALIDATION=$(aws acm describe-certificate \
        --region "${AWS_REGION}" \
        --certificate-arn "${CERT_ARN}" \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
    V_NAME=$(echo "${VALIDATION}"  | jq -r '.Name')
    V_TYPE=$(echo "${VALIDATION}"  | jq -r '.Type')
    V_VALUE=$(echo "${VALIDATION}" | jq -r '.Value')

    log "Creating DNS validation record: ${V_NAME}"
    CHANGE_BATCH=$(cat <<EOF
{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"${V_NAME}","Type":"${V_TYPE}","TTL":300,"ResourceRecords":[{"Value":"${V_VALUE}"}]}}]}
EOF
)
    aws route53 change-resource-record-sets \
        --hosted-zone-id "${HOSTED_ZONE_ID}" \
        --change-batch "${CHANGE_BATCH}" \
        --query 'ChangeInfo.Id' --output text >/dev/null
    ok "DNS validation record created."

    warn "Waiting for ACM cert to be issued (this requires nameservers already point to Route 53)..."
    warn "If stuck >10 min, verify GoDaddy nameservers are set correctly."
    aws acm wait certificate-validated \
        --region "${AWS_REGION}" \
        --certificate-arn "${CERT_ARN}" || warn "Wait timed out — check status manually."
else
    ok "ACM cert exists: ${CERT_ARN}"
fi

# ── 3. ECR Repository ───────────────────────────────────────────────────────
log "Step 3/4 — ECR repository: ${ECR_REPO}"

if aws ecr describe-repositories \
    --region "${AWS_REGION}" \
    --repository-names "${ECR_REPO}" >/dev/null 2>&1; then
    ok "ECR repo exists: ${ECR_REPO}"
else
    aws ecr create-repository \
        --region "${AWS_REGION}" \
        --repository-name "${ECR_REPO}" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --image-tag-mutability IMMUTABLE \
        --tags "Key=Name,Value=aissisted-${ENVIRONMENT}" >/dev/null
    ok "Created ECR repo: ${ECR_REPO}"

    # Lifecycle: keep last 20 images
    aws ecr put-lifecycle-policy \
        --region "${AWS_REGION}" \
        --repository-name "${ECR_REPO}" \
        --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 20 images","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":20},"action":{"type":"expire"}}]}' \
        >/dev/null
fi

# ── 4. SSM Parameter Store Secrets ──────────────────────────────────────────
log "Step 4/4 — SSM Parameter Store secrets at ${SSM_PREFIX}/*"

put_param_if_missing() {
    local name="$1" value="$2" description="$3"
    if aws ssm get-parameter --region "${AWS_REGION}" --name "${name}" >/dev/null 2>&1; then
        ok "SSM param exists: ${name}"
    else
        aws ssm put-parameter \
            --region "${AWS_REGION}" \
            --name "${name}" \
            --value "${value}" \
            --type SecureString \
            --description "${description}" \
            --tags "Key=Environment,Value=${ENVIRONMENT}" \
            >/dev/null
        ok "Created SSM param: ${name}"
    fi
}

DB_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '=+/' | cut -c1-24)
JWT_SECRET=$(openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')

# Database URL — use placeholder for now; deploy.sh will update with real RDS endpoint
put_param_if_missing \
    "${SSM_PREFIX}/database-url" \
    "postgresql://aissisted:${DB_PASSWORD}@PLACEHOLDER:5432/aissisted?sslmode=require" \
    "Postgres connection string — placeholder until stack deploys and populates RDS endpoint"

put_param_if_missing \
    "${SSM_PREFIX}/db-master-password" \
    "${DB_PASSWORD}" \
    "RDS master password (consumed by CloudFormation at deploy time)"

put_param_if_missing \
    "${SSM_PREFIX}/jwt-secret" \
    "${JWT_SECRET}" \
    "JWT signing secret (openssl rand -hex 32)"

put_param_if_missing \
    "${SSM_PREFIX}/token-encryption-key" \
    "${TOKEN_ENCRYPTION_KEY}" \
    "AES-256-GCM key for OAuth token encryption (HIPAA)"

if ! aws ssm get-parameter --region "${AWS_REGION}" --name "${SSM_PREFIX}/anthropic-api-key" >/dev/null 2>&1; then
    warn "Anthropic API key not set. Paste it now (input hidden) or press Enter to skip:"
    read -rs ANTHROPIC_KEY
    echo ""
    if [[ -n "${ANTHROPIC_KEY}" ]]; then
        put_param_if_missing \
            "${SSM_PREFIX}/anthropic-api-key" \
            "${ANTHROPIC_KEY}" \
            "Anthropic API key (console.anthropic.com)"
    else
        put_param_if_missing \
            "${SSM_PREFIX}/anthropic-api-key" \
            "PLACEHOLDER_SET_ME" \
            "Anthropic API key — UPDATE ME before deploy"
        warn "Anthropic key set to placeholder. Update before deploy:"
        warn "  aws ssm put-parameter --overwrite --region ${AWS_REGION} \\"
        warn "    --name ${SSM_PREFIX}/anthropic-api-key --type SecureString \\"
        warn "    --value sk-ant-..."
    fi
fi

# ── Output ──────────────────────────────────────────────────────────────────
echo ""
ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ok " BOOTSTRAP COMPLETE"
ok "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Hosted Zone ID : ${HOSTED_ZONE_ID}"
echo "  ACM Cert ARN   : ${CERT_ARN}"
echo "  ECR URI        : ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
echo "  SSM Prefix     : ${SSM_PREFIX}/*"
echo ""

# Save for deploy.sh to consume
CONFIG_FILE="$(dirname "$0")/.bootstrap-output.env"
cat > "${CONFIG_FILE}" <<EOF
# Generated by bootstrap.sh — consumed by deploy.sh
AWS_REGION=${AWS_REGION}
ENVIRONMENT=${ENVIRONMENT}
DOMAIN=${DOMAIN}
SUBDOMAIN=${SUBDOMAIN}
ACCOUNT_ID=${ACCOUNT_ID}
HOSTED_ZONE_ID=${HOSTED_ZONE_ID}
CERT_ARN=${CERT_ARN}
ECR_REPO=${ECR_REPO}
SSM_PREFIX=${SSM_PREFIX}
EOF
ok "Saved config → ${CONFIG_FILE}"
echo ""
echo "  Next: ./infra/aws/deploy.sh"
