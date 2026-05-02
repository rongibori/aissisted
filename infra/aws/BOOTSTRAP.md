# aissisted AWS Bootstrap — One-Time Steps

**Run this BEFORE any Terraform apply.** These are the manual setup steps that cannot be expressed in Terraform because they create the trust foundation Terraform will use.

**Owner:** Ron + engineer (pair). Estimated time: **half a day**.

---

## Prerequisites

- A non-personal email Ron controls for the AWS root account. Recommended: `aws@aissisted.me` (a distribution list with Ron + 1 backup person, NEVER a personal mailbox).
- Hardware MFA device (YubiKey or equivalent) for the root user.
- Phone for SMS-based verification (used once during AWS account creation).

---

## Step 1 — Create AWS Organization root account

1. Sign up at <https://aws.amazon.com/> using `aws@aissisted.me`.
2. Provide billing details (corporate card, not personal).
3. Verify phone + email.
4. Choose **Business support tier minimum** for the root account ($100/mo) — required for prompt response on any HIPAA-affecting incident.
5. Immediately enable **hardware MFA** on the root user.
6. Generate a long random password, store in 1Password under "AWS Root — aissisted-org". Tag it with "do-not-use-after-bootstrap".
7. Sign out. Never sign in as root again unless responding to a billing or trust-restoration emergency.

---

## Step 2 — Execute the AWS Business Associate Addendum (BAA)

1. As the root user, navigate to **AWS Artifact** → **Agreements** → **AWS BAA**.
2. Read the BAA. Click **Accept** on behalf of Aissisted Inc.
3. Once accepted, the org is HIPAA-eligible for HIPAA-eligible services. List of eligible services: <https://aws.amazon.com/compliance/hipaa-eligible-services-reference/>.
4. Document the acceptance date in `docs/specs/SECURITY_AND_COMPLIANCE_V1.md` §BAA Inventory.

---

## Step 3 — Set up AWS Organizations + member accounts

From the root account:

1. Navigate to **AWS Organizations** → **Create organization** → enable all features.
2. Create three member accounts:
   - `aissisted-prod` — email `aws-prod@aissisted.me`
   - `aissisted-staging` — email `aws-staging@aissisted.me`
   - `aissisted-dev` — email `aws-dev@aissisted.me`
3. The BAA cascades to member accounts automatically.
4. Set up an OU structure:
   - `Production` OU contains `aissisted-prod`
   - `Non-Production` OU contains `aissisted-staging`, `aissisted-dev`
5. Apply Service Control Policies (SCPs):
   - **`DenyDeletionOfAuditResources`** — denies `s3:DeleteBucket`, `s3:PutBucketPolicy` on resources tagged `data-class=audit`.
   - **`DenyDisablingCloudTrail`** — denies `cloudtrail:StopLogging`, `cloudtrail:DeleteTrail`, `cloudtrail:UpdateTrail`.
   - **`RequireMFAForSensitiveActions`** — denies a wide list of destructive actions when no MFA token present.
   - **`DenyResourceCreationWithoutTags`** — denies create-resource calls missing `env`, `data-class`, `owner`, `cost-center` tags. Apply to Production OU strictly; Non-Production OU in warn-only mode for first 30 days.

---

## Step 4 — Set up Identity Center (SSO)

In the root account:

1. Enable **Identity Center**.
2. Create users:
   - `ron@aissisted.me` (admin in all accounts)
   - One per future engineer
3. Create permission sets:
   - `AdministratorAccess` (break-glass; assigned to Ron only)
   - `PowerUserAccess` (engineers in dev + staging; read-only in prod)
   - `ReadOnlyAccess` (default for new joiners)
   - `BillingAdmin` (Ron + finance role only)
   - `SecurityAuditor` (read-only across all accounts; for compliance reviews)
4. Assign Ron's user to `AdministratorAccess` in all three accounts.
5. **Disable the AWS access portal "console" button for users who don't need it.**
6. **NEVER create IAM users with long-lived access keys.** All human + CI access via SSO or OIDC.

---

## Step 5 — CloudTrail centralization

In the root account:

1. Create an **organization-wide CloudTrail** that ships logs from all three member accounts.
2. Destination: a dedicated S3 bucket in a fourth account `aissisted-logs` (create now if not yet) — `aws-logs@aissisted.me`.
3. Bucket settings:
   - Object Lock enabled in compliance mode
   - 7-year retention
   - KMS CMK encryption (key created in `aissisted-logs` account; cross-account grants for the trail)
   - Block all public access
   - Versioning enabled
   - MFA delete enabled
4. CloudTrail config:
   - Management events: All
   - Data events for S3: Yes (PHI buckets)
   - Data events for Lambda: Yes
   - Insights events: Enabled
   - Log file validation: Enabled

---

## Step 6 — Bootstrap Terraform state backend

In the `aissisted-dev` account (intentional — bootstrap state in non-prod first):

1. Manually (this once) create:
   - S3 bucket `aissisted-tf-state` with versioning, KMS encryption, public access block, MFA delete.
   - DynamoDB table `aissisted-tf-locks` (partition key: `LockID` string).
2. Save the bucket name + lock table name as variables in `infra/aws/backend.tf`:
   ```hcl
   terraform {
     backend "s3" {
       bucket         = "aissisted-tf-state"
       key            = "envs/${env}/terraform.tfstate"
       region         = "us-east-1"
       dynamodb_table = "aissisted-tf-locks"
       encrypt        = true
       kms_key_id     = "alias/aissisted-tf-state"
     }
   }
   ```
3. Verify by running `terraform init` from `infra/aws/envs/dev/`.

---

## Step 7 — GuardDuty + Config + Security Hub (organization-level)

1. **GuardDuty** — enable in root, delegate to `aissisted-prod` as the GuardDuty admin. Auto-enable for all member accounts. Enable Malware Protection, S3 Protection, EKS Protection (latter unused but enabled for consistency).
2. **AWS Config** — enable in all accounts and regions. Apply the **Operational-Best-Practices-for-HIPAA-Security** conformance pack to `aissisted-prod`. Aggregate findings to `aissisted-prod` as the Config admin.
3. **Security Hub** — enable in all accounts, with the **AWS Foundational Security Best Practices** standard and the **HIPAA** standard. Aggregate to `aissisted-prod`.
4. Hook all three services' findings into a notification SNS topic that pipes to a `#sec-alerts` Slack channel (set up in Phase 1 week 2).

---

## Step 8 — Domain + DNSSEC

In the `aissisted-prod` account:

1. Create Route 53 hosted zones:
   - `aissisted.me` (apex; landing site)
   - Subdomains created later via Terraform
2. Enable DNSSEC for `aissisted.me`. Generate the KSK with KMS asymmetric key.
3. Update the registrar (current registrar TBD per `jeffrey/DNS_SETUP_GUIDE.md`) with the DS record from Route 53.
4. Verify DNSSEC chain validates with `dig +dnssec aissisted.me`.

---

## Step 9 — Sanity verification before any Terraform apply

Before running ANY `terraform apply`, verify:

- [ ] Root user MFA hardware key works
- [ ] All three member accounts created and accessible via SSO
- [ ] AWS BAA acceptance recorded in compliance doc
- [ ] CloudTrail logs from all member accounts are arriving in `aissisted-logs` bucket
- [ ] Config + GuardDuty + Security Hub all green in `aissisted-prod`
- [ ] Terraform state backend (`aissisted-tf-state` bucket + `aissisted-tf-locks` table) exists in `aissisted-dev` and `terraform init` succeeds
- [ ] DNSSEC validates for `aissisted.me`
- [ ] No long-lived IAM access keys in any account (`aws iam list-access-keys` empty for all users)

When all 8 boxes are checked, proceed to `infra/aws/envs/dev/` and run `terraform plan`.

---

## What you'll have at the end of this bootstrap

A four-account AWS organization with:
- HIPAA BAA executed
- Hardware-MFA root, never used
- Identity Center SSO for all human access
- Org-wide CloudTrail in an immutable log archive
- Config + GuardDuty + Security Hub reporting findings centrally
- Terraform state backend ready for module work
- DNSSEC-secured apex domain
- All access via short-lived credentials (SSO sessions or OIDC tokens)

This is the trust foundation. Everything else is automation on top of it.
