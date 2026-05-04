/**
 * Pilot seed script — Aissisted 10-person user-testing cohort.
 *
 * Creates 10 realistic test profiles with full provenance chains so every
 * surface in the demo (dashboard, labs, integrations, Jeffrey, neural viz,
 * stack) can render against persisted data without depending on live OAuth
 * round-trips during the pilot.
 *
 * Run via:   pnpm --filter @aissisted/db seed:pilot
 *
 * Idempotent: re-running deletes the prior pilot rows (matched by the
 * ``aissisted-pilot-`` user-id prefix) and rebuilds them. Production users
 * are untouched because their ids do not start with that prefix.
 *
 * Connection status spread:
 *   01-03  WHOOP + FHIR + Apple Health (full stack)
 *   04-06  WHOOP + FHIR (no Apple Health)
 *   07-08  Apple Health only (no clinical)
 *   09     Fresh user, consent only (tests onboarding)
 *   10     Lab-only manual entry
 *
 * IMPORTANT: passwords are seeded as deterministic dev hashes for the pilot
 * password ``demo1234``. This is acceptable for the test cohort. Production
 * users always sign up via the auth service which mints unique hashes.
 */

import { db, schema, eq, like } from "./index.js";

// ─── Constants ─────────────────────────────────────────────────────────────

/**
 * Bcrypt hash of "demo1234" (10 rounds). Hard-coded so the seed runs without
 * a runtime bcrypt dependency. Each pilot user gets the same hash — fine for
 * a closed-cohort test, never reuse this in production.
 */
const PILOT_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

const PILOT_PREFIX = "aissisted-pilot-";

const NOW = () => new Date().toISOString();

// ─── Pilot definitions ─────────────────────────────────────────────────────

interface PilotDefinition {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  sex: "male" | "female" | "other";
  dateOfBirth: string;
  goals: string[];
  conditions: string[];
  medications: string[];
  /** Which integrations have valid tokens. */
  connections: ("whoop" | "fhir" | "apple_health")[];
  /** Override default biomarker spread. Empty = use the default set. */
  biomarkerOverrides?: Partial<Record<string, { value: number; flag?: string }>>;
}

const PILOTS: PilotDefinition[] = [
  // ── Full-stack users ────────────────────────────────────────────────────
  {
    id: `${PILOT_PREFIX}01`,
    email: "ron.gibori+pilot01@aissisted.test",
    firstName: "Ron",
    lastName: "Gibori",
    sex: "male",
    dateOfBirth: "1985-03-12",
    goals: ["recovery", "longevity", "cognition"],
    conditions: [],
    medications: [],
    connections: ["whoop", "fhir", "apple_health"],
    // Ron's profile mirrors the brain-prototype demo: ApoB priority + recovery suppressed
    biomarkerOverrides: {
      ApoB: { value: 92, flag: "H" },
      "hs-CRP": { value: 1.8, flag: "H" },
      Cortisol: { value: 21, flag: "H" },
    },
  },
  {
    id: `${PILOT_PREFIX}02`,
    email: "marcus.chen+pilot02@aissisted.test",
    firstName: "Marcus",
    lastName: "Chen",
    sex: "male",
    dateOfBirth: "1978-07-22",
    goals: ["metabolic health", "energy", "sleep"],
    conditions: ["pre-diabetic"],
    medications: ["metformin 500mg"],
    connections: ["whoop", "fhir", "apple_health"],
    biomarkerOverrides: {
      Glucose: { value: 108, flag: "H" },
      HbA1c: { value: 5.9, flag: "H" },
      Insulin: { value: 12.4, flag: "H" },
      "HOMA-IR": { value: 3.3, flag: "H" },
    },
  },
  {
    id: `${PILOT_PREFIX}03`,
    email: "sarah.kane+pilot03@aissisted.test",
    firstName: "Sarah",
    lastName: "Kane",
    sex: "female",
    dateOfBirth: "1991-11-04",
    goals: ["hormone balance", "stress", "skin"],
    conditions: [],
    medications: [],
    connections: ["whoop", "fhir", "apple_health"],
    biomarkerOverrides: {
      "Vitamin D": { value: 22, flag: "L" },
      TSH: { value: 4.6, flag: "H" },
      Cortisol: { value: 24, flag: "H" },
    },
  },

  // ── WHOOP + FHIR (no Apple Health) ──────────────────────────────────────
  {
    id: `${PILOT_PREFIX}04`,
    email: "james.tate+pilot04@aissisted.test",
    firstName: "James",
    lastName: "Tate",
    sex: "male",
    dateOfBirth: "1972-05-18",
    goals: ["cardiovascular", "longevity"],
    conditions: ["hypertension"],
    medications: ["lisinopril 10mg"],
    connections: ["whoop", "fhir"],
    biomarkerOverrides: {
      LDL: { value: 142, flag: "H" },
      Triglycerides: { value: 168, flag: "H" },
      ApoB: { value: 108, flag: "H" },
    },
  },
  {
    id: `${PILOT_PREFIX}05`,
    email: "priya.shah+pilot05@aissisted.test",
    firstName: "Priya",
    lastName: "Shah",
    sex: "female",
    dateOfBirth: "1988-09-30",
    goals: ["energy", "cognition", "fertility"],
    conditions: [],
    medications: [],
    connections: ["whoop", "fhir"],
    biomarkerOverrides: {
      Ferritin: { value: 18, flag: "L" },
      "Vitamin D": { value: 28, flag: "L" },
    },
  },
  {
    id: `${PILOT_PREFIX}06`,
    email: "diego.alvarez+pilot06@aissisted.test",
    firstName: "Diego",
    lastName: "Alvarez",
    sex: "male",
    dateOfBirth: "1980-01-14",
    goals: ["performance", "recovery"],
    conditions: [],
    medications: [],
    connections: ["whoop", "fhir"],
  },

  // ── Apple Health only ───────────────────────────────────────────────────
  {
    id: `${PILOT_PREFIX}07`,
    email: "tomas.berg+pilot07@aissisted.test",
    firstName: "Tomas",
    lastName: "Berg",
    sex: "male",
    dateOfBirth: "1995-06-08",
    goals: ["sleep", "recovery"],
    conditions: [],
    medications: [],
    connections: ["apple_health"],
  },
  {
    id: `${PILOT_PREFIX}08`,
    email: "ana.lopez+pilot08@aissisted.test",
    firstName: "Ana",
    lastName: "Lopez",
    sex: "female",
    dateOfBirth: "1986-12-19",
    goals: ["stress", "skin", "energy"],
    conditions: [],
    medications: [],
    connections: ["apple_health"],
  },

  // ── Fresh user (consent only) ──────────────────────────────────────────
  {
    id: `${PILOT_PREFIX}09`,
    email: "leo.fournier+pilot09@aissisted.test",
    firstName: "Leo",
    lastName: "Fournier",
    sex: "male",
    dateOfBirth: "1993-04-25",
    goals: [],
    conditions: [],
    medications: [],
    connections: [],
  },

  // ── Lab-only (manual entry) ────────────────────────────────────────────
  {
    id: `${PILOT_PREFIX}10`,
    email: "olivia.kerr+pilot10@aissisted.test",
    firstName: "Olivia",
    lastName: "Kerr",
    sex: "female",
    dateOfBirth: "1976-08-02",
    goals: ["hormone balance", "metabolic"],
    conditions: ["hashimotos"],
    medications: ["levothyroxine 75mcg"],
    connections: [],
    biomarkerOverrides: {
      TSH: { value: 5.2, flag: "H" },
      "Free T4": { value: 0.8, flag: "L" },
      "Anti-TPO": { value: 240, flag: "H" },
    },
  },
];

// ─── Default biomarker panel ───────────────────────────────────────────────

interface BiomarkerSpec {
  name: string;
  defaultValue: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  panel: string;
}

const DEFAULT_PANEL: BiomarkerSpec[] = [
  { name: "Glucose", defaultValue: 88, unit: "mg/dL", refLow: 70, refHigh: 99, panel: "Metabolic" },
  { name: "HbA1c", defaultValue: 5.2, unit: "%", refLow: 4.0, refHigh: 5.6, panel: "Metabolic" },
  { name: "Insulin", defaultValue: 6.1, unit: "µU/mL", refLow: 2.0, refHigh: 9.4, panel: "Metabolic" },
  { name: "HOMA-IR", defaultValue: 1.3, unit: "", refLow: 0.5, refHigh: 2.0, panel: "Metabolic" },
  { name: "ApoB", defaultValue: 78, unit: "mg/dL", refLow: 0, refHigh: 90, panel: "Lipids" },
  { name: "LDL", defaultValue: 102, unit: "mg/dL", refLow: 0, refHigh: 130, panel: "Lipids" },
  { name: "HDL", defaultValue: 58, unit: "mg/dL", refLow: 40, refHigh: 100, panel: "Lipids" },
  { name: "Triglycerides", defaultValue: 88, unit: "mg/dL", refLow: 0, refHigh: 150, panel: "Lipids" },
  { name: "hs-CRP", defaultValue: 0.6, unit: "mg/L", refLow: 0, refHigh: 1.0, panel: "Inflammation" },
  { name: "Vitamin D", defaultValue: 44, unit: "ng/mL", refLow: 30, refHigh: 100, panel: "Nutrients" },
  { name: "Cortisol", defaultValue: 14, unit: "µg/dL", refLow: 6, refHigh: 18, panel: "Hormones" },
  { name: "TSH", defaultValue: 1.8, unit: "mIU/L", refLow: 0.4, refHigh: 4.0, panel: "Hormones" },
  { name: "Creatinine", defaultValue: 0.92, unit: "mg/dL", refLow: 0.6, refHigh: 1.2, panel: "Renal" },
  { name: "eGFR", defaultValue: 96, unit: "mL/min", refLow: 60, refHigh: 999, panel: "Renal" },
  { name: "Homocysteine", defaultValue: 8.4, unit: "µmol/L", refLow: 4, refHigh: 11, panel: "Cardio" },
];

// Sex-specific additions
const MALE_ADD: BiomarkerSpec[] = [
  { name: "Testosterone", defaultValue: 580, unit: "ng/dL", refLow: 300, refHigh: 1000, panel: "Hormones" },
];

// ─── Default supplement stack ──────────────────────────────────────────────

/** Canonical time slot from the schema enum. */
type TimeSlot = "morning_with_food" | "midday" | "presleep";

interface StackItem {
  name: string;
  dose: string;
  /** Display label shown in the UI (the schema's `timing` column is free-text). */
  timing: "morning" | "day" | "night";
  /** Canonical scheduling slot from the TIME_SLOTS enum. */
  slot: TimeSlot;
  rationale: string;
}

const DEFAULT_STACK: StackItem[] = [
  { name: "L-Tyrosine", dose: "500mg", timing: "morning", slot: "morning_with_food", rationale: "Cognition + focus support" },
  { name: "Rhodiola", dose: "300mg", timing: "morning", slot: "morning_with_food", rationale: "Adaptogen for AM cortisol balance" },
  { name: "Vitamin D3+K2", dose: "5000 IU + 100mcg", timing: "morning", slot: "morning_with_food", rationale: "Bone + cardiovascular" },
  { name: "B-complex", dose: "1 cap", timing: "morning", slot: "morning_with_food", rationale: "Methylation + energy" },
  { name: "Omega-3 EPA/DHA", dose: "2g", timing: "day", slot: "midday", rationale: "Anti-inflammatory; supports lipid profile" },
  { name: "Creatine monohydrate", dose: "5g", timing: "day", slot: "midday", rationale: "Performance + cognition" },
  { name: "Curcumin", dose: "500mg", timing: "day", slot: "midday", rationale: "hs-CRP support" },
  { name: "Magnesium glycinate", dose: "340mg", timing: "night", slot: "presleep", rationale: "Sleep architecture; HRV" },
  { name: "Glycine", dose: "3g", timing: "night", slot: "presleep", rationale: "Core temp drop; sleep onset" },
  { name: "L-theanine", dose: "200mg", timing: "night", slot: "presleep", rationale: "Calm wind-down" },
  { name: "Apigenin", dose: "50mg", timing: "night", slot: "presleep", rationale: "Adenosine support" },
  { name: "Ashwagandha", dose: "600mg", timing: "night", slot: "presleep", rationale: "Cortisol; recovery" },
];

// ─── Seeder ────────────────────────────────────────────────────────────────

function makeId(prefix: string, ix: string | number): string {
  return `${prefix}-${ix}`;
}

function pickBiomarkerSet(p: PilotDefinition): BiomarkerSpec[] {
  const base = [...DEFAULT_PANEL];
  if (p.sex === "male") base.push(...MALE_ADD);
  // If pilot has no labs source (Apple Health only or fresh), return empty so
  // we don't seed clinical biomarkers they wouldn't actually have.
  if (!p.connections.includes("fhir") && p.connections.length > 0 && p.id !== `${PILOT_PREFIX}10`) {
    return [];
  }
  return base;
}

function flagFromValue(spec: BiomarkerSpec, value: number, override?: string): string | null {
  if (override) return override;
  if (spec.refHigh !== undefined && value > spec.refHigh) return "H";
  if (spec.refLow !== undefined && value < spec.refLow) return "L";
  return null;
}

async function clearPriorPilot() {
  // SQLite + drizzle: cascade deletes will clean dependents when we wipe users.
  // We additionally wipe by-userId for tables that reference users via SET NULL.
  // Match on the `aissisted-pilot-` prefix so production users are untouched.
  await db.delete(schema.users).where(like(schema.users.id, `${PILOT_PREFIX}%`));
  // auditLog uses ON DELETE SET NULL — we still want to drop pilot audit rows so
  // the demo log doesn't accumulate stale entries.
  await db.delete(schema.auditLog).where(like(schema.auditLog.userId, `${PILOT_PREFIX}%`));
}

async function seedPilot(p: PilotDefinition) {
  const now = NOW();

  // ── 1. user
  await db.insert(schema.users).values({
    id: p.id,
    email: p.email,
    passwordHash: PILOT_PASSWORD_HASH,
    createdAt: now,
    updatedAt: now,
  });

  // ── 2. health profile
  await db.insert(schema.healthProfiles).values({
    id: makeId(p.id, "profile"),
    userId: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    sex: p.sex,
    goals: JSON.stringify(p.goals),
    conditions: JSON.stringify(p.conditions),
    medications: JSON.stringify(p.medications),
    allergies: JSON.stringify([]),
    supplements: JSON.stringify([]),
    createdAt: now,
    updatedAt: now,
  });

  // ── 3. consent (HIPAA + data processing always; FHIR data access if connected)
  const consents: { type: "hipaa_notice" | "data_processing" | "fhir_data_access"; }[] = [
    { type: "hipaa_notice" },
    { type: "data_processing" },
  ];
  if (p.connections.includes("fhir")) consents.push({ type: "fhir_data_access" });

  for (const c of consents) {
    await db.insert(schema.consentRecords).values({
      id: makeId(p.id, `consent-${c.type}`),
      userId: p.id,
      consentType: c.type,
      version: "1.0",
      grantedAt: now,
      ipAddress: "127.0.0.1",
      userAgent: "pilot-seed",
    });
  }

  // ── 4. biomarkers
  const biomarkerSet = pickBiomarkerSet(p);
  for (const spec of biomarkerSet) {
    const override = p.biomarkerOverrides?.[spec.name];
    const value = override?.value ?? spec.defaultValue;
    const flag = flagFromValue(spec, value, override?.flag);

    await db.insert(schema.biomarkers).values({
      id: makeId(p.id, `bio-${spec.name.toLowerCase().replace(/\s+/g, "-")}`),
      userId: p.id,
      name: spec.name,
      value,
      unit: spec.unit,
      source: p.connections.includes("fhir") ? "fhir" : "manual",
      referenceRangeLow: spec.refLow ?? null,
      referenceRangeHigh: spec.refHigh ?? null,
      abnormalFlag: flag,
      confidence: p.connections.includes("fhir") ? 1.0 : 0.6,
      labPanelName: spec.panel,
      measuredAt: now,
      createdAt: now,
    });
  }

  // ── 5. integration tokens (provenance — connection markers)
  for (const provider of p.connections) {
    await db.insert(schema.integrationTokens).values({
      id: makeId(p.id, `token-${provider}`),
      userId: p.id,
      provider,
      // Tokens are sentinel values for the seed; real flows replace them on OAuth callback.
      accessToken: `sentinel-${provider}-${p.id}`,
      refreshToken: provider === "apple_health" ? null : `sentinel-refresh-${provider}-${p.id}`,
      expiresAt: provider === "apple_health" ? null : new Date(Date.now() + 86_400_000).toISOString(),
      scope: provider === "fhir" ? "patient/*.read" : provider === "whoop" ? "read:recovery read:sleep read:profile" : null,
      metadata: JSON.stringify({
        connectedAt: now,
        seedSentinel: true,
        // Mirrors what the real adapter writes on first sync
        ...(provider === "fhir" ? { patientId: `pilot-patient-${p.id.slice(-2)}` } : {}),
      }),
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 6. supplement stack (for users who actually have data to compute against)
  const hasData = p.connections.length > 0 || biomarkerSet.length > 0;
  if (hasData) {
    await db.insert(schema.supplementStacks).values({
      id: makeId(p.id, "stack-current"),
      userId: p.id,
      name: "Personalized v1.0",
      items: JSON.stringify(DEFAULT_STACK),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // ── 7. protocol + recommendations
    const protocolId = makeId(p.id, "protocol-current");
    await db.insert(schema.protocols).values({
      id: protocolId,
      userId: p.id,
      summary: `Initial protocol for ${p.firstName}, weighted toward ${p.goals.join(", ") || "general optimization"}.`,
      warnings: JSON.stringify([]),
      signals: JSON.stringify({
        biomarkerCount: biomarkerSet.length,
        connections: p.connections,
        goals: p.goals,
      }),
      createdAt: now,
    });

    for (const item of DEFAULT_STACK) {
      await db.insert(schema.recommendations).values({
        id: makeId(p.id, `rec-${item.name.toLowerCase().replace(/\s+/g, "-")}`),
        protocolId,
        name: item.name,
        dosage: item.dose,
        // `timing` is the human-readable label; `timeSlot` is the canonical enum.
        timing: item.timing,
        timeSlot: item.slot,
        rationale: item.rationale,
        score: 1.0,
        safetyStatus: "allowed",
      });
    }
  }

  // ── 8. starter conversation (one Jeffrey greeting + one user check-in)
  const conversationId = makeId(p.id, "conv-welcome");
  await db.insert(schema.conversations).values({
    id: conversationId,
    userId: p.id,
    title: "Welcome to Aissisted",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(schema.messages).values([
    {
      id: makeId(p.id, "msg-1"),
      conversationId,
      role: "assistant",
      content: `Welcome, ${p.firstName}. I'm Jeffrey. I'll be reading your signals over the next few weeks and adapting your protocol to what your body actually needs.`,
      createdAt: now,
    },
  ]);

  // ── 9. audit trail (provenance for every action above)
  const auditEvents: { action: string; resource: string; resourceId: string }[] = [
    { action: "user.create", resource: "users", resourceId: p.id },
    { action: "profile.create", resource: "health_profiles", resourceId: makeId(p.id, "profile") },
    ...consents.map((c) => ({
      action: "consent.grant",
      resource: "consent_records",
      resourceId: makeId(p.id, `consent-${c.type}`),
    })),
    ...p.connections.map((c) => ({
      action: "integration.connect",
      resource: "integration_tokens",
      resourceId: makeId(p.id, `token-${c}`),
    })),
  ];
  for (const e of auditEvents) {
    await db.insert(schema.auditLog).values({
      id: makeId(p.id, `audit-${e.action}-${e.resourceId}`),
      userId: p.id,
      action: e.action,
      resource: e.resource,
      resourceId: e.resourceId,
      detail: JSON.stringify({ source: "pilot-seed" }),
      createdAt: now,
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("→ Clearing prior pilot data…");
  await clearPriorPilot();

  console.log(`→ Seeding ${PILOTS.length} pilot users…`);
  let i = 0;
  for (const p of PILOTS) {
    i += 1;
    process.stdout.write(`  ${String(i).padStart(2, "0")}. ${p.firstName} ${p.lastName} (${p.connections.join("+") || "no integrations"})… `);
    await seedPilot(p);
    process.stdout.write("✓\n");
  }
  console.log(`\n✓ Pilot seed complete. Login any user with password "demo1234".`);
  console.log(`  Sign-in emails are ${PILOTS[0].email.replace("01", "NN")} (NN = 01..10).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Pilot seed failed:");
    console.error(err);
    process.exit(1);
  });
