import { randomUUID } from "crypto";
import { db, schema, eq, and, desc } from "@aissisted/db";

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

  return { id, userId, ...data, createdAt: now };
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

  return rows;
}

export async function getLatestBiomarkers(userId: string) {
  // Get the most recent reading for each unique biomarker name
  const all = await getBiomarkers(userId, { limit: 500 });
  const seen = new Set<string>();
  return all.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
}
