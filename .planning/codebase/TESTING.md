# Testing Patterns

**Analysis Date:** 2026-05-04

## Test Framework

**Runner:**
- Vitest 3.0.0
- Config: `apps/api/vitest.config.ts` (API package primary test target)

**Assertion Library:**
- Vitest built-in matchers (similar to Jest/Chai API)

**Run Commands:**
```bash
npm run test                     # Run all tests (API package via turbo)
npm run test:watch              # Watch mode (API package)
turbo run test --filter=@aissisted/api  # Run API tests specifically
```

## Test File Organization

**Location:**
- Co-located in `__tests__/` subfolder adjacent to source code
- Pattern: `src/{feature}/__tests__/{feature}.test.ts`

**Examples:**
- `apps/api/src/engine/__tests__/biomarker-ranges.test.ts`
- `apps/api/src/routes/__tests__/jeffrey-realtime.test.ts`
- `apps/api/src/utils/__tests__/token-encryption.test.ts`
- `packages/jeffrey-evals/src/jeffrey.eval.test.ts`

**Naming:**
- `*.test.ts` suffix (not `*.spec.ts`)

**Structure:**
```
apps/api/src/
├── engine/
│   ├── biomarker-ranges.ts
│   └── __tests__/
│       └── biomarker-ranges.test.ts
├── routes/
│   ├── chat.ts
│   └── __tests__/
│       └── jeffrey-realtime.test.ts
└── services/
    └── [no tests yet in this sample]
```

## Test Structure

**Suite Organization:**
```typescript
// From apps/api/src/engine/__tests__/biomarker-ranges.test.ts
import { describe, it, expect } from "vitest";
import { getRangeStatus, BIOMARKER_RANGES } from "../biomarker-ranges.js";

describe("getRangeStatus", () => {
  describe("vitamin_d_ng_ml", () => {
    it("returns 'low' when below normal range", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 20).status).toBe("low");
    });

    it("returns 'optimal' when in optimal range", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 55).status).toBe("optimal");
    });
  });

  describe("ldl_mg_dl", () => {
    it("returns 'optimal' when in optimal range (≤70)", () => {
      expect(getRangeStatus("ldl_mg_dl", 40).status).toBe("optimal");
    });
  });
});

describe("BIOMARKER_RANGES", () => {
  it("every range has required fields", () => {
    for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
      expect(typeof range.unit, `${name}.unit`).toBe("string");
    }
  });
});
```

**Patterns:**
- Nested `describe()` blocks organize related tests by biomarker or feature
- Setup: None required for unit tests (no beforeEach/afterEach in simple tests)
- Teardown: `beforeAll()` and cleanup hooks available when needed

## Mocking

**Framework:** Vitest's built-in mock support (compatible with Jest)

**Patterns:**
Unit tests do not use mocks — they test pure functions or simple value objects. Integration tests build real instances with test-specific configuration.

**Integration Test Pattern (from `apps/api/src/routes/__tests__/jeffrey-realtime.test.ts`):**
```typescript
import { describe, expect, it, beforeAll } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { jeffreyRealtimeRoutes } from "../jeffrey-realtime.js";

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(jwt, {
    secret: "test-secret-do-not-use-in-prod",
    sign: { expiresIn: "7d" },
  });
  await app.register(websocket);
  await app.register(jeffreyRealtimeRoutes);
  await app.ready();
  return app;
}

function signUserToken(app: FastifyInstance, sub: string): string {
  return app.jwt.sign({ sub });
}

describe("POST /v1/jeffrey/realtime/ticket", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  it("returns 401 without an auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      payload: { surface: "concierge" },
    });
    expect(res.statusCode).toBe(401);
  });
});
```

**What to Mock:**
- External services (OpenAI, ElevenLabs, WHOOP API) — would require integration test harness
- Database connections — not mocked; tests run against SQLite in-memory or test database when applicable

**What NOT to Mock:**
- Route handlers — test them in integration via `app.inject()`
- Services — test with real database when feasible; lightweight per-test setup
- Fastify plugins — register them in test app and test behavior through HTTP interface

## Fixtures and Factories

**Test Data:**
No formal fixture framework detected. Tests use inline data objects:

```typescript
// From apps/api/src/engine/__tests__/evaluator.test.ts
const signals: Signal[] = [
  { name: "vitamin_d_ng_ml", value: 22, unit: "ng/mL" },
];
const results = buildSignalsFromBiomarkers(signals);
expect(results).toHaveLength(1);
expect(results[0]).toMatchObject({
  name: "vitamin_d_ng_ml",
  value: 22,
  unit: "ng/mL",
  source: "biomarker",
});
```

**Factory Pattern:**
Integration tests use builder functions. Example from `jeffreyRealtimeRoutes` test:
```typescript
async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  // register plugins, routes...
  return app;
}

function signUserToken(app: FastifyInstance, sub: string): string {
  return app.jwt.sign({ sub });
}
```

**Location:**
- Helper factories defined inline in test files
- No shared test fixtures directory detected

## Coverage

**Requirements:** Not detected in CI config or package.json

**Current State:** Not discoverable from configuration; coverage reporting not configured in `vitest.config.ts`

**To Enable Coverage:**
Add `coverage` option to `apps/api/vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**"],
    },
  },
});
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, value objects, business logic
- Approach: Direct function calls with inline test data
- Examples: `biomarker-ranges.test.ts` (range classification), `unit-converter.test.ts` (unit math)
- Setup: Minimal — no database, no mocks

**Unit Test Example:**
```typescript
// From apps/api/src/engine/__tests__/biomarker-ranges.test.ts
describe("getRangeStatus", () => {
  it("returns 'low' when below normal range", () => {
    expect(getRangeStatus("vitamin_d_ng_ml", 20).status).toBe("low");
  });

  it("marks critically low B12", () => {
    expect(getRangeStatus("b12_pg_ml", 90).isCritical).toBe(true);
  });
});
```

**Integration Tests:**
- Scope: Route handlers, Fastify middleware, JWT validation, multi-step flows
- Approach: Build a test Fastify app, register routes, use `app.inject()` to simulate HTTP
- Examples: `jeffrey-realtime.test.ts` (POST /ticket, auth check, schema validation)
- Setup: Async `beforeAll()` to set up Fastify app; lightweight but non-trivial

**Integration Test Example:**
```typescript
// From apps/api/src/routes/__tests__/jeffrey-realtime.test.ts
describe("POST /v1/jeffrey/realtime/ticket", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  it("issues a short-lived ticket with expected claims", async () => {
    const token = signUserToken(app, "user-42");
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      headers: { authorization: `Bearer ${token}` },
      payload: { surface: "concierge" },
    });
    expect(res.statusCode).toBe(200);

    const body = res.json() as {
      data: { ticket: string; expiresInSeconds: number; surface: string };
    };
    expect(body.data.surface).toBe("concierge");
    expect(body.data.expiresInSeconds).toBe(30);
  });
});
```

**E2E Tests:**
- Framework: Not detected in current codebase
- Comments in integration tests acknowledge scope: "What we deliberately do not cover here: Actual upstream WebSocket round-trip to OpenAI. That would require a mock ws server and a working test harness; we defer that to a later full-stack test."
- Recommendation: E2E tests could use Playwright or Cypress for browser-based scenarios; not currently in scope

## Common Patterns

**Async Testing:**
Tests use `await` directly in test blocks; Vitest's Promise detection is automatic:
```typescript
it("returns 200 when valid", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/endpoint",
  });
  expect(res.statusCode).toBe(200);
});
```

**Error Testing:**
```typescript
// From apps/api/src/engine/__tests__/biomarker-ranges.test.ts
it("marks critically high Vitamin D", () => {
  expect(getRangeStatus("vitamin_d_ng_ml", 200).isCritical).toBe(true);
});

it("returns 'unknown' status for unrecognized names", () => {
  expect(getRangeStatus("not_a_real_biomarker", 42).status).toBe("unknown");
});
```

**HTTP Status Testing:**
```typescript
it("returns 401 without an auth token", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/v1/jeffrey/realtime/ticket",
    payload: { surface: "concierge" },
  });
  expect(res.statusCode).toBe(401);
});
```

**Payload/Schema Testing:**
```typescript
it("rejects surfaces outside the realtime allowlist", async () => {
  const token = signUserToken(app, "user-1");
  const res = await app.inject({
    method: "POST",
    url: "/v1/jeffrey/realtime/ticket",
    headers: { authorization: `Bearer ${token}` },
    payload: { surface: "investor" }, // Not allowed
  });
  // Schema validation rejects enum mismatch with 400.
  expect(res.statusCode).toBe(400);
});
```

**Boundary/Data Consistency Testing:**
```typescript
// From apps/api/src/engine/__tests__/biomarker-ranges.test.ts
it("every range has required fields", () => {
  for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
    expect(typeof range.unit, `${name}.unit`).toBe("string");
    expect(typeof range.low, `${name}.low`).toBe("number");
    expect(typeof range.highNormal, `${name}.highNormal`).toBe("number");
    expect(range.low, `${name}: low < highNormal`).toBeLessThan(range.highNormal);
  }
});

it("critical bounds are more extreme than normal bounds when defined", () => {
  for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
    if (range.criticalLow !== undefined) {
      expect(range.criticalLow, `${name}: criticalLow <= low`).toBeLessThanOrEqual(range.low);
    }
  }
});
```

## Testing Jeffrey (AI Brain)

**packages/jeffrey:** TypeScript-only, no integration test suite visible in codebase

**Evaluation tests:** `packages/jeffrey-evals/src/jeffrey.eval.test.ts` exists but focuses on LLM output validation

**Pattern for Jeffrey in apps/api:**
- Mocked at service boundary: `jeffrey.service.ts` calls `createJeffreySession()` from `@aissisted/jeffrey`
- Route tests do NOT mock Jeffrey calls; they test the route handler logic separately
- Full Jeffrey → route → client flow would require live OpenAI key (integration-level test)

---

*Testing analysis: 2026-05-04*
