# Aissisted: AI-Driven Personalized Supplement Platform
## Canonical Architecture & Implementation Roadmap

**Version**: 2.0  
**Status**: Foundation Phase  
**Last Updated**: April 15, 2026

---

## 1. Executive Overview

**Aissisted** is a premium, data-driven supplement personalization platform that combines health data (labs, wearables, user input) with AI-powered recommendation logic to deliver continuously adapting supplement protocols.

### Core Value Proposition
- **Personalization Engine**: Transforms raw health data into individualized supplement recommendations
- **Longitudinal Tracking**: Biomarker trends over time, not snapshots
- **Explainability**: Every recommendation includes reasoning and evidence
- **Adaptation**: Protocols evolve as new data arrives (labs, wearables, user feedback)

### Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4.2, TypeScript
- **Backend**: Fastify 5.0, Drizzle ORM, TypeScript
- **Database**: PostgreSQL 16 (AWS RDS, encryption at rest)
- **Monorepo**: Turbo 2.0, pnpm 10.0.0
- **AI**: Anthropic API (Claude for reasoning layer)
- **Infrastructure**: Vercel (frontend), AWS ECS Fargate (backend), AWS RDS PostgreSQL (database)
- **Security**: AES-256-GCM field encryption, HIPAA audit logging, consent tracking

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Dashboard    │  │ Onboarding   │  │ Settings     │          │
│  │ (Labs View)  │  │ (Health Data)│  │ (Preferences)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            ▼                                    │
│                   API Client (React Query)                      │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              INTEGRATION LAYER (Data Ingestion)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ FHIR/MyChart │  │ WHOOP Sync   │  │ Apple Health │          │
│  │ (Epic Labs)  │  │ (Biometrics) │  │ (Wearables)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NORMALIZATION LAYER (Transform)                    │
│  • Parse FHIR resources into canonical data model              │
│  • Map biomarker values to standard units                       │
│  • Time-series aggregation & validation                         │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         PERSONALIZATION ENGINE (Rules + AI)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rules Engine (Deterministic)                            │  │
│  │ • Biomarker range validation                            │  │
│  │ • Interaction detection                                 │  │
│  │ • Contraindication checks                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                  │
│                             ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AI Layer (Claude API)                                   │  │
│  │ • Context: Labs, wearables, user profile               │  │
│  │ • Reasoning: Why this supplement, dosage, timing       │  │
│  │ • Scoring: Confidence, priority, evidence strength    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                  │
│                             ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Memory Layer (Longitudinal Context)                      │  │
│  │ • Outcome tracking: "Vitamin D at 8000 IU → labs ↑"    │  │
│  │ • User feedback: "Tolerate well / GI upset"             │  │
│  │ • Historical recommendations (audit trail)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         RECOMMENDATION OUTPUT (Protocol)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Supplement   │  │ Dosage +     │  │ Evidence &   │          │
│  │ Name         │  │ Timing       │  │ Reasoning    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  Status: ACTIVE / PAUSED / ARCHIVED                            │
│  Confidence: 85% (based on biomarker targets)                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL + Drizzle)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Users        │  │ Biomarkers   │  │ Supplements  │          │
│  │ Profile      │  │ History      │  │ Protocols    │          │
│  │ Auth         │  │ Timestamps   │  │ Outcomes     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### Core Entities

#### **User**
```typescript
interface User {
  id: string
  email: string
  name: string
  age: number
  sex: "M" | "F" | "Other"
  healthGoals: string[] // e.g., ["optimize energy", "reduce inflammation"]
  preferences: {
    supplementForm: "capsule" | "powder" | "liquid" | "any"
    pillBurden: "minimal" | "moderate" | "high"
    budget: "premium" | "standard" | "budget"
  }
  integrations: {
    epic?: { enabled: boolean; patientId?: string }
    whoop?: { enabled: boolean; memberId?: string }
    apple?: { enabled: boolean; userId?: string }
  }
  createdAt: Date
  updatedAt: Date
}
```

#### **Biomarker**
```typescript
interface Biomarker {
  id: string
  userId: string
  name: string // "Vitamin D, 25-OH", "hs-CRP", "Magnesium"
  value: number
  unit: string // "ng/mL", "mg/dL", etc.
  referenceMin: number
  referenceMax: number
  source: "epic" | "user_entered" | "wearable" | "lab_order"
  testDate: Date
  createdAt: Date
  
  // Derived
  status: "low" | "normal" | "high"
  trend?: "improving" | "stable" | "declining" // vs. previous 3 months
}
```

#### **Supplement Protocol**
```typescript
interface SupplementProtocol {
  id: string
  userId: string
  supplementId: string
  dosage: {
    amount: number
    unit: string // "IU", "mg", "g", "mcg"
  }
  frequency: "daily" | "weekly" | "as_needed"
  timing: {
    timeOfDay?: "morning" | "midday" | "evening"
    withFood?: boolean
    spacing?: string // "2 hours after other supplements"
  }
  rationale: string // AI-generated explanation
  confidence: number // 0-100
  biomarkersTargeted: string[] // biomarker IDs
  status: "active" | "paused" | "archived"
  createdAt: Date
  updatedAt: Date
  nextReviewDate: Date
  
  // Tracking
  outcomes?: {
    biomarkerChange?: number
    userFeedback?: "well_tolerated" | "side_effects" | "no_change"
    adherence?: number // 0-100
  }
}
```

#### **Integration Event** (for audit trail)
```typescript
interface IntegrationEvent {
  id: string
  userId: string
  type: "data_sync" | "recommendation_generated" | "outcome_tracked"
  source: "epic" | "whoop" | "user" | "ai"
  data: Record<string, any>
  timestamp: Date
  status: "success" | "error"
}
```

---

## 4. Core Workflows

### Workflow 1: Initial Health Assessment
1. **User Registration** → collect health goals, preferences, current supplements
2. **FHIR Integration** → authorize Epic/MyChart, fetch recent labs
3. **Wearable Sync** → connect WHOOP, Apple Health
4. **Data Normalization** → standardize units, validate ranges
5. **AI Initial Assessment** → generate first recommendations based on current state
6. **User Review** → approve/modify recommendations
7. **Store Protocol** → save initial supplement protocol to DB

**Output**: Initial personalized supplement protocol with 3-6 supplements

---

### Workflow 2: Continuous Data Sync & Adaptation
1. **Scheduled Sync** (daily/weekly)
   - Query WHOOP for latest biometrics (HRV, sleep, recovery)
   - Query Apple Health for activity, heart rate
   - Fetch any new lab results from Epic
2. **Biomarker Ingestion** → normalize, store in DB
3. **Trend Detection** → compare vs. 30/90-day rolling average
4. **AI Re-evaluation** → "Are current supplements still optimal?"
5. **If Changes Needed**:
   - Adjust dosages, timing, or supplements
   - Generate new rationale
   - Notify user with "Protocol Updated" alert
6. **Outcome Tracking** → correlate supplement changes with biomarker shifts

**Output**: Continuously optimized protocol; alerts when action needed

---

### Workflow 3: User Feedback Loop
1. User logs: "Started magnesium, sleep improved"
2. Record outcome in SupplementProtocol.outcomes
3. AI layer retrieves feedback + biomarker data
4. Reinforces recommendation or suggests adjustments
5. Update confidence score for that supplement

**Output**: Personalized evidence base for this user

---

## 5. API Endpoints (Planned)

### Auth
- `POST /api/auth/register` → Create account
- `POST /api/auth/login` → Session token
- `POST /api/auth/logout` → Revoke session

### User Profile
- `GET /api/user/profile` → Current user data
- `PUT /api/user/profile` → Update preferences, health goals
- `GET /api/user/integrations` → Connected services
- `POST /api/user/integrations/:service/connect` → OAuth flow
- `POST /api/user/integrations/:service/disconnect` → Revoke access

### Biomarkers
- `GET /api/biomarkers` → User's biomarker history (with pagination)
- `GET /api/biomarkers/:id` → Single biomarker + trends
- `POST /api/biomarkers` → User-entered lab value
- `GET /api/biomarkers/summary` → Current status dashboard

### Protocols & Recommendations
- `GET /api/protocols` → All active/archived protocols
- `GET /api/protocols/:id` → Protocol detail + rationale
- `POST /api/protocols` → Manual protocol creation (admin)
- `PUT /api/protocols/:id` → Update protocol (pause, adjust dosage)
- `POST /api/protocols/:id/feedback` → Log outcome/feedback
- `POST /api/recommendations/generate` → Trigger AI generation

### Integrations
- `POST /api/integrations/epic/sync` → Force FHIR data pull
- `POST /api/integrations/whoop/sync` → Force WHOOP pull
- `GET /api/integrations/sync-status` → Last sync time per service

### Admin
- `GET /api/admin/audit-log` → Integration events (for review)
- `GET /api/admin/biomarker-ranges` → Reference ranges (maintain global)

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Goal**: MVP with manual supplement entry, basic UI

- [ ] **Database Schema**
  - Drizzle ORM tables: users, biomarkers, protocols, integrations
  - PostgreSQL on AWS RDS provisioning & migrations
  - Seed reference biomarker ranges

- [ ] **Backend API Skeleton** (Fastify 5.0)
  - Auth (basic JWT)
  - User profile endpoints
  - Biomarker CRUD
  - Protocol CRUD
  - CI/CD setup (GitHub Actions)

- [ ] **Frontend Dashboard** (Next.js)
  - Landing page → Login/Register
  - User onboarding flow (health goals, supplements)
  - Biomarker entry form
  - Protocol display (read-only for MVP)
  - Styling system (Tailwind variables for theme)

- [ ] **Deploy**
  - Frontend to Vercel
  - Backend to AWS ECS Fargate
  - Database on AWS RDS PostgreSQL

**Deliverable**: Working app where user can log in, enter lab values, see stored supplements

---

### Phase 2: Core Intelligence (Weeks 4-6)
**Goal**: AI-powered recommendations, basic rules engine

- [ ] **Rules Engine**
  - Biomarker range validation (low/normal/high)
  - Supplement-biomarker mapping (e.g., Vitamin D ↔ 25-OH Vitamin D)
  - Interaction detection (supplement conflicts)
  - Contraindication checks (supplement vs. medical conditions)

- [ ] **AI Integration** (Claude API)
  - Prompt engineering for recommendation generation
  - Context: user profile + current biomarkers + health goals
  - Output: structured recommendation with dosage, timing, rationale
  - Caching layer for performance

- [ ] **Recommendation Flow**
  - On user request or scheduled trigger
  - AI generates 3-5 supplement recommendations
  - User can approve, modify, or dismiss
  - Store approved protocols

- [ ] **Outcome Tracking**
  - User can log feedback ("took for 2 weeks, felt better")
  - Simple adherence tracking

**Deliverable**: User can generate recommendations; AI explains choices; outcomes tracked

---

### Phase 3: Integrations (Weeks 7-9)
**Goal**: Real data from Epic (FHIR), WHOOP, Apple Health

- [ ] **Epic/MyChart (FHIR)**
  - OAuth 2.0 flow for patient authorization
  - FHIR client library (e.g., fhirclient.js)
  - Fetch Observation resources (labs)
  - Parse into Biomarker model
  - Store raw FHIR JSON for audit

- [ ] **WHOOP Integration**
  - OAuth API access
  - Fetch daily recovery, strain, sleep metrics
  - Map to Biomarker or custom "metrics" table
  - Webhook or scheduled sync

- [ ] **Apple Health (HealthKit)**
  - Request HealthKit access from iOS/watchOS
  - Background sync of heart rate, steps, sleep
  - Normalize to Biomarker schema

- [ ] **Sync Orchestration**
  - Background job (Turbo task or Bull queue)
  - Daily/weekly sync schedule per service
  - Error handling & retry logic
  - Audit trail (IntegrationEvent)

**Deliverable**: Live biomarker data from labs, wearables; auto-updating protocols

---

### Phase 4: Memory & Adaptation (Weeks 10-12)
**Goal**: Longitudinal intelligence, personalized reasoning

- [ ] **Longitudinal Analytics**
  - 30/90-day trend detection (improving/stable/declining)
  - Correlation: supplement change → biomarker shift
  - Store outcomes in SupplementProtocol.outcomes

- [ ] **Memory System**
  - AI system prompt includes user history
  - "This user previously tried Magnesium glycinate, tolerated well"
  - "Vitamin D protocol raised 25-OH from 28 → 52 ng/mL"
  - Confidence scoring based on evidence

- [ ] **Adaptive Logic**
  - Scheduled re-evaluation (every 30 days or on new data)
  - AI suggests protocol adjustments with confidence
  - Alerts: "New lab shows iron deficiency; recommend iron supplement"
  - Pause recommendations if no longer needed

- [ ] **User Feedback Loop**
  - Thumbs up/down on recommendations
  - "Side effects / no change / improved" tracking
  - AI learns user's sensitivity, preferences

- [ ] **Dashboard Analytics**
  - "Biomarkers Improving" widget
  - "Supplements Contributing" breakdown
  - "Next Review Date" countdown

**Deliverable**: Personalized, evolving protocol; system learns from user's response

---

### Phase 5: Scale & Polish (Weeks 13+)
**Goal**: Production hardening, performance, compliance

- [ ] **Performance**
  - Database indexing on userId, testDate, status
  - API caching (Redis for integration responses)
  - AI response streaming for large recommendations
  - CDN for frontend assets

- [ ] **Security & Compliance**
  - HIPAA compliance (if handling health data)
  - Data encryption at rest
  - Audit logging (all data access)
  - Rate limiting on API

- [ ] **Observability**
  - Logging (Axiom, Datadog, or similar)
  - Error tracking (Sentry)
  - Monitoring (API latency, sync failures)

- [ ] **Voice Interface (Jeffrey)**
  - Voice-first chat for health queries
  - "How much Vitamin D should I take?"
  - "What's my current protocol?"
  - Persistent session memory

- [ ] **Testing**
  - Unit tests (biomarker parsing, rules engine)
  - Integration tests (API + DB)
  - E2E tests (user flow from signup → recommendation)

- [ ] **Documentation**
  - API docs (OpenAPI/Swagger)
  - Architecture runbook
  - Troubleshooting guide

**Deliverable**: Production-grade platform with voice, observability, compliance

---

## 7. Current Repo State

### Existing Packages
- **@aissisted/db**: Drizzle ORM, PostgreSQL client, schema (partially built)
- **@aissisted/types**: TypeScript interfaces (minimal)
- **@aissisted/config**: Shared config (tsconfig, eslint)
- **@aissisted/ui**: Shared UI components (empty or minimal)
- **@aissisted/integrations**: Integration clients (stub)
- **@aissisted/domain**: Business logic (stub)

### Existing Apps
- **@aissisted/web**: Next.js 15, React 19 frontend (needs build)
- **@aissisted/api**: Backend API (Fastify 5.0 with 8 route modules)

### Next Immediate Steps
1. Finalize database schema (Drizzle migrations for PostgreSQL)
2. Complete backend API (Fastify is already in place)
3. Connect frontend to API
4. Implement user auth + profile
5. Add biomarker CRUD
6. Start AI integration tests

---

## 8. Key Design Decisions

### Why PostgreSQL on AWS RDS?
- HIPAA-eligible with BAA (Business Associate Agreement)
- Encryption at rest via AWS KMS
- Proven at scale, mature ecosystem
- Native JSONB for flexible health data storage
- Mature tooling for backups, replication, disaster recovery
- Replaces earlier LibSQL/Turso for compliance-critical workload

### Why Fastify (kept from v1)?
- Backend already built with 8 route modules (auth, biomarkers, protocols, integrations, rules engine, outcomes, user, admin)
- JWT authentication and audit logging already integrated
- WHOOP, FHIR, and Apple Health integrations actively wired
- Faster than Express with structured plugin system
- Plugin architecture provides clear module boundaries
- Migrating to NestJS would cost 1-2 weeks with no business value at current stage
- Ready for Phase 1 MVP without framework change

### Why AWS for Backend?
- HIPAA BAA available (meets compliance requirements)
- RDS encryption at rest with AWS KMS
- ECS Fargate is container-native with zero server management
- SSM Parameter Store for secure secrets storage
- CloudTrail for comprehensive audit logging
- VPC isolation for additional security
- Integrated monitoring and alerting via CloudWatch

### Why Drizzle ORM?
- TypeScript-first, excellent DX
- Type-safe queries
- Minimal runtime overhead
- Great for migrations
- Works seamlessly with both SQLite and PostgreSQL

### Why Anthropic API for AI?
- Excellent reasoning for clinical/supplement logic
- Structured output (for JSON recommendations)
- Cost-effective at scale
- Vision models if needed (for supplement bottle scanning)

### Why Turbo Monorepo?
- Shared types, configs, UI components
- Fast builds with incremental compilation
- Clear dependency graph
- Single source of truth for shared logic

---

## 9. Success Metrics

### Phase 1 (MVP)
- App deployed & accessible
- User can log in, enter biomarkers, view protocols
- 5+ manual supplement protocols in DB

### Phase 2
- AI generates recommendations with 3+ per user
- 80%+ user satisfaction on reasoning clarity
- 2-week outcome tracking active

### Phase 3
- 50%+ users with ≥1 integration active
- Automated sync success rate >95%
- <100ms API latency p99

### Phase 4
- 30-day protocol adaptation rate 60%+
- Correlation detected between protocol changes & biomarker shifts
- User retention >70%

### Phase 5
- NPS >50
- HIPAA compliance verified
- 5+ integrations (expanded beyond Epic/WHOOP/Apple)
- Voice interface active with 20%+ engagement

---

## 10. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| HIPAA compliance overhead | High | HIPAA-ready from Phase 1: PostgreSQL on RDS with encryption at rest, field-level PII encryption, audit logging on all mutations, consent tracking table, AWS BAA signed |
| Integration fragility (Epic, WHOOP, Apple) | Medium | Robust error handling; fallback to manual entry; monitoring |
| AI hallucination in recommendations | High | Rule engine pre/post filters; user review required; audit trail |
| Data privacy (3rd party access) | High | Explicit user consent; transparency in integrations; data minimization |
| Cold start (new users) | Medium | Onboarding questionnaire; generic recommendations; lower confidence |
| Retention (limited value early) | Medium | MVP focuses on outcomes visibility; gamification later |

---

## 11. HIPAA Compliance Checklist

- [ ] AWS BAA signed
- [ ] RDS encryption at rest (KMS)
- [ ] Field-level PII encryption (AES-256-GCM)
- [ ] Audit logging on all state-mutating requests
- [ ] Consent records tracked per user
- [ ] Raw FHIR data stored immutably for audit
- [ ] SSL/TLS in transit (ALB → ECS, ECS → RDS)
- [ ] VPC isolation (RDS in private subnet)
- [ ] CloudTrail enabled
- [ ] Access tokens encrypted at rest (TOKEN_ENCRYPTION_KEY)

---

## 12. Appendix: Tech Specs

### Node Versions
- Node 18+ required (Turbo 2.0, TypeScript 5.6)
- Use `nvm use` to pin version

### Package Manager
- pnpm 10.0.0 (required; faster than npm/yarn)
- Install: `npm i -g pnpm@10.0.0`

### Local Development
```bash
# Install deps
pnpm install

# Dev server
pnpm run dev

# Build all packages
pnpm run build

# Test
pnpm run test

# Type check
pnpm run typecheck
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/aissisted

# AI
ANTHROPIC_API_KEY=sk-...

# Auth
JWT_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Integrations
EPIC_CLIENT_ID=...
EPIC_CLIENT_SECRET=...
WHOOP_CLIENT_ID=...
APPLE_HEALTH_ENTITLEMENT=...

# Encryption
TOKEN_ENCRYPTION_KEY=...
```

---

**Document Owner**: Ron Gibori  
**Last Review**: April 15, 2026  
**Next Review**: May 1, 2026  
**Status**: Active (Phase 1 - Foundation)
