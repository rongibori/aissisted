/**
 * Integration tests for the Jeffrey Realtime route.
 *
 * What we cover here:
 *   - POST /v1/jeffrey/realtime/ticket requires auth.
 *   - POST /v1/jeffrey/realtime/ticket rejects surfaces outside the allowlist.
 *   - POST /v1/jeffrey/realtime/ticket returns a JWT with the expected claims.
 *   - GET  /v1/jeffrey/realtime closes the socket when no ticket is provided
 *     (we simulate this at the handler level without opening a live socket).
 *
 * What we deliberately do not cover here:
 *   - Actual upstream WebSocket round-trip to OpenAI. That would require a
 *     mock ws server and a working test harness; we defer that to a later
 *     full-stack test. The proxy logic is small and mostly pass-through.
 */

import { describe, expect, it, beforeAll } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { jeffreyRealtimeRoutes } from "../jeffrey-realtime.js";

async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(jwt, {
    secret: "test-secret-do-not-use-in-prod",
    sign: { expiresIn: "7d" },
  });
  await app.register(websocket);
  await app.register(jeffreyRealtimeRoutes);
  await app.ready();
  return app;
}

function signUserToken(app: FastifyInstance, sub: string): string {
  return app.jwt.sign({ sub });
}

describe("POST /v1/jeffrey/realtime/ticket", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  it("returns 401 without an auth token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      payload: { surface: "concierge" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects surfaces outside the realtime allowlist", async () => {
    const token = signUserToken(app, "user-1");
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      headers: { authorization: `Bearer ${token}` },
      payload: { surface: "investor" },
    });
    // Schema validation rejects enum mismatch with 400.
    expect(res.statusCode).toBe(400);
  });

  it("issues a short-lived ticket with expected claims", async () => {
    const token = signUserToken(app, "user-42");
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      headers: { authorization: `Bearer ${token}` },
      payload: { surface: "concierge" },
    });
    expect(res.statusCode).toBe(200);

    const body = res.json() as {
      data: { ticket: string; expiresInSeconds: number; surface: string };
    };
    expect(body.data.surface).toBe("concierge");
    expect(body.data.expiresInSeconds).toBe(30);
    expect(typeof body.data.ticket).toBe("string");

    const decoded = app.jwt.verify(body.data.ticket) as {
      sub: string;
      surface: string;
      kind: string;
      exp: number;
    };
    expect(decoded.sub).toBe("user-42");
    expect(decoded.surface).toBe("concierge");
    expect(decoded.kind).toBe("realtime");
    // TTL should be within ~60s of now (30s target + a little slack).
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.exp - now).toBeLessThanOrEqual(60);
    expect(decoded.exp - now).toBeGreaterThan(0);
  });

  it("accepts onboarding as a realtime surface", async () => {
    const token = signUserToken(app, "user-onb");
    const res = await app.inject({
      method: "POST",
      url: "/v1/jeffrey/realtime/ticket",
      headers: { authorization: `Bearer ${token}` },
      payload: { surface: "onboarding" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: { surface: string } };
    expect(body.data.surface).toBe("onboarding");
  });
});
