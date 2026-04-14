import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as profileService from "../services/profile.service.js";

export async function profileRoutes(app: FastifyInstance) {
  // GET /user/profile
  app.get(
    "/user/profile",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const profile = await profileService.getProfile(sub);

      if (!profile) {
        return reply
          .status(404)
          .send({ error: { message: "Profile not found", code: "NOT_FOUND" } });
      }

      reply.send({ data: { profile } });
    }
  );

  // PATCH /user/profile
  app.patch(
    "/user/profile",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            dateOfBirth: { type: "string" },
            sex: { type: "string", enum: ["male", "female", "other"] },
            goals: { type: "array", items: { type: "string" } },
            conditions: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            supplements: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const body = request.body as Parameters<
        typeof profileService.upsertProfile
      >[1];

      const profile = await profileService.upsertProfile(sub, body);
      reply.send({ data: { profile } });
    }
  );
}
