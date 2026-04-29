/**
 * @aissisted/jeffrey-evals — Setup
 *
 * Provides an in-process, fixture-backed test environment for B1 evals.
 *
 * B1 scope: persona state is held in memory — no DB or migrations required.
 * makeEvalMemoryAdapter() returns a LongTermMemoryAdapter that reads directly
 * from the seeded persona fixture, giving Jeffrey authentic user context
 * (profile, connected sources, memory entries) without any I/O.
 *
 * This is sufficient to test response_text, tokens, cost, and latency.
 *
 * B2: swap the in-memory store for real DB seeding via @aissisted/db once the
 * DB integration pattern is ratified (users, health_profiles, biomarkers,
 * protocols, conversations tables).
 */

import type { SyntheticPersona } from './types.js';
import type {
  JeffreyUserProfile,
  LongTermMemoryAdapter,
  LongTermMemoryEntry,
} from '@aissisted/jeffrey';

// In-process store: userId → persona. Cleared on setup / teardown.
const personaStore = new Map<string, SyntheticPersona>();

export async function setupTestEnv(): Promise<void> {
  personaStore.clear();
}

export async function teardownTestEnv(): Promise<void> {
  personaStore.clear();
}

/**
 * Seed a persona into the in-process store. Idempotent — re-seeding the same
 * userId overwrites the previous fixture.
 */
export async function seedPersona(persona: SyntheticPersona): Promise<void> {
  personaStore.set(persona.user.userId, persona);
}

export async function clearPersona(personaUserId: string): Promise<void> {
  personaStore.delete(personaUserId);
}

/**
 * Returns a LongTermMemoryAdapter backed by the seeded persona fixture.
 *
 * Pass the returned adapter to createJeffreySession({ memoryAdapter }) so
 * Jeffrey receives this persona's profile and memory entries as context.
 * The persona must have been seeded via seedPersona() first.
 */
export function makeEvalMemoryAdapter(persona: SyntheticPersona): LongTermMemoryAdapter {
  const userId = persona.user.userId;
  return {
    async getProfile(): Promise<JeffreyUserProfile | null> {
      const stored = personaStore.get(userId);
      if (!stored) return null;
      return buildProfile(stored);
    },

    async listEntries(): Promise<LongTermMemoryEntry[]> {
      const stored = personaStore.get(userId);
      if (!stored) return [];
      return stored.memorySeed.map((seed, i) => ({
        userId,
        key: `${seed.kind}-${i}`,
        summary: seed.content,
        updatedAt: seed.createdAt,
      }));
    },

    async upsertEntry(): Promise<void> {
      // Writes are intentionally noop in the eval environment.
    },

    async deleteEntry(): Promise<void> {
      // Deletes are intentionally noop in the eval environment.
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildProfile(persona: SyntheticPersona): JeffreyUserProfile {
  const connectedSources: JeffreyUserProfile['connectedSources'] = [];
  for (const w of persona.wearables) {
    if (w.provider === 'whoop') connectedSources.push('whoop');
    else if (w.provider === 'oura') connectedSources.push('oura');
    else if (w.provider === 'apple_health') connectedSources.push('apple-health');
  }

  const summaryBits: string[] = [];
  if (persona.healthProfile.goals.length) {
    summaryBits.push(`Goals: ${persona.healthProfile.goals.join(', ')}`);
  }
  const conditions = persona.healthProfile.conditions.map((c) => c.label);
  if (conditions.length) summaryBits.push(`Conditions: ${conditions.join(', ')}`);
  const meds = persona.healthProfile.medications.map((m) => m.name);
  if (meds.length) summaryBits.push(`Medications: ${meds.join(', ')}`);

  return {
    userId: persona.user.userId,
    displayName: persona.user.displayName,
    connectedSources,
    memorySummary: summaryBits.length ? summaryBits.join(' · ') : undefined,
  };
}
