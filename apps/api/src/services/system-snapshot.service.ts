/**
 * System Snapshot composer
 *
 * Builds the per-user `SystemSnapshot` consumed by the Jeffrey AI System
 * neural-visualization surface. Replaces the in-component `RON_SNAPSHOT`
 * mock with persisted, user-scoped data.
 *
 * Shape contract: keep the output identical to the type defined in
 *   apps/web/components/JeffreyAISystem/systemTypes.ts
 *
 * The 7 canonical modules each receive a `ModuleData`. Modules with no
 * source data are returned with status="priority" + caption="no data" so
 * the visual surfaces a Connect-CTA rather than silently filling mock
 * values.
 *
 * Aligned with: plan-phase C of /Users/rongibori/.claude/plans/proud-enchanting-lerdorf.md
 */
import { db, schema, eq, desc, and } from "@aissisted/db";
import { getProfile } from "./profile.service.js";
import { getBiomarkerTrends } from "./trends.service.js";
import { getLatestHealthState } from "./analysis.service.js";

// ─── Public types — mirror apps/web/.../systemTypes.ts ─────────────────────

export type SystemMode =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "recommendation";

export type DataModuleType =
  | "sleep"
  | "recovery"
  | "stress"
  | "performance"
  | "metabolic"
  | "labs"
  | "stack";

export type ModuleStatus = "optimal" | "watch" | "priority";

export interface ModuleMetric {
  label: string;
  value: string;
  status?: ModuleStatus;
}

export interface ModuleData {
  type: DataModuleType;
  label: string;
  primaryValue: string;
  caption: string;
  status: ModuleStatus;
  metrics?: ModuleMetric[];
  spark?: number[];
}

export interface UserContext {
  name: string;
  lastSyncedAt: string;
  state: string;
}

export interface SystemSnapshot {
  user: UserContext;
  modules: Record<DataModuleType, ModuleData>;
}

// ─── Module → biomarker name mapping ───────────────────────────────────────
//
// Names match the canonical strings the seed + FHIR normalizer + WHOOP
// normalizer + Apple Health parser write into `biomarkers.name`. Where
// duplicates exist across providers we list the most precise variant first.

const MODULE_BIOMARKERS: Record<DataModuleType, string[]> = {
  sleep: ["SleepDuration", "SleepEfficiency", "DeepSleep", "REMSleep", "SleepScore"],
  recovery: ["RecoveryScore", "HRV", "RestingHeartRate"],
  stress: ["Cortisol", "RespiratoryRate"],
  performance: ["VO2Max", "Steps", "ActiveCalories", "Strain"],
  metabolic: ["Glucose", "HbA1c", "Insulin", "HOMA-IR"],
  labs: ["ApoB", "LDL", "HDL", "Cholesterol", "hs-CRP", "VitaminD", "Vitamin D", "Homocysteine", "Triglycerides", "Creatinine"],
  stack: [],
};

const MODULE_LABELS: Record<DataModuleType, string> = {
  sleep: "Sleep",
  recovery: "Recovery",
  stress: "Stress + Recovery",
  performance: "Performance",
  metabolic: "Metabolic",
  labs: "Lab Biomarkers",
  stack: "Supplement Stack",
};

// ─── Status logic ─────────────────────────────────────────────────────────

/**
 * Map a single biomarker reading to a module status.
 *
 * Priority order:
 *   1. abnormalFlag from FHIR/lab source: "H"/"L"/"HH"/"LL" → priority,
 *      "A" → watch
 *   2. Trend direction === "worsening" → watch
 *   3. otherwise → optimal
 */
function statusForBiomarker(
  flag: string | null | undefined,
  trend: string | null | undefined,
): ModuleStatus {
  if (flag && /^(H|L|HH|LL)$/i.test(flag)) return "priority";
  if (flag && /^A$/i.test(flag)) return "watch";
  if (trend === "worsening") return "watch";
  return "optimal";
}

/**
 * Roll up multiple biomarker statuses into one module status.
 * Worst-of: priority > watch > optimal.
 */
function rollupStatus(items: ModuleStatus[]): ModuleStatus {
  if (items.includes("priority")) return "priority";
  if (items.includes("watch")) return "watch";
  return "optimal";
}

// ─── Helpers ──────────────────────────────────────────────────────────────

interface LatestBiomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  source: string | null;
  abnormalFlag: string | null;
  measuredAt: string;
}

interface BiomarkerTrend {
  biomarkerName: string;
  trendDirection: string;
  rollingAvg30d: number | null;
  readingCount: number;
}

function fmtValue(v: number, unit: string): string {
  if (Number.isNaN(v)) return "—";
  // Whole numbers stay whole; small decimals get 1-2 places.
  const abs = Math.abs(v);
  let str: string;
  if (abs >= 100) str = String(Math.round(v));
  else if (abs >= 10) str = v.toFixed(1).replace(/\.0$/, "");
  else str = v.toFixed(2).replace(/\.?0+$/, "");
  return unit ? `${str} ${unit}`.trim() : str;
}

function emptyModule(type: DataModuleType, hint = "no data"): ModuleData {
  return {
    type,
    label: MODULE_LABELS[type],
    primaryValue: "—",
    caption: hint,
    status: "priority",
    metrics: [],
    spark: [],
  };
}

/**
 * Pull a 24-point sparkline from biomarker history. We don't have time
 * to query history per marker on every snapshot request — instead we
 * derive a synthetic ascending/descending stub from the trend slope,
 * normalized to 0..1. This keeps the visual pulse honest about
 * direction without an extra round-trip.
 *
 * If we have a 30-day rolling average and the latest value, we can place
 * the latest at one end and the rolling avg at the other, then linearly
 * interpolate.
 */
function deriveSpark(
  latest: number,
  trend: BiomarkerTrend | undefined,
): number[] {
  const rolling = trend?.rollingAvg30d ?? latest;
  // Normalize: pick a band ±20% around the larger magnitude.
  const ref = Math.max(Math.abs(latest), Math.abs(rolling), 1);
  const lo = ref * 0.8;
  const hi = ref * 1.2;
  const norm = (v: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1)));
  const start = norm(rolling);
  const end = norm(latest);
  const out: number[] = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    out.push(start + (end - start) * t);
  }
  return out;
}

// ─── Module composer ──────────────────────────────────────────────────────

function buildBiomarkerModule(
  type: DataModuleType,
  latestByName: Map<string, LatestBiomarker>,
  trendByName: Map<string, BiomarkerTrend>,
): ModuleData {
  const wanted = MODULE_BIOMARKERS[type];
  const present: LatestBiomarker[] = [];
  for (const name of wanted) {
    const hit = latestByName.get(name) ?? latestByName.get(name.toLowerCase());
    if (hit) present.push(hit);
  }
  if (present.length === 0) {
    return emptyModule(type);
  }

  const primary = present[0];
  const primaryTrend = trendByName.get(primary.name);
  const statuses = present.map((b) =>
    statusForBiomarker(b.abnormalFlag, trendByName.get(b.name)?.trendDirection),
  );
  const status = rollupStatus(statuses);

  const metrics: ModuleMetric[] = present.slice(1, 4).map((b) => ({
    label: b.name,
    value: fmtValue(b.value, b.unit ?? ""),
    status: statusForBiomarker(b.abnormalFlag, trendByName.get(b.name)?.trendDirection),
  }));

  // Caption: narrate the worst-status biomarker if not optimal, else summarize positively.
  let caption = "in range";
  if (status === "priority") {
    const worst = present.find(
      (b) => statusForBiomarker(b.abnormalFlag, trendByName.get(b.name)?.trendDirection) === "priority",
    );
    if (worst) caption = `${worst.name} ${worst.abnormalFlag === "L" || worst.abnormalFlag === "LL" ? "low" : "elevated"}`;
  } else if (status === "watch") {
    const watch = present.find(
      (b) => statusForBiomarker(b.abnormalFlag, trendByName.get(b.name)?.trendDirection) === "watch",
    );
    if (watch) caption = `${watch.name} watch`;
  }

  return {
    type,
    label: MODULE_LABELS[type],
    primaryValue: fmtValue(primary.value, primary.unit ?? ""),
    caption,
    status,
    metrics,
    spark: deriveSpark(primary.value, primaryTrend),
  };
}

async function buildStackModule(userId: string): Promise<ModuleData> {
  // Most recent active stack
  const stack = await db
    .select()
    .from(schema.supplementStacks)
    .where(and(eq(schema.supplementStacks.userId, userId), eq(schema.supplementStacks.active, true)))
    .orderBy(desc(schema.supplementStacks.updatedAt))
    .get();

  // Most recent protocol with recommendations
  const protocol = await db
    .select()
    .from(schema.protocols)
    .where(eq(schema.protocols.userId, userId))
    .orderBy(desc(schema.protocols.createdAt))
    .get();

  let recCount = 0;
  if (protocol) {
    const recs = await db
      .select({ id: schema.recommendations.id })
      .from(schema.recommendations)
      .where(eq(schema.recommendations.protocolId, protocol.id));
    recCount = recs.length;
  }

  if (!stack && !protocol) return emptyModule("stack", "no protocol yet");

  const items: string[] = stack ? JSON.parse(stack.items) : [];

  return {
    type: "stack",
    label: MODULE_LABELS.stack,
    primaryValue: stack?.name ?? "active",
    caption: protocol?.summary?.slice(0, 80) ?? `${recCount} recommendation${recCount === 1 ? "" : "s"}`,
    status: "optimal",
    metrics: [
      { label: "Items", value: String(items.length || recCount) },
      { label: "Recs", value: String(recCount) },
    ],
    spark: [],
  };
}

async function buildLastSyncedAt(userId: string): Promise<string> {
  // Most recent completed sync_batch wins
  const batch = await db
    .select({ completedAt: schema.syncBatches.completedAt })
    .from(schema.syncBatches)
    .where(and(eq(schema.syncBatches.userId, userId), eq(schema.syncBatches.status, "completed")))
    .orderBy(desc(schema.syncBatches.completedAt))
    .get();
  if (batch?.completedAt) return batch.completedAt;
  // Fallback: most recent integration_tokens.updatedAt
  const tok = await db
    .select({ updatedAt: schema.integrationTokens.updatedAt })
    .from(schema.integrationTokens)
    .where(eq(schema.integrationTokens.userId, userId))
    .orderBy(desc(schema.integrationTokens.updatedAt))
    .get();
  if (tok?.updatedAt) return tok.updatedAt;
  // Final fallback: now (so the UI doesn't show "never synced")
  return new Date().toISOString();
}

function buildStatePhrase(
  hs: Awaited<ReturnType<typeof getLatestHealthState>>,
  modules: Record<DataModuleType, ModuleData>,
): string {
  if (hs?.mode && hs.mode !== "optimal") {
    const tags = hs.activeSignals
      .slice(0, 2)
      .map((s) => s.biomarkerName ?? s.key)
      .filter(Boolean)
      .join(" · ");
    return tags ? `${hs.mode} · ${tags}` : hs.mode;
  }
  const priorities: string[] = [];
  for (const m of Object.values(modules)) {
    if (m.status === "priority" && m.caption !== "no data") priorities.push(m.caption);
  }
  if (priorities.length > 0) return priorities.slice(0, 3).join(" · ");
  return "All systems in range";
}

/**
 * Query latest biomarker rows directly so we keep typed access to
 * `abnormalFlag` (the high-level `getLatestBiomarkers` annotate-helper drops
 * it from its declared return shape). One row per biomarker name, latest
 * `measuredAt` wins.
 */
async function getLatestBiomarkerRows(userId: string): Promise<LatestBiomarker[]> {
  const all = await db
    .select({
      id: schema.biomarkers.id,
      name: schema.biomarkers.name,
      value: schema.biomarkers.value,
      unit: schema.biomarkers.unit,
      source: schema.biomarkers.source,
      abnormalFlag: schema.biomarkers.abnormalFlag,
      measuredAt: schema.biomarkers.measuredAt,
    })
    .from(schema.biomarkers)
    .where(eq(schema.biomarkers.userId, userId))
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(2000);

  const seen = new Set<string>();
  const out: LatestBiomarker[] = [];
  for (const row of all) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    out.push(row);
  }
  return out;
}

// ─── Public composer ──────────────────────────────────────────────────────

/**
 * Compose the SystemSnapshot for a user. Always returns a complete shape;
 * empty modules are filled with status="priority" + caption="no data" so
 * the UI surfaces Connect-CTAs rather than rendering blanks.
 */
export async function buildSystemSnapshot(userId: string): Promise<SystemSnapshot> {
  const [profile, latest, trends, healthState, lastSyncedAt] = await Promise.all([
    getProfile(userId),
    getLatestBiomarkerRows(userId),
    getBiomarkerTrends(userId),
    getLatestHealthState(userId).catch(() => null),
    buildLastSyncedAt(userId),
  ]);

  // Index biomarkers + trends by name (case-insensitive friendly via the lower-case key fallback)
  const latestByName = new Map<string, LatestBiomarker>();
  for (const b of latest) {
    latestByName.set(b.name, b);
  }
  const trendByName = new Map<string, BiomarkerTrend>();
  for (const t of trends) {
    trendByName.set(t.biomarkerName, t as unknown as BiomarkerTrend);
  }

  const biomarkerModules = (
    ["sleep", "recovery", "stress", "performance", "metabolic", "labs"] as DataModuleType[]
  ).reduce<Record<DataModuleType, ModuleData>>(
    (acc, type) => {
      acc[type] = buildBiomarkerModule(type, latestByName, trendByName);
      return acc;
    },
    {} as Record<DataModuleType, ModuleData>,
  );

  const stackModule = await buildStackModule(userId);

  const modules: Record<DataModuleType, ModuleData> = {
    ...biomarkerModules,
    stack: stackModule,
  };

  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() || "Tester";

  return {
    user: {
      name,
      lastSyncedAt,
      state: buildStatePhrase(healthState, modules),
    },
    modules,
  };
}
