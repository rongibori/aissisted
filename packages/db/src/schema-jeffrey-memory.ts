/**
 * Jeffrey memory schema — pgvector-aligned.
 *
 * Aligned with: docs/specs/SHARED_STATE_AND_MEMORY_SPEC.md, Jeffrey roadmap §J2-3.
 *
 * Two tables:
 *   memory_items       — structured memory records (kind + content + metadata)
 *   memory_embeddings  — vector embeddings, one row per memory item
 *
 * The split exists so we can rebuild embeddings (model upgrade, dimension
 * change) without touching the canonical content. Foreign key cascades.
 *
 * To merge into the main schema:
 *   1. Move these table defs into packages/db/src/schema.ts
 *   2. Add pgvector extension migration: `CREATE EXTENSION IF NOT EXISTS vector;`
 *   3. Run `pnpm --filter @aissisted/db db:generate` then `db:push`
 *
 * NOTE: This is a draft. The `embedding` column uses Drizzle's customType
 *       hook because pgvector isn't first-class in drizzle-orm yet. The
 *       hook is encapsulated below — single source of truth.
 */

import { customType, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ─── pgvector custom type ───────────────────────────────────────────────────
// `vector(N)` round-trips as a string in pgvector's wire format ("[0.1,0.2,...]").
// We expose it to TS as number[] for ergonomics; the customType handles the cast.

const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    // pgvector returns strings like "[0.1,0.2,...]"
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((s) => Number(s));
  },
});

// ─── memory_items ───────────────────────────────────────────────────────────

export const memoryItems = pgTable("memory_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),

  /**
   * Memory kind.
   *  - preference   : "I take Mg in the evenings" — long-lived
   *  - constraint   : "no caffeine after 2pm" — long-lived
   *  - episodic     : "had a bad reaction to ashwagandha" — long-lived
   *  - context      : "traveling next week" — short-lived (30d default)
   *  - summary      : derived rollup of N related items — long-lived
   *  - clinical     : doctor's instruction or lab note — long-lived, audit-tagged
   */
  kind: text("kind").notNull(),

  /** Free-form content — Jeffrey-readable summary in one sentence */
  content: text("content").notNull(),

  /** Source of this memory: chat | voice | onboarding | derived | clinician */
  source: text("source").notNull(),

  /** Optional structured payload — depends on kind */
  metadata: jsonb("metadata"),

  /** Lifecycle */
  status: text("status").notNull().default("active"),    // active | promoted | expired | summarized
  promotedAt: timestamp("promoted_at"),                  // when lifecycle moved to permanent
  expiresAt: timestamp("expires_at"),                    // null = no expiry
  summarizedInto: uuid("summarized_into"),               // if rolled up, points at the summary item

  /** Reference counters — used by lifecycle to decide promotion */
  recallCount: integer("recall_count").notNull().default(0),
  lastRecalledAt: timestamp("last_recalled_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── memory_embeddings ──────────────────────────────────────────────────────

export const memoryEmbeddings = pgTable("memory_embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryItemId: uuid("memory_item_id").notNull(), // FK to memory_items
  /** Embedding model used so we can re-embed on upgrade */
  model: text("model").notNull(),
  /** Vector — default 1536 dims (text-embedding-3-small) */
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Indexes (run as raw SQL in migration) ──────────────────────────────────
//
//   CREATE INDEX memory_items_user_idx ON memory_items(user_id);
//   CREATE INDEX memory_items_kind_idx ON memory_items(kind);
//   CREATE INDEX memory_items_status_idx ON memory_items(status);
//   CREATE INDEX memory_items_expires_idx ON memory_items(expires_at) WHERE expires_at IS NOT NULL;
//   CREATE INDEX memory_embeddings_ivfflat ON memory_embeddings
//     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

export type MemoryItem = typeof memoryItems.$inferSelect;
export type NewMemoryItem = typeof memoryItems.$inferInsert;
export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect;
export type NewMemoryEmbedding = typeof memoryEmbeddings.$inferInsert;
