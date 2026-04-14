import { randomUUID } from "crypto";
import { db, schema, eq, and, desc } from "@aissisted/db";
import {
  getRangeStatus,
  validateBiomarkerValue,
  type RangeStatus,
} from "../engine/biomarker-ranges.js";

export type { RangeStatus };

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
  // Validate value before persisting
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
  return { id, userId, ...data, createdAt: now, status, isCritical };
}

function annotate(row: {
  id: string;
  name: string;
  value: number;
  unit: string;
  userId: string;
  source: string | null;
  measuredAt: string;
  createdAt: string;
}) {
  const { status, isCritical } = getRangeStatus(row.name, row.value);
  return { ...row, status, isCritical };
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

  return rows.map(annotate);
}

export async function getLatestBiomarkers(userId: string) {
  const all = await getBiomarkers(userId, { limit: 500 });
  const seen = new Set<string>();
  return all.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
}
