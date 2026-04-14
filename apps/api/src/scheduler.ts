import cron from "node-cron";
import { db, schema, eq } from "@aissisted/db";
import { syncWhoopForUser } from "./integrations/whoop/sync.js";
import type { FastifyBaseLogger } from "fastify";

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
        tokens.map((t) => syncWhoopForUser(t.userId))
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      log.info(`WHOOP sync complete: ${succeeded} succeeded, ${failed} failed`);
    } catch (err) {
      log.error(err, "WHOOP scheduled sync error");
    }
  });

  log.info("Scheduler started — WHOOP sync every 30 minutes");
}
