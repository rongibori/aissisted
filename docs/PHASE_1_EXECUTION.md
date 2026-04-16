# Aissisted Phase 1: Foundation Execution Plan
## Weeks 1-3: MVP Launch

**Goal**: Working MVP where users can log in, enter health data, view supplement protocols, and receive manual recommendations.

---

## Week 1: Database & Backend Skeleton

### Task 1.1: Finalize Drizzle Schema
**Owner**: Claude (infrastructure)  
**Status**: NOT STARTED  
**Time**: 2 days

**Deliverables**:
- [ ] Create/review schema files in `packages/db/src/schema/`
  - `users.ts`
  - `biomarkers.ts`
  - `supplement_protocols.ts`
  - `supplement_library.ts` (supplement reference data)
  - `integration_events.ts`
  - `outcomes.ts`

- [ ] Define relationships & indexes
  - FK: biomarkers → users
  - FK: protocols → users, supplements
  - Indexes: userId, testDate, status

- [ ] Create seed data
  - Reference biomarker ranges (Vit D, hs-CRP, magnesium, etc.)
  - Common supplements library (Vitamin D3, Magnesium Glycinate, etc.)

**Command Reference**:
```bash
cd packages/db
pnpm run db:generate  # Generate types from schema
pnpm run db:push      # Push schema to Turso
```

**Acceptance**: Schema deployed; `pnpm run db:push` succeeds; types auto-generated.

---

### Task 1.2: Backend API Setup (NestJS or Express Decision)
**Owner**: Ron (decision) + Claude (implementation)  
**Status**: DECISION PENDING  
**Time**: 1 day (decision) + 2 days (build)

**Decision Framework**:
| Factor | NestJS | Express |
|--------|--------|---------|
| Learning curve | Steeper (decorators, DI) | Shallow |
| TypeScript support | Built-in, opinionated | Manual setup |
| Scaling | Better for large teams | Sufficient for MVP |
| Time to MVP | 2-3 days | 1-2 days |

**Recommendation**: **Express + Zod** for speed (MVP focus). Migrate to NestJS in Phase 2 if team grows.

**Deliverables**:
- [ ] Create `apps/api/` structure (or expand existing)
  ```
  apps/api/
  ├── src/
  │   ├── main.ts           # Express app + middleware
  │   ├── middleware/
  │   │   ├── auth.ts       # JWT verification
  │   │   └── error.ts      # Error handling
  │   ├── routes/
  │   │   ├── auth.ts       # /api/auth/*
  │   │   ├── user.ts       # /api/user/*
  │   │   ├── biomarkers.ts # /api/biomarkers/*
  │   │   ├── protocols.ts  # /api/protocols/*
  │   │   └── integrations.ts # /api/integrations/*
  │   ├── services/
  │   │   ├── auth.service.ts
  │   │   ├── user.service.ts
  │   │   ├── biomarker.service.ts
  │   │   ├── protocol.service.ts
  │   ├── db.ts             # Drizzle client
  │   └── types.ts          # Shared types
  ├── package.json
  └── tsconfig.json
  ```

- [ ] Install dependencies:
  ```bash
  cd apps/api
  pnpm add express zod cors dotenv
  pnpm add -D @types/express typescript tsx
  ```

- [ ] Create basic Express app with middleware:
  - CORS configured
  - Error handler
  - Request logging
  - Request validation (Zod)

- [ ] Database connection
  - Drizzle client instantiation
  - Connection pooling

**Acceptance**: `pnpm run dev` starts API on port 3001; health check returns 200.

---

### Task 1.3: Auth Skeleton (JWT + Basic Session)
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 1 day

**Deliverables**:
- [ ] `apps/api/src/services/auth.service.ts`
  - `register(email, password, name)` → create user + hash password
  - `login(email, password)` → validate + return JWT
  - `verifyToken(token)` → decode + validate expiry
  - Password hashing (bcrypt)
  - JWT signing with `JWT_SECRET`

- [ ] `apps/api/src/routes/auth.ts`
  - `POST /api/auth/register` → validation + service call + response
  - `POST /api/auth/login` → validation + service call + response
  - Input validation with Zod

- [ ] Auth middleware
  - `apps/api/src/middleware/auth.ts`
  - Check Authorization header
  - Verify JWT
  - Attach user ID to request context

- [ ] Environment variables
  - `.env.example` in repo
  - `JWT_SECRET`, `DATABASE_URL`, etc.

**Acceptance**: 
- `POST /api/auth/register` with `{email, password, name}` creates user
- `POST /api/auth/login` with `{email, password}` returns JWT
- Protected endpoints reject requests without valid JWT

---

## Week 2: Frontend MVP & User Profile

### Task 2.1: Frontend Project Setup & Styling System
**Owner**: Claude (design + setup)  
**Status**: NOT STARTED  
**Time**: 1 day

**Current State**: `apps/web` exists with Next.js 15, React 19, Tailwind 4.2

**Deliverables**:
- [ ] CSS variable system (design tokens)
  - Colors: primary (blue), secondary, accent, neutral (grays)
  - Typography: heading (bold sans), body (regular sans), mono
  - Spacing: 4px base unit (xs, sm, md, lg, xl, 2xl)
  - Border radius: subtle (2px), default (4px), large (8px)
  - Shadows: subtle, medium, strong

- [ ] Create `apps/web/src/styles/globals.css`
  ```css
  :root {
    --color-primary: #0066cc;
    --color-primary-light: #e6f0ff;
    --color-text: #1a1a1a;
    --color-text-muted: #666;
    --color-bg: #fff;
    --color-border: #e0e0e0;
    ...
  }
  ```

- [ ] Shadcn/ui setup (if not already done)
  - Install shadcn/ui Button, Card, Input, Dialog, etc.
  - Customize theme to match design tokens

- [ ] Layout components
  - `Layout.tsx` → nav, sidebar, footer structure
  - `Container.tsx` → max-width wrapper
  - `Header.tsx` → top nav with user menu

**Acceptance**: App renders with consistent design system; Storybook optional.

---

### Task 2.2: User Onboarding & Auth Flow
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 2 days

**Pages**:
- [ ] `/` → Landing page
  - Hero section: "Personalized Supplement Recommendations Based on Your Labs"
  - Feature list: AI-driven, lab data, longitudinal tracking
  - CTA: "Get Started"

- [ ] `/auth/register` → Sign up form
  - Email, password, name
  - Form validation (Zod on client)
  - Submit to `POST /api/auth/register`
  - On success: redirect to `/onboarding`
  - Error handling + user feedback

- [ ] `/auth/login` → Sign in form
  - Email, password
  - Remember me (localStorage)
  - Submit to `POST /api/auth/login`
  - On success: save JWT to `localStorage`; redirect to `/dashboard`
  - Error handling

- [ ] `/onboarding` → Multi-step form (if auth.user.completedOnboarding === false)
  - Step 1: Health goals ("Optimize Energy", "Reduce Inflammation", etc.)
  - Step 2: Current supplements (manual entry, searchable library)
  - Step 3: Supplement preferences (form, powder, liquid)
  - On complete: mark user as onboarded; redirect to `/dashboard`

**State Management**:
- Use React Context or Zustand for global auth state
- Persist JWT in localStorage (+ secure considerations)
- Redirect unauthenticated users to login

**Acceptance**: 
- User can register, verify JWT is set
- User can log in, verify redirect to dashboard
- Onboarding flow complete; user marked as onboarded

---

### Task 2.3: Dashboard & Profile
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 1.5 days

**Pages**:
- [ ] `/dashboard` → Main view (authenticated)
  - Welcome message: "Hi [Name], here's your supplement protocol"
  - "Biomarkers" section: last 3 biomarkers (Vit D, hs-CRP, magnesium)
  - "Active Protocols" section: list of current supplements with dosage
  - "Request New Recommendation" button
  - "View Settings" link

- [ ] `/settings/profile` → User profile editing
  - Name, email, age, sex
  - Health goals (multi-select checkboxes)
  - Supplement preferences (form, powder, liquid, pill burden)
  - Save → API `PUT /api/user/profile`
  - Integrations section (placeholder for Phase 3)

- [ ] API hooks (React Query or SWR)
  - `useAuth()` → current user
  - `useProfile()` → fetch profile, update profile
  - `useBiomarkers()` → fetch biomarkers

**Acceptance**: 
- Dashboard displays user name and greeting
- Profile page loads user data and allows edits
- API calls succeed with auth token

---

## Week 3: Biomarkers & Protocols

### Task 3.1: Biomarker CRUD
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 1.5 days

**Backend** (`apps/api/src/routes/biomarkers.ts`):
- [ ] `GET /api/biomarkers` → list user's biomarkers (paginated, sorted by date DESC)
  - Query params: `?limit=20&offset=0`
  - Response: `{ biomarkers: [...], total: N }`

- [ ] `GET /api/biomarkers/:id` → single biomarker detail + trend
  - Trend calculation (compare last 3 values)
  - Status (low/normal/high vs reference range)

- [ ] `POST /api/biomarkers` → user-entered lab value
  - Body: `{ name, value, unit, testDate, source }`
  - Validation: name in whitelist, value > 0, testDate is valid
  - Save to DB
  - Response: created biomarker

- [ ] `PUT /api/biomarkers/:id` → edit biomarker (admin only for now)

**Frontend** (`apps/web/src/pages/biomarkers.tsx`):
- [ ] Biomarker list view
  - Table: Name, Value, Status (colored), Date, Trend (↑/→/↓)
  - Search by name
  - Sort by date (default DESC)
  - Pagination controls

- [ ] Add biomarker form (modal or page)
  - Searchable dropdown: select biomarker name from library
  - Input: value, unit (auto-populated), test date
  - Submit → API call
  - On success: refresh list, show toast

- [ ] Biomarker detail view (click a row to view trends)
  - Chart: value over time (simple line chart)
  - Reference range visualization
  - Trend indicator
  - Status badge

**Acceptance**: 
- User can enter a biomarker (Vitamin D: 45 ng/mL on 2024-04-15)
- List displays with correct status
- Trend calculated and displayed

---

### Task 3.2: Supplement Protocols UI
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 1.5 days

**Backend** (`apps/api/src/routes/protocols.ts`):
- [ ] `GET /api/protocols` → user's active + archived protocols
  - Query param: `?status=active` (filter)
  - Response: `{ protocols: [...] }`

- [ ] `GET /api/protocols/:id` → protocol detail
  - Include: supplement name, dosage, timing, rationale, confidence, biomarkers targeted
  - Include: outcomes (feedback, adherence) if available

- [ ] `POST /api/protocols` → manually create protocol (testing)
  - Body: `{ supplementId, dosage, frequency, timing, rationale }`
  - Response: created protocol

- [ ] `PUT /api/protocols/:id` → pause/resume/archive
  - Body: `{ status: "paused" | "archived" | "active" }`

- [ ] `POST /api/protocols/:id/feedback` → user outcome
  - Body: `{ adherence: 0-100, feedback: "well_tolerated" | "side_effects" | "no_change" }`

**Frontend** (`apps/web/src/pages/protocols.tsx`):
- [ ] Protocol list (by default on dashboard)
  - Card per protocol: supplement name, dosage, frequency, status (badge)
  - "View Details" button → modal or detail page

- [ ] Protocol detail modal
  - Supplement name, dosage, timing, frequency
  - "Rationale" section (AI-generated explanation)
  - Confidence score (%)
  - "Targeted Biomarkers" list
  - "Outcome Tracking" section: radio buttons (well tolerated / side effects / no change)
  - "Adherence" slider (0-100%)
  - Buttons: Pause, Archive, Submit Feedback

- [ ] Manual protocol creation (testing, optional for MVP)
  - Searchable supplement dropdown
  - Dosage input + unit selector
  - Frequency selector
  - Save button

**Acceptance**: 
- User can view active protocols
- User can log outcome feedback
- Detail view shows rationale + biomarkers

---

### Task 3.3: Integration Tests & E2E Workflow
**Owner**: Claude  
**Status**: NOT STARTED  
**Time**: 1 day

**Integration Tests** (`apps/api/src/__tests__/`):
- [ ] Auth flow: register → login → protected endpoint
  ```typescript
  it("should register, login, and access protected endpoint", async () => {
    // POST /api/auth/register
    // POST /api/auth/login
    // GET /api/user/profile with JWT
  })
  ```

- [ ] Biomarker flow: create → list → detail
  ```typescript
  it("should create biomarker and retrieve with trend", async () => {
    // POST /api/biomarkers (Vit D 30)
    // POST /api/biomarkers (Vit D 45)
    // GET /api/biomarkers/[id]
    // Verify trend is "improving"
  })
  ```

- [ ] Protocol flow: create → retrieve → feedback
  ```typescript
  it("should create protocol and log outcome", async () => {
    // POST /api/protocols
    // POST /api/protocols/[id]/feedback
    // GET /api/protocols/[id] → verify feedback stored
  })
  ```

**E2E Tests** (Playwright, optional for MVP but recommended):
- [ ] `tests/user-flow.spec.ts`
  - Register → Onboarding → Dashboard → Add Biomarker → View Protocol
  - ~5 min test
  - Run on CI

**Acceptance**: Tests pass; CI shows green.

---

## Deployment & Launch

### Task: Deploy to Staging
**Owner**: Ron (decision on hosting) + Claude (setup)  
**Status**: NOT STARTED  
**Time**: 1 day

**Frontend**:
- [ ] Deploy `apps/web` to Vercel
  - Connect GitHub repo
  - Set environment variables (API_URL, ANTHROPIC_API_KEY, etc.)
  - Auto-deploy on main branch

**Backend** (TBD hosting):
- [ ] Option 1: Vercel Functions (serverless)
  - Convert Express to Vercel Functions format
  - Deploy `apps/api` to Vercel
  
- [ ] Option 2: Dedicated Server (Railway, Render, Fly.io)
  - Set up server
  - Configure env vars
  - Set up CI/CD

- [ ] Database
  - Turso (already provisioned?)
  - Verify connection string works in production

**Testing**:
- [ ] Health check: frontend loads
- [ ] Auth flow: register + login works
- [ ] API calls: biomarker create + list works
- [ ] Database: Turso connection verified

**Acceptance**: App accessible at `https://aissisted.vercel.app` (or custom domain)

---

## Phase 1 Acceptance Criteria

✅ User can register and log in  
✅ User completes onboarding (health goals, current supplements)  
✅ User dashboard displays greeting + active protocols  
✅ User can manually enter biomarkers (Vit D, hs-CRP, magnesium)  
✅ User can view biomarker history + trends  
✅ User can view supplement protocols (name, dosage, rationale placeholder)  
✅ User can log outcome feedback (well tolerated / side effects / no change)  
✅ API tests pass (>80% coverage on critical flows)  
✅ Frontend and backend deployed and accessible  
✅ No critical errors in Sentry (if configured)  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Database schema changes mid-phase | Finalize schema in Task 1.1; use Drizzle migrations for changes |
| Backend delays | NestJS vs Express decision by EOD Week 1; Express prioritized for speed |
| Auth complexity | Use JWT + localStorage for MVP; upgrade to NextAuth.js in Phase 2 if needed |
| Styling inconsistency | Define CSS variables early (Task 2.1); use Tailwind for consistency |
| Missing test coverage | Integration tests for critical flows; E2E optional for MVP |

---

## Weekly Sync Cadence

**Every Monday 9 AM PT**:
- Review tasks completed
- Adjust timeline if blockers
- Discuss Phase 2 prep

**Every Friday 4 PM PT**:
- Demo to stakeholders (optional)
- Feedback collection

---

**Phase 1 Owner**: Ron (PM) + Claude (Execution)  
**Start Date**: Monday, April 15, 2026  
**Target Launch**: Friday, May 6, 2026 (Week 3)  
**Status**: 🚀 READY TO START

Next: **Confirm NestJS vs Express decision** → Task 1.2 can proceed.
