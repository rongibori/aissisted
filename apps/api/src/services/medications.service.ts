/**
 * Medications Service — longitudinal medication records.
 *
 * Stores structured medication data derived from FHIR MedicationRequest
 * or entered manually. Separate from the health_profiles.medications JSON
 * array so we can track status changes, dosage history, and source provenance
 * for downstream safety and protocol logic.
 *
 * Upsert strategy: match on (userId, normalizedName) — update status/dosage
 * on re-sync rather than duplicating.
 */

import { randomUUID } from "crypto";
import { db, schema, eq, and } from "@aissisted/db";

export interface MedicationInput {
  name: string;
  dosage?: string;
  frequency?: string;
  status?: "active" | "inactive" | "stopped" | "unknown";
  startDate?: string;
  endDate?: string;
  source: "fhir" | "manual" | "inferred";
  sourceResourceId?: string;
  rxnormCode?: string;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Upsert a list of medication records for a user.
 * Returns count of new medications inserted.
 */
export async function persistMedications(
  userId: string,
  meds: MedicationInput[]
): Promise<number> {
  if (meds.length === 0) return 0;

  const now = new Date().toISOString();
  let inserted = 0;

  for (const med of meds) {
    const normalized = normalizeName(med.name);

    const existing = await db
      .select({ id: schema.medications.id, status: schema.medications.status })
      .from(schema.medications)
      .where(
        and(
          eq(schema.medications.userId, userId),
          eq(schema.medications.normalizedName, normalized)
        )
      )
      .get();

    if (existing) {
      // Update status, dosage, and source metadata if changed
      await db
        .update(schema.medications)
        .set({
          status: med.status ?? existing.status,
          dosage: med.dosage ?? null,
          frequency: med.frequency ?? null,
          startDate: med.startDate ?? null,
          endDate: med.endDate ?? null,
          sourceResourceId: med.sourceResourceId ?? null,
          rxnormCode: med.rxnormCode ?? null,
          updatedAt: now,
        })
        .where(eq(schema.medications.id, existing.id));
    } else {
      await db.insert(schema.medications).values({
        id: randomUUID(),
        userId,
        name: med.name,
        normalizedName: normalized,
        dosage: med.dosage ?? null,
        frequency: med.frequency ?? null,
        status: med.status ?? "active",
        startDate: med.startDate ?? null,
        endDate: med.endDate ?? null,
        source: med.source,
        sourceResourceId: med.sourceResourceId ?? null,
        rxnormCode: med.rxnormCode ?? null,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
  }

  return inserted;
}

export async function getMedications(
  userId: string,
  activeOnly = false
) {
  const rows = await db
    .select()
    .from(schema.medications)
    .where(eq(schema.medications.userId, userId));

  return activeOnly ? rows.filter((r) => r.status === "active") : rows;
}

/**
 * Returns a flat list of active medication names suitable for
 * safety evaluation and Jeffrey context. Matches the shape that
 * health_profiles.medications JSON array previously provided.
 */
export async function getActiveMedicationNames(userId: string): Promise<string[]> {
  const rows = await getMedications(userId, true);
  return rows.map((r) => r.name);
}
