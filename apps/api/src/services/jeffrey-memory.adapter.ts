/**
 * DB-backed LongTermMemoryAdapter for @aissisted/jeffrey.
 *
 * Jeffrey's ephemeral session memory lives in process; long-term memory is
 * persisted here. We satisfy the package interface using the existing
 * schema (users, health_profiles, integration_tokens) — no new tables needed
 * for Phase 1. Freeform entries (upsertEntry / deleteEntry) are noop for now
 * and will land when we have a dedicated jeffrey_memory_entries table.
 */
import { db, schema, eq } from "@aissisted/db";
import type {
  LongTermMemoryAdapter,
  LongTermMemoryEntry,
} from "@aissisted/jeffrey/memory";
import type { JeffreyUserProfile } from "@aissisted/jeffrey";

function deriveConnectedSources(
  providers: Array<string>,
): JeffreyUserProfile["connectedSources"] {
  const out: JeffreyUserProfile["connectedSources"] = [];
  for (const p of providers) {
    if (p === "fhir") out.push("mychart");
    else if (p === "whoop") out.push("whoop");
    else if (p === "apple_health") out.push("apple-health");
  }
  return out;
}

export const dbMemoryAdapter: LongTermMemoryAdapter = {
  async getProfile(userId: string): Promise<JeffreyUserProfile | null> {
    const [profile, tokens] = await Promise.all([
      db
        .select()
        .from(schema.healthProfiles)
        .where(eq(schema.healthProfiles.userId, userId))
        .get(),
      db
        .select({ provider: schema.integrationTokens.provider })
        .from(schema.integrationTokens)
        .where(eq(schema.integrationTokens.userId, userId)),
    ]);

    if (!profile && tokens.length === 0) {
      return null;
    }

    const displayName = profile
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : undefined;

    let memorySummary: string | undefined;
    if (profile) {
      const bits: string[] = [];
      const goals = safeParseArray(profile.goals);
      const conditions = safeParseArray(profile.conditions);
      const medications = safeParseArray(profile.medications);
      if (goals.length) bits.push(`Goals: ${goals.join(", ")}`);
      if (conditions.length) bits.push(`Conditions: ${conditions.join(", ")}`);
      if (medications.length)
        bits.push(`Medications: ${medications.join(", ")}`);
      if (bits.length) memorySummary = bits.join(" · ");
    }

    return {
      userId,
      displayName,
      connectedSources: deriveConnectedSources(tokens.map((t) => t.provider)),
      memorySummary,
    };
  },

  async listEntries(_userId: string): Promise<LongTermMemoryEntry[]> {
    // Freeform entry store not yet materialised. Return empty so the package
    // composeMemoryPreamble still emits the profile line.
    return [];
  },

  async upsertEntry(_entry: LongTermMemoryEntry): Promise<void> {
    // No-op until a dedicated table exists. Do not throw — callers treat this
    // as fire-and-forget for now.
  },

  async deleteEntry(_userId: string, _key: string): Promise<void> {
    // No-op — see above.
  },
};

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
