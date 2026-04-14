import { getLatestRecovery, getLatestSleep } from "./client.js";
import { recoveryToSignals, sleepToSignals } from "./normalizer.js";
import { persistRawBiomarkers } from "../../services/biomarker.service.js";
import { maybeReanalyze } from "../../services/analysis.service.js";

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

  const count = await persistRawBiomarkers(userId, entries);
  maybeReanalyze(userId, count).catch(() => {});
  return count;
}
