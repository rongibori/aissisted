import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as biomarkerService from "../services/biomarker.service.js";
import {
  getBiomarkerTrends,
  getBiomarkerTrend,
  computeBiomarkerTrends,
} from "../services/trends.service.js";

export async function biomarkerRoutes(app: FastifyInstance) {
  // POST /biomarkers
  app.post(
    "/biomarkers",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["name", "value", "unit", "measuredAt"],
          properties: {
            name: { type: "string" },
            value: { type: "number" },
            unit: { type: "string" },
            source: { type: "string" },
            measuredAt: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const body = request.body as {
        name: string;
        value: number;
        unit: string;
        source?: string;
        measuredAt: string;
      };

      try {
        const biomarker = await biomarkerService.addBiomarker(sub, body);
        reply.status(201).send({ data: { biomarker } });
      } catch (err: any) {
        if (err.code === "INVALID_BIOMARKER_VALUE") {
          return reply.status(400).send({ error: { message: err.message, code: err.code } });
        }
        throw err;
      }
    }
  );

  // GET /biomarkers
  app.get(
    "/biomarkers",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const query = request.query as { name?: string; latest?: string };

      const biomarkers =
        query.latest === "true"
          ? await biomarkerService.getLatestBiomarkers(sub)
          : await biomarkerService.getBiomarkers(sub, { name: query.name });

      reply.send({ data: { biomarkers } });
    }
  );

  // GET /biomarkers/history/:name — time series for a specific biomarker
  app.get(
    "/biomarkers/history/:name",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { name } = request.params as { name: string };
      const biomarkers = await biomarkerService.getBiomarkers(sub, { name, limit: 50 });
      reply.send({ data: { biomarkers } });
    }
  );

  // GET /biomarkers/trends — pre-computed rolling averages + slope for all biomarkers
  app.get(
    "/biomarkers/trends",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const query = request.query as { refresh?: string };

      if (query.refresh === "true") {
        await computeBiomarkerTrends(sub);
      }

      const trends = await getBiomarkerTrends(sub);
      reply.send({ data: { trends } });
    }
  );

  // GET /biomarkers/trends/:name — trend record for a single biomarker
  app.get(
    "/biomarkers/trends/:name",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { name } = request.params as { name: string };
      const trend = await getBiomarkerTrend(sub, name);
      if (!trend) {
        return reply.status(404).send({ error: { message: "No trend data found for this biomarker" } });
      }
      reply.send({ data: { trend } });
    }
  );
}
