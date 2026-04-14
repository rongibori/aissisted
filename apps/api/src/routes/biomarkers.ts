import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as biomarkerService from "../services/biomarker.service.js";

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

      const biomarker = await biomarkerService.addBiomarker(sub, body);
      reply.status(201).send({ data: { biomarker } });
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
}
