import cron from "node-cron";
import { db, schema, eq, lt } from "@aissisted/db";
import { syncWhoopForUser } from "./integrations/whoop/sync.js";
import { withRetry } from "./utils/retry.js";
import { runMemoryLifecyclePass } from "./services/memory-lifecycle.js";
import type { FastifyBaseLogger } from "fastify";

const AUDIT_RETENTION_DAYS = 90;

/**
 * Schedule background jobs.
 * Call once after the server starts.
 */
export function startScheduler(log: FastifyBaseLogger): void {
  // Sync WHOOP data for all connected users every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    log.info("Scheduled WHOOP sync starting");
    try {
      const tokens = await db
        .select({ userId: schema.integrationTokens.userId })
        .from(schema.integrationTokens)
        .where(eq(schema.integrationTokens.provider, "whoop"));

      const results = await Promise.allSettled(
        tokens.map((t) =>
          withRetry(() => syncWhoopForUser(t.userId), 2, 1000)
        )
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      log.info(`WHOOP sync complete: ${succeeded} succeeded, ${failed} failed`);
    } catch (err) {
      log.error(err, "WHOOP scheduled sync error");
    }
  });

  // Prune audit log daily at 03:00 — keep last 90 days
  cron.schedule("0 3 * * *", async () => {
    try {
      const cutoff = new Date(
        Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      await db
        .delete(schema.auditLog)
        .where(lt(schema.auditLog.createdAt, cutoff));

      log.info(`Audit log pruned — entries older than ${AUDIT_RETENTION_DAYS} days removed`);
    } catch (err) {
      log.error(err, "Audit log pruning error");
    }
  });

  // Memory lifecycle pass — nightly at 03:30 UTC (orchestrate per user-local in handler)
  // Aligned with: JEFFREY_BRAIN_ROADMAP.md §J2-4
  cron.schedule("30 3 * * *", async () => {
    try {
      const result = await runMemoryLifecyclePass(log, async () => {
        const rows = await db.select({ userId: schema.users.id }).from(schema.users);
        return rows.map((r) => ({ userId: r.userId }));
      });
      log.info(
        { ...result.aggregate, users: result.usersProcessed },
        "Memory lifecycle pass complete",
      );
    } catch (err) {
      log.error(err, "Memory lifecycle pass error");
    }
  });

  // Adaptive tuning pass — nightly at 04:00 UTC (per user-local in handler)
  // Aligned with: JEFFREY_BRAIN_ROADMAP.md §J4-3
  cron.schedule("0 4 * * *", async () => {
    try {
      // TODO(adaptive): wire signal aggregation + per-user tuning loop.
      // Implementation lives in apps/api/src/services/adaptive-tuning.ts;
      // here we just iterate users and call proposeAdaptiveTuning(...).
      log.info("Adaptive tuning pass — pending wire-up (apps/api/src/services/adaptive-tuning.ts)");
    } catch (err) {
      log.error(err, "Adaptive tuning pass error");
    }
  });

  log.info("Scheduler started — WHOOP sync every 30 min, audit pruning 03:00, memory lifecycle 03:30, adaptive tuning 04:00");
}
