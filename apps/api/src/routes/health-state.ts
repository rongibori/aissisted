import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import {
  computeHealthState,
  getLatestHealthState,
} from "../services/analysis.service.js";

export async function healthStateRoutes(app: FastifyInstance) {
  /**
   * GET /health-state
   * Returns the latest health state snapshot (recomputes if stale > 24h).
   * Query param: ?refresh=true  — force recompute even if recent.
   */
  app.get(
    "/health-state",
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: "object",
          properties: {
            refresh: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { refresh } = request.query as { refresh?: boolean };

      try {
        const state = refresh
          ? await computeHealthState(sub)
          : await getLatestHealthState(sub);

        if (!state) {
          // No data yet — compute a fresh (empty) snapshot
          const fresh = await computeHealthState(sub);
          return reply.send({ data: fresh });
        }

        reply.send({ data: state });
      } catch (err: any) {
        app.log.error(err, "health-state computation failed");
        reply.status(500).send({
          error: {
            message: "Health state computation failed",
            code: "HEALTH_STATE_ERROR",
          },
        });
      }
    }
  );

  /**
   * POST /health-state/refresh
   * Force-recomputes and persists a new health state snapshot.
   */
  app.post(
    "/health-state/refresh",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };

      try {
        const state = await computeHealthState(sub);
        reply.status(201).send({ data: state });
      } catch (err: any) {
        app.log.error(err, "health-state refresh failed");
        reply.status(500).send({
          error: {
            message: "Health state refresh failed",
            code: "HEALTH_STATE_REFRESH_ERROR",
          },
        });
      }
    }
  );
}
