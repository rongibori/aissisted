/**
 * Jeffrey memory layer.
 *
 * Two tiers:
 *   - Session memory (ephemeral): in-process turn buffer for the current
 *     conversation. Lives in memory for the life of the session object.
 *   - Long-term memory (adapter): persisted summaries + facts per user. We
 *     define the adapter interface here; the concrete Postgres-backed
 *     adapter lives in apps/api (it's the one with DB access).
 *
 * Jeffrey never remembers things silently. Summaries are written through the
 * adapter, and the adapter is responsible for consent and TTL.
 */

import type { JeffreyMessage, JeffreyUserProfile } from "./types.js";

// ---------------------------------------------------------------------------
// Session memory (ephemeral)
// ---------------------------------------------------------------------------

export interface SessionMemory {
  /** All messages in this session so far. */
  messages: JeffreyMessage[];
  /** Append a message and return the new length. */
  push(message: JeffreyMessage): number;
  /** Reset the buffer. */
  clear(): void;
  /** Snapshot — useful for passing to the model. */
  snapshot(): JeffreyMessage[];
}

export function createSessionMemory(seed: JeffreyMessage[] = []): SessionMemory {
  const messages: JeffreyMessage[] = [...seed];
  return {
    messages,
    push(message) {
      messages.push(message);
      return messages.length;
    },
    clear() {
      messages.length = 0;
    },
    snapshot() {
      return [...messages];
    },
  };
}

// ---------------------------------------------------------------------------
// Long-term memory (adapter)
// ---------------------------------------------------------------------------

export interface LongTermMemoryEntry {
  userId: string;
  /** Stable key for dedupe, e.g. "goals", "medical-context", "tone-preference". */
  key: string;
  /** Short natural-language summary Jeffrey can cite. */
  summary: string;
  /** When this was last written. */
  updatedAt: string;
  /** Optional TTL for time-sensitive facts. */
  expiresAt?: string;
}

export interface LongTermMemoryAdapter {
  getProfile(userId: string): Promise<JeffreyUserProfile | null>;
  listEntries(userId: string): Promise<LongTermMemoryEntry[]>;
  upsertEntry(entry: LongTermMemoryEntry): Promise<void>;
  deleteEntry(userId: string, key: string): Promise<void>;
}

/**
 * No-op adapter for local dev and tests. Pass a real adapter from apps/api.
 */
export const noopMemoryAdapter: LongTermMemoryAdapter = {
  async getProfile() {
    return null;
  },
  async listEntries() {
    return [];
  },
  async upsertEntry() {
    /* noop */
  },
  async deleteEntry() {
    /* noop */
  },
};

/**
 * Compose a short memory preamble that the session can prepend to the system
 * prompt. Keep it tight — this lives in every turn.
 */
export function composeMemoryPreamble(
  profile: JeffreyUserProfile | null,
  entries: LongTermMemoryEntry[],
): string {
  const now = new Date();
  const active = entries.filter(
    (e) => !e.expiresAt || new Date(e.expiresAt) > now,
  );
  if (!profile && active.length === 0) return "";

  const lines: string[] = ["### What Jeffrey already knows about this person"];
  if (profile) {
    lines.push(`- Name: ${profile.displayName ?? "(not set)"}`);
    if (profile.connectedSources.length > 0) {
      lines.push(`- Connected sources: ${profile.connectedSources.join(", ")}`);
    }
    if (profile.memorySummary) {
      lines.push(`- Summary: ${profile.memorySummary}`);
    }
  }
  for (const entry of active) {
    lines.push(`- [${entry.key}] ${entry.summary}`);
  }
  return lines.join("\n");
}
