/**
 * /v1/system/* routes
 *
 * Surfaces the per-user composite payloads the product UI needs but that
 * don't fit cleanly under any single domain. Today: the SystemSnapshot
 * consumed by the JeffreyAISystem neural visualization.
 */
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { buildSystemSnapshot } from "../services/system-snapshot.service.js";

export async function systemRoutes(app: FastifyInstance) {
  /**
   * GET /v1/system/snapshot
   *
   * Returns the SystemSnapshot for the authenticated user. Always returns a
   * complete 7-module payload — modules with no source data come back with
   * status="priority" + caption="no data" so the UI can render a Connect CTA.
   */
  app.get(
    "/v1/system/snapshot",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      try {
        const snapshot = await buildSystemSnapshot(sub);
        reply.send({ data: { snapshot } });
      } catch (err: any) {
        app.log.error(err, "system snapshot failed");
        reply
          .status(500)
          .send({ error: { message: err?.message ?? "snapshot failed", code: "SNAPSHOT_FAILED" } });
      }
    },
  );
}
