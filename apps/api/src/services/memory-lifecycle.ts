/**
 * Memory Lifecycle Service
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J2-4, SHARED_STATE_AND_MEMORY_SPEC.md
 *
 * Three operations, run nightly:
 *   1. promote   — recurring → permanent (recallCount ≥ 5 in last 30d)
 *   2. expire    — one-off "context" items past their expiresAt
 *   3. summarize — N related items collapsed into a summary item
 *
 * The cron runs at 03:30 user-local. Output is logged to the audit ledger
 * with before/after counts so regressions are visible in the eval suite (MR).
 *
 * NOTE: This service expects the pgvector tables from
 *       packages/db/src/schema-jeffrey-memory.ts to be merged into the main
 *       schema and migrated. Until then, the implementation is wired but the
 *       DB calls are stubbed — see the TODO(memory-pg) markers.
 */

import type { FastifyBaseLogger } from "fastify";

export interface LifecycleStats {
  promoted: number;
  expired: number;
  summarized: number;
  errors: number;
  durationMs: number;
}

const PROMOTE_RECALL_THRESHOLD = 5;
const PROMOTE_WINDOW_DAYS = 30;
const SUMMARY_CLUSTER_MIN_SIZE = 5;

/**
 * Run a full lifecycle pass for one user. The orchestrator iterates users.
 * Returns stats for the audit log.
 */
export async function runLifecycleForUser(
  userId: string,
  log: FastifyBaseLogger,
): Promise<LifecycleStats> {
  const t0 = Date.now();
  const stats: LifecycleStats = { promoted: 0, expired: 0, summarized: 0, errors: 0, durationMs: 0 };

  try {
    stats.promoted = await promoteRecurringMemories(userId, log);
  } catch (err) {
    log.error({ userId, err }, "memory lifecycle: promote failed");
    stats.errors++;
  }

  try {
    stats.expired = await expireStaleMemories(userId, log);
  } catch (err) {
    log.error({ userId, err }, "memory lifecycle: expire failed");
    stats.errors++;
  }

  try {
    stats.summarized = await summarizeClusters(userId, log);
  } catch (err) {
    log.error({ userId, err }, "memory lifecycle: summarize failed");
    stats.errors++;
  }

  stats.durationMs = Date.now() - t0;
  return stats;
}

/**
 * Promote: any item with recallCount ≥ THRESHOLD in last 30d gets status=promoted.
 * Promoted items never expire and are weighted higher in retrieval ranking.
 */
async function promoteRecurringMemories(
  userId: string,
  log: FastifyBaseLogger,
): Promise<number> {
  // TODO(memory-pg): wire to real DB once schema-jeffrey-memory.ts is merged.
  // Pseudocode:
  //
  //   UPDATE memory_items
  //   SET status = 'promoted', promoted_at = now(), updated_at = now()
  //   WHERE user_id = $1
  //     AND status = 'active'
  //     AND recall_count >= $2
  //     AND last_recalled_at >= now() - interval '$3 days'
  //   RETURNING id;
  log.debug({ userId, threshold: PROMOTE_RECALL_THRESHOLD, days: PROMOTE_WINDOW_DAYS }, "memory: promote pass");
  return 0;
}

/**
 * Expire: any context item past expiresAt gets status=expired.
 * Expired items are excluded from retrieval but kept on disk for 90d.
 */
async function expireStaleMemories(
  userId: string,
  log: FastifyBaseLogger,
): Promise<number> {
  // TODO(memory-pg): wire to real DB.
  //   UPDATE memory_items SET status = 'expired', updated_at = now()
  //   WHERE user_id = $1 AND status = 'active' AND expires_at IS NOT NULL AND expires_at < now()
  //   RETURNING id;
  log.debug({ userId }, "memory: expire pass");
  return 0;
}

/**
 * Summarize: cluster active items by topic+kind, collapse N≥5 related items
 * into a single "summary" item. The cluster items remain but get
 * status=summarized + summarizedInto=<summaryId>.
 *
 * Clustering is semantic — uses pgvector cosine on embeddings.
 */
async function summarizeClusters(
  userId: string,
  log: FastifyBaseLogger,
): Promise<number> {
  // TODO(memory-pg): wire pgvector cluster query.
  //
  // Strategy:
  //   1. SELECT id, content, embedding FROM memory_embeddings
  //      JOIN memory_items USING (memory_item_id)
  //      WHERE user_id = $1 AND status = 'active' AND kind != 'summary';
  //   2. Run agglomerative clustering with cosine threshold 0.85.
  //   3. For each cluster of size >= SUMMARY_CLUSTER_MIN_SIZE:
  //      a) Concat their content
  //      b) Call gpt-4o-mini to write a one-sentence summary in Jeffrey's voice
  //      c) Embed the summary
  //      d) Insert as kind='summary'
  //      e) Mark cluster items status='summarized' summarizedInto=summaryId
  log.debug({ userId, clusterMin: SUMMARY_CLUSTER_MIN_SIZE }, "memory: summarize pass");
  return 0;
}

/**
 * Iterate every user and run the lifecycle. Called from the api scheduler.
 */
export async function runMemoryLifecyclePass(
  log: FastifyBaseLogger,
  iterateUsers: () => Promise<{ userId: string }[]>,
): Promise<{ usersProcessed: number; aggregate: LifecycleStats }> {
  const users = await iterateUsers();
  const aggregate: LifecycleStats = { promoted: 0, expired: 0, summarized: 0, errors: 0, durationMs: 0 };
  const t0 = Date.now();

  for (const u of users) {
    const stats = await runLifecycleForUser(u.userId, log);
    aggregate.promoted += stats.promoted;
    aggregate.expired += stats.expired;
    aggregate.summarized += stats.summarized;
    aggregate.errors += stats.errors;
  }

  aggregate.durationMs = Date.now() - t0;
  log.info({ aggregate, usersProcessed: users.length }, "memory lifecycle: pass complete");
  return { usersProcessed: users.length, aggregate };
}
