/**
 * Conditions Service — longitudinal condition/diagnosis records.
 *
 * Stores structured condition data derived from FHIR Condition resources
 * or entered manually. Separate from health_profiles.conditions JSON array
 * to track onset/abatement dates, clinical status changes, and ICD/SNOMED
 * codes for downstream safety and protocol personalization.
 *
 * Upsert strategy: match on (userId, normalizedName) — update status/dates
 * on re-sync.
 */

import { randomUUID } from "crypto";
import { db, schema, eq, and } from "@aissisted/db";

export interface ConditionInput {
  name: string;
  status?: "active" | "resolved" | "inactive" | "unknown";
  onsetDate?: string;
  abatementDate?: string;
  source: "fhir" | "manual" | "inferred";
  sourceResourceId?: string;
  icd10Code?: string;
  snomedCode?: string;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Upsert a list of condition records for a user.
 * Returns count of new conditions inserted.
 */
export async function persistConditions(
  userId: string,
  conds: ConditionInput[]
): Promise<number> {
  if (conds.length === 0) return 0;

  const now = new Date();
  let inserted = 0;

  for (const cond of conds) {
    const normalized = normalizeName(cond.name);

    const existing = await db
      .select({ id: schema.conditions.id, status: schema.conditions.status })
      .from(schema.conditions)
      .where(
        and(
          eq(schema.conditions.userId, userId),
          eq(schema.conditions.normalizedName, normalized)
        )
      )
      .get();

    if (existing) {
      await db
        .update(schema.conditions)
        .set({
          status: cond.status ?? existing.status,
          onsetDate: cond.onsetDate ?? null,
          abatementDate: cond.abatementDate ?? null,
          sourceResourceId: cond.sourceResourceId ?? null,
          icd10Code: cond.icd10Code ?? null,
          snomedCode: cond.snomedCode ?? null,
          updatedAt: now,
        })
        .where(eq(schema.conditions.id, existing.id));
    } else {
      await db.insert(schema.conditions).values({
        id: randomUUID(),
        userId,
        name: cond.name,
        normalizedName: normalized,
        status: cond.status ?? "active",
        onsetDate: cond.onsetDate ?? null,
        abatementDate: cond.abatementDate ?? null,
        source: cond.source,
        sourceResourceId: cond.sourceResourceId ?? null,
        icd10Code: cond.icd10Code ?? null,
        snomedCode: cond.snomedCode ?? null,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
  }

  return inserted;
}

export async function getConditions(userId: string, activeOnly = false) {
  const rows = await db
    .select()
    .from(schema.conditions)
    .where(eq(schema.conditions.userId, userId));

  return activeOnly ? rows.filter((r) => r.status === "active") : rows;
}

/**
 * Returns a flat list of active condition names suitable for
 * safety evaluation and Jeffrey context.
 */
export async function getActiveConditionNames(userId: string): Promise<string[]> {
  const rows = await getConditions(userId, true);
  return rows.map((r) => r.name);
}
