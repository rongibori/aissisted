import { randomUUID } from "crypto";
import { db, schema } from "@aissisted/db";
import { getLatestRecovery, getLatestSleep } from "./client.js";
import { recoveryToSignals, sleepToSignals } from "./normalizer.js";

type BiomarkerEntry = {
  name: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: string;
};

async function persistBiomarkers(
  userId: string,
  entries: BiomarkerEntry[]
): Promise<number> {
  if (entries.length === 0) return 0;
  let count = 0;
  const now = new Date().toISOString();
  for (const entry of entries) {
    try {
      await db.insert(schema.biomarkers).values({
        id: randomUUID(),
        userId,
        name: entry.name,
        value: entry.value,
        unit: entry.unit,
        source: entry.source,
        measuredAt: entry.measuredAt,
        createdAt: now,
      });
      count++;
    } catch {
      // Skip duplicates / constraint violations
    }
  }
  return count;
}

export async function syncWhoopForUser(userId: string): Promise<number> {
  const [recovery, sleep] = await Promise.all([
    getLatestRecovery(userId),
    getLatestSleep(userId),
  ]);

  const entries: BiomarkerEntry[] = [];

  if (recovery?.score_state === "SCORED") {
    for (const s of recoveryToSignals(recovery)) {
      entries.push({
        name: s.name,
        value: s.value,
        unit: s.unit ?? "",
        source: "whoop",
        measuredAt: recovery.created_at,
      });
    }
  }

  if (sleep?.score_state === "SCORED") {
    for (const s of sleepToSignals(sleep)) {
      entries.push({
        name: s.name,
        value: s.value,
        unit: s.unit ?? "",
        source: "whoop",
        measuredAt: sleep.end,
      });
    }
  }

  return persistBiomarkers(userId, entries);
}
