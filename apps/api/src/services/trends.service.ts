/**
 * Biomarker Trends — Feature Layer
 *
 * Computes and persists pre-computed trend records for each biomarker:
 *   - 7 / 30 / 90-day rolling averages
 *   - Linear slope (value change per 30 days)
 *   - Trend direction relative to clinical reference ranges
 *
 * Results are upserted into `biomarker_trends` and consumed by:
 *   - analysis.service (health state scoring)
 *   - protocol.service (signal building)
 *   - Jeffrey context (trend-aware explanations)
 *   - Frontend labs page (sparklines with direction annotation)
 */

import { randomUUID } from "crypto";
import { db, schema, eq, desc, and } from "@aissisted/db";
import { BIOMARKER_RANGES, getRangeStatus } from "../engine/biomarker-ranges.js";

// ─── Types ────────────────────────────────────────────────

export interface BiomarkerTrendRecord {
  id: string;
  userId: string;
  biomarkerName: string;
  latestValue: number;
  latestUnit: string;
  latestMeasuredAt: string;
  firstMeasuredAt: string | null;
  readingCount: number;
  slope30d: number | null;   // value change per 30 days
  rollingAvg7d: number | null;
  rollingAvg30d: number | null;
  rollingAvg90d: number | null;
  trendDirection: "worsening" | "improving" | "stable" | "new" | "insufficient_data";
  computedAt: string;
}

// ─── Math helpers ─────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Simple ordinary least-squares linear regression.
 * Returns slope (change in y per unit x) and intercept.
 * x values should be in consistent units (days since first reading).
 */
function linearRegression(
  points: Array<{ x: number; y: number }>
): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Classify trend direction based on:
 *  - slope_per_30d  (linear rate of change)
 *  - latest range status (are we above/below optimal?)
 *  - normal band width (for relative significance threshold)
 */
function classifyTrend(
  biomarkerName: string,
  latestValue: number,
  slope30d: number,
  readingCount: number
): "worsening" | "improving" | "stable" | "new" | "insufficient_data" {
  if (readingCount === 1) return "new";
  if (readingCount < 3) return "insufficient_data";

  const range = BIOMARKER_RANGES[biomarkerName];
  if (!range) return "stable";

  const bandWidth = range.highNormal - range.low;
  // Threshold: movement of < 3% of band per 30 days = stable
  const stableThreshold = bandWidth * 0.03;
  if (Math.abs(slope30d) < stableThreshold) return "stable";

  const { status } = getRangeStatus(biomarkerName, latestValue);

  // For markers where higher = worse (LDL, TG, CRP, glucose, creatinine, BUN)
  // "worsening" = value rising when already high or rising toward critical
  // For markers where lower = worse (HDL, vitamin D, ferritin, B12, testosterone)
  // "worsening" = value falling when already low

  // High markers: worsening = positive slope when high/optimal-high
  const highIsBad = [
    "ldl_mg_dl", "triglycerides_mg_dl", "total_cholesterol_mg_dl",
    "crp_mg_l", "hs_crp_mg_l", "glucose_mg_dl", "hba1c_pct", "insulin_uiu_ml",
    "creatinine_mg_dl", "bun_mg_dl", "cortisol_mcg_dl", "tsh_miu_l",
    "esr_mm_hr", "homocysteine_umol_l", "alt_u_l", "ast_u_l", "ggtp_u_l",
  ];

  const lowIsBad = [
    "hdl_mg_dl", "vitamin_d_ng_ml", "b12_pg_ml", "folate_ng_ml",
    "ferritin_ng_ml", "hemoglobin_g_dl", "testosterone_ng_dl",
    "free_testosterone_pg_ml", "dhea_s_mcg_dl", "magnesium_mg_dl",
    "iron_mcg_dl", "whoop_hrv_rmssd_ms", "whoop_recovery_score",
  ];

  if (highIsBad.includes(biomarkerName)) {
    // Rising = worsening (especially if already high)
    if (slope30d > stableThreshold) {
      return status === "high" || status === "optimal" ? "worsening" : "improving";
    } else {
      return status === "high" ? "improving" : "worsening";
    }
  }

  if (lowIsBad.includes(biomarkerName)) {
    // Falling = worsening (especially if already low)
    if (slope30d < -stableThreshold) {
      return status === "low" || status === "optimal" ? "worsening" : "improving";
    } else {
      return status === "low" ? "improving" : "worsening";
    }
  }

  // Unknown directionality — positive slope is generally worsening, negative improving
  if (slope30d > 0) return "worsening";
  if (slope30d < 0) return "improving";
  return "stable";
}

// ─── Rolling average helpers ──────────────────────────────

function rollingAverage(
  readings: Array<{ value: number; measuredAt: string }>,
  days: number
): number | null {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const recent = readings.filter((r) => r.measuredAt >= cutoff);
  if (recent.length === 0) return null;
  return parseFloat(mean(recent.map((r) => r.value)).toFixed(4));
}

// ─── Core computation ─────────────────────────────────────

/**
 * Compute and persist trend records for all of a user's biomarkers.
 * Safe to call repeatedly — upserts via (userId, biomarkerName) uniqueness.
 */
export async function computeBiomarkerTrends(userId: string): Promise<void> {
  // Load full biomarker history (up to 2000 readings for trend computation)
  const allRows = await db
    .select({
      name: schema.biomarkers.name,
      value: schema.biomarkers.value,
      unit: schema.biomarkers.unit,
      measuredAt: schema.biomarkers.measuredAt,
    })
    .from(schema.biomarkers)
    .where(eq(schema.biomarkers.userId, userId))
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(2000);

  if (allRows.length === 0) return;

  // Group by biomarker name
  const grouped = new Map<string, Array<{ value: number; unit: string; measuredAt: string }>>();
  for (const row of allRows) {
    const arr = grouped.get(row.name) ?? [];
    arr.push({ value: row.value, unit: row.unit, measuredAt: row.measuredAt });
    grouped.set(row.name, arr);
  }

  const now = new Date().toISOString();

  for (const [name, readings] of grouped) {
    // Readings are already sorted newest-first from DB; we need oldest-first for regression
    const sorted = [...readings].sort(
      (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    );

    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    const readingCount = sorted.length;

    // Build regression points: x = days since first reading, y = value
    const firstMs = new Date(first.measuredAt).getTime();
    const regressionPoints = sorted.map((r) => ({
      x: (new Date(r.measuredAt).getTime() - firstMs) / (1000 * 60 * 60 * 24),
      y: r.value,
    }));

    // Slope in value/day → convert to value/30 days
    const { slope } = linearRegression(regressionPoints);
    const slope30d = readingCount >= 3 ? parseFloat((slope * 30).toFixed(4)) : null;

    const trendDirection = classifyTrend(name, latest.value, slope30d ?? 0, readingCount);

    // Rolling averages use the original newest-first ordering
    const avg7d = rollingAverage(readings, 7);
    const avg30d = rollingAverage(readings, 30);
    const avg90d = rollingAverage(readings, 90);

    // Upsert: check if a trend record already exists for this user+biomarker
    const existingRow = await db
      .select({ id: schema.biomarkerTrends.id })
      .from(schema.biomarkerTrends)
      .where(
        and(
          eq(schema.biomarkerTrends.userId, userId),
          eq(schema.biomarkerTrends.biomarkerName, name)
        )
      )
      .get();

    if (existingRow) {
      await db
        .update(schema.biomarkerTrends)
        .set({
          latestValue: latest.value,
          latestUnit: latest.unit,
          latestMeasuredAt: latest.measuredAt,
          firstMeasuredAt: first.measuredAt,
          readingCount,
          slope30d,
          rollingAvg7d: avg7d,
          rollingAvg30d: avg30d,
          rollingAvg90d: avg90d,
          trendDirection,
          computedAt: now,
        })
        .where(eq(schema.biomarkerTrends.id, existingRow.id));
    } else {
      await db.insert(schema.biomarkerTrends).values({
        id: randomUUID(),
        userId,
        biomarkerName: name,
        latestValue: latest.value,
        latestUnit: latest.unit,
        latestMeasuredAt: latest.measuredAt,
        firstMeasuredAt: first.measuredAt,
        readingCount,
        slope30d,
        rollingAvg7d: avg7d,
        rollingAvg30d: avg30d,
        rollingAvg90d: avg90d,
        trendDirection,
        computedAt: now,
      });
    }
  }
}

/**
 * Get pre-computed trend records for a user.
 * Returns null if no trends have been computed yet — caller should call
 * computeBiomarkerTrends() first.
 */
export async function getBiomarkerTrends(
  userId: string
): Promise<BiomarkerTrendRecord[]> {
  return db
    .select()
    .from(schema.biomarkerTrends)
    .where(eq(schema.biomarkerTrends.userId, userId)) as Promise<BiomarkerTrendRecord[]>;
}

/**
 * Get the trend record for a single biomarker.
 */
export async function getBiomarkerTrend(
  userId: string,
  biomarkerName: string
): Promise<BiomarkerTrendRecord | null> {
  const all = await getBiomarkerTrends(userId);
  return all.find((t) => t.biomarkerName === biomarkerName) ?? null;
}
