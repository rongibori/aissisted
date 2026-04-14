import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as protocolService from "../services/protocol.service.js";
import { getUserProtocols } from "../services/protocol.service.js";

export async function protocolRoutes(app: FastifyInstance) {
  // POST /protocol/run — generate a new protocol for the authenticated user
  app.post(
    "/protocol/run",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };

      try {
        const protocol = await protocolService.generateProtocol(sub);
        reply.status(201).send({ data: { protocol } });
      } catch (err: any) {
        app.log.error(err);
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );

  // GET /protocol/latest — get user's most recent protocol
  app.get(
    "/protocol/latest",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const protocol = await protocolService.getLatestProtocol(sub);

      if (!protocol) {
        return reply.status(404).send({
          error: { message: "No protocol found", code: "NOT_FOUND" },
        });
      }

      reply.send({ data: { protocol } });
    }
  );

  // GET /protocol/history — list all protocols for user (summary only)
  app.get(
    "/protocol/history",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const protocols = await getUserProtocols(sub);
      reply.send({ data: { protocols } });
    }
  );

  // GET /protocol/:id
  app.get(
    "/protocol/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const protocol = await protocolService.getProtocol(id);

      if (!protocol) {
        return reply.status(404).send({
          error: { message: "Protocol not found", code: "NOT_FOUND" },
        });
      }

      reply.send({ data: { protocol } });
    }
  );
}
