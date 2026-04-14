import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { chat } from "../services/jeffrey.service.js";
import { getUserConversations } from "../services/conversation.service.js";

export async function chatRoutes(app: FastifyInstance) {
  // POST /chat
  app.post(
    "/chat",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", minLength: 1, maxLength: 4000 },
            conversationId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { message, conversationId } = request.body as {
        message: string;
        conversationId?: string;
      };

      try {
        const result = await chat(sub, message, conversationId);
        reply.send({ data: result });
      } catch (err: any) {
        app.log.error(err);
        reply
          .status(500)
          .send({ error: { message: err.message, code: "CHAT_ERROR" } });
      }
    }
  );

  // GET /chat/conversations — list user's conversations
  app.get(
    "/chat/conversations",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const conversations = await getUserConversations(sub);
      reply.send({ data: { conversations } });
    }
  );
}
