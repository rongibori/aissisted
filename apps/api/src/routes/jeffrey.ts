/**
 * /v1/jeffrey/* routes.
 *
 * One canonical Jeffrey, multiple surfaces:
 *   - health       → routes to services/jeffrey.service.chat() (full health context)
 *   - investor     → clean investor-mode session
 *   - onboarding   → clean onboarding-mode session
 *   - brand        → clean brand-mode session
 *   - concierge    → clean concierge-mode session
 *   - product-walkthrough → clean product-mode session
 *
 * Voice delivery (ElevenLabs streaming TTS) is relayed here to keep the
 * xi-api-key server-side.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { chat, askSurface } from "../services/jeffrey.service.js";
import { config } from "../config.js";
import { synthesizeStream } from "@aissisted/jeffrey/bridge";
import type { JeffreySurface } from "@aissisted/jeffrey";

const ALLOWED_SURFACES: ReadonlyArray<JeffreySurface> = [
  "investor",
  "onboarding",
  "product-walkthrough",
  "health",
  "brand",
  "concierge",
];

function isSurface(x: unknown): x is JeffreySurface {
  return typeof x === "string" && ALLOWED_SURFACES.includes(x as JeffreySurface);
}

export async function jeffreyRoutes(app: FastifyInstance) {
  // ─── POST /v1/jeffrey/ask ──────────────────────────────────────────────
  app.post(
    "/v1/jeffrey/ask",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["surface", "message"],
          properties: {
            surface: {
              type: "string",
              enum: [...ALLOWED_SURFACES],
            },
            message: { type: "string", minLength: 1, maxLength: 4000 },
            conversationId: { type: "string" },
            extraContext: {
              type: "array",
              items: { type: "string", maxLength: 4000 },
              maxItems: 8,
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as { sub: string };
      const body = request.body as {
        surface: string;
        message: string;
        conversationId?: string;
        extraContext?: string[];
      };

      if (!isSurface(body.surface)) {
        return reply.status(400).send({
          error: { message: "Unknown surface", code: "BAD_SURFACE" },
        });
      }

      try {
        // Health surface keeps the production health pipeline (intent
        // routing, protocol gen, biomarker context, conversation memory).
        if (body.surface === "health") {
          const result = await chat(sub, body.message, body.conversationId);
          return reply.send({
            data: {
              surface: "health",
              reply: result.reply,
              conversationId: result.conversationId,
              intent: result.intent,
              protocolTriggered: result.protocolTriggered,
            },
          });
        }

        // Non-health surfaces: clean session, no health context.
        const text = await askSurface({
          surface: body.surface,
          userId: sub,
          message: body.message,
          extraContext: body.extraContext,
        });
        return reply.send({
          data: { surface: body.surface, reply: text },
        });
      } catch (err) {
        const e = err as Error;
        app.log.error({ err: e }, "[jeffrey] ask failed");
        return reply.status(500).send({
          error: { message: e.message, code: "JEFFREY_ASK_FAILED" },
        });
      }
    },
  );

  // ─── POST /v1/jeffrey/voice/tts ────────────────────────────────────────
  // Streams audio/mpeg back to the caller. Use this as a relay so ElevenLabs
  // credentials never reach the browser.
  app.post(
    "/v1/jeffrey/voice/tts",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: 4000 },
            voiceId: { type: "string" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!config.elevenLabs.apiKey || !config.elevenLabs.voiceId) {
        return reply.status(503).send({
          error: {
            message: "Voice not configured (ELEVENLABS_API_KEY missing)",
            code: "VOICE_UNAVAILABLE",
          },
        });
      }

      const { text, voiceId } = request.body as {
        text: string;
        voiceId?: string;
      };

      reply.raw.setHeader("content-type", "audio/mpeg");
      reply.raw.setHeader("cache-control", "no-store");
      reply.raw.setHeader("x-jeffrey-voice", "elevenlabs");

      try {
        for await (const chunk of synthesizeStream({
          text,
          voiceId: voiceId ?? config.elevenLabs.voiceId,
        })) {
          if (chunk.final) break;
          if (chunk.bytes.byteLength === 0) continue;
          reply.raw.write(Buffer.from(chunk.bytes));
        }
        reply.raw.end();
      } catch (err) {
        const e = err as Error;
        app.log.error({ err: e }, "[jeffrey] tts relay failed");
        if (!reply.raw.headersSent) {
          reply.status(502).send({
            error: { message: e.message, code: "TTS_FAILED" },
          });
        } else {
          reply.raw.end();
        }
      }
    },
  );
}
