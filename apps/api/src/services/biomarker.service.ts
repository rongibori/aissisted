import { randomUUID } from "crypto";
import { db, schema, eq, and, desc } from "@aissisted/db";
import {
  getRangeStatus,
  validateBiomarkerValue,
  type RangeStatus,
} from "../engine/biomarker-ranges.js";

export type { RangeStatus };
export type TrendDirection = "up" | "down" | "stable" | "new";

export async function addBiomarker(
  userId: string,
  data: {
    name: string;
    value: number;
    unit: string;
    source?: string;
    measuredAt: string;
  }
) {
  const validationError = validateBiomarkerValue(data.name, data.value, data.unit);
  if (validationError) {
    throw Object.assign(new Error(validationError), { code: "INVALID_BIOMARKER_VALUE" });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.biomarkers).values({
    id,
    userId,
    name: data.name,
    value: data.value,
    unit: data.unit,
    source: data.source,
    measuredAt: data.measuredAt,
    createdAt: now,
  });

  const { status, isCritical } = getRangeStatus(data.name, data.value);
  return { id, userId, ...data, createdAt: now, status, isCritical, trend: "new" as TrendDirection };
}

function annotate(
  row: {
    id: string;
    name: string;
    value: number;
    unit: string;
    userId: string;
    source: string | null;
    measuredAt: string;
    createdAt: string;
  },
  previousValue?: number
) {
  const { status, isCritical } = getRangeStatus(row.name, row.value);
  let trend: TrendDirection = "new";
  if (previousValue !== undefined) {
    const delta = row.value - previousValue;
    const pct = Math.abs(delta) / (Math.abs(previousValue) || 1);
    if (pct < 0.01) trend = "stable";
    else trend = delta > 0 ? "up" : "down";
  }
  return { ...row, status, isCritical, trend, previousValue };
}

export async function getBiomarkers(
  userId: string,
  options?: { name?: string; limit?: number }
) {
  const rows = await db
    .select()
    .from(schema.biomarkers)
    .where(
      options?.name
        ? and(
            eq(schema.biomarkers.userId, userId),
            eq(schema.biomarkers.name, options.name)
          )
        : eq(schema.biomarkers.userId, userId)
    )
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(options?.limit ?? 100);

  return rows.map((r) => annotate(r));
}

/**
 * Bulk-insert biomarker entries, silently skipping constraint violations
 * (e.g. duplicate data from repeated integration syncs).
 */
export async function persistRawBiomarkers(
  userId: string,
  entries: Array<{
    name: string;
    value: number;
    unit: string;
    source: string;
    measuredAt: string;
    referenceRangeLow?: number;
    referenceRangeHigh?: number;
    labPanelName?: string;
    abnormalFlag?: string;
    confidence?: number;
  }>
): Promise<number> {
  if (entries.length === 0) return 0;
  let count = 0;
  const now = new Date().toISOString();
  for (const entry of entries) {
    const result = await db
      .insert(schema.biomarkers)
      .values({
        id: randomUUID(),
        userId,
        name: entry.name,
        value: entry.value,
        unit: entry.unit,
        source: entry.source,
        referenceRangeLow: entry.referenceRangeLow ?? null,
        referenceRangeHigh: entry.referenceRangeHigh ?? null,
        labPanelName: entry.labPanelName ?? null,
        abnormalFlag: entry.abnormalFlag ?? null,
        confidence: entry.confidence ?? 1.0,
        measuredAt: entry.measuredAt,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: schema.biomarkers.id });
    if (result.length > 0) count++;
  }
  return count;
}

export async function getLatestBiomarkers(userId: string) {
  // Fetch enough history to compute trends (2 readings per marker)
  const all = await db
    .select()
    .from(schema.biomarkers)
    .where(eq(schema.biomarkers.userId, userId))
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(1000);

  // Group by name, keep latest 2 per marker
  const grouped = new Map<string, typeof all>();
  for (const row of all) {
    const arr = grouped.get(row.name) ?? [];
    if (arr.length < 2) arr.push(row);
    grouped.set(row.name, arr);
  }

  return Array.from(grouped.values()).map(([latest, previous]) =>
    annotate(latest, previous?.value)
  );
}
