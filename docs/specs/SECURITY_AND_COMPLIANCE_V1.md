# SECURITY & COMPLIANCE — V1

**Version:** 1.0
**Date:** 2026-04-30
**Status:** Draft — for legal/compliance review
**Owner:** Engineering + Legal
**Anchors:** AISSISTED_BETA_LAUNCH_PLAN_v1 §3 (HIPAA AWS Infrastructure)
**Depends on:** AWS BAA executed, OpenAI BAA executed, attorney engagement

---

## 0. PURPOSE

This document maps Aissisted's technical and operational controls to the **HIPAA Security Rule** (45 CFR 164.302–318) and HIPAA Privacy Rule basics. It exists to:

1. Make HIPAA-required controls explicit so engineering knows what to build
2. Give legal and external auditors a single document to review
3. Surface gaps before Beta launch, not during a breach

This is a **control catalog** — not a privacy policy or Notice of Privacy Practices. Those are separate legal documents.

---

## 1. SCOPE

### 1.1 What's in scope

Aissisted handles **Protected Health Information (PHI)** under HIPAA the moment any of the following occurs:

- A user uploads a lab result PDF
- A user connects Epic / SMART on FHIR (lab values flow into the user health graph)
- A user enters medical conditions, medications, or allergies in onboarding
- A user shares biometrics from WHOOP / Oura / Apple Health (these are PHI when associated with health context)
- Jeffrey conversations reference any of the above

PHI is a subset of all data Aissisted holds. Non-PHI (marketing site analytics, newsletter signups, investor-room interest) is out of scope for this document.

### 1.2 Aissisted as a Covered Entity vs Business Associate

Aissisted is a **direct-to-consumer wellness product**, not a covered entity. However, when integrating with covered entities (e.g., Epic FHIR servers operated by hospitals), Aissisted acts as a **Business Associate** to that covered entity.

**Practical implication:** Aissisted must execute a Business Associate Agreement (BAA) with:
- Each Epic-integrated health system at SMART on FHIR launch
- Every cloud vendor that processes PHI (AWS, OpenAI, ElevenLabs, etc.)

---

## 2. DATA CLASSIFICATION

Every database table, S3 bucket, and Redis key is classified at one of three levels:

| Class | Definition | Examples | Access controls |
|---|---|---|---|
| **PHI** | Health information that identifies an individual, or could reasonably do so | `health_profiles`, `biomarkers`, `medications`, `lab_panels`, `protocols`, `audit_log` (records PHI access), `conversations` (Jeffrey), `health_signals` | RLS-enforced; non-PHI services blocked at network layer; encrypted at rest with KMS CMK; audit log records every access |
| **PII (non-PHI)** | Identifies an individual but isn't health-specific | `users.email`, `subscriptions.stripe_customer_id`, `user_preferences` | Encrypted at rest; access logged but not PHI-class audited |
| **Public / Operational** | Doesn't identify an individual or doesn't deserve special handling | App config, brand tokens, marketing copy, eval cohort fixtures (synthetic), build artifacts | Standard repo controls |

### 2.1 Tagging in code and infra

| Layer | Mechanism |
|---|---|
| **Postgres tables** | All PHI tables live in `phi.*` schema. Non-PHI in `public.*`. RLS policies on every PHI table. |
| **AWS resources** | Mandatory tag `data-class=phi\|pii\|public` on every Terraform-managed resource. CloudWatch metric filter alerts on untagged resources. |
| **TypeScript types** | PHI types branded: `type PhiBiomarker = Biomarker & { __phi: true }`. Compile-time guard against accidental non-PHI service handling PHI. (Implementation queued.) |
| **API routes** | Routes touching PHI registered with `withPhiAudit()` middleware that writes to audit log. |

---

## 3. HIPAA SECURITY RULE CONTROL MAPPING

The Security Rule has three categories of safeguards: Administrative, Physical, Technical. Below maps each required and addressable specification to Aissisted's implementation.

### 3.1 Administrative Safeguards (164.308)

| § | Standard | Aissisted control | Status |
|---|---|---|---|
| (a)(1)(i) | Security Management Process | Risk register in `docs/specs/RISK_REGISTER.md` (to draft); annual review | TODO |
| (a)(1)(ii)(A) | Risk Analysis | Annual third-party assessment + quarterly internal review | TODO Beta-1 |
| (a)(1)(ii)(B) | Risk Management | Documented mitigation plan per identified risk | TODO Beta-1 |
| (a)(1)(ii)(C) | Sanction Policy | HR policy: documented disciplinary process for workforce violations | TODO Beta-1 |
| (a)(1)(ii)(D) | Information System Activity Review | Audit log review monthly; alerts on anomalies (Sentry + GuardDuty) | Phase 1 (logging) → Phase 4 (review cadence) |
| (a)(2) | Assigned Security Responsibility | Ron is Security Officer until org grows; documented in this doc | ✅ This doc |
| (a)(3)(i) | Workforce Security | Background check on hires with PHI access; documented role definitions | TODO when team grows |
| (a)(3)(ii)(A) | Authorization | Identity Center (SSO) groups define access; least-privilege defaults | Phase 1 |
| (a)(3)(ii)(B) | Workforce Clearance | Manual review before granting prod access; ticket required | Phase 1 |
| (a)(3)(ii)(C) | Termination Procedures | Identity Center deprovisioning + key rotation runbook | TODO Beta-1 |
| (a)(4)(i) | Information Access Management | Role-based access via Identity Center groups | Phase 1 |
| (a)(4)(ii)(A) | Isolating Healthcare Clearinghouse Functions | N/A — Aissisted is not a clearinghouse | N/A |
| (a)(4)(ii)(B) | Access Authorization | Documented in IAM + RLS policies | Phase 1 |
| (a)(4)(ii)(C) | Access Establishment and Modification | Quarterly access review; documented in Confluence | TODO Beta-1 |
| (a)(5)(i) | Security Awareness and Training | All workforce: 1-hour HIPAA training before PHI access; annual refresh | TODO when team grows |
| (a)(5)(ii)(A) | Security Reminders | Monthly security newsletter / Slack reminder | TODO when team grows |
| (a)(5)(ii)(B) | Protection from Malicious Software | Endpoint security on workforce machines; AWS GuardDuty on infra | Phase 1 |
| (a)(5)(ii)(C) | Log-in Monitoring | CloudTrail on all auth events; Identity Center login logs | Phase 1 |
| (a)(5)(ii)(D) | Password Management | Identity Center enforces MFA + complexity; user passwords bcrypt + complexity rules | Phase 1 |
| (a)(6)(i) | Security Incident Procedures | Incident response runbook in `docs/runbooks/incident-response.md` (to draft) | TODO Beta-1 |
| (a)(6)(ii) | Response and Reporting | 60-day breach notification per HIPAA; documented in privacy policy | TODO Beta-1 |
| (a)(7)(i) | Contingency Plan | Documented backup/restore + DR plan | Phase 4 |
| (a)(7)(ii)(A) | Data Backup Plan | RDS automated backups (35d retention) + S3 cross-region replication for PHI | Phase 1 |
| (a)(7)(ii)(B) | Disaster Recovery Plan | Documented RTO 4h / RPO 1h for Beta | Phase 4 |
| (a)(7)(ii)(C) | Emergency Mode Operation Plan | Read-only mode failover documented; user notification template | Phase 4 |
| (a)(7)(ii)(D) | Testing and Revision | Quarterly DR drill; annual tabletop | TODO post-Beta |
| (a)(7)(ii)(E) | Applications and Data Criticality Analysis | RTO/RPO per service documented | Phase 4 |
| (a)(8) | Evaluation | Annual third-party HIPAA assessment | TODO post-Beta |
| (b)(1) | Business Associate Contracts | BAA inventory in `docs/baa-inventory.md`; signed before any PHI flow | Phase 1 |

### 3.2 Physical Safeguards (164.310)

Aissisted runs in AWS. Physical safeguards delegate to AWS via the BAA.

| § | Standard | Aissisted control | Status |
|---|---|---|---|
| (a)(1) | Facility Access Controls | AWS controls; documented in BAA | ✅ AWS |
| (a)(2)(i) | Contingency Operations | AWS multi-AZ; documented in DR plan | Phase 1 |
| (a)(2)(ii) | Facility Security Plan | AWS responsibility | ✅ AWS |
| (a)(2)(iii) | Access Control and Validation | AWS Identity Center + IAM | Phase 1 |
| (a)(2)(iv) | Maintenance Records | AWS Config tracks changes; CloudTrail logs | Phase 1 |
| (b) | Workstation Use | Laptop policy: encryption-at-rest required, screen lock <5min, AV running | TODO when team grows |
| (c) | Workstation Security | Same | TODO when team grows |
| (d)(1) | Device and Media Controls | Workforce laptops not used for PHI bulk export; documented | TODO when team grows |
| (d)(2)(i) | Disposal | AWS destroys decommissioned media (NIST 800-88 compliant) | ✅ AWS |
| (d)(2)(ii) | Media Re-use | AWS handles | ✅ AWS |
| (d)(2)(iii) | Accountability | CloudTrail + IAM logs | Phase 1 |
| (d)(2)(iv) | Data Backup and Storage | RDS automated backups + S3 versioning | Phase 1 |

### 3.3 Technical Safeguards (164.312)

| § | Standard | Aissisted control | Status |
|---|---|---|---|
| (a)(1) | Access Control | RLS in Postgres; IAM least-privilege; SSO MFA | Phase 1 |
| (a)(2)(i) | Unique User Identification | All access via Identity Center SSO; users get UUID `users.id` | Phase 1 |
| (a)(2)(ii) | Emergency Access Procedure | Break-glass IAM role with audit-trail-on-use; documented | TODO Beta-1 |
| (a)(2)(iii) | Automatic Logoff | App session 24h max; admin console 1h max; configurable | Phase 1 |
| (a)(2)(iv) | Encryption and Decryption | AES-256 at rest (KMS CMK); TLS 1.2+ in transit | Phase 1 |
| (b) | Audit Controls | `audit_log` table writes on every PHI access; CloudTrail on infra | Phase 1 (table exists) → Phase 3 (per-turn instrumentation) |
| (c)(1) | Integrity | Postgres ACID + checksums; S3 object integrity hashes | Phase 1 |
| (c)(2) | Mechanism to Authenticate ePHI | Cryptographic hash on lab uploads; tamper-evident audit log | Phase 4 (audit log object-lock) |
| (d) | Person or Entity Authentication | JWT + MFA for users; SSO for workforce | Phase 1 |
| (e)(1) | Transmission Security | TLS 1.2+ everywhere; ALB with ACM cert; CloudFront origin protection | Phase 1 |
| (e)(2)(i) | Integrity Controls | TLS prevents in-transit tampering; database constraints prevent in-memory corruption | Phase 1 |
| (e)(2)(ii) | Encryption | Same as (a)(2)(iv) | Phase 1 |

---

## 4. BAA INVENTORY

Every vendor that touches PHI must have a signed BAA before any PHI flows.

| Vendor | Service | Requires BAA? | Status | Action |
|---|---|---|---|---|
| **AWS** | Compute, storage, database, networking | Yes | TODO | Execute via AWS Artifact (free, online) — **Phase 1 Week 1** |
| **OpenAI** | LLM brain (Jeffrey reasoning + completions) | **Yes if PHI sent** | TODO | Sign Enterprise BAA OR build redaction layer. **Phase 1 Week 1.** Recommendation: sign Enterprise BAA. |
| **ElevenLabs** | Voice TTS | Maybe — see notes | TODO | Verify with vendor: do they consider TTS as a "Conduit" (no BAA needed) or BA? If BA, sign DPA + BAA. **Phase 1 Week 2.** |
| **Vercel** | Frontend hosting (apps/web, apps/site) | Yes if PHI in pages or functions | TODO | Vercel Enterprise has a BAA option. Confirm `apps/web` page renders don't include PHI server-side beyond what TLS protects, OR sign BAA. **Phase 1 Week 2.** |
| **Stripe** | Payments | Tokens only — Stripe doesn't see PHI | No | DPA only (already standard) |
| **Sentry** | Error monitoring | Maybe — depends on what's logged | TODO | Configure to scrub PHI from error events; sign BAA if they offer (Sentry Business+). **Phase 1 Week 2.** |
| **Datadog or OpenTelemetry collector** | Observability | Yes if metrics include user-IDs joined with health data | TODO | Use anonymized user IDs in metrics; sign BAA if needed. **Phase 1 Week 2.** |
| **WHOOP** | Wearable data ingestion | Source — they're the data provider | DPA | Standard DPA via API agreement |
| **Oura** | Wearable data ingestion | Source | DPA | Standard DPA |
| **Epic / health-system** | FHIR data ingestion | **Yes — Aissisted is a Business Associate to the health system** | TODO | Sign per-system BAA at SMART launch. **Phase 4 (defer with FHIR cert).** |
| **GitHub** | Code repository | Should not see PHI | No | Confirm no PHI in commits or issue tracker |
| **Email provider (Google Workspace)** | Email + storage | Yes if PHI in email | TODO | Sign Workspace BAA — straightforward. **Phase 1 Week 1.** |
| **Compounder / fulfillment partner** | Physical product fulfillment | Yes — they see protocol + dose data | TODO | BAA in compounder contract negotiation. **Phase 4.** |

### 4.1 BAA tracking

A canonical inventory lives at `docs/baa-inventory.md` (to draft). Each entry: vendor name, service, BAA execution date, BAA renewal date, contract owner, redaction strategy (if no BAA possible).

---

## 5. ENCRYPTION POSTURE

### 5.1 At rest

| Data | Where | Encryption | Key |
|---|---|---|---|
| Postgres (RDS) | EBS volume | AES-256 | KMS CMK `aissisted-rds-prod` |
| S3 lab PDFs | `s3://aissisted-prod-phi-labs` | SSE-KMS | KMS CMK `aissisted-s3-phi-prod` |
| S3 audit archives | `s3://aissisted-prod-audit` | SSE-KMS + Object Lock (compliance mode, 6 years) | KMS CMK `aissisted-s3-audit-prod` |
| Redis (ElastiCache) | In-memory + persistence | AES-256 | KMS CMK `aissisted-redis-prod` |
| Secrets Manager | Secret material | KMS-encrypted | KMS CMK `aissisted-secrets-prod` |
| Audit log table | Postgres column-level | KMS via pgcrypto for sensitive payloads | Same as RDS |
| Workforce laptops | FileVault | AES-256 | Per-laptop |

### 5.2 In transit

| Path | Protocol | Notes |
|---|---|---|
| User browser → CloudFront | TLS 1.2 minimum, TLS 1.3 preferred | ACM cert for `*.aissisted.me` |
| CloudFront → ALB | TLS 1.2+ | ACM cert |
| ALB → ECS task | TLS 1.2+ within VPC | mTLS optional, not yet implemented |
| ECS task → RDS | TLS 1.2+ | RDS forces TLS via parameter group |
| ECS task → ElastiCache | TLS 1.2+ | ElastiCache encryption-in-transit enabled |
| ECS task → OpenAI | TLS 1.3 | OpenAI public endpoint |
| ECS task → ElevenLabs | TLS 1.3 | ElevenLabs public endpoint |
| Service → Service (within VPC) | TLS 1.2+ via service mesh OR private API Gateway | Phase 4 if needed |

### 5.3 Key rotation

| Key class | Rotation cadence | Trigger |
|---|---|---|
| KMS CMKs | Annual (automatic) | AWS-managed |
| RDS master credentials | Quarterly | Secrets Manager auto-rotation |
| OAuth tokens (WHOOP, Oura) | Per spec from provider | Refresh tokens stored encrypted |
| API keys (OpenAI, ElevenLabs) | Annual or on suspicion | Rotation runbook in `docs/runbooks/key-rotation.md` |
| Workforce SSO credentials | 90 days password + MFA always | Identity Center policy |

---

## 6. AUDIT LOG REQUIREMENTS

Every read or write of PHI generates an audit event.

### 6.1 What gets logged

| Event class | Trigger | Contents |
|---|---|---|
| PHI read | Any API route returning PHI | userId, accessor (user vs admin vs system), resource type, resource ID, timestamp, IP, request ID |
| PHI write | Any API route mutating PHI | Above + before/after values for material fields |
| Authentication | Login, logout, MFA, failed attempts | userId, success/failure, IP, user agent |
| Authorization | Permission check, role change | Above + permission requested/granted/denied |
| Admin action | Any admin console action | Above + admin userId + reason field (required free-text) |
| AI invocation | Every Jeffrey turn that touches PHI | sessionId, userId, model, tools called, redaction applied |
| Integration sync | WHOOP/Oura/Apple/FHIR sync runs | userId, source, records ingested, errors |

### 6.2 Where it lives

- **Hot tier**: Postgres `audit_log` table, retained 90 days
- **Cold tier**: S3 with Object Lock (compliance mode), retained 6 years (HIPAA minimum)
- **Cross-region replication**: Yes, for resilience

### 6.3 What does NOT go in audit log

- Plaintext passwords (never)
- Plaintext credit card numbers (never — Stripe handles)
- Full PHI payloads in non-PHI-classified log destinations (Sentry, Datadog without BAA, etc.)
- Anything that wouldn't survive a subpoena review

### 6.4 Access to audit log

Audit log itself is PHI-class. Access:
- Read: dedicated `audit-reader` IAM role, requires elevated MFA
- Write: only the application; never humans
- Delete: never (Object Lock prevents on cold tier; trigger-prevented on hot tier)

---

## 7. PHI MINIMIZATION (the OpenAI question)

The simplest way to handle the OpenAI BAA question is to **not send PHI to OpenAI**. This is impractical for Aissisted (Jeffrey's value depends on context). Two paths:

### 7.1 Path A — Sign OpenAI Enterprise BAA (recommended)

OpenAI offers a BAA at the Enterprise tier. Sign it. PHI flows freely in prompts. Cost: higher tier pricing (acceptable for Beta scale).

### 7.2 Path B — Redaction layer

Strip PHI before any prompt; substitute tokens; re-inject after response. Architecturally:

```
User input → PHI scanner → token-substituted prompt → OpenAI → response → re-injection → user
```

Complexity:
- Named entity recognition for medical conditions, medications, lab values, proper nouns
- Token substitution that preserves grammatical structure
- Re-injection that doesn't break formatting
- Audit trail of every substitution

Estimate: **6–8 weeks of engineering**. Only worth it if Enterprise BAA is unworkable.

**Default decision (per Beta plan §6 #2):** Path A.

---

## 8. INCIDENT RESPONSE (skeleton)

Detailed runbook lives at `docs/runbooks/incident-response.md` (to draft).

### 8.1 Incident classification

| Severity | Definition | Response time |
|---|---|---|
| **SEV-1** | Confirmed unauthorized PHI access by external party | Immediate (within 1 hour) |
| **SEV-2** | Confirmed unauthorized PHI access by internal party (insider) | Immediate (within 1 hour) |
| **SEV-3** | Suspected PHI exposure — under investigation | 4 hours |
| **SEV-4** | Configuration drift or audit gap with potential PHI risk | 24 hours |
| **SEV-5** | Operational incident with no PHI impact | 4 hours (operational SLA, not HIPAA) |

### 8.2 Response steps (SEV-1/2)

1. **Contain** — revoke access, isolate affected systems
2. **Document** — start incident timeline; record every action
3. **Assess** — determine scope of PHI exposure
4. **Notify** — Security Officer (Ron) within 1 hour; legal counsel within 4 hours
5. **Mitigate** — patch vulnerability; rotate credentials
6. **Communicate** — affected users notified within 60 days per HIPAA
7. **Report** — HHS notification within 60 days; if >500 records, media notification within 60 days
8. **Postmortem** — root cause analysis + control gap documented within 30 days

---

## 9. PRIVACY POLICY AND USER RIGHTS

Privacy Policy lives at `aissisted.me/privacy` (to draft with attorney). Must include:

- What PHI is collected and why
- Who has access (workforce + Business Associates)
- User rights:
  - Access their own PHI
  - Request correction
  - Request deletion (within HIPAA bounds — audit log retention is a legal requirement that overrides deletion requests)
  - Receive an accounting of disclosures
- Breach notification process
- Contact for privacy concerns: `privacy@aissisted.me`

### 9.1 User-facing controls (in the app)

| Control | Surface | Status |
|---|---|---|
| Download my data | `app.aissisted.me/profile/data-export` | TODO Phase 4 |
| Delete my account | `app.aissisted.me/profile/delete` | TODO Phase 4 |
| What Jeffrey remembers about me | `app.aissisted.me/profile/memory` | TODO Phase 3 (memory writebacks must exist first) |
| Forget specific memory item | Same | TODO Phase 3 |
| Audit trail of who accessed my data | Currently internal-only; user-facing TODO | TODO post-Beta |

---

## 10. PHASED COMPLIANCE WORK

Mapped to the Beta Launch Plan phases.

### Phase 1 (Weeks 1–2): Foundation
- Execute AWS BAA, OpenAI Enterprise BAA, Workspace BAA
- Set up KMS CMKs (RDS, S3 PHI, S3 audit, Redis, Secrets)
- Configure Identity Center SSO with MFA
- Enable CloudTrail, Config (HIPAA conformance pack), Security Hub, GuardDuty
- Tag-policy for `data-class`
- Deploy production with encryption-at-rest + TLS 1.2+ everywhere
- Audit log table already exists; verify write coverage on all PHI routes
- BAA inventory document

### Phase 2 (Weeks 3–6): Core
- Confirm RLS policies on all PHI tables
- WHOOP / Oura DPAs verified
- Vercel BAA evaluated (Enterprise tier or move PHI-touching pages server-side)
- Sentry + Datadog redaction config
- Lab PDF S3 bucket policies tested

### Phase 3 (Weeks 7–10): Intelligence
- Per-Jeffrey-turn audit instrumentation
- User-facing "what Jeffrey remembers" surface
- Memory forget-on-request UI
- AI redaction safeguards (defense-in-depth even with BAA)

### Phase 4 (Weeks 11–14): Beta-ready
- Privacy Policy + NPP finalized with attorney
- Incident response runbook drafted + tabletop exercise
- Quarterly access review process documented
- DR drill scheduled
- Compounder BAA in their contract
- Data export + account deletion flows
- Audit log access UI for security review

### Beta Launch (Week 15)
- Final security review
- Pen-test scoped to PHI handling paths
- Workforce HIPAA training (Ron + any contractors)

---

## 11. WHAT THIS DOC DOES NOT COVER

- **Privacy Rule details** — separate doc with attorney
- **State law** — California CCPA/CPRA, New York SHIELD, etc. — separate
- **GDPR** — Aissisted is US-only at Beta; GDPR work deferred
- **SOC 2** — optional certification, post-Beta
- **PCI** — Stripe handles cards; Aissisted is out-of-scope
- **HITRUST** — optional, post-launch

---

## 12. DECISIONS LOGGED

| Decision | Choice | Date | Rationale |
|---|---|---|---|
| OpenAI: BAA vs redaction | **BAA Enterprise — RATIFIED** | 2026-04-30 | Avoids 6–8wk redaction engineering; PHI-in-prompt is the canonical product flow. Outreach email to compliance@openai.com queued. |
| Compute: ECS Fargate vs EKS | ECS Fargate | 2026-04-30 | No control plane to manage; HIPAA-eligible; sized right for Beta |
| Database: RDS vs Aurora | RDS Postgres Multi-AZ | 2026-04-30 | Aurora's higher cost not justified at Beta scale; can migrate later. Neon Postgres email queued as comparison data point only. |
| Region: us-east-1 vs us-west-2 primary | **us-east-1 primary, us-west-2 DR — RATIFIED** | 2026-04-30 | Most BAA-eligible services available first in us-east-1 |
| Frontend hosting BAA | Vercel Enterprise (assuming BAA terms work) | 2026-04-30 | Outreach email queued. Backup: move PHI-touching pages to API server-side if Vercel BAA terms unworkable. |
| Voice synthesis vendor BAA | ElevenLabs primary; OpenAI Realtime fallback | 2026-04-30 | Outreach email queued to enterprise@elevenlabs.io. If ElevenLabs declines BAA, Conduit interpretation may apply (TTS doesn't see PHI in plaintext) — confirm with vendor counsel. |

---

## 13. CHANGELOG

| Date | Version | By | Change |
|---|---|---|---|
| 2026-04-30 | 1.0 | Cowork | Initial draft. Maps HIPAA Security Rule to Aissisted controls. |

---

*End of document. Next review: after attorney engagement (queued — see Beta Launch Plan §6 decision #8).*
