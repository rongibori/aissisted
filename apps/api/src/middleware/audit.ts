import { randomUUID } from "crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db, schema } from "@aissisted/db";

/**
 * Audit log middleware.
 *
 * Logs all state-mutating requests (POST, PATCH, PUT, DELETE) to the
 * audit_log table after the response is sent. Failures are swallowed
 * so they never break the request flow.
 */
export async function registerAuditLog(app: FastifyInstance) {
  app.addHook("onResponse", async (request, reply) => {
    // Only log mutating methods
    const method = request.method.toUpperCase();
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(method)) return;

    // Only log successful (2xx/3xx) responses
    if (reply.statusCode >= 500) return;

    // Extract userId from JWT if present
    let userId: string | undefined;
    try {
      const payload = request.user as { sub?: string } | undefined;
      userId = payload?.sub;
    } catch {
      // unauthenticated request
    }

    const action = `${method} ${request.url.split("?")[0]}`;
    const resource = deriveResource(request.url);
    const resourceId = deriveResourceId(request.url);

    const detail: Record<string, unknown> = {
      statusCode: reply.statusCode,
      ip: request.ip,
    };

    // Include safe parts of the request body (never passwords/tokens)
    if (request.body && typeof request.body === "object") {
      const body = request.body as Record<string, unknown>;
      const safeBody: Record<string, unknown> = {};
      for (const key of Object.keys(body)) {
        if (!["password", "token", "secret", "hash"].includes(key.toLowerCase())) {
          safeBody[key] = body[key];
        }
      }
      if (Object.keys(safeBody).length > 0) {
        detail.body = safeBody;
      }
    }

    try {
      await db.insert(schema.auditLog).values({
        id: randomUUID(),
        userId: userId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        detail,
        createdAt: new Date(),
      });
    } catch {
      // Never let audit logging break a request
    }
  });
}

function deriveResource(url: string): string {
  const path = url.split("?")[0].replace(/^\//, "");
  const parts = path.split("/");
  return parts[0] ?? "unknown";
}

function deriveResourceId(url: string): string | null {
  const path = url.split("?")[0].replace(/^\//, "");
  const parts = path.split("/");
  // Heuristic: if 3rd part looks like a UUID or ID, use it
  const id = parts[2] ?? parts[1] ?? null;
  if (id && /^[a-f0-9-]{8,}$/i.test(id)) return id;
  return null;
}
