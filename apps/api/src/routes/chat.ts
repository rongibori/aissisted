import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { chat } from "../services/jeffrey.service.js";
import {
  getUserConversations,
  getConversationHistory,
  getConversationById,
} from "../services/conversation.service.js";

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

  // GET /chat/recent — get most recent conversation with its messages (for page reload restore)
  app.get(
    "/chat/recent",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const conversations = await getUserConversations(sub);
      if (conversations.length === 0) {
        return reply.send({ data: { conversationId: null, messages: [] } });
      }
      const latest = conversations[0];
      const messages = await getConversationHistory(latest.id, 50);
      reply.send({ data: { conversationId: latest.id, messages } });
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

  // GET /chat/conversations/:id/messages — load messages for a conversation
  app.get(
    "/chat/conversations/:id/messages",
    {
      preHandler: [requireAuth],
      schema: {
        params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { id } = request.params as { id: string };

      // Verify the conversation belongs to this user
      const conversation = await getConversationById(id, sub);
      if (!conversation) {
        return reply.status(404).send({ error: { message: "Conversation not found", code: "NOT_FOUND" } });
      }

      const messages = await getConversationHistory(id, 100);
      reply.send({ data: { conversationId: id, messages } });
    }
  );
}
