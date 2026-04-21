/**
 * /v1/jeffrey/realtime — OpenAI Realtime WebSocket proxy.
 *
 * Architecture:
 *
 *   browser ──ws──▶ apps/api (this file) ──ws──▶ api.openai.com/v1/realtime
 *
 * Why proxy at all:
 *   - OPENAI_API_KEY never touches the browser.
 *   - We enforce per-session timeouts and a soft audio-byte cap to stop a
 *     runaway client from burning through budget.
 *   - The @aissisted/jeffrey package owns the session payload (system prompt,
 *     tone overlay, surface-specific instructions, VAD config, voice) — this
 *     route is pure transport.
 *
 * Auth flow (two-step, because browser WS clients cannot send arbitrary
 * headers and we do not want long-lived JWTs in URL query strings):
 *
 *   1. Client calls POST /v1/jeffrey/realtime/ticket with its normal JWT in
 *      the Authorization header. Body specifies `surface`.
 *   2. Server mints a short-lived (30s) realtime ticket JWT containing
 *      { sub, surface, kind: "realtime" } and returns it.
 *   3. Client opens WS to
 *      /v1/jeffrey/realtime?ticket=<ticket>&surface=<surface>
 *      Server verifies ticket, checks surface match, proceeds.
 *
 * Surfaces whitelisted for realtime: `concierge`, `onboarding`.
 * Investor/health surfaces are explicitly blocked until persona polish
 * (Task #52) is complete; those surfaces ship text-only or ElevenLabs TTS
 * relay until then.
 *
 * Soft budgets per session (defensive — prevents runaway sockets):
 *   - 5 minute wall-clock timeout.
 *   - 10 MB cumulative inbound audio bytes (≈ 5 minutes of pcm16 @ 24kHz mono).
 */

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import WebSocket from "ws";
import { prepareRealtimeSession } from "@aissisted/jeffrey/bridge";
import type { JeffreySurface } from "@aissisted/jeffrey";
import { requireAuth } from "../middleware/auth.js";

/** Surfaces we allow to open a realtime socket (conservative). */
const REALTIME_ALLOWED_SURFACES: ReadonlyArray<JeffreySurface> = [
  "concierge",
  "onboarding",
];

const TICKET_TTL_SECONDS = 30;
const SESSION_MAX_MS = 5 * 60 * 1000; // 5 minutes
const INBOUND_AUDIO_BYTE_CAP = 10 * 1024 * 1024; // 10 MB
const CLIENT_MESSAGE_BYTE_CAP = 256 * 1024; // 256 KB per frame

interface RealtimeTicketPayload {
  sub: string;
  surface: JeffreySurface;
  kind: "realtime";
}

function isSurface(x: unknown): x is JeffreySurface {
  return (
    typeof x === "string" &&
    REALTIME_ALLOWED_SURFACES.includes(x as JeffreySurface)
  );
}

/**
 * Registers:
 *   - POST /v1/jeffrey/realtime/ticket   (authenticated, mints ticket)
 *   - GET  /v1/jeffrey/realtime          (websocket, proxies to OpenAI)
 *
 * Expects @fastify/websocket and @fastify/jwt to be registered already.
 */
export async function jeffreyRealtimeRoutes(app: FastifyInstance) {
  // ─── POST /v1/jeffrey/realtime/ticket ──────────────────────────────────
  // Mints a short-lived token the browser embeds in the WS query string.
  app.post(
    "/v1/jeffrey/realtime/ticket",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["surface"],
          properties: {
            surface: {
              type: "string",
              enum: [...REALTIME_ALLOWED_SURFACES],
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { sub } = request.user as { sub: string };
      const { surface } = request.body as { surface: string };

      if (!isSurface(surface)) {
        return reply.status(400).send({
          error: {
            message: `Realtime not available for surface "${surface}"`,
            code: "REALTIME_SURFACE_NOT_ALLOWED",
          },
        });
      }

      const payload: RealtimeTicketPayload = {
        sub,
        surface,
        kind: "realtime",
      };
      const ticket = await reply.jwtSign(payload, {
        expiresIn: `${TICKET_TTL_SECONDS}s`,
      });

      return reply.send({
        data: {
          ticket,
          expiresInSeconds: TICKET_TTL_SECONDS,
          surface,
        },
      });
    },
  );

  // ─── GET /v1/jeffrey/realtime ──────────────────────────────────────────
  // The browser opens a WebSocket here. We verify the ticket, open an
  // outbound socket to OpenAI, and proxy frames bidirectionally.
  app.get(
    "/v1/jeffrey/realtime",
    { websocket: true },
    (socket, request) => {
      void handleRealtimeSocket(app, socket, request);
    },
  );
}

async function handleRealtimeSocket(
  app: FastifyInstance,
  clientSocket: WebSocket,
  request: FastifyRequest,
): Promise<void> {
  const log = app.log.child({ route: "jeffrey-realtime" });

  // ─── Verify ticket ───────────────────────────────────────────────────
  const { ticket, surface: surfaceParam } = (request.query ?? {}) as {
    ticket?: string;
    surface?: string;
  };
  if (!ticket || !surfaceParam) {
    closeWithReason(clientSocket, 4001, "Missing ticket or surface");
    return;
  }

  let payload: RealtimeTicketPayload;
  try {
    payload = (await app.jwt.verify(ticket)) as RealtimeTicketPayload;
  } catch (err) {
    log.warn({ err }, "realtime ticket invalid");
    closeWithReason(clientSocket, 4003, "Invalid or expired ticket");
    return;
  }

  if (payload.kind !== "realtime" || !isSurface(payload.surface)) {
    closeWithReason(clientSocket, 4003, "Ticket not valid for realtime");
    return;
  }
  if (payload.surface !== surfaceParam) {
    closeWithReason(clientSocket, 4003, "Surface mismatch");
    return;
  }

  const userId = payload.sub;
  const surface = payload.surface;

  // ─── Build the OpenAI session descriptor (pure helper, no I/O) ──────
  let descriptor: ReturnType<typeof prepareRealtimeSession>;
  try {
    descriptor = prepareRealtimeSession({ surface });
  } catch (err) {
    log.error({ err }, "prepareRealtimeSession failed");
    closeWithReason(clientSocket, 1011, "Server misconfigured");
    return;
  }

  // ─── Open the outbound socket to OpenAI ────────────────────────────
  const upstream = new WebSocket(descriptor.url, {
    headers: descriptor.headers,
  });

  let upstreamReady = false;
  let closed = false;
  let inboundAudioBytes = 0;

  const sessionTimer = setTimeout(() => {
    log.info({ userId, surface }, "realtime session timeout — closing");
    closeAll("session_timeout");
  }, SESSION_MAX_MS);

  const closeAll = (reason: string) => {
    if (closed) return;
    closed = true;
    clearTimeout(sessionTimer);
    try {
      upstream.close(1000, reason);
    } catch {
      /* noop */
    }
    try {
      clientSocket.close(1000, reason);
    } catch {
      /* noop */
    }
  };

  upstream.on("open", () => {
    upstreamReady = true;
    try {
      upstream.send(JSON.stringify(descriptor.sessionUpdate));
      log.info({ userId, surface }, "realtime session opened");
    } catch (err) {
      log.error({ err }, "failed to send session.update");
      closeAll("session_update_failed");
    }
  });

  upstream.on("message", (data, isBinary) => {
    if (closed || clientSocket.readyState !== WebSocket.OPEN) return;
    try {
      clientSocket.send(data, { binary: isBinary });
    } catch (err) {
      log.warn({ err }, "forward upstream → client failed");
    }
  });

  upstream.on("close", (code, reasonBuf) => {
    const reason = reasonBuf?.toString?.() ?? "";
    log.info(
      { userId, surface, code, reason },
      "upstream closed",
    );
    closeAll(`upstream_closed:${code}`);
  });

  upstream.on("error", (err) => {
    log.error({ err }, "upstream socket error");
    closeAll("upstream_error");
  });

  // ─── Client → upstream proxy ───────────────────────────────────────
  clientSocket.on("message", (data, isBinary) => {
    if (closed) return;

    // Size cap per frame — cheap defence against malformed clients.
    const size = (data as Buffer).byteLength ?? 0;
    if (size > CLIENT_MESSAGE_BYTE_CAP) {
      log.warn({ size }, "client frame exceeds cap");
      closeAll("frame_too_large");
      return;
    }

    // Cumulative inbound audio cap — crude budget guard.
    // We inspect JSON events for the append opcode; binary frames are counted
    // in full because we do not know their semantics.
    if (isBinary) {
      inboundAudioBytes += size;
    } else {
      try {
        const parsed = JSON.parse(data.toString());
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.type === "input_audio_buffer.append" &&
          typeof parsed.audio === "string"
        ) {
          // base64 decodes to roughly 3/4 of its length
          inboundAudioBytes += Math.floor((parsed.audio.length * 3) / 4);
        }
      } catch {
        // Not JSON — fall through, forward anyway.
      }
    }
    if (inboundAudioBytes > INBOUND_AUDIO_BYTE_CAP) {
      log.warn(
        { userId, surface, bytes: inboundAudioBytes },
        "inbound audio cap exceeded",
      );
      closeAll("audio_cap_exceeded");
      return;
    }

    if (!upstreamReady) {
      // Small buffering grace: drop if upstream is not yet open. Client
      // should wait for an ack event before streaming audio, but we do not
      // crash if it does not.
      return;
    }
    try {
      upstream.send(data, { binary: isBinary });
    } catch (err) {
      log.warn({ err }, "forward client → upstream failed");
    }
  });

  clientSocket.on("close", (code, reasonBuf) => {
    const reason = reasonBuf?.toString?.() ?? "";
    log.info(
      { userId, surface, code, reason },
      "client closed",
    );
    closeAll(`client_closed:${code}`);
  });

  clientSocket.on("error", (err) => {
    log.warn({ err }, "client socket error");
    closeAll("client_error");
  });
}

function closeWithReason(
  socket: WebSocket,
  code: number,
  reason: string,
): void {
  try {
    socket.close(code, reason);
  } catch {
    /* noop */
  }
}
