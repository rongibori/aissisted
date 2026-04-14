import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as adherenceService from "../services/adherence.service.js";
import { TIME_SLOTS } from "@aissisted/db/src/schema.js";

export async function adherenceRoutes(app: FastifyInstance) {
  // POST /adherence/log — record a supplement taken or skipped
  app.post(
    "/adherence/log",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["supplementName"],
          properties: {
            supplementName: { type: "string", minLength: 1, maxLength: 200 },
            dosage: { type: "string" },
            timeSlot: { type: "string" },
            takenAt: { type: "string" },
            skipped: { type: "boolean" },
            protocolId: { type: "string" },
            recommendationId: { type: "string" },
            note: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const body = request.body as {
        supplementName: string;
        dosage?: string;
        timeSlot?: string;
        takenAt?: string;
        skipped?: boolean;
        protocolId?: string;
        recommendationId?: string;
        note?: string;
      };

      const log = await adherenceService.logSupplement(sub, {
        ...body,
        takenAt: body.takenAt ?? (!body.skipped ? new Date().toISOString() : undefined),
      } as any);

      reply.status(201).send({ data: { log } });
    }
  );

  // GET /adherence/today — today's log entries
  app.get(
    "/adherence/today",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const logs = await adherenceService.getTodayLogs(sub);
      reply.send({ data: { logs } });
    }
  );

  // GET /adherence/score — adherence percentage over last N days
  app.get(
    "/adherence/score",
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: "object",
          properties: {
            days: { type: "number", minimum: 1, maximum: 365 },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { days } = (request.query as { days?: number });
      const score = await adherenceService.getAdherenceScore(sub, days ?? 30);
      reply.send({ data: score });
    }
  );

  // GET /adherence/history — recent log entries
  app.get(
    "/adherence/history",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const history = await adherenceService.getAdherenceHistory(sub);
      reply.send({ data: { logs: history } });
    }
  );
}
