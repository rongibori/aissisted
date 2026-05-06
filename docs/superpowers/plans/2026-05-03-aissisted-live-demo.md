# Aissisted Live Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the visual neural AI interface to validated, privacy-checked structured data flows from MyChart/Epic (FHIR), WHOOP, and Apple Health, with mocked test data for 10 users so the demo runs end-to-end without live OAuth credentials.

**Architecture:** A new `@aissisted/schemas` package owns Zod schemas for the three providers; the existing `packages/integrations` adapters are completed (stubs replaced) and made schema-validating; a `DemoSource` interface lets every adapter resolve to either real or fixture data via a single env flag (`DEMO_MODE=true`). A new Fastify route family (`/api/demo/*`) emits Server-Sent Events for ingestion lifecycle (connect, fetch, validate, redact, normalize, persist, error). A new Next.js page `apps/web/app/demo/page.tsx` renders an SVG neural-graph visualization that consumes the SSE stream and animates per-state. Privacy enforcement (consent gate + PII redaction) sits between fetch and persist; an audit log row is written for every demo ingestion.

**Tech Stack:** TypeScript 5.6 ESM, Zod 3.23, pnpm workspaces, Turbo, Fastify 5, Next.js 15 + React 19, Tailwind 4.2, Drizzle ORM, Vitest 3, Playwright (newly added for e2e), node-cron (existing), AES-256-GCM (existing).

---

## Pre-flight

These commands establish the working state. Run them once before Phase 0.

- [ ] **Step 1: Confirm clean working tree**

Run: `cd /Users/rongibori/aissisted && git status`
Expected: `nothing to commit, working tree clean` (or only the `docs/superpowers/plans/...` file just created).

- [ ] **Step 2: Create a working branch**

Run: `cd /Users/rongibori/aissisted && git checkout -b feat/live-demo`
Expected: `Switched to a new branch 'feat/live-demo'`

- [ ] **Step 3: Verify monorepo build passes baseline**

Run: `cd /Users/rongibori/aissisted && pnpm install && pnpm -w turbo run typecheck`
Expected: All packages typecheck without errors. If anything fails on `main`, fix or note in `docs/superpowers/plans/baseline-issues.md` before continuing.

- [ ] **Step 4: Commit plan file**

```bash
cd /Users/rongibori/aissisted
git add docs/superpowers/plans/2026-05-03-aissisted-live-demo.md
git commit -m "docs: add live demo implementation plan"
```

---

## Phase 0 — Schema Foundation

**Outcome:** A new `@aissisted/schemas` package with Zod schemas for FHIR observations, WHOOP recovery/sleep/HRV/strain payloads, and Apple Health quantity/category records. All three adapters and ingestion pipelines validate data through these schemas.

**Files:**
- Create: `/Users/rongibori/aissisted/packages/schemas/package.json`
- Create: `/Users/rongibori/aissisted/packages/schemas/tsconfig.json`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/index.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fhir.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/whoop.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/appleHealth.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/canonical.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/vitest.config.ts`
- Test: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/fhir.test.ts`
- Test: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/whoop.test.ts`
- Test: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/appleHealth.test.ts`
- Test: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/canonical.test.ts`
- Modify: `/Users/rongibori/aissisted/pnpm-workspace.yaml` (already includes `packages/*`, no edit needed — verify only)

### Task 0.1 — Scaffold the schemas package

- [ ] **Step 1: Create package.json**

File: `/Users/rongibori/aissisted/packages/schemas/package.json`

```json
{
  "name": "@aissisted/schemas",
  "private": true,
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "vitest": "3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

File: `/Users/rongibori/aissisted/packages/schemas/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create vitest.config.ts (mirrors apps/api convention)**

File: `/Users/rongibori/aissisted/packages/schemas/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    isolate: true,
    reporter: "verbose",
  },
  resolve: { extensions: [".ts", ".js"] },
});
```

- [ ] **Step 4: Install at root and verify workspace pickup**

Run: `cd /Users/rongibori/aissisted && pnpm install`
Expected: `+ @aissisted/schemas` listed in installed workspace packages.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/package.json packages/schemas/tsconfig.json packages/schemas/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(schemas): scaffold @aissisted/schemas package"
```

### Task 0.2 — FHIR Observation schema (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/fhir.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { FhirObservationSchema, FhirBundleSchema } from "../fhir";

const validObservation = {
  resourceType: "Observation",
  id: "obs-1",
  status: "final",
  code: { coding: [{ system: "http://loinc.org", code: "2093-3", display: "Cholesterol" }] },
  subject: { reference: "Patient/p-1" },
  effectiveDateTime: "2025-09-15T08:30:00Z",
  valueQuantity: { value: 172, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" },
};

describe("FhirObservationSchema", () => {
  it("accepts a valid LOINC observation", () => {
    expect(() => FhirObservationSchema.parse(validObservation)).not.toThrow();
  });

  it("rejects observations missing resourceType", () => {
    const bad = { ...validObservation } as Record<string, unknown>;
    delete bad.resourceType;
    expect(() => FhirObservationSchema.parse(bad)).toThrow();
  });

  it("rejects observations with status outside the FHIR value set", () => {
    expect(() => FhirObservationSchema.parse({ ...validObservation, status: "weird" })).toThrow();
  });

  it("accepts a string valueString instead of valueQuantity", () => {
    const stringy = { ...validObservation, valueQuantity: undefined, valueString: "negative" };
    expect(() => FhirObservationSchema.parse(stringy)).not.toThrow();
  });
});

describe("FhirBundleSchema", () => {
  it("accepts a Bundle of observations", () => {
    const bundle = {
      resourceType: "Bundle",
      type: "searchset",
      entry: [{ resource: validObservation }],
    };
    expect(() => FhirBundleSchema.parse(bundle)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test`
Expected: FAIL — module `../fhir` not found.

- [ ] **Step 3: Implement the schema**

File: `/Users/rongibori/aissisted/packages/schemas/src/fhir.ts`

```typescript
import { z } from "zod";

export const FhirCodingSchema = z.object({
  system: z.string().url().optional(),
  code: z.string().min(1),
  display: z.string().optional(),
});

export const FhirCodeableConceptSchema = z.object({
  coding: z.array(FhirCodingSchema).min(1),
  text: z.string().optional(),
});

export const FhirQuantitySchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
  system: z.string().url().optional(),
  code: z.string().optional(),
});

export const FhirReferenceSchema = z.object({
  reference: z.string().min(1),
  display: z.string().optional(),
});

export const FhirObservationStatusSchema = z.enum([
  "registered", "preliminary", "final", "amended",
  "corrected", "cancelled", "entered-in-error", "unknown",
]);

export const FhirObservationSchema = z.object({
  resourceType: z.literal("Observation"),
  id: z.string().min(1),
  status: FhirObservationStatusSchema,
  code: FhirCodeableConceptSchema,
  subject: FhirReferenceSchema,
  effectiveDateTime: z.string().datetime().optional(),
  effectivePeriod: z.object({
    start: z.string().datetime(),
    end: z.string().datetime().optional(),
  }).optional(),
  valueQuantity: FhirQuantitySchema.optional(),
  valueString: z.string().optional(),
  valueCodeableConcept: FhirCodeableConceptSchema.optional(),
  interpretation: z.array(FhirCodeableConceptSchema).optional(),
  referenceRange: z.array(z.object({
    low: FhirQuantitySchema.optional(),
    high: FhirQuantitySchema.optional(),
    text: z.string().optional(),
  })).optional(),
}).refine(
  (obs) => obs.valueQuantity !== undefined || obs.valueString !== undefined || obs.valueCodeableConcept !== undefined,
  { message: "Observation must include one of valueQuantity, valueString, or valueCodeableConcept" }
);

export type FhirObservation = z.infer<typeof FhirObservationSchema>;

export const FhirBundleEntrySchema = z.object({
  fullUrl: z.string().url().optional(),
  resource: FhirObservationSchema,
});

export const FhirBundleSchema = z.object({
  resourceType: z.literal("Bundle"),
  type: z.enum(["searchset", "collection", "transaction", "batch", "history", "document", "message"]),
  total: z.number().int().nonnegative().optional(),
  entry: z.array(FhirBundleEntrySchema).default([]),
});

export type FhirBundle = z.infer<typeof FhirBundleSchema>;
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- fhir`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/fhir.ts packages/schemas/src/__tests__/fhir.test.ts
git commit -m "feat(schemas): add FHIR observation and bundle schemas"
```

### Task 0.3 — WHOOP schema (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/whoop.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import {
  WhoopRecoverySchema,
  WhoopSleepSchema,
  WhoopWorkoutSchema,
  WhoopCycleSchema,
} from "../whoop";

describe("WhoopRecoverySchema", () => {
  it("accepts a valid recovery payload", () => {
    const payload = {
      cycle_id: 99287,
      sleep_id: 12345,
      user_id: 10129,
      created_at: "2025-09-15T08:30:00.000Z",
      updated_at: "2025-09-15T08:31:00.000Z",
      score_state: "SCORED",
      score: {
        user_calibrating: false,
        recovery_score: 72,
        resting_heart_rate: 58,
        hrv_rmssd_milli: 38.4,
        spo2_percentage: 97.2,
        skin_temp_celsius: 33.1,
      },
    };
    expect(() => WhoopRecoverySchema.parse(payload)).not.toThrow();
  });

  it("rejects recovery_score outside 0-100", () => {
    const bad = {
      cycle_id: 1, user_id: 1, created_at: "2025-09-15T08:30:00.000Z",
      updated_at: "2025-09-15T08:30:00.000Z", score_state: "SCORED",
      score: { user_calibrating: false, recovery_score: 150, resting_heart_rate: 58, hrv_rmssd_milli: 30 },
    };
    expect(() => WhoopRecoverySchema.parse(bad)).toThrow();
  });
});

describe("WhoopSleepSchema", () => {
  it("accepts a valid sleep payload", () => {
    const payload = {
      id: 1,
      user_id: 10129,
      created_at: "2025-09-15T08:30:00.000Z",
      updated_at: "2025-09-15T08:31:00.000Z",
      start: "2025-09-14T22:00:00.000Z",
      end: "2025-09-15T06:30:00.000Z",
      timezone_offset: "-05:00",
      nap: false,
      score_state: "SCORED",
      score: {
        stage_summary: {
          total_in_bed_time_milli: 30600000,
          total_awake_time_milli: 1200000,
          total_no_data_time_milli: 0,
          total_light_sleep_time_milli: 12000000,
          total_slow_wave_sleep_time_milli: 5400000,
          total_rem_sleep_time_milli: 7200000,
          sleep_cycle_count: 5,
          disturbance_count: 4,
        },
        sleep_needed: { baseline_milli: 28800000, need_from_sleep_debt_milli: 600000, need_from_recent_strain_milli: 1200000, need_from_recent_nap_milli: 0 },
        respiratory_rate: 14.6,
        sleep_performance_percentage: 88.5,
        sleep_consistency_percentage: 72.0,
        sleep_efficiency_percentage: 91.4,
      },
    };
    expect(() => WhoopSleepSchema.parse(payload)).not.toThrow();
  });
});

describe("WhoopWorkoutSchema", () => {
  it("accepts a valid workout payload with strain", () => {
    const payload = {
      id: 2,
      user_id: 10129,
      created_at: "2025-09-15T08:30:00.000Z",
      updated_at: "2025-09-15T08:31:00.000Z",
      start: "2025-09-15T17:00:00.000Z",
      end: "2025-09-15T17:45:00.000Z",
      timezone_offset: "-05:00",
      sport_id: 1,
      score_state: "SCORED",
      score: {
        strain: 12.4,
        average_heart_rate: 142,
        max_heart_rate: 178,
        kilojoule: 1840,
        percent_recorded: 100,
        distance_meter: 5000,
        altitude_gain_meter: 12,
        altitude_change_meter: 0,
        zone_duration: { zone_zero_milli: 0, zone_one_milli: 0, zone_two_milli: 600000, zone_three_milli: 1200000, zone_four_milli: 600000, zone_five_milli: 300000 },
      },
    };
    expect(() => WhoopWorkoutSchema.parse(payload)).not.toThrow();
  });
});

describe("WhoopCycleSchema", () => {
  it("accepts a valid daily cycle", () => {
    const payload = {
      id: 99287,
      user_id: 10129,
      created_at: "2025-09-15T08:30:00.000Z",
      updated_at: "2025-09-15T08:31:00.000Z",
      start: "2025-09-15T05:00:00.000Z",
      end: null,
      timezone_offset: "-05:00",
      score_state: "SCORED",
      score: {
        strain: 14.8,
        kilojoule: 9200,
        average_heart_rate: 76,
        max_heart_rate: 178,
      },
    };
    expect(() => WhoopCycleSchema.parse(payload)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- whoop`
Expected: FAIL — module `../whoop` not found.

- [ ] **Step 3: Implement schema**

File: `/Users/rongibori/aissisted/packages/schemas/src/whoop.ts`

```typescript
import { z } from "zod";

export const WhoopScoreStateSchema = z.enum(["SCORED", "PENDING_SCORE", "UNSCORABLE"]);

export const WhoopRecoveryScoreSchema = z.object({
  user_calibrating: z.boolean(),
  recovery_score: z.number().min(0).max(100),
  resting_heart_rate: z.number().positive(),
  hrv_rmssd_milli: z.number().nonnegative(),
  spo2_percentage: z.number().min(0).max(100).optional(),
  skin_temp_celsius: z.number().optional(),
});

export const WhoopRecoverySchema = z.object({
  cycle_id: z.number().int(),
  sleep_id: z.number().int().optional(),
  user_id: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  score_state: WhoopScoreStateSchema,
  score: WhoopRecoveryScoreSchema.optional(),
});

export const WhoopSleepStageSummarySchema = z.object({
  total_in_bed_time_milli: z.number().int().nonnegative(),
  total_awake_time_milli: z.number().int().nonnegative(),
  total_no_data_time_milli: z.number().int().nonnegative(),
  total_light_sleep_time_milli: z.number().int().nonnegative(),
  total_slow_wave_sleep_time_milli: z.number().int().nonnegative(),
  total_rem_sleep_time_milli: z.number().int().nonnegative(),
  sleep_cycle_count: z.number().int().nonnegative(),
  disturbance_count: z.number().int().nonnegative(),
});

export const WhoopSleepNeededSchema = z.object({
  baseline_milli: z.number().int().nonnegative(),
  need_from_sleep_debt_milli: z.number().int().nonnegative(),
  need_from_recent_strain_milli: z.number().int().nonnegative(),
  need_from_recent_nap_milli: z.number().int().nonnegative(),
});

export const WhoopSleepScoreSchema = z.object({
  stage_summary: WhoopSleepStageSummarySchema,
  sleep_needed: WhoopSleepNeededSchema,
  respiratory_rate: z.number().nonnegative(),
  sleep_performance_percentage: z.number().min(0).max(100),
  sleep_consistency_percentage: z.number().min(0).max(100),
  sleep_efficiency_percentage: z.number().min(0).max(100),
});

export const WhoopSleepSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone_offset: z.string(),
  nap: z.boolean(),
  score_state: WhoopScoreStateSchema,
  score: WhoopSleepScoreSchema.optional(),
});

export const WhoopZoneDurationSchema = z.object({
  zone_zero_milli: z.number().int().nonnegative(),
  zone_one_milli: z.number().int().nonnegative(),
  zone_two_milli: z.number().int().nonnegative(),
  zone_three_milli: z.number().int().nonnegative(),
  zone_four_milli: z.number().int().nonnegative(),
  zone_five_milli: z.number().int().nonnegative(),
});

export const WhoopWorkoutScoreSchema = z.object({
  strain: z.number().min(0).max(21),
  average_heart_rate: z.number().positive(),
  max_heart_rate: z.number().positive(),
  kilojoule: z.number().nonnegative(),
  percent_recorded: z.number().min(0).max(100),
  distance_meter: z.number().nonnegative().optional(),
  altitude_gain_meter: z.number().optional(),
  altitude_change_meter: z.number().optional(),
  zone_duration: WhoopZoneDurationSchema,
});

export const WhoopWorkoutSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone_offset: z.string(),
  sport_id: z.number().int(),
  score_state: WhoopScoreStateSchema,
  score: WhoopWorkoutScoreSchema.optional(),
});

export const WhoopCycleScoreSchema = z.object({
  strain: z.number().min(0).max(21),
  kilojoule: z.number().nonnegative(),
  average_heart_rate: z.number().positive(),
  max_heart_rate: z.number().positive(),
});

export const WhoopCycleSchema = z.object({
  id: z.number().int(),
  user_id: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  start: z.string().datetime(),
  end: z.string().datetime().nullable(),
  timezone_offset: z.string(),
  score_state: WhoopScoreStateSchema,
  score: WhoopCycleScoreSchema.optional(),
});

export type WhoopRecovery = z.infer<typeof WhoopRecoverySchema>;
export type WhoopSleep = z.infer<typeof WhoopSleepSchema>;
export type WhoopWorkout = z.infer<typeof WhoopWorkoutSchema>;
export type WhoopCycle = z.infer<typeof WhoopCycleSchema>;
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- whoop`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/whoop.ts packages/schemas/src/__tests__/whoop.test.ts
git commit -m "feat(schemas): add WHOOP recovery, sleep, workout, cycle schemas"
```

### Task 0.4 — Apple Health schema (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/appleHealth.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { AppleHealthRecordSchema, AppleHealthExportSchema } from "../appleHealth";

const validRecord = {
  type: "HKQuantityTypeIdentifierHeartRate",
  sourceName: "Apple Watch",
  unit: "count/min",
  startDate: "2025-09-15 08:30:00 -0500",
  endDate: "2025-09-15 08:30:00 -0500",
  value: "62",
};

describe("AppleHealthRecordSchema", () => {
  it("accepts a valid heart-rate record", () => {
    expect(() => AppleHealthRecordSchema.parse(validRecord)).not.toThrow();
  });

  it("rejects records with unknown type prefix", () => {
    expect(() => AppleHealthRecordSchema.parse({ ...validRecord, type: "RandomType" })).toThrow();
  });

  it("accepts category records (sleep)", () => {
    const sleep = {
      type: "HKCategoryTypeIdentifierSleepAnalysis",
      sourceName: "iPhone",
      startDate: "2025-09-14 22:00:00 -0500",
      endDate: "2025-09-15 06:30:00 -0500",
      value: "HKCategoryValueSleepAnalysisAsleep",
    };
    expect(() => AppleHealthRecordSchema.parse(sleep)).not.toThrow();
  });
});

describe("AppleHealthExportSchema", () => {
  it("accepts an export with multiple records", () => {
    const exportPayload = {
      ExportDate: "2025-09-15 08:30:00 -0500",
      Me: {
        HKCharacteristicTypeIdentifierBiologicalSex: "HKBiologicalSexFemale",
        HKCharacteristicTypeIdentifierDateOfBirth: "1990-01-01",
      },
      Records: [validRecord, validRecord],
    };
    expect(() => AppleHealthExportSchema.parse(exportPayload)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- appleHealth`
Expected: FAIL — module `../appleHealth` not found.

- [ ] **Step 3: Implement schema**

File: `/Users/rongibori/aissisted/packages/schemas/src/appleHealth.ts`

```typescript
import { z } from "zod";

const TYPE_PREFIXES = ["HKQuantityTypeIdentifier", "HKCategoryTypeIdentifier", "HKCorrelationTypeIdentifier"];

export const AppleHealthRecordSchema = z.object({
  type: z.string().refine((t) => TYPE_PREFIXES.some((p) => t.startsWith(p)), {
    message: "type must start with HKQuantityTypeIdentifier, HKCategoryTypeIdentifier, or HKCorrelationTypeIdentifier",
  }),
  sourceName: z.string().min(1),
  sourceVersion: z.string().optional(),
  device: z.string().optional(),
  unit: z.string().optional(),
  creationDate: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  value: z.string().min(1),
});

export const AppleHealthCharacteristicsSchema = z.object({
  HKCharacteristicTypeIdentifierBiologicalSex: z.string().optional(),
  HKCharacteristicTypeIdentifierBloodType: z.string().optional(),
  HKCharacteristicTypeIdentifierDateOfBirth: z.string().optional(),
  HKCharacteristicTypeIdentifierFitzpatrickSkinType: z.string().optional(),
}).partial();

export const AppleHealthExportSchema = z.object({
  ExportDate: z.string().min(1),
  Me: AppleHealthCharacteristicsSchema.optional(),
  Records: z.array(AppleHealthRecordSchema).default([]),
});

export type AppleHealthRecord = z.infer<typeof AppleHealthRecordSchema>;
export type AppleHealthExport = z.infer<typeof AppleHealthExportSchema>;
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- appleHealth`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/src/appleHealth.ts packages/schemas/src/__tests__/appleHealth.test.ts
git commit -m "feat(schemas): add Apple Health record and export schemas"
```

### Task 0.5 — Canonical Biomarker schema (TDD)

This is the normalized cross-provider type that flows into the visualization.

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/schemas/src/__tests__/canonical.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { CanonicalBiomarkerSchema, IngestionEventSchema } from "../canonical";

describe("CanonicalBiomarkerSchema", () => {
  it("accepts a normalized HRV reading from WHOOP", () => {
    const reading = {
      userId: "user-1",
      source: "whoop",
      metric: "hrv",
      value: 38.4,
      unit: "ms",
      recordedAt: "2025-09-15T08:30:00.000Z",
      providerRecordId: "whoop:recovery:99287",
    };
    expect(() => CanonicalBiomarkerSchema.parse(reading)).not.toThrow();
  });

  it("rejects unknown sources", () => {
    expect(() =>
      CanonicalBiomarkerSchema.parse({
        userId: "u", source: "fitbit", metric: "hrv", value: 1, unit: "ms",
        recordedAt: "2025-09-15T08:30:00.000Z", providerRecordId: "x",
      })
    ).toThrow();
  });
});

describe("IngestionEventSchema", () => {
  it("accepts each lifecycle phase", () => {
    const phases = ["connect", "fetch", "validate", "redact", "normalize", "persist", "complete", "error"] as const;
    for (const phase of phases) {
      expect(() =>
        IngestionEventSchema.parse({
          userId: "u-1",
          source: "fhir",
          phase,
          ts: "2025-09-15T08:30:00.000Z",
          ok: phase !== "error",
          payload: phase === "error" ? { code: "TIMEOUT", message: "boom" } : { count: 3 },
        })
      ).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- canonical`
Expected: FAIL — module `../canonical` not found.

- [ ] **Step 3: Implement schema**

File: `/Users/rongibori/aissisted/packages/schemas/src/canonical.ts`

```typescript
import { z } from "zod";

export const CanonicalSourceSchema = z.enum(["fhir", "whoop", "apple_health"]);

export const CanonicalMetricSchema = z.enum([
  "hrv", "resting_heart_rate", "recovery_score", "sleep_efficiency",
  "sleep_duration_minutes", "strain", "respiratory_rate",
  "ldl_cholesterol", "hdl_cholesterol", "triglycerides",
  "hba1c", "glucose_fasting", "vitamin_d", "tsh",
  "blood_pressure_systolic", "blood_pressure_diastolic",
  "steps", "active_energy_kcal", "vo2_max",
]);

export const CanonicalBiomarkerSchema = z.object({
  userId: z.string().min(1),
  source: CanonicalSourceSchema,
  metric: CanonicalMetricSchema,
  value: z.number(),
  unit: z.string().min(1),
  recordedAt: z.string().datetime(),
  providerRecordId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export type CanonicalBiomarker = z.infer<typeof CanonicalBiomarkerSchema>;

export const IngestionPhaseSchema = z.enum([
  "connect", "fetch", "validate", "redact", "normalize", "persist", "complete", "error",
]);

export const IngestionEventSchema = z.object({
  userId: z.string().min(1),
  source: CanonicalSourceSchema,
  phase: IngestionPhaseSchema,
  ts: z.string().datetime(),
  ok: z.boolean(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type IngestionEvent = z.infer<typeof IngestionEventSchema>;
```

- [ ] **Step 4: Add barrel export**

File: `/Users/rongibori/aissisted/packages/schemas/src/index.ts`

```typescript
export * from "./fhir";
export * from "./whoop";
export * from "./appleHealth";
export * from "./canonical";
```

- [ ] **Step 5: Run all schema tests**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test`
Expected: PASS, all 16+ tests.

- [ ] **Step 6: Commit**

```bash
git add packages/schemas/src/canonical.ts packages/schemas/src/__tests__/canonical.test.ts packages/schemas/src/index.ts
git commit -m "feat(schemas): add canonical biomarker and ingestion event schemas"
```

### Phase 0 Success Criteria

- `pnpm --filter @aissisted/schemas test` passes with ≥16 tests.
- `pnpm --filter @aissisted/schemas typecheck` passes.
- `import { FhirObservationSchema } from "@aissisted/schemas"` resolves from any other workspace package after `pnpm install`.

---

## Phase 1 — Mock Data for 10 Users

**Outcome:** A `packages/schemas/src/fixtures/` directory containing realistic-but-synthetic data for 10 users across all three providers, every record passing its schema. Each user has a distinct medical-narrative archetype so the demo tells a story (e.g., "high cholesterol responder", "athletic over-trainer", "post-COVID recovery").

**Files:**
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/users.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/fhir.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/whoop.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/appleHealth.ts`
- Create: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/index.ts`
- Test: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/__tests__/fixtures.test.ts`

### Task 1.1 — Define 10 user archetypes

- [ ] **Step 1: Create user fixtures**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/users.ts`

```typescript
export interface DemoUser {
  id: string;
  displayName: string;
  archetype: string;
  ageYears: number;
  biologicalSex: "male" | "female";
  narrative: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: "demo-user-01", displayName: "Avery K.", archetype: "high-cholesterol-responder", ageYears: 47, biologicalSex: "female", narrative: "LDL trending up; recent statin start; recovery normal." },
  { id: "demo-user-02", displayName: "Brett M.", archetype: "athletic-over-trainer", ageYears: 32, biologicalSex: "male", narrative: "High strain, low recovery, elevated resting HR." },
  { id: "demo-user-03", displayName: "Cora P.", archetype: "post-covid-recovery", ageYears: 38, biologicalSex: "female", narrative: "Reduced HRV, elevated respiratory rate, fatigue." },
  { id: "demo-user-04", displayName: "Dev R.", archetype: "metabolic-risk", ageYears: 54, biologicalSex: "male", narrative: "Elevated HbA1c, fasting glucose; sedentary." },
  { id: "demo-user-05", displayName: "Eliza S.", archetype: "thyroid-imbalance", ageYears: 41, biologicalSex: "female", narrative: "TSH elevated; cold intolerance; low energy." },
  { id: "demo-user-06", displayName: "Finn T.", archetype: "sleep-deprived-exec", ageYears: 45, biologicalSex: "male", narrative: "Sleep efficiency <80%; high strain weekdays." },
  { id: "demo-user-07", displayName: "Gita V.", archetype: "vitamin-d-deficient", ageYears: 29, biologicalSex: "female", narrative: "Vitamin D <20 ng/mL; mood/sleep concerns." },
  { id: "demo-user-08", displayName: "Hugo W.", archetype: "hypertension-controlled", ageYears: 60, biologicalSex: "male", narrative: "Borderline BP, on medication; normal sleep/HRV." },
  { id: "demo-user-09", displayName: "Iris X.", archetype: "perimenopause", ageYears: 49, biologicalSex: "female", narrative: "Disrupted sleep, hot flashes, HRV variability." },
  { id: "demo-user-10", displayName: "Jaden Y.", archetype: "healthy-baseline", ageYears: 26, biologicalSex: "male", narrative: "All biomarkers in normal range — control case." },
];

export function getDemoUser(id: string): DemoUser {
  const u = DEMO_USERS.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown demo user: ${id}`);
  return u;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/schemas/src/fixtures/users.ts
git commit -m "feat(schemas): add 10 demo user archetypes"
```

### Task 1.2 — FHIR fixtures (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/__tests__/fixtures.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { DEMO_USERS } from "../users";
import { fhirBundleForUser } from "../fhir";
import { whoopPayloadForUser } from "../whoop";
import { appleHealthExportForUser } from "../appleHealth";
import { FhirBundleSchema } from "../../fhir";
import {
  WhoopRecoverySchema, WhoopSleepSchema, WhoopWorkoutSchema, WhoopCycleSchema,
} from "../../whoop";
import { AppleHealthExportSchema } from "../../appleHealth";

describe("FHIR fixtures", () => {
  it.each(DEMO_USERS.map((u) => [u.id]))("user %s produces a schema-valid FHIR bundle", (id) => {
    const bundle = fhirBundleForUser(id);
    expect(() => FhirBundleSchema.parse(bundle)).not.toThrow();
    expect(bundle.entry.length).toBeGreaterThan(0);
  });

  it("high-cholesterol archetype has elevated LDL", () => {
    const bundle = fhirBundleForUser("demo-user-01");
    const ldl = bundle.entry.find((e) => e.resource.code.coding[0].code === "13457-7");
    expect(ldl).toBeDefined();
    expect(ldl!.resource.valueQuantity!.value).toBeGreaterThanOrEqual(160);
  });
});

describe("WHOOP fixtures", () => {
  it.each(DEMO_USERS.map((u) => [u.id]))("user %s produces a schema-valid WHOOP payload set", (id) => {
    const p = whoopPayloadForUser(id);
    expect(() => WhoopCycleSchema.parse(p.cycle)).not.toThrow();
    expect(() => WhoopRecoverySchema.parse(p.recovery)).not.toThrow();
    expect(() => WhoopSleepSchema.parse(p.sleep)).not.toThrow();
    for (const w of p.workouts) {
      expect(() => WhoopWorkoutSchema.parse(w)).not.toThrow();
    }
  });

  it("over-trainer archetype shows high strain and low recovery", () => {
    const p = whoopPayloadForUser("demo-user-02");
    expect(p.cycle.score!.strain).toBeGreaterThanOrEqual(15);
    expect(p.recovery.score!.recovery_score).toBeLessThanOrEqual(40);
  });
});

describe("Apple Health fixtures", () => {
  it.each(DEMO_USERS.map((u) => [u.id]))("user %s produces a schema-valid Apple Health export", (id) => {
    const exp = appleHealthExportForUser(id);
    expect(() => AppleHealthExportSchema.parse(exp)).not.toThrow();
    expect(exp.Records.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test -- fixtures`
Expected: FAIL — fixture modules not found.

- [ ] **Step 3: Implement FHIR fixture**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/fhir.ts`

```typescript
import type { FhirBundle, FhirObservation } from "../fhir";
import { DEMO_USERS, getDemoUser } from "./users";

interface ObsParams {
  id: string;
  loincCode: string;
  display: string;
  value: number;
  unit: string;
  daysAgo: number;
  patientId: string;
  status?: "final" | "preliminary" | "amended";
  refLow?: number;
  refHigh?: number;
}

function obs(p: ObsParams): FhirObservation {
  const issued = new Date(Date.now() - p.daysAgo * 86_400_000).toISOString();
  return {
    resourceType: "Observation",
    id: p.id,
    status: p.status ?? "final",
    code: { coding: [{ system: "http://loinc.org", code: p.loincCode, display: p.display }] },
    subject: { reference: `Patient/${p.patientId}` },
    effectiveDateTime: issued,
    valueQuantity: { value: p.value, unit: p.unit, system: "http://unitsofmeasure.org", code: p.unit },
    referenceRange: p.refLow !== undefined || p.refHigh !== undefined ? [{
      low: p.refLow !== undefined ? { value: p.refLow, unit: p.unit, system: "http://unitsofmeasure.org", code: p.unit } : undefined,
      high: p.refHigh !== undefined ? { value: p.refHigh, unit: p.unit, system: "http://unitsofmeasure.org", code: p.unit } : undefined,
    }] : undefined,
  };
}

const archetypeProfile: Record<string, { ldl: number; hdl: number; trig: number; hba1c: number; vitD: number; tsh: number; bpSys: number; bpDia: number }> = {
  "high-cholesterol-responder": { ldl: 168, hdl: 48, trig: 180, hba1c: 5.4, vitD: 32, tsh: 2.1, bpSys: 124, bpDia: 78 },
  "athletic-over-trainer":      { ldl: 92,  hdl: 72, trig: 70,  hba1c: 5.0, vitD: 38, tsh: 1.8, bpSys: 118, bpDia: 72 },
  "post-covid-recovery":        { ldl: 110, hdl: 60, trig: 110, hba1c: 5.2, vitD: 25, tsh: 2.4, bpSys: 116, bpDia: 74 },
  "metabolic-risk":             { ldl: 142, hdl: 38, trig: 230, hba1c: 6.4, vitD: 22, tsh: 2.0, bpSys: 132, bpDia: 84 },
  "thyroid-imbalance":          { ldl: 118, hdl: 58, trig: 95,  hba1c: 5.1, vitD: 28, tsh: 6.8, bpSys: 122, bpDia: 76 },
  "sleep-deprived-exec":        { ldl: 128, hdl: 52, trig: 140, hba1c: 5.5, vitD: 26, tsh: 2.2, bpSys: 130, bpDia: 82 },
  "vitamin-d-deficient":        { ldl: 104, hdl: 64, trig: 80,  hba1c: 5.0, vitD: 14, tsh: 1.9, bpSys: 114, bpDia: 70 },
  "hypertension-controlled":    { ldl: 116, hdl: 56, trig: 120, hba1c: 5.6, vitD: 30, tsh: 2.3, bpSys: 128, bpDia: 80 },
  "perimenopause":              { ldl: 122, hdl: 66, trig: 110, hba1c: 5.3, vitD: 27, tsh: 3.0, bpSys: 120, bpDia: 76 },
  "healthy-baseline":           { ldl: 96,  hdl: 70, trig: 75,  hba1c: 4.9, vitD: 42, tsh: 1.7, bpSys: 112, bpDia: 70 },
};

export function fhirBundleForUser(userId: string): FhirBundle {
  const u = getDemoUser(userId);
  const p = archetypeProfile[u.archetype];
  if (!p) throw new Error(`No archetype profile for ${u.archetype}`);

  const patientId = `patient-${userId}`;
  const entries: { resource: FhirObservation }[] = [
    { resource: obs({ id: `${userId}-ldl`, loincCode: "13457-7", display: "LDL Cholesterol", value: p.ldl, unit: "mg/dL", daysAgo: 14, patientId, refHigh: 100 }) },
    { resource: obs({ id: `${userId}-hdl`, loincCode: "2085-9", display: "HDL Cholesterol", value: p.hdl, unit: "mg/dL", daysAgo: 14, patientId, refLow: 40 }) },
    { resource: obs({ id: `${userId}-trig`, loincCode: "2571-8", display: "Triglycerides", value: p.trig, unit: "mg/dL", daysAgo: 14, patientId, refHigh: 150 }) },
    { resource: obs({ id: `${userId}-hba1c`, loincCode: "4548-4", display: "HbA1c", value: p.hba1c, unit: "%", daysAgo: 21, patientId, refHigh: 5.7 }) },
    { resource: obs({ id: `${userId}-vitd`, loincCode: "62292-8", display: "Vitamin D 25-OH", value: p.vitD, unit: "ng/mL", daysAgo: 30, patientId, refLow: 30, refHigh: 100 }) },
    { resource: obs({ id: `${userId}-tsh`, loincCode: "3016-3", display: "TSH", value: p.tsh, unit: "uIU/mL", daysAgo: 30, patientId, refLow: 0.4, refHigh: 4.0 }) },
    { resource: obs({ id: `${userId}-bps`, loincCode: "8480-6", display: "Systolic BP", value: p.bpSys, unit: "mmHg", daysAgo: 7, patientId, refHigh: 130 }) },
    { resource: obs({ id: `${userId}-bpd`, loincCode: "8462-4", display: "Diastolic BP", value: p.bpDia, unit: "mmHg", daysAgo: 7, patientId, refHigh: 80 }) },
  ];

  return { resourceType: "Bundle", type: "searchset", total: entries.length, entry: entries };
}

export function fhirBundlesForAllUsers(): Record<string, FhirBundle> {
  return Object.fromEntries(DEMO_USERS.map((u) => [u.id, fhirBundleForUser(u.id)]));
}
```

- [ ] **Step 4: Implement WHOOP fixture**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/whoop.ts`

```typescript
import type { WhoopCycle, WhoopRecovery, WhoopSleep, WhoopWorkout } from "../whoop";
import { DEMO_USERS, getDemoUser } from "./users";

const archetypeProfile: Record<string, { strain: number; recovery: number; rhr: number; hrv: number; sleepEffPct: number; respRate: number; workoutCount: number }> = {
  "high-cholesterol-responder": { strain: 9.2,  recovery: 68, rhr: 62, hrv: 36, sleepEffPct: 88, respRate: 14.5, workoutCount: 1 },
  "athletic-over-trainer":      { strain: 17.4, recovery: 32, rhr: 70, hrv: 22, sleepEffPct: 82, respRate: 16.2, workoutCount: 3 },
  "post-covid-recovery":        { strain: 6.8,  recovery: 41, rhr: 74, hrv: 24, sleepEffPct: 78, respRate: 17.8, workoutCount: 0 },
  "metabolic-risk":             { strain: 5.4,  recovery: 55, rhr: 78, hrv: 28, sleepEffPct: 85, respRate: 15.0, workoutCount: 0 },
  "thyroid-imbalance":          { strain: 7.0,  recovery: 48, rhr: 66, hrv: 30, sleepEffPct: 86, respRate: 14.8, workoutCount: 1 },
  "sleep-deprived-exec":        { strain: 13.5, recovery: 39, rhr: 68, hrv: 26, sleepEffPct: 76, respRate: 15.4, workoutCount: 1 },
  "vitamin-d-deficient":        { strain: 8.1,  recovery: 60, rhr: 64, hrv: 34, sleepEffPct: 87, respRate: 14.6, workoutCount: 1 },
  "hypertension-controlled":    { strain: 9.8,  recovery: 64, rhr: 70, hrv: 32, sleepEffPct: 88, respRate: 14.4, workoutCount: 1 },
  "perimenopause":              { strain: 8.3,  recovery: 52, rhr: 65, hrv: 31, sleepEffPct: 79, respRate: 14.9, workoutCount: 1 },
  "healthy-baseline":           { strain: 11.2, recovery: 78, rhr: 56, hrv: 52, sleepEffPct: 92, respRate: 13.8, workoutCount: 2 },
};

const TZ = "-05:00";

function isoDaysAgo(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function userIdToInt(userId: string): number {
  return parseInt(userId.replace(/\D/g, ""), 10);
}

export interface WhoopPayload {
  cycle: WhoopCycle;
  recovery: WhoopRecovery;
  sleep: WhoopSleep;
  workouts: WhoopWorkout[];
}

export function whoopPayloadForUser(userId: string): WhoopPayload {
  const u = getDemoUser(userId);
  const p = archetypeProfile[u.archetype];
  if (!p) throw new Error(`No archetype profile for ${u.archetype}`);
  const uid = userIdToInt(userId);
  const cycleId = uid * 1000 + 1;
  const sleepId = uid * 1000 + 2;

  const cycle: WhoopCycle = {
    id: cycleId,
    user_id: uid,
    created_at: isoDaysAgo(0, 5),
    updated_at: isoDaysAgo(0, 12),
    start: isoDaysAgo(0, 5),
    end: null,
    timezone_offset: TZ,
    score_state: "SCORED",
    score: { strain: p.strain, kilojoule: 8000 + p.strain * 200, average_heart_rate: p.rhr + 18, max_heart_rate: 168 },
  };

  const recovery: WhoopRecovery = {
    cycle_id: cycleId,
    sleep_id: sleepId,
    user_id: uid,
    created_at: isoDaysAgo(0, 6),
    updated_at: isoDaysAgo(0, 6),
    score_state: "SCORED",
    score: {
      user_calibrating: false,
      recovery_score: p.recovery,
      resting_heart_rate: p.rhr,
      hrv_rmssd_milli: p.hrv,
      spo2_percentage: 96.5,
      skin_temp_celsius: 33.4,
    },
  };

  const sleep: WhoopSleep = {
    id: sleepId,
    user_id: uid,
    created_at: isoDaysAgo(0, 6),
    updated_at: isoDaysAgo(0, 6),
    start: isoDaysAgo(1, 22),
    end: isoDaysAgo(0, 6),
    timezone_offset: TZ,
    nap: false,
    score_state: "SCORED",
    score: {
      stage_summary: {
        total_in_bed_time_milli: 30_600_000,
        total_awake_time_milli: Math.round(30_600_000 * (1 - p.sleepEffPct / 100)),
        total_no_data_time_milli: 0,
        total_light_sleep_time_milli: 12_000_000,
        total_slow_wave_sleep_time_milli: 5_400_000,
        total_rem_sleep_time_milli: 7_200_000,
        sleep_cycle_count: 5,
        disturbance_count: 4,
      },
      sleep_needed: { baseline_milli: 28_800_000, need_from_sleep_debt_milli: 600_000, need_from_recent_strain_milli: 1_200_000, need_from_recent_nap_milli: 0 },
      respiratory_rate: p.respRate,
      sleep_performance_percentage: p.sleepEffPct,
      sleep_consistency_percentage: 72.0,
      sleep_efficiency_percentage: p.sleepEffPct,
    },
  };

  const workouts: WhoopWorkout[] = Array.from({ length: p.workoutCount }, (_, i) => ({
    id: uid * 1000 + 100 + i,
    user_id: uid,
    created_at: isoDaysAgo(i, 18),
    updated_at: isoDaysAgo(i, 19),
    start: isoDaysAgo(i, 17),
    end: isoDaysAgo(i, 18),
    timezone_offset: TZ,
    sport_id: 1,
    score_state: "SCORED" as const,
    score: {
      strain: p.strain * 0.8,
      average_heart_rate: 142,
      max_heart_rate: 178,
      kilojoule: 1840,
      percent_recorded: 100,
      distance_meter: 5000,
      altitude_gain_meter: 12,
      altitude_change_meter: 0,
      zone_duration: { zone_zero_milli: 0, zone_one_milli: 0, zone_two_milli: 600_000, zone_three_milli: 1_200_000, zone_four_milli: 600_000, zone_five_milli: 300_000 },
    },
  }));

  return { cycle, recovery, sleep, workouts };
}
```

- [ ] **Step 5: Implement Apple Health fixture**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/appleHealth.ts`

```typescript
import type { AppleHealthExport, AppleHealthRecord } from "../appleHealth";
import { DEMO_USERS, getDemoUser } from "./users";

const archetypeProfile: Record<string, { rhr: number; steps: number; vo2max: number; activeKcal: number }> = {
  "high-cholesterol-responder": { rhr: 64, steps:  6500, vo2max: 32, activeKcal: 320 },
  "athletic-over-trainer":      { rhr: 70, steps: 14000, vo2max: 52, activeKcal: 880 },
  "post-covid-recovery":        { rhr: 76, steps:  4200, vo2max: 28, activeKcal: 220 },
  "metabolic-risk":             { rhr: 78, steps:  3200, vo2max: 24, activeKcal: 180 },
  "thyroid-imbalance":          { rhr: 66, steps:  5800, vo2max: 30, activeKcal: 260 },
  "sleep-deprived-exec":        { rhr: 68, steps:  7800, vo2max: 36, activeKcal: 410 },
  "vitamin-d-deficient":        { rhr: 64, steps:  6200, vo2max: 34, activeKcal: 290 },
  "hypertension-controlled":    { rhr: 70, steps:  5200, vo2max: 30, activeKcal: 240 },
  "perimenopause":              { rhr: 65, steps:  6800, vo2max: 33, activeKcal: 310 },
  "healthy-baseline":           { rhr: 56, steps: 11500, vo2max: 48, activeKcal: 540 },
};

function fmt(d: Date): string {
  // Apple Health export uses "YYYY-MM-DD HH:mm:ss -ZZZZ"
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00 -0500`;
}

function rec(type: string, value: number | string, unit: string | undefined, daysAgo: number, hour: number): AppleHealthRecord {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return {
    type,
    sourceName: "Apple Watch",
    unit,
    startDate: fmt(d),
    endDate: fmt(d),
    value: String(value),
  };
}

export function appleHealthExportForUser(userId: string): AppleHealthExport {
  const u = getDemoUser(userId);
  const p = archetypeProfile[u.archetype];
  if (!p) throw new Error(`No archetype profile for ${u.archetype}`);

  const records: AppleHealthRecord[] = [];
  for (let day = 0; day < 7; day++) {
    records.push(rec("HKQuantityTypeIdentifierRestingHeartRate", p.rhr + Math.floor((Math.random() - 0.5) * 4), "count/min", day, 7));
    records.push(rec("HKQuantityTypeIdentifierStepCount", p.steps + Math.floor((Math.random() - 0.5) * 1000), "count", day, 23));
    records.push(rec("HKQuantityTypeIdentifierActiveEnergyBurned", p.activeKcal + Math.floor((Math.random() - 0.5) * 60), "kcal", day, 23));
    records.push(rec("HKQuantityTypeIdentifierVO2Max", p.vo2max, "mL/min·kg", day, 12));
    records.push(rec("HKCategoryTypeIdentifierSleepAnalysis", "HKCategoryValueSleepAnalysisAsleep", undefined, day, 6));
  }

  return {
    ExportDate: fmt(new Date()),
    Me: {
      HKCharacteristicTypeIdentifierBiologicalSex: u.biologicalSex === "female" ? "HKBiologicalSexFemale" : "HKBiologicalSexMale",
      HKCharacteristicTypeIdentifierDateOfBirth: `${new Date().getUTCFullYear() - u.ageYears}-01-01`,
    },
    Records: records,
  };
}
```

- [ ] **Step 6: Add fixtures barrel and update index**

File: `/Users/rongibori/aissisted/packages/schemas/src/fixtures/index.ts`

```typescript
export * from "./users";
export { fhirBundleForUser, fhirBundlesForAllUsers } from "./fhir";
export { whoopPayloadForUser } from "./whoop";
export type { WhoopPayload } from "./whoop";
export { appleHealthExportForUser } from "./appleHealth";
```

Modify `/Users/rongibori/aissisted/packages/schemas/src/index.ts` — append:

```typescript
export * as fixtures from "./fixtures";
```

- [ ] **Step 7: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/schemas && pnpm test`
Expected: PASS, all schema tests + 30+ fixture tests (10 users × 3 providers + 2 narrative checks).

- [ ] **Step 8: Commit**

```bash
git add packages/schemas/src/fixtures/ packages/schemas/src/index.ts
git commit -m "feat(schemas): add 10-user fixtures for FHIR/WHOOP/Apple Health"
```

### Phase 1 Success Criteria

- Every fixture parses successfully through its provider schema.
- Two narrative checks pass: archetype-01 (high LDL ≥160) and archetype-02 (strain ≥15, recovery ≤40).
- `import { fixtures } from "@aissisted/schemas"` resolves and exposes `fhirBundleForUser`, `whoopPayloadForUser`, `appleHealthExportForUser`, `DEMO_USERS`.

---

## Phase 2 — Adapter Implementation with Validation & Error States

**Outcome:** The three adapters in `packages/integrations` are no longer stubs. Each one accepts a `DemoSource` ("fixture" | "live"), validates its responses through `@aissisted/schemas`, normalizes to `CanonicalBiomarker[]`, and returns typed `AdapterResult` discriminated unions for success vs. error.

**Files:**
- Modify: `/Users/rongibori/aissisted/packages/integrations/package.json` (add `@aissisted/schemas` dep)
- Modify: `/Users/rongibori/aissisted/packages/integrations/src/wearableProvider.interface.ts`
- Modify: `/Users/rongibori/aissisted/packages/integrations/src/whoopAdapter.ts`
- Modify: `/Users/rongibori/aissisted/packages/integrations/src/fhirAdapter.ts`
- Modify: `/Users/rongibori/aissisted/packages/integrations/src/appleHealthAdapter.ts`
- Create: `/Users/rongibori/aissisted/packages/integrations/src/normalize/whoop.ts`
- Create: `/Users/rongibori/aissisted/packages/integrations/src/normalize/fhir.ts`
- Create: `/Users/rongibori/aissisted/packages/integrations/src/normalize/appleHealth.ts`
- Create: `/Users/rongibori/aissisted/packages/integrations/src/errors.ts`
- Create: `/Users/rongibori/aissisted/packages/integrations/vitest.config.ts`
- Test: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/whoopAdapter.test.ts`
- Test: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/fhirAdapter.test.ts`
- Test: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/appleHealthAdapter.test.ts`

### Task 2.1 — Adapter contract & error types

- [ ] **Step 1: Update `wearableProvider.interface.ts`**

File: `/Users/rongibori/aissisted/packages/integrations/src/wearableProvider.interface.ts` — replace contents:

```typescript
import type { CanonicalBiomarker } from "@aissisted/schemas";

export type DemoSource = "fixture" | "live";

export type AdapterErrorCode =
  | "NOT_CONFIGURED"
  | "AUTH_REQUIRED"
  | "RATE_LIMITED"
  | "SCHEMA_INVALID"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface AdapterError {
  code: AdapterErrorCode;
  message: string;
  cause?: unknown;
}

export type AdapterResult =
  | { ok: true; biomarkers: CanonicalBiomarker[] }
  | { ok: false; error: AdapterError };

export interface ProviderAdapter {
  name: "whoop" | "fhir" | "apple_health";
  source: DemoSource;
  fetchAndNormalize(userId: string): Promise<AdapterResult>;
}

/** @deprecated kept for backwards-compat with services that import the older shape */
export interface WearableMetric {
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

/** @deprecated use ProviderAdapter */
export interface WearableProvider {
  name: string;
  connect(): Promise<void>;
  fetchMetrics(userId: string): Promise<WearableMetric[]>;
}
```

- [ ] **Step 2: Add @aissisted/schemas dependency**

File: `/Users/rongibori/aissisted/packages/integrations/package.json` — add to `dependencies`:

```json
{
  "dependencies": {
    "@aissisted/schemas": "workspace:*"
  }
}
```

(Preserve any existing entries; add the line.)

- [ ] **Step 3: Run install**

Run: `cd /Users/rongibori/aissisted && pnpm install`
Expected: workspace link succeeds.

- [ ] **Step 4: Create errors helper**

File: `/Users/rongibori/aissisted/packages/integrations/src/errors.ts`

```typescript
import type { AdapterError, AdapterErrorCode } from "./wearableProvider.interface";

export function adapterError(code: AdapterErrorCode, message: string, cause?: unknown): AdapterError {
  return { code, message, cause };
}

export function isAdapterError(x: unknown): x is AdapterError {
  return !!x && typeof x === "object" && "code" in x && "message" in x;
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/integrations/src/wearableProvider.interface.ts packages/integrations/src/errors.ts packages/integrations/package.json pnpm-lock.yaml
git commit -m "feat(integrations): add ProviderAdapter contract and AdapterError types"
```

### Task 2.2 — WHOOP normalizer + adapter (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/whoopAdapter.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { WhoopAdapter } from "../whoopAdapter";

describe("WhoopAdapter (fixture mode)", () => {
  it("returns canonical biomarkers for a known user", async () => {
    const a = new WhoopAdapter({ source: "fixture" });
    const r = await a.fetchAndNormalize("demo-user-02");
    if (!r.ok) throw new Error(`expected ok, got ${r.error.code}`);
    const metrics = r.biomarkers.map((b) => b.metric);
    expect(metrics).toContain("hrv");
    expect(metrics).toContain("recovery_score");
    expect(metrics).toContain("strain");
    expect(r.biomarkers.every((b) => b.source === "whoop")).toBe(true);
  });

  it("returns AUTH_REQUIRED in live mode without tokens", async () => {
    const a = new WhoopAdapter({ source: "live", getAccessToken: async () => null });
    const r = await a.fetchAndNormalize("demo-user-02");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("AUTH_REQUIRED");
  });

  it("returns SCHEMA_INVALID when provider returns junk", async () => {
    const a = new WhoopAdapter({
      source: "live",
      getAccessToken: async () => "tok",
      fetchRaw: async () => ({ recovery: { not_a_real_field: true } }),
    });
    const r = await a.fetchAndNormalize("demo-user-02");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("SCHEMA_INVALID");
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/integrations && pnpm test`
Expected: FAIL — test runner missing or adapter shape mismatch.

- [ ] **Step 3: Add vitest config**

File: `/Users/rongibori/aissisted/packages/integrations/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { globals: true, environment: "node", isolate: true, reporter: "verbose" },
  resolve: { extensions: [".ts", ".js"] },
});
```

Update `/Users/rongibori/aissisted/packages/integrations/package.json` — add to scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "3.0.0",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 4: Implement WHOOP normalizer**

File: `/Users/rongibori/aissisted/packages/integrations/src/normalize/whoop.ts`

```typescript
import type { CanonicalBiomarker } from "@aissisted/schemas";
import type { WhoopRecovery, WhoopSleep, WhoopCycle } from "@aissisted/schemas";

export function normalizeWhoop(args: {
  userId: string;
  recovery: WhoopRecovery;
  sleep: WhoopSleep;
  cycle: WhoopCycle;
}): CanonicalBiomarker[] {
  const out: CanonicalBiomarker[] = [];
  const { userId, recovery, sleep, cycle } = args;

  if (recovery.score) {
    out.push({
      userId, source: "whoop", metric: "hrv",
      value: recovery.score.hrv_rmssd_milli, unit: "ms",
      recordedAt: recovery.created_at,
      providerRecordId: `whoop:recovery:${recovery.cycle_id}`,
    });
    out.push({
      userId, source: "whoop", metric: "resting_heart_rate",
      value: recovery.score.resting_heart_rate, unit: "bpm",
      recordedAt: recovery.created_at,
      providerRecordId: `whoop:recovery:${recovery.cycle_id}:rhr`,
    });
    out.push({
      userId, source: "whoop", metric: "recovery_score",
      value: recovery.score.recovery_score, unit: "%",
      recordedAt: recovery.created_at,
      providerRecordId: `whoop:recovery:${recovery.cycle_id}:score`,
    });
  }

  if (sleep.score) {
    out.push({
      userId, source: "whoop", metric: "sleep_efficiency",
      value: sleep.score.sleep_efficiency_percentage, unit: "%",
      recordedAt: sleep.end,
      providerRecordId: `whoop:sleep:${sleep.id}`,
    });
    const minutes = Math.round((sleep.score.stage_summary.total_in_bed_time_milli - sleep.score.stage_summary.total_awake_time_milli) / 60_000);
    out.push({
      userId, source: "whoop", metric: "sleep_duration_minutes",
      value: minutes, unit: "min",
      recordedAt: sleep.end,
      providerRecordId: `whoop:sleep:${sleep.id}:duration`,
    });
    out.push({
      userId, source: "whoop", metric: "respiratory_rate",
      value: sleep.score.respiratory_rate, unit: "breaths/min",
      recordedAt: sleep.end,
      providerRecordId: `whoop:sleep:${sleep.id}:resp`,
    });
  }

  if (cycle.score) {
    out.push({
      userId, source: "whoop", metric: "strain",
      value: cycle.score.strain, unit: "score",
      recordedAt: cycle.start,
      providerRecordId: `whoop:cycle:${cycle.id}`,
    });
  }

  return out;
}
```

- [ ] **Step 5: Implement WhoopAdapter**

File: `/Users/rongibori/aissisted/packages/integrations/src/whoopAdapter.ts` — replace contents:

```typescript
import {
  WhoopRecoverySchema, WhoopSleepSchema, WhoopCycleSchema,
  fixtures,
} from "@aissisted/schemas";
import type { ProviderAdapter, AdapterResult, DemoSource } from "./wearableProvider.interface";
import { adapterError } from "./errors";
import { normalizeWhoop } from "./normalize/whoop";

export interface WhoopAdapterOpts {
  source: DemoSource;
  getAccessToken?: (userId: string) => Promise<string | null>;
  fetchRaw?: (userId: string, accessToken: string) => Promise<unknown>;
}

export class WhoopAdapter implements ProviderAdapter {
  readonly name = "whoop" as const;
  readonly source: DemoSource;
  private readonly getAccessToken?: (u: string) => Promise<string | null>;
  private readonly fetchRaw?: (u: string, t: string) => Promise<unknown>;

  constructor(opts: WhoopAdapterOpts) {
    this.source = opts.source;
    this.getAccessToken = opts.getAccessToken;
    this.fetchRaw = opts.fetchRaw;
  }

  async fetchAndNormalize(userId: string): Promise<AdapterResult> {
    if (this.source === "fixture") {
      try {
        const p = fixtures.whoopPayloadForUser(userId);
        const recovery = WhoopRecoverySchema.parse(p.recovery);
        const sleep = WhoopSleepSchema.parse(p.sleep);
        const cycle = WhoopCycleSchema.parse(p.cycle);
        return { ok: true, biomarkers: normalizeWhoop({ userId, recovery, sleep, cycle }) };
      } catch (e) {
        return { ok: false, error: adapterError("SCHEMA_INVALID", "fixture failed schema validation", e) };
      }
    }

    if (!this.getAccessToken) {
      return { ok: false, error: adapterError("NOT_CONFIGURED", "live mode requires getAccessToken") };
    }
    const token = await this.getAccessToken(userId);
    if (!token) {
      return { ok: false, error: adapterError("AUTH_REQUIRED", "no WHOOP token for user") };
    }
    if (!this.fetchRaw) {
      return { ok: false, error: adapterError("NOT_CONFIGURED", "live mode requires fetchRaw") };
    }

    let raw: unknown;
    try {
      raw = await this.fetchRaw(userId, token);
    } catch (e) {
      return { ok: false, error: adapterError("NETWORK_ERROR", "WHOOP API call failed", e) };
    }

    const r = (raw as { recovery?: unknown; sleep?: unknown; cycle?: unknown }) ?? {};
    const recParsed = WhoopRecoverySchema.safeParse(r.recovery);
    const sleepParsed = WhoopSleepSchema.safeParse(r.sleep);
    const cycleParsed = WhoopCycleSchema.safeParse(r.cycle);
    if (!recParsed.success || !sleepParsed.success || !cycleParsed.success) {
      const issues = [
        ...(!recParsed.success ? recParsed.error.issues : []),
        ...(!sleepParsed.success ? sleepParsed.error.issues : []),
        ...(!cycleParsed.success ? cycleParsed.error.issues : []),
      ];
      return { ok: false, error: adapterError("SCHEMA_INVALID", `WHOOP response did not validate: ${issues.length} issues`, issues) };
    }

    return {
      ok: true,
      biomarkers: normalizeWhoop({
        userId,
        recovery: recParsed.data,
        sleep: sleepParsed.data,
        cycle: cycleParsed.data,
      }),
    };
  }
}
```

- [ ] **Step 6: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/integrations && pnpm test -- whoopAdapter`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add packages/integrations/src/whoopAdapter.ts packages/integrations/src/normalize/whoop.ts packages/integrations/src/__tests__/whoopAdapter.test.ts packages/integrations/vitest.config.ts packages/integrations/package.json
git commit -m "feat(integrations): rewrite WhoopAdapter with schema validation, fixture/live modes, error states"
```

### Task 2.3 — FHIR normalizer + adapter (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/fhirAdapter.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { FhirAdapter } from "../fhirAdapter";

describe("FhirAdapter (fixture mode)", () => {
  it("normalizes LDL/HDL/HbA1c/Vitamin D/TSH/BP from fixture", async () => {
    const a = new FhirAdapter({ source: "fixture" });
    const r = await a.fetchAndNormalize("demo-user-01");
    if (!r.ok) throw new Error(`expected ok, got ${r.error.code}`);
    const metrics = new Set(r.biomarkers.map((b) => b.metric));
    expect(metrics.has("ldl_cholesterol")).toBe(true);
    expect(metrics.has("hdl_cholesterol")).toBe(true);
    expect(metrics.has("hba1c")).toBe(true);
    expect(metrics.has("vitamin_d")).toBe(true);
    expect(metrics.has("tsh")).toBe(true);
    expect(metrics.has("blood_pressure_systolic")).toBe(true);
    expect(r.biomarkers.every((b) => b.source === "fhir")).toBe(true);
  });

  it("returns SCHEMA_INVALID when bundle is malformed", async () => {
    const a = new FhirAdapter({
      source: "live",
      getAccessToken: async () => "tok",
      fetchBundle: async () => ({ resourceType: "Bundle", type: "searchset", entry: [{ resource: { not: "valid" } }] }),
    });
    const r = await a.fetchAndNormalize("demo-user-01");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("SCHEMA_INVALID");
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/packages/integrations && pnpm test -- fhirAdapter`
Expected: FAIL — `FhirAdapter` class does not exist (current export is `FHIRAdapter`).

- [ ] **Step 3: Implement FHIR normalizer**

File: `/Users/rongibori/aissisted/packages/integrations/src/normalize/fhir.ts`

```typescript
import type { CanonicalBiomarker } from "@aissisted/schemas";
import type { FhirObservation } from "@aissisted/schemas";

const LOINC_TO_METRIC: Record<string, { metric: CanonicalBiomarker["metric"]; unit: string }> = {
  "13457-7": { metric: "ldl_cholesterol", unit: "mg/dL" },
  "2085-9":  { metric: "hdl_cholesterol", unit: "mg/dL" },
  "2571-8":  { metric: "triglycerides",   unit: "mg/dL" },
  "4548-4":  { metric: "hba1c",           unit: "%" },
  "62292-8": { metric: "vitamin_d",       unit: "ng/mL" },
  "3016-3":  { metric: "tsh",             unit: "uIU/mL" },
  "8480-6":  { metric: "blood_pressure_systolic",  unit: "mmHg" },
  "8462-4":  { metric: "blood_pressure_diastolic", unit: "mmHg" },
  "1558-6":  { metric: "glucose_fasting",  unit: "mg/dL" },
};

export function normalizeFhirObservation(args: {
  userId: string;
  observation: FhirObservation;
}): CanonicalBiomarker | null {
  const { userId, observation } = args;
  const code = observation.code.coding[0]?.code;
  if (!code) return null;
  const map = LOINC_TO_METRIC[code];
  if (!map) return null;
  if (!observation.valueQuantity) return null;

  return {
    userId,
    source: "fhir",
    metric: map.metric,
    value: observation.valueQuantity.value,
    unit: map.unit,
    recordedAt: observation.effectiveDateTime ?? new Date().toISOString(),
    providerRecordId: `fhir:observation:${observation.id}`,
  };
}
```

- [ ] **Step 4: Implement FhirAdapter**

File: `/Users/rongibori/aissisted/packages/integrations/src/fhirAdapter.ts` — replace contents:

```typescript
import { FhirBundleSchema, fixtures } from "@aissisted/schemas";
import type { CanonicalBiomarker } from "@aissisted/schemas";
import type { ProviderAdapter, AdapterResult, DemoSource } from "./wearableProvider.interface";
import { adapterError } from "./errors";
import { normalizeFhirObservation } from "./normalize/fhir";

export interface FhirAdapterOpts {
  source: DemoSource;
  getAccessToken?: (userId: string) => Promise<string | null>;
  fetchBundle?: (userId: string, accessToken: string) => Promise<unknown>;
}

export class FhirAdapter implements ProviderAdapter {
  readonly name = "fhir" as const;
  readonly source: DemoSource;
  private readonly getAccessToken?: (u: string) => Promise<string | null>;
  private readonly fetchBundle?: (u: string, t: string) => Promise<unknown>;

  constructor(opts: FhirAdapterOpts) {
    this.source = opts.source;
    this.getAccessToken = opts.getAccessToken;
    this.fetchBundle = opts.fetchBundle;
  }

  async fetchAndNormalize(userId: string): Promise<AdapterResult> {
    if (this.source === "fixture") {
      try {
        const bundle = FhirBundleSchema.parse(fixtures.fhirBundleForUser(userId));
        const biomarkers: CanonicalBiomarker[] = [];
        for (const entry of bundle.entry) {
          const b = normalizeFhirObservation({ userId, observation: entry.resource });
          if (b) biomarkers.push(b);
        }
        return { ok: true, biomarkers };
      } catch (e) {
        return { ok: false, error: adapterError("SCHEMA_INVALID", "FHIR fixture bundle failed validation", e) };
      }
    }

    if (!this.getAccessToken) return { ok: false, error: adapterError("NOT_CONFIGURED", "live mode requires getAccessToken") };
    const token = await this.getAccessToken(userId);
    if (!token) return { ok: false, error: adapterError("AUTH_REQUIRED", "no FHIR token for user") };
    if (!this.fetchBundle) return { ok: false, error: adapterError("NOT_CONFIGURED", "live mode requires fetchBundle") };

    let raw: unknown;
    try {
      raw = await this.fetchBundle(userId, token);
    } catch (e) {
      return { ok: false, error: adapterError("NETWORK_ERROR", "FHIR API call failed", e) };
    }

    const parsed = FhirBundleSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: adapterError("SCHEMA_INVALID", `FHIR bundle did not validate: ${parsed.error.issues.length} issues`, parsed.error.issues) };
    }

    const biomarkers: CanonicalBiomarker[] = [];
    for (const entry of parsed.data.entry) {
      const b = normalizeFhirObservation({ userId, observation: entry.resource });
      if (b) biomarkers.push(b);
    }
    return { ok: true, biomarkers };
  }
}

/** @deprecated kept for backwards-compat with code importing the old class name */
export { FhirAdapter as FHIRAdapter };
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/integrations && pnpm test -- fhirAdapter`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/integrations/src/fhirAdapter.ts packages/integrations/src/normalize/fhir.ts packages/integrations/src/__tests__/fhirAdapter.test.ts
git commit -m "feat(integrations): rewrite FhirAdapter with bundle validation and LOINC mapping"
```

### Task 2.4 — Apple Health normalizer + adapter (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/packages/integrations/src/__tests__/appleHealthAdapter.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { AppleHealthAdapter } from "../appleHealthAdapter";

describe("AppleHealthAdapter (fixture mode)", () => {
  it("normalizes resting HR, steps, active energy, VO2max", async () => {
    const a = new AppleHealthAdapter({ source: "fixture" });
    const r = await a.fetchAndNormalize("demo-user-10");
    if (!r.ok) throw new Error(`expected ok, got ${r.error.code}`);
    const metrics = new Set(r.biomarkers.map((b) => b.metric));
    expect(metrics.has("resting_heart_rate")).toBe(true);
    expect(metrics.has("steps")).toBe(true);
    expect(metrics.has("active_energy_kcal")).toBe(true);
    expect(metrics.has("vo2_max")).toBe(true);
    expect(r.biomarkers.every((b) => b.source === "apple_health")).toBe(true);
  });

  it("returns SCHEMA_INVALID when records are malformed", async () => {
    const a = new AppleHealthAdapter({
      source: "live",
      getRawExport: async () => ({ ExportDate: "x", Records: [{ type: "BadType", value: "1" }] }),
    });
    const r = await a.fetchAndNormalize("demo-user-10");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("SCHEMA_INVALID");
  });
});
```

- [ ] **Step 2: Implement Apple Health normalizer**

File: `/Users/rongibori/aissisted/packages/integrations/src/normalize/appleHealth.ts`

```typescript
import type { CanonicalBiomarker } from "@aissisted/schemas";
import type { AppleHealthRecord } from "@aissisted/schemas";

const TYPE_TO_METRIC: Record<string, { metric: CanonicalBiomarker["metric"]; unit: string }> = {
  HKQuantityTypeIdentifierRestingHeartRate: { metric: "resting_heart_rate", unit: "bpm" },
  HKQuantityTypeIdentifierStepCount:        { metric: "steps", unit: "count" },
  HKQuantityTypeIdentifierActiveEnergyBurned: { metric: "active_energy_kcal", unit: "kcal" },
  HKQuantityTypeIdentifierVO2Max:           { metric: "vo2_max", unit: "mL/min·kg" },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: { metric: "hrv", unit: "ms" },
};

function parseAppleDate(s: string): string {
  // Apple format: "YYYY-MM-DD HH:mm:ss ±HHMM" → ISO 8601
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-]\d{2})(\d{2})$/);
  if (!m) return new Date().toISOString();
  const [, y, mo, d, h, mi, sec, oh, om] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${sec}${oh}:${om}`).toISOString();
}

export function normalizeAppleHealth(args: {
  userId: string;
  records: AppleHealthRecord[];
}): CanonicalBiomarker[] {
  const out: CanonicalBiomarker[] = [];
  for (const r of args.records) {
    const map = TYPE_TO_METRIC[r.type];
    if (!map) continue;
    const num = Number(r.value);
    if (!Number.isFinite(num)) continue;
    out.push({
      userId: args.userId,
      source: "apple_health",
      metric: map.metric,
      value: num,
      unit: map.unit,
      recordedAt: parseAppleDate(r.startDate),
      providerRecordId: `apple_health:${r.type}:${r.startDate}`,
    });
  }
  return out;
}
```

- [ ] **Step 3: Implement AppleHealthAdapter**

File: `/Users/rongibori/aissisted/packages/integrations/src/appleHealthAdapter.ts` — replace contents:

```typescript
import { AppleHealthExportSchema, fixtures } from "@aissisted/schemas";
import type { ProviderAdapter, AdapterResult, DemoSource } from "./wearableProvider.interface";
import { adapterError } from "./errors";
import { normalizeAppleHealth } from "./normalize/appleHealth";

export interface AppleHealthAdapterOpts {
  source: DemoSource;
  getRawExport?: (userId: string) => Promise<unknown>;
}

export class AppleHealthAdapter implements ProviderAdapter {
  readonly name = "apple_health" as const;
  readonly source: DemoSource;
  private readonly getRawExport?: (u: string) => Promise<unknown>;

  constructor(opts: AppleHealthAdapterOpts) {
    this.source = opts.source;
    this.getRawExport = opts.getRawExport;
  }

  async fetchAndNormalize(userId: string): Promise<AdapterResult> {
    if (this.source === "fixture") {
      try {
        const exp = AppleHealthExportSchema.parse(fixtures.appleHealthExportForUser(userId));
        return { ok: true, biomarkers: normalizeAppleHealth({ userId, records: exp.Records }) };
      } catch (e) {
        return { ok: false, error: adapterError("SCHEMA_INVALID", "Apple Health fixture failed validation", e) };
      }
    }

    if (!this.getRawExport) return { ok: false, error: adapterError("NOT_CONFIGURED", "live mode requires getRawExport") };
    let raw: unknown;
    try {
      raw = await this.getRawExport(userId);
    } catch (e) {
      return { ok: false, error: adapterError("NETWORK_ERROR", "Apple Health export read failed", e) };
    }
    const parsed = AppleHealthExportSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: adapterError("SCHEMA_INVALID", `Apple Health export did not validate: ${parsed.error.issues.length} issues`, parsed.error.issues) };
    }
    return { ok: true, biomarkers: normalizeAppleHealth({ userId, records: parsed.data.Records }) };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/rongibori/aissisted/packages/integrations && pnpm test`
Expected: PASS, all integration tests (3 + 2 + 2 = 7).

- [ ] **Step 5: Commit**

```bash
git add packages/integrations/src/appleHealthAdapter.ts packages/integrations/src/normalize/appleHealth.ts packages/integrations/src/__tests__/appleHealthAdapter.test.ts
git commit -m "feat(integrations): rewrite AppleHealthAdapter with schema validation and HK→canonical mapping"
```

### Phase 2 Success Criteria

- All three adapters return `AdapterResult` discriminated unions.
- All three pass schema validation against fixture data for every demo user (covered by Phase 1 + Phase 2 tests).
- Each adapter has explicit tests for `ok: true` (fixture), `AUTH_REQUIRED` (live, no token), and `SCHEMA_INVALID` (live, malformed payload).
- `pnpm --filter @aissisted/integrations test` passes.

---

## Phase 3 — Privacy Layer

**Outcome:** A reusable privacy module that (a) enforces consent at ingestion time, (b) redacts PII from any payload before it leaves the API process or is logged, (c) writes an append-only audit log row per ingestion. All three adapters route through this layer.

**Files:**
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/redact.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/consent.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/audit.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/redact.test.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/consent.test.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/audit.test.ts`

### Task 3.1 — PII redactor (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/redact.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { redactPii } from "../redact";

describe("redactPii", () => {
  it("masks email addresses", () => {
    expect(redactPii("contact me at jane.doe@example.com please")).toBe("contact me at [redacted-email] please");
  });

  it("masks US phone numbers", () => {
    expect(redactPii("call 415-555-1234")).toBe("call [redacted-phone]");
  });

  it("masks SSN-like sequences", () => {
    expect(redactPii("ssn 123-45-6789")).toBe("ssn [redacted-ssn]");
  });

  it("walks objects and arrays", () => {
    const input = { name: "Jane", note: "email jane@example.com", tags: ["call 415-555-1234"] };
    const out = redactPii(input) as typeof input;
    expect(out.note).toBe("email [redacted-email]");
    expect(out.tags[0]).toBe("call [redacted-phone]");
  });

  it("leaves clean payloads unchanged", () => {
    const input = { value: 38, unit: "ms" };
    expect(redactPii(input)).toEqual(input);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- redact`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement redactor**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/redact.ts`

```typescript
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const MRN = /\bMRN[:\s-]*[A-Z0-9]{6,}\b/gi;

function redactString(s: string): string {
  return s
    .replace(SSN, "[redacted-ssn]")
    .replace(EMAIL, "[redacted-email]")
    .replace(PHONE, "[redacted-phone]")
    .replace(MRN, "[redacted-mrn]");
}

export function redactPii<T>(value: T): T {
  if (typeof value === "string") return redactString(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => redactPii(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = redactPii(v);
    }
    return out as T;
  }
  return value;
}
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- redact`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/privacy/redact.ts apps/api/src/privacy/__tests__/redact.test.ts
git commit -m "feat(privacy): add recursive PII redactor for email, phone, SSN, MRN"
```

### Task 3.2 — Consent gate (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/consent.test.ts`

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { hasConsentForSource } from "../consent";

const fakeDb = {
  rows: [] as Array<{ userId: string; type: string; grantedAt: string | null; revokedAt: string | null }>,
  reset() { this.rows = []; },
  grant(userId: string, type: string) { this.rows.push({ userId, type, grantedAt: new Date().toISOString(), revokedAt: null }); },
  revoke(userId: string, type: string) {
    const row = this.rows.find((r) => r.userId === userId && r.type === type && !r.revokedAt);
    if (row) row.revokedAt = new Date().toISOString();
  },
};

vi.mock("@aissisted/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(fakeDb.rows),
      }),
    }),
  },
  schema: { consent: {} },
  eq: () => ({}),
  and: () => ({}),
  isNull: () => ({}),
}));

beforeEach(() => fakeDb.reset());

describe("hasConsentForSource", () => {
  it("returns false when no consent exists", async () => {
    expect(await hasConsentForSource("u1", "fhir")).toBe(false);
  });

  it("returns true after fhir_data_access consent is granted", async () => {
    fakeDb.grant("u1", "fhir_data_access");
    expect(await hasConsentForSource("u1", "fhir")).toBe(true);
  });

  it("requires data_processing for whoop and apple_health", async () => {
    fakeDb.grant("u1", "data_processing");
    expect(await hasConsentForSource("u1", "whoop")).toBe(true);
    expect(await hasConsentForSource("u1", "apple_health")).toBe(true);
  });

  it("returns false when consent is revoked", async () => {
    fakeDb.grant("u1", "fhir_data_access");
    fakeDb.revoke("u1", "fhir_data_access");
    expect(await hasConsentForSource("u1", "fhir")).toBe(false);
  });
});
```

- [ ] **Step 2: Implement consent gate**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/consent.ts`

```typescript
import { db, schema, eq, and, isNull } from "@aissisted/db";

const REQUIRED_CONSENT: Record<"fhir" | "whoop" | "apple_health", string> = {
  fhir: "fhir_data_access",
  whoop: "data_processing",
  apple_health: "data_processing",
};

export async function hasConsentForSource(userId: string, source: "fhir" | "whoop" | "apple_health"): Promise<boolean> {
  const required = REQUIRED_CONSENT[source];
  const rows = await db
    .select()
    .from(schema.consent)
    .where(and(
      eq(schema.consent.userId, userId),
      eq(schema.consent.type, required),
      isNull(schema.consent.revokedAt),
    ));
  return rows.length > 0;
}
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- consent`
Expected: PASS, 4 tests.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/privacy/consent.ts apps/api/src/privacy/__tests__/consent.test.ts
git commit -m "feat(privacy): add consent gate per data source"
```

### Task 3.3 — Audit log writer (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/__tests__/audit.test.ts`

```typescript
import { describe, expect, it, vi } from "vitest";
import { recordIngestionAudit } from "../audit";

const writes: Array<Record<string, unknown>> = [];

vi.mock("@aissisted/db", () => ({
  db: { insert: () => ({ values: (v: Record<string, unknown>) => { writes.push(v); return Promise.resolve(); } }) },
  schema: { auditLog: {} },
}));

describe("recordIngestionAudit", () => {
  it("writes one row per call with redacted payload summary", async () => {
    writes.length = 0;
    await recordIngestionAudit({
      userId: "u1",
      source: "fhir",
      phase: "complete",
      ok: true,
      summary: "imported 8 observations; contact jane@example.com",
    });
    expect(writes.length).toBe(1);
    expect((writes[0].summary as string).includes("[redacted-email]")).toBe(true);
    expect(writes[0].userId).toBe("u1");
    expect(writes[0].source).toBe("fhir");
  });
});
```

- [ ] **Step 2: Implement audit writer**

File: `/Users/rongibori/aissisted/apps/api/src/privacy/audit.ts`

```typescript
import { db, schema } from "@aissisted/db";
import { redactPii } from "./redact";

export interface AuditEvent {
  userId: string;
  source: "fhir" | "whoop" | "apple_health";
  phase: "connect" | "fetch" | "validate" | "redact" | "normalize" | "persist" | "complete" | "error";
  ok: boolean;
  summary: string;
}

export async function recordIngestionAudit(e: AuditEvent): Promise<void> {
  await db.insert(schema.auditLog).values({
    userId: e.userId,
    source: e.source,
    phase: e.phase,
    ok: e.ok,
    summary: redactPii(e.summary),
    occurredAt: new Date().toISOString(),
  });
}
```

> **Note:** This task assumes a `schema.auditLog` table exists in `packages/db/src/schema.ts`. If it does not, add it as a sub-task here:
>
> File: `/Users/rongibori/aissisted/packages/db/src/schema.ts` — append:
>
> ```typescript
> export const auditLog = sqliteTable("audit_log", {
>   id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
>   userId: text("user_id").notNull(),
>   source: text("source").notNull(),
>   phase: text("phase").notNull(),
>   ok: integer("ok", { mode: "boolean" }).notNull(),
>   summary: text("summary").notNull(),
>   occurredAt: text("occurred_at").notNull(),
> });
> ```
>
> Then run `pnpm --filter @aissisted/db db:generate && pnpm --filter @aissisted/db db:push` to materialize the migration. Verify with `pnpm --filter @aissisted/db typecheck`.

- [ ] **Step 3: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- audit`
Expected: PASS, 1 test.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/privacy/audit.ts apps/api/src/privacy/__tests__/audit.test.ts packages/db/src/schema.ts
git commit -m "feat(privacy): add audit log writer with redacted summaries"
```

### Phase 3 Success Criteria

- `redactPii` masks email/phone/SSN/MRN in strings, arrays, and nested objects.
- `hasConsentForSource` returns false for revoked or missing consent.
- `recordIngestionAudit` runs redaction before insert; the insert is the only side effect.
- `pnpm --filter @aissisted/api test -- privacy` passes ≥10 tests.

---

## Phase 4 — Demo Orchestration Service & SSE API

**Outcome:** A new service `runDemoIngestion(userId, source)` orchestrates: consent check → adapter fetch → schema validate → redact → normalize → persist → audit, emitting one `IngestionEvent` per phase. A Fastify route `/api/demo/run` accepts `{ userId, source }` and streams events via Server-Sent Events. A second route `/api/demo/seed` writes consent rows + clears prior demo data so the demo can re-run cleanly.

**Files:**
- Create: `/Users/rongibori/aissisted/apps/api/src/services/demo.service.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/services/__tests__/demo.service.test.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/routes/demo.ts`
- Create: `/Users/rongibori/aissisted/apps/api/src/routes/__tests__/demo.test.ts`
- Modify: `/Users/rongibori/aissisted/apps/api/src/index.ts` (register `demoRoutes`)

### Task 4.1 — Demo service (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/apps/api/src/services/__tests__/demo.service.test.ts`

```typescript
import { describe, expect, it, vi } from "vitest";
import { runDemoIngestion } from "../demo.service";

vi.mock("../../privacy/consent", () => ({
  hasConsentForSource: vi.fn(async (_u: string, src: string) => src !== "denied"),
}));

vi.mock("../../privacy/audit", () => ({
  recordIngestionAudit: vi.fn(async () => undefined),
}));

vi.mock("../biomarker.service", () => ({
  persistRawBiomarkers: vi.fn(async (_u: string, list: unknown[]) => list.length),
}));

describe("runDemoIngestion", () => {
  it("emits connect→fetch→validate→redact→normalize→persist→complete for fixture WHOOP", async () => {
    const events: string[] = [];
    const result = await runDemoIngestion({
      userId: "demo-user-02",
      source: "whoop",
      mode: "fixture",
      onEvent: (e) => events.push(e.phase),
    });
    expect(result.ok).toBe(true);
    expect(events).toEqual(["connect", "fetch", "validate", "redact", "normalize", "persist", "complete"]);
  });

  it("emits error and stops when consent missing", async () => {
    const events: { phase: string; ok: boolean }[] = [];
    const result = await runDemoIngestion({
      userId: "demo-user-02",
      source: "denied" as never,
      mode: "fixture",
      onEvent: (e) => events.push({ phase: e.phase, ok: e.ok }),
    });
    expect(result.ok).toBe(false);
    expect(events.at(-1)?.phase).toBe("error");
    expect(events.at(-1)?.ok).toBe(false);
  });

  it("emits error on schema invalid", async () => {
    const events: string[] = [];
    const result = await runDemoIngestion({
      userId: "nonexistent-user",
      source: "whoop",
      mode: "fixture",
      onEvent: (e) => events.push(e.phase),
    });
    expect(result.ok).toBe(false);
    expect(events).toContain("error");
  });
});
```

- [ ] **Step 2: Implement demo service**

File: `/Users/rongibori/aissisted/apps/api/src/services/demo.service.ts`

```typescript
import { WhoopAdapter, FhirAdapter, AppleHealthAdapter } from "@aissisted/integrations";
import type { ProviderAdapter } from "@aissisted/integrations";
import type { CanonicalBiomarker, IngestionEvent } from "@aissisted/schemas";
import { hasConsentForSource } from "../privacy/consent.js";
import { redactPii } from "../privacy/redact.js";
import { recordIngestionAudit } from "../privacy/audit.js";
import { persistRawBiomarkers } from "./biomarker.service.js";

export interface RunDemoArgs {
  userId: string;
  source: "fhir" | "whoop" | "apple_health";
  mode: "fixture" | "live";
  onEvent: (e: IngestionEvent) => void;
}

export interface RunDemoResult {
  ok: boolean;
  count: number;
  error?: { code: string; message: string };
}

function emit(args: RunDemoArgs, phase: IngestionEvent["phase"], ok: boolean, payload?: Record<string, unknown>): void {
  args.onEvent({
    userId: args.userId,
    source: args.source,
    phase,
    ts: new Date().toISOString(),
    ok,
    payload,
  });
}

function buildAdapter(source: RunDemoArgs["source"], mode: RunDemoArgs["mode"]): ProviderAdapter {
  if (source === "whoop") return new WhoopAdapter({ source: mode });
  if (source === "fhir") return new FhirAdapter({ source: mode });
  return new AppleHealthAdapter({ source: mode });
}

export async function runDemoIngestion(args: RunDemoArgs): Promise<RunDemoResult> {
  emit(args, "connect", true);

  const consented = await hasConsentForSource(args.userId, args.source);
  if (!consented) {
    emit(args, "error", false, { code: "NO_CONSENT", message: `consent missing for ${args.source}` });
    await recordIngestionAudit({ userId: args.userId, source: args.source, phase: "error", ok: false, summary: "ingestion blocked: no consent" });
    return { ok: false, count: 0, error: { code: "NO_CONSENT", message: "consent missing" } };
  }

  emit(args, "fetch", true);
  const adapter = buildAdapter(args.source, args.mode);
  const result = await adapter.fetchAndNormalize(args.userId);

  if (!result.ok) {
    emit(args, "error", false, { code: result.error.code, message: result.error.message });
    await recordIngestionAudit({ userId: args.userId, source: args.source, phase: "error", ok: false, summary: result.error.message });
    return { ok: false, count: 0, error: { code: result.error.code, message: result.error.message } };
  }

  emit(args, "validate", true, { count: result.biomarkers.length });

  const redacted: CanonicalBiomarker[] = redactPii(result.biomarkers);
  emit(args, "redact", true, { count: redacted.length });

  emit(args, "normalize", true, { count: redacted.length });

  const persisted = await persistRawBiomarkers(args.userId, redacted as unknown as Parameters<typeof persistRawBiomarkers>[1]);
  emit(args, "persist", true, { count: persisted });

  await recordIngestionAudit({ userId: args.userId, source: args.source, phase: "complete", ok: true, summary: `imported ${persisted} biomarkers from ${args.source}` });
  emit(args, "complete", true, { count: persisted });

  return { ok: true, count: persisted };
}
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- demo.service`
Expected: PASS, 3 tests.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/services/demo.service.ts apps/api/src/services/__tests__/demo.service.test.ts
git commit -m "feat(api): add runDemoIngestion orchestrator with phase events"
```

### Task 4.2 — SSE route + seed route

- [ ] **Step 1: Write the failing route test**

File: `/Users/rongibori/aissisted/apps/api/src/routes/__tests__/demo.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { demoRoutes } from "../demo";

describe("demoRoutes", () => {
  it("POST /demo/seed grants consents for all 10 demo users", async () => {
    const app = Fastify();
    await app.register(demoRoutes);
    const r = await app.inject({ method: "POST", url: "/demo/seed" });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body) as { data: { seeded: number } };
    expect(body.data.seeded).toBe(10);
  });

  it("GET /demo/run streams SSE events", async () => {
    const app = Fastify();
    await app.register(demoRoutes);
    const r = await app.inject({ method: "GET", url: "/demo/run?userId=demo-user-10&source=whoop" });
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-type"]).toContain("text/event-stream");
    expect(r.body).toContain("event: phase");
    expect(r.body).toContain("\"phase\":\"complete\"");
  });
});
```

- [ ] **Step 2: Implement routes**

File: `/Users/rongibori/aissisted/apps/api/src/routes/demo.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "@aissisted/db";
import { fixtures } from "@aissisted/schemas";
import { runDemoIngestion } from "../services/demo.service.js";

const RunQuery = z.object({
  userId: z.string().min(1),
  source: z.enum(["fhir", "whoop", "apple_health"]),
});

export async function demoRoutes(app: FastifyInstance) {
  /** POST /demo/seed — grant required consents for all DEMO_USERS (idempotent) */
  app.post("/demo/seed", async (_req, reply) => {
    let seeded = 0;
    for (const u of fixtures.DEMO_USERS) {
      for (const type of ["data_processing", "fhir_data_access", "hipaa_notice"]) {
        await db.insert(schema.consent).values({
          userId: u.id,
          type,
          grantedAt: new Date().toISOString(),
          revokedAt: null,
        }).onConflictDoNothing();
      }
      seeded++;
    }
    reply.send({ data: { seeded } });
  });

  /** GET /demo/run?userId=...&source=... — SSE stream of ingestion phase events */
  app.get("/demo/run", async (request, reply) => {
    const parsed = RunQuery.safeParse(request.query);
    if (!parsed.success) {
      reply.status(400).send({ error: { message: "invalid query", issues: parsed.error.issues } });
      return;
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await runDemoIngestion({
      userId: parsed.data.userId,
      source: parsed.data.source,
      mode: "fixture",
      onEvent: (e) => send("phase", e),
    });

    send("done", { ok: true });
    reply.raw.end();
  });
}
```

- [ ] **Step 3: Register the routes**

Modify `/Users/rongibori/aissisted/apps/api/src/index.ts` — add registration alongside other route registrations:

```typescript
import { demoRoutes } from "./routes/demo.js";
// ...
await app.register(demoRoutes, { prefix: "/api" });
```

(Locate the existing `app.register(...)` block for `integrationsRoutes` and add the new line beside it.)

- [ ] **Step 4: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/api && pnpm test -- demo`
Expected: PASS, 2 route tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/demo.ts apps/api/src/routes/__tests__/demo.test.ts apps/api/src/index.ts
git commit -m "feat(api): add /api/demo/seed and /api/demo/run SSE routes"
```

### Phase 4 Success Criteria

- `POST /api/demo/seed` grants the three required consents for all 10 demo users; running it twice does not error.
- `GET /api/demo/run?userId=demo-user-02&source=whoop` returns `text/event-stream` and emits 7 phase events ending with `complete`.
- Hitting `/api/demo/run` with `userId=nonexistent-user` emits `error` and the response still ends cleanly (no hung connection).

---

## Phase 5 — Visual Neural AI Interface

**Outcome:** A new Next.js page `/demo` renders an SVG graph: three outer nodes (MyChart/Epic, WHOOP, Apple Health) with animated edges flowing into a central "Jeffrey" node. Each outer node has six visual states (idle, connecting, fetching, validating, redacting, persisting, complete, error) that map directly to the SSE event stream from Phase 4. Below the graph, a per-user picker lets the operator select any of the 10 demo users, and a side panel shows the live event log + final biomarker count.

**Files:**
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/page.tsx`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/NeuralGraph.tsx`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/EventLog.tsx`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/UserPicker.tsx`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/useDemoStream.ts`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/types.ts`
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/__tests__/useDemoStream.test.ts`

### Task 5.1 — Shared types & SSE hook (TDD)

- [ ] **Step 1: Write the failing test**

File: `/Users/rongibori/aissisted/apps/web/app/demo/__tests__/useDemoStream.test.ts`

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoStream } from "../useDemoStream";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {};
  readyState = 0;
  closed = false;
  constructor(url: string) { this.url = url; MockEventSource.instances.push(this); }
  addEventListener(type: string, fn: (e: MessageEvent) => void) {
    (this.listeners[type] ??= []).push(fn);
  }
  emit(type: string, data: unknown) {
    const e = new MessageEvent(type, { data: JSON.stringify(data) });
    (this.listeners[type] ?? []).forEach((fn) => fn(e));
  }
  close() { this.closed = true; }
}

beforeEach(() => {
  (globalThis as { EventSource?: unknown }).EventSource = MockEventSource;
  MockEventSource.instances = [];
});

afterEach(() => {
  delete (globalThis as { EventSource?: unknown }).EventSource;
});

describe("useDemoStream", () => {
  it("starts idle and tracks phase events per source", () => {
    const { result } = renderHook(() => useDemoStream());
    expect(result.current.statusBySource.whoop).toBe("idle");

    act(() => result.current.start({ userId: "u1", source: "whoop" }));
    const es = MockEventSource.instances[0];
    expect(es.url).toContain("userId=u1");
    expect(es.url).toContain("source=whoop");

    act(() => es.emit("phase", { source: "whoop", phase: "fetch", ok: true }));
    expect(result.current.statusBySource.whoop).toBe("fetch");

    act(() => es.emit("phase", { source: "whoop", phase: "complete", ok: true, payload: { count: 6 } }));
    expect(result.current.statusBySource.whoop).toBe("complete");
    expect(result.current.events.length).toBe(2);
  });

  it("transitions to error and closes the stream", () => {
    const { result } = renderHook(() => useDemoStream());
    act(() => result.current.start({ userId: "u1", source: "fhir" }));
    const es = MockEventSource.instances[0];
    act(() => es.emit("phase", { source: "fhir", phase: "error", ok: false, payload: { message: "boom" } }));
    expect(result.current.statusBySource.fhir).toBe("error");
  });
});
```

- [ ] **Step 2: Implement types**

File: `/Users/rongibori/aissisted/apps/web/app/demo/types.ts`

```typescript
export type DemoSource = "fhir" | "whoop" | "apple_health";
export type DemoPhase = "idle" | "connect" | "fetch" | "validate" | "redact" | "normalize" | "persist" | "complete" | "error";

export interface DemoEvent {
  userId: string;
  source: DemoSource;
  phase: Exclude<DemoPhase, "idle">;
  ts: string;
  ok: boolean;
  payload?: Record<string, unknown>;
}

export interface DemoUserSummary {
  id: string;
  displayName: string;
  archetype: string;
  narrative: string;
}
```

- [ ] **Step 3: Implement the hook**

File: `/Users/rongibori/aissisted/apps/web/app/demo/useDemoStream.ts`

```typescript
"use client";

import { useCallback, useRef, useState } from "react";
import type { DemoEvent, DemoPhase, DemoSource } from "./types";

const SOURCES: DemoSource[] = ["fhir", "whoop", "apple_health"];

interface StartArgs {
  userId: string;
  source: DemoSource;
}

interface StreamState {
  events: DemoEvent[];
  statusBySource: Record<DemoSource, DemoPhase>;
  isStreaming: boolean;
}

export function useDemoStream() {
  const initialStatus = SOURCES.reduce((acc, s) => ({ ...acc, [s]: "idle" as DemoPhase }), {} as Record<DemoSource, DemoPhase>);
  const [state, setState] = useState<StreamState>({ events: [], statusBySource: initialStatus, isStreaming: false });
  const sourcesRef = useRef<Map<DemoSource, EventSource>>(new Map());

  const reset = useCallback(() => {
    sourcesRef.current.forEach((es) => es.close());
    sourcesRef.current.clear();
    setState({ events: [], statusBySource: initialStatus, isStreaming: false });
  }, []);

  const start = useCallback((args: StartArgs) => {
    const url = `/api/demo/run?userId=${encodeURIComponent(args.userId)}&source=${args.source}`;
    const existing = sourcesRef.current.get(args.source);
    if (existing) existing.close();

    const es = new EventSource(url);
    sourcesRef.current.set(args.source, es);
    setState((prev) => ({ ...prev, isStreaming: true, statusBySource: { ...prev.statusBySource, [args.source]: "connect" } }));

    es.addEventListener("phase", (raw) => {
      const evt = JSON.parse((raw as MessageEvent).data) as DemoEvent;
      setState((prev) => ({
        ...prev,
        events: [...prev.events, evt],
        statusBySource: { ...prev.statusBySource, [evt.source]: evt.phase },
      }));
    });

    es.addEventListener("done", () => {
      es.close();
      sourcesRef.current.delete(args.source);
      setState((prev) => ({ ...prev, isStreaming: sourcesRef.current.size > 0 }));
    });

    es.onerror = () => {
      setState((prev) => ({ ...prev, statusBySource: { ...prev.statusBySource, [args.source]: "error" } }));
      es.close();
      sourcesRef.current.delete(args.source);
    };
  }, []);

  const startAll = useCallback((userId: string) => {
    for (const s of SOURCES) start({ userId, source: s });
  }, [start]);

  return { ...state, start, startAll, reset };
}
```

- [ ] **Step 4: Add testing-library deps**

Modify `/Users/rongibori/aissisted/apps/web/package.json` — add to devDependencies:

```json
{
  "devDependencies": {
    "vitest": "3.0.0",
    "jsdom": "25.0.0",
    "@testing-library/react": "16.0.0"
  }
}
```

Create `/Users/rongibori/aissisted/apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { globals: true, environment: "jsdom", isolate: true, reporter: "verbose" },
  resolve: { alias: { "@": path.resolve(__dirname, "./") }, extensions: [".ts", ".tsx", ".js"] },
});
```

Run: `cd /Users/rongibori/aissisted && pnpm install`
Expected: dependencies installed.

- [ ] **Step 5: Run tests**

Run: `cd /Users/rongibori/aissisted/apps/web && pnpm test -- useDemoStream`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/demo/types.ts apps/web/app/demo/useDemoStream.ts apps/web/app/demo/__tests__/useDemoStream.test.ts apps/web/vitest.config.ts apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add useDemoStream hook with SSE phase tracking"
```

### Task 5.2 — Neural graph SVG component

- [ ] **Step 1: Implement NeuralGraph**

File: `/Users/rongibori/aissisted/apps/web/app/demo/NeuralGraph.tsx`

```tsx
"use client";

import type { DemoPhase, DemoSource } from "./types";

interface Props {
  statusBySource: Record<DemoSource, DemoPhase>;
}

const NODES: { source: DemoSource; label: string; angleDeg: number }[] = [
  { source: "fhir",         label: "MyChart / Epic", angleDeg: 210 },
  { source: "whoop",        label: "WHOOP",          angleDeg: 330 },
  { source: "apple_health", label: "Apple Health",   angleDeg: 90 },
];

const PHASE_COLORS: Record<DemoPhase, string> = {
  idle:      "#3a3a44",
  connect:   "#4f6bff",
  fetch:     "#4f9bff",
  validate:  "#4fcfff",
  redact:    "#cc7aff",
  normalize: "#ffce4f",
  persist:   "#7aff8e",
  complete:  "#2ecf6d",
  error:     "#ff5161",
};

const PHASE_LABEL: Record<DemoPhase, string> = {
  idle: "Idle", connect: "Connecting", fetch: "Fetching", validate: "Validating",
  redact: "Redacting PII", normalize: "Normalizing", persist: "Persisting",
  complete: "Complete", error: "Error",
};

export function NeuralGraph({ statusBySource }: Props) {
  const cx = 300, cy = 240, r = 170;
  return (
    <svg viewBox="0 0 600 480" role="img" aria-label="Neural data flow visualization" className="w-full h-auto">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7e90ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1a1d2c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r="120" fill="url(#coreGlow)" />
      <circle cx={cx} cy={cy} r="44" fill="#1a1d2c" stroke="#7e90ff" strokeWidth="2" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="#e8eaff" fontSize="16" fontWeight="600">Jeffrey</text>

      {NODES.map((n) => {
        const rad = (n.angleDeg * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        const phase = statusBySource[n.source];
        const color = PHASE_COLORS[phase];
        const animating = phase !== "idle" && phase !== "complete" && phase !== "error";
        return (
          <g key={n.source}>
            <line x1={nx} y1={ny} x2={cx} y2={cy} stroke={color} strokeWidth="2" strokeOpacity={animating ? 0.9 : 0.3}
                  strokeDasharray={animating ? "6 4" : undefined}>
              {animating && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite" />}
            </line>
            <circle cx={nx} cy={ny} r="34" fill="#1a1d2c" stroke={color} strokeWidth="2.5" />
            <circle cx={nx} cy={ny} r="34" fill="none" stroke={color} strokeOpacity="0.4">
              {animating && <animate attributeName="r" from="34" to="48" dur="1.2s" repeatCount="indefinite" />}
              {animating && <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.2s" repeatCount="indefinite" />}
            </circle>
            <text x={nx} y={ny + 5} textAnchor="middle" fill="#e8eaff" fontSize="11" fontWeight="600">{n.label}</text>
            <text x={nx} y={ny + 60} textAnchor="middle" fill={color} fontSize="11">{PHASE_LABEL[phase]}</text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/demo/NeuralGraph.tsx
git commit -m "feat(web): add NeuralGraph SVG with per-source phase animation"
```

### Task 5.3 — User picker, event log, page

- [ ] **Step 1: Implement UserPicker**

File: `/Users/rongibori/aissisted/apps/web/app/demo/UserPicker.tsx`

```tsx
"use client";

import type { DemoUserSummary } from "./types";

interface Props {
  users: DemoUserSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function UserPicker({ users, selectedId, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(u.id)}
          className={`text-left p-3 rounded-lg border transition ${
            selectedId === u.id
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-white/10 hover:border-white/30"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <div className="text-xs uppercase tracking-wide text-indigo-300">{u.archetype}</div>
          <div className="text-sm font-semibold text-white">{u.displayName}</div>
          <div className="text-xs text-white/60 mt-1 line-clamp-2">{u.narrative}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement EventLog**

File: `/Users/rongibori/aissisted/apps/web/app/demo/EventLog.tsx`

```tsx
"use client";

import type { DemoEvent } from "./types";

interface Props { events: DemoEvent[]; }

const PHASE_BADGE: Record<DemoEvent["phase"], string> = {
  connect: "bg-blue-500/20 text-blue-200",
  fetch: "bg-sky-500/20 text-sky-200",
  validate: "bg-cyan-500/20 text-cyan-200",
  redact: "bg-fuchsia-500/20 text-fuchsia-200",
  normalize: "bg-amber-500/20 text-amber-200",
  persist: "bg-emerald-500/20 text-emerald-200",
  complete: "bg-emerald-600/30 text-emerald-100 font-semibold",
  error: "bg-rose-600/30 text-rose-100 font-semibold",
};

export function EventLog({ events }: Props) {
  if (events.length === 0) {
    return <div className="text-sm text-white/40 italic">No events yet — pick a user and start the demo.</div>;
  }
  return (
    <ol className="space-y-1 text-xs font-mono max-h-[420px] overflow-y-auto">
      {events.map((e, i) => (
        <li key={`${e.ts}-${i}`} className="flex items-start gap-2 px-2 py-1 rounded bg-white/5">
          <span className="text-white/40 shrink-0">{e.ts.slice(11, 19)}</span>
          <span className="text-white/60 shrink-0 w-24">{e.source}</span>
          <span className={`shrink-0 px-1.5 rounded ${PHASE_BADGE[e.phase]}`}>{e.phase}</span>
          {e.payload && <span className="text-white/50 truncate">{JSON.stringify(e.payload)}</span>}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Implement page**

File: `/Users/rongibori/aissisted/apps/web/app/demo/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { NeuralGraph } from "./NeuralGraph";
import { EventLog } from "./EventLog";
import { UserPicker } from "./UserPicker";
import { useDemoStream } from "./useDemoStream";
import type { DemoUserSummary } from "./types";

const DEMO_USERS: DemoUserSummary[] = [
  { id: "demo-user-01", displayName: "Avery K.", archetype: "high-cholesterol-responder", narrative: "LDL trending up; recent statin start; recovery normal." },
  { id: "demo-user-02", displayName: "Brett M.", archetype: "athletic-over-trainer",      narrative: "High strain, low recovery, elevated resting HR." },
  { id: "demo-user-03", displayName: "Cora P.",  archetype: "post-covid-recovery",        narrative: "Reduced HRV, elevated respiratory rate, fatigue." },
  { id: "demo-user-04", displayName: "Dev R.",   archetype: "metabolic-risk",             narrative: "Elevated HbA1c, fasting glucose; sedentary." },
  { id: "demo-user-05", displayName: "Eliza S.", archetype: "thyroid-imbalance",          narrative: "TSH elevated; cold intolerance; low energy." },
  { id: "demo-user-06", displayName: "Finn T.",  archetype: "sleep-deprived-exec",        narrative: "Sleep efficiency <80%; high strain weekdays." },
  { id: "demo-user-07", displayName: "Gita V.",  archetype: "vitamin-d-deficient",        narrative: "Vitamin D <20 ng/mL; mood/sleep concerns." },
  { id: "demo-user-08", displayName: "Hugo W.",  archetype: "hypertension-controlled",    narrative: "Borderline BP, on medication; normal sleep/HRV." },
  { id: "demo-user-09", displayName: "Iris X.",  archetype: "perimenopause",              narrative: "Disrupted sleep, hot flashes, HRV variability." },
  { id: "demo-user-10", displayName: "Jaden Y.", archetype: "healthy-baseline",           narrative: "All biomarkers in normal range — control case." },
];

export default function DemoPage() {
  const [selectedId, setSelectedId] = useState(DEMO_USERS[0].id);
  const stream = useDemoStream();

  async function handleSeed() {
    await fetch("/api/demo/seed", { method: "POST" });
  }

  function handleRun() {
    stream.reset();
    stream.startAll(selectedId);
  }

  return (
    <main className="min-h-screen bg-[#0c0d18] text-white p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Aissisted — Live Data Demo</h1>
        <p className="text-white/60 text-sm">Watch validated, redacted, consented data flow into Jeffrey from MyChart, WHOOP, and Apple Health.</p>
      </header>

      <section className="mb-6">
        <UserPicker users={DEMO_USERS} selectedId={selectedId} onSelect={setSelectedId} disabled={stream.isStreaming} />
      </section>

      <section className="flex gap-3 mb-6">
        <button onClick={handleSeed} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Seed consents</button>
        <button onClick={handleRun} disabled={stream.isStreaming}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-sm font-semibold">
          {stream.isStreaming ? "Streaming…" : "Start ingestion"}
        </button>
        <button onClick={stream.reset} disabled={stream.isStreaming}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-sm">Reset</button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="rounded-xl bg-[#11132099] border border-white/5 p-4">
          <NeuralGraph statusBySource={stream.statusBySource} />
        </div>
        <div className="rounded-xl bg-[#11132099] border border-white/5 p-4">
          <h2 className="text-sm font-semibold mb-2 text-white/80">Event log</h2>
          <EventLog events={stream.events} />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Manual smoke test**

Run, in two terminals:

```bash
# terminal 1
cd /Users/rongibori/aissisted/apps/api && pnpm dev

# terminal 2
cd /Users/rongibori/aissisted/apps/web && pnpm dev
```

Open: `http://localhost:3000/demo`
Expected:
- Page renders with neural graph (3 outer nodes around central Jeffrey).
- Click "Seed consents" → button completes silently.
- Pick a user → click "Start ingestion" → all three nodes animate through phases and end on green "Complete".
- Event log shows ≥21 phase events (7 phases × 3 sources).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/demo/UserPicker.tsx apps/web/app/demo/EventLog.tsx apps/web/app/demo/page.tsx
git commit -m "feat(web): add /demo page wiring graph, picker, event log, and SSE stream"
```

### Phase 5 Success Criteria

- `/demo` renders without runtime errors.
- All three nodes animate through 7 phases when "Start ingestion" is clicked.
- Selecting a different user resets state and re-runs cleanly.
- An adapter throwing `SCHEMA_INVALID` (manually triggered with a synthetic bad userId) renders the offending node in red with phase "Error" and never blocks the other two nodes.
- `pnpm --filter @aissisted/web test` passes.

---

## Phase 6 — End-to-End Tests

**Outcome:** A Playwright e2e test boots both apps, hits the demo page, runs the full ingestion for a user, and asserts the final UI state. This is the regression net for the demo.

**Files:**
- Create: `/Users/rongibori/aissisted/apps/web/playwright.config.ts`
- Create: `/Users/rongibori/aissisted/apps/web/e2e/demo.spec.ts`
- Modify: `/Users/rongibori/aissisted/apps/web/package.json` (add Playwright deps + script)

### Task 6.1 — Add Playwright

- [ ] **Step 1: Install Playwright**

Run:

```bash
cd /Users/rongibori/aissisted/apps/web
pnpm add -D @playwright/test@1.48.0
pnpm exec playwright install --with-deps chromium
```

Expected: Chromium browser installed.

- [ ] **Step 2: Add config**

File: `/Users/rongibori/aissisted/apps/web/playwright.config.ts`

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: [
    { command: "pnpm --filter @aissisted/api dev", port: 4000, reuseExistingServer: !process.env.CI, timeout: 60_000 },
    { command: "pnpm --filter @aissisted/web dev", port: 3000, reuseExistingServer: !process.env.CI, timeout: 60_000 },
  ],
});
```

- [ ] **Step 3: Write the e2e test**

File: `/Users/rongibori/aissisted/apps/web/e2e/demo.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("/demo live ingestion", () => {
  test("full flow for demo-user-02 reaches Complete on all three sources", async ({ page }) => {
    await page.goto("/demo");

    await page.getByRole("button", { name: /seed consents/i }).click();

    await page.getByRole("button", { name: /Brett M\./i }).click();

    await page.getByRole("button", { name: /start ingestion/i }).click();

    await expect(page.getByText("Complete", { exact: false }).nth(0)).toBeVisible({ timeout: 30_000 });

    const completeBadges = page.locator("text=complete");
    await expect(completeBadges).toHaveCount(3, { timeout: 30_000 });
  });

  test("denied consent shows error state without seeding", async ({ page, request }) => {
    await request.post("http://localhost:4000/api/demo/seed");

    await page.goto("/demo");
    await page.getByRole("button", { name: /Avery K\./i }).click();
    await page.getByRole("button", { name: /start ingestion/i }).click();

    await expect(page.getByText("Complete", { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });
});
```

- [ ] **Step 4: Add npm script**

Modify `/Users/rongibori/aissisted/apps/web/package.json` — add to scripts:

```json
{
  "scripts": {
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Run e2e**

Run: `cd /Users/rongibori/aissisted/apps/web && pnpm e2e`
Expected: 2 tests pass, ~45 s total.

- [ ] **Step 6: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/demo.spec.ts apps/web/package.json pnpm-lock.yaml
git commit -m "test(e2e): add Playwright e2e for /demo ingestion flow"
```

### Phase 6 Success Criteria

- `pnpm --filter @aissisted/web e2e` passes locally.
- The first test verifies all three sources reach `complete`.
- The second test verifies the seed endpoint and end-to-end flow for a second user.

---

## Phase 7 — Privacy Review & Demo Polish

**Outcome:** A privacy review checklist confirms PII is never written to logs, browser console, or persisted summaries. A README block in `apps/web/app/demo/README.md` documents how to run the demo and what each phase of the visualization means.

**Files:**
- Create: `/Users/rongibori/aissisted/apps/web/app/demo/README.md`
- Create: `/Users/rongibori/aissisted/docs/specs/LIVE_DEMO_PRIVACY_CHECKLIST.md`

### Task 7.1 — Privacy checklist

- [ ] **Step 1: Write the checklist**

File: `/Users/rongibori/aissisted/docs/specs/LIVE_DEMO_PRIVACY_CHECKLIST.md`

```markdown
# Live Demo Privacy Checklist

Confirm before any external demo:

- [ ] `redactPii` covers every code path that logs payloads (search: `app.log.info(`, `console.log(`, `console.error(`).
- [ ] `IngestionEvent.payload` is bounded — only `{ count }` or `{ code, message }` shapes; never raw biomarker bodies.
- [ ] SSE responses contain no email, phone, SSN, or MRN strings (verified via `curl /api/demo/run | grep -E '\S+@\S+|\d{3}-\d{2}-\d{4}'` — must return empty).
- [ ] `recordIngestionAudit` is the only path that writes summaries; `summary` strings are run through `redactPii` (line audit.ts:N).
- [ ] Demo users have synthetic names with no real PHI (verified via `git log -p packages/schemas/src/fixtures/users.ts`).
- [ ] `DEMO_MODE=true` is set in any environment that exposes `/api/demo/*` publicly; the routes are blocked behind an env check otherwise.
- [ ] Browser DevTools Network tab on `/demo` shows event-stream payloads containing only `{ phase, source, ok, payload: { count } }` — never raw values.
- [ ] No console.log statements in `apps/web/app/demo/`.
```

- [ ] **Step 2: Add a CI grep guard**

Modify `/Users/rongibori/aissisted/turbo.json` — add a new task:

```json
{
  "tasks": {
    "privacy:scan": {
      "cache": false,
      "outputs": []
    }
  }
}
```

Create `/Users/rongibori/aissisted/scripts/privacy-scan.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Scanning for raw PII patterns in demo code paths…"

if grep -rE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' apps/web/app/demo apps/api/src/routes/demo.ts apps/api/src/services/demo.service.ts; then
  echo "ERROR: email-like string found in demo code"; exit 1
fi
if grep -rE '\b\d{3}-\d{2}-\d{4}\b' apps/web/app/demo apps/api/src/routes/demo.ts apps/api/src/services/demo.service.ts; then
  echo "ERROR: SSN-like sequence found in demo code"; exit 1
fi

echo "OK"
```

Run: `chmod +x scripts/privacy-scan.sh && ./scripts/privacy-scan.sh`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/LIVE_DEMO_PRIVACY_CHECKLIST.md scripts/privacy-scan.sh turbo.json
git commit -m "docs+script: add live demo privacy checklist and scan"
```

### Task 7.2 — Demo README

- [ ] **Step 1: Write the README**

File: `/Users/rongibori/aissisted/apps/web/app/demo/README.md`

```markdown
# /demo — Live Data Flow Visualization

What it shows: validated, consented, redacted health data flowing from MyChart/Epic, WHOOP, and Apple Health into Jeffrey, with each phase animated as the data moves.

## Run locally

```
pnpm --filter @aissisted/api dev
pnpm --filter @aissisted/web dev
# in another terminal, seed consents once:
curl -X POST http://localhost:4000/api/demo/seed
# then visit http://localhost:3000/demo
```

## Phases

| Phase     | Color   | Meaning                                           |
| --------- | ------- | ------------------------------------------------- |
| connect   | blue    | Establishing adapter session                      |
| fetch     | sky     | Pulling raw payload (fixture in demo mode)        |
| validate  | cyan    | Zod schema validation against provider contract   |
| redact    | fuchsia | PII removal pass (email/phone/SSN/MRN)            |
| normalize | amber   | Provider → CanonicalBiomarker mapping             |
| persist   | green   | Insert into raw_biomarkers / observations table   |
| complete  | green   | Phase finished cleanly                            |
| error     | red     | Adapter or schema failure — see event log payload |

## Switching to live mode

Set `DEMO_MODE=false` and provide real OAuth tokens via `/integrations/whoop/connect` and `/integrations/fhir/connect`. The adapters fall through to live `fetchRaw` / `fetchBundle` calls instead of fixtures. Apple Health requires the user to upload `export.xml` via `/integrations/apple-health/upload`.
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/demo/README.md
git commit -m "docs(demo): explain phases and live-mode switching"
```

### Phase 7 Success Criteria

- `./scripts/privacy-scan.sh` exits 0.
- Privacy checklist is checked off before any external demo.
- README documents both demo and live modes.

---

## Final Verification

- [ ] **Step 1: Run all tests**

Run: `cd /Users/rongibori/aissisted && pnpm -w turbo run test`
Expected: All workspaces' tests pass.

- [ ] **Step 2: Run all typecheck**

Run: `cd /Users/rongibori/aissisted && pnpm -w turbo run typecheck`
Expected: All workspaces' typecheck passes.

- [ ] **Step 3: Run e2e**

Run: `cd /Users/rongibori/aissisted/apps/web && pnpm e2e`
Expected: Playwright tests pass.

- [ ] **Step 4: Run privacy scan**

Run: `cd /Users/rongibori/aissisted && ./scripts/privacy-scan.sh`
Expected: `OK`.

- [ ] **Step 5: Manual demo dry-run**

1. Start API + web (`pnpm dev` in each).
2. `curl -X POST http://localhost:4000/api/demo/seed`
3. Visit `http://localhost:3000/demo`.
4. For each of the 10 users: click → Start ingestion → verify all 3 nodes reach Complete with no console errors.
5. Verify event-log payloads contain only `{ count: N }` shapes — no raw values.

- [ ] **Step 6: Push branch and open PR**

```bash
git push -u origin feat/live-demo
gh pr create --title "feat: live demo with validated FHIR/WHOOP/Apple Health flows" \
  --body "$(cat <<'EOF'
## Summary
- New @aissisted/schemas package: Zod schemas + 10-user fixtures for FHIR, WHOOP, Apple Health, plus canonical biomarker schema
- Rewrote three integration adapters with schema validation, fixture/live modes, AdapterResult error union
- Added privacy layer: PII redactor, consent gate, audit logger
- Added /api/demo/seed and /api/demo/run SSE routes
- Added /demo Next.js page with neural-graph SVG visualization, user picker, event log
- Added Playwright e2e and privacy-scan script

## Test plan
- [ ] pnpm -w turbo run test passes
- [ ] pnpm -w turbo run typecheck passes
- [ ] pnpm --filter @aissisted/web e2e passes
- [ ] ./scripts/privacy-scan.sh exits 0
- [ ] Manual dry-run of all 10 users at /demo
EOF
)"
```

---

## Top-Level Success Criteria

1. **Schema validation:** Every provider payload (real or fixture) passes through a Zod schema before any normalization or persistence; `SCHEMA_INVALID` errors surface to the UI instead of silently corrupting data.
2. **Mocked test data for 10 users:** `fixtures.DEMO_USERS` has 10 distinct archetypes; every fixture parses through its provider schema in CI.
3. **Interactive UI states:** `/demo` visualizes 8 phases (idle + 7 active) per source with distinct colors and animation.
4. **Data ingestion flows:** `runDemoIngestion` orchestrates connect → fetch → validate → redact → normalize → persist → audit, with each phase observable.
5. **Error states:** `AUTH_REQUIRED`, `RATE_LIMITED`, `SCHEMA_INVALID`, `NETWORK_ERROR`, `NO_CONSENT` all reach the UI as red `error` phase events with code + message.
6. **Privacy checks:** Consent gate blocks ingestion without consent; PII redactor masks email/phone/SSN/MRN in logs and audit summaries; privacy-scan script blocks any regression.
7. **Automated tests:** Vitest unit/integration tests across `@aissisted/schemas`, `@aissisted/integrations`, `@aissisted/api`, `@aissisted/web`; Playwright e2e for the full flow.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| FHIR Bundle from real Epic differs from our schema (vendor extensions) | `safeParse` returns issue list; UI shows `SCHEMA_INVALID` with first 3 issue paths so we can iterate without code rollback |
| WHOOP API rate-limits during a live demo | Adapter has `RATE_LIMITED` error code; UI degrades to fixture mode if `DEMO_FALLBACK_ON_RATE_LIMIT=true` (env-controlled) |
| Apple Health export.xml is multi-MB and times out the SSE | We only ingest summaries (counts) over SSE; large payloads stay server-side; existing `/integrations/apple-health/upload` already caps at 2 MB |
| `auditLog` table doesn't exist yet | Phase 3 task 3.3 includes the schema addition + migration step |
| Animations cause performance issues on Safari | SVG `<animate>` elements are GPU-accelerated; if needed, reduce-motion media query falls back to static colors (defer until perf bug observed) |
| SSE connection survives navigation away from page | `useDemoStream.reset()` runs on unmount; `EventSource.close()` is called in cleanup |
| Demo routes become public on staging | Routes guarded by `if (process.env.DEMO_MODE !== "true") return reply.status(404).send()` — add to `demoRoutes` registration in apps/api/src/index.ts |
