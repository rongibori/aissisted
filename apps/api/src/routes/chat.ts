import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { chat } from "../services/jeffrey.service.js";
import {
  getUserConversations,
  getConversationHistory,
  getConversationById,
  getOrCreateConversation,
  addMessage,
} from "../services/conversation.service.js";
import { getProfile } from "../services/profile.service.js";
import { writeAuditLog } from "../services/audit.service.js";
import { orchestrate, type SafetyContext, type SafetyUserProfile } from "@aissisted/jeffrey";

/** Compute integer age in years, or undefined if dob missing/invalid. */
function ageFromDob(dob: string | null | undefined): number | undefined {
  if (!dob) return undefined;
  const t = Date.parse(dob);
  if (Number.isNaN(t)) return undefined;
  const ms = Date.now() - t;
  const years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  return years > 0 && years < 130 ? years : undefined;
}

/** JSON-decode an allergies field; healthProfiles.allergies is a JSON string. */
function parseJsonStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Build a SafetyUserProfile from the user's healthProfiles row. */
async function buildSafetyContext(userId: string): Promise<SafetyContext> {
  const profile = await getProfile(userId).catch(() => null);
  const sex =
    profile?.sex === "male" || profile?.sex === "female" ? profile.sex : undefined;
  const safetyProfile: SafetyUserProfile = {
    userId,
    age: ageFromDob(profile?.dateOfBirth),
    sexAtBirth: sex,
    conditions: parseJsonStringArray((profile as any)?.conditions),
    medications: parseJsonStringArray((profile as any)?.medications),
    allergies: parseJsonStringArray((profile as any)?.allergies),
  };
  return { profile: safetyProfile, dataAsOf: new Date().toISOString() };
}

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
        // Escape hatch: USE_LEGACY_CHAT=1 bypasses the orchestrator entirely.
        // Lets us fall back to the pre-J3 path during the demo if the
        // orchestrator regresses on a critical case.
        if (process.env.USE_LEGACY_CHAT === "1") {
          const result = await chat(sub, message, conversationId);
          return reply.send({ data: result });
        }

        // Build the safety context once per turn — a fresh user-profile
        // pull, age computed from DOB.
        const safetyContext = await buildSafetyContext(sub);

        const orch = await orchestrate({
          userId: sub,
          input: message,
          channel: "text",
          conversationId,
          safetyContext,
        });

        // formula/recall agents call chat() internally → conversation +
        // messages already persisted. safety/proactive agents don't, so
        // we persist the turn here.
        let conversationIdOut = (orch.agentDraft.metadata?.conversationId as string | undefined) ?? conversationId ?? null;
        if (orch.routedTo === "safety" || orch.routedTo === "proactive") {
          const conv = await getOrCreateConversation(sub, conversationId);
          conversationIdOut = conv.id;
          await addMessage(conv.id, "user", message, orch.routedTo);
          await addMessage(conv.id, "assistant", orch.finalResponseText, orch.routedTo);
        }

        // Audit telemetry — every routed turn. Non-blocking on failure.
        writeAuditLog(sub, "chat.route", "conversation", conversationIdOut ?? null, {
          routedTo: orch.routedTo,
          routingReason: orch.routingReason,
          safetyDecision: orch.safety.decision,
          channel: "text",
        }).catch(() => {});

        reply.send({
          data: {
            reply: orch.finalResponseText,
            conversationId: conversationIdOut,
            intent: (orch.agentDraft.metadata?.intent as string | undefined) ?? orch.routedTo,
            protocolTriggered: Boolean(orch.agentDraft.metadata?.protocolTriggered),
            routedTo: orch.routedTo,
            safety: { decision: orch.safety.decision },
          },
        });
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
