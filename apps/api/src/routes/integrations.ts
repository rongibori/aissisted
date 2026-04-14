import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { db, schema, eq } from "@aissisted/db";

// WHOOP
import { buildAuthUrl, exchangeCode, storeTokens } from "../integrations/whoop/oauth.js";
import { getLatestRecovery, getLatestSleep } from "../integrations/whoop/client.js";
import { recoveryToSignals, sleepToSignals } from "../integrations/whoop/normalizer.js";

// Apple Health
import { parseAppleHealthXml } from "../integrations/apple-health/parser.js";
import { normalizeAppleHealthRecords } from "../integrations/apple-health/normalizer.js";

// FHIR
import { getSmartConfig, buildFhirAuthUrl, exchangeFhirCode, fetchObservations } from "../integrations/fhir/client.js";
import { normalizeObservations } from "../integrations/fhir/normalizer.js";

// Shared: persist biomarkers from integration
async function persistBiomarkers(
  userId: string,
  entries: Array<{ name: string; value: number; unit: string; source: string; measuredAt: string }>
): Promise<number> {
  if (entries.length === 0) return 0;
  let count = 0;
  const now = new Date().toISOString();
  for (const entry of entries) {
    try {
      await db.insert(schema.biomarkers).values({
        id: randomUUID(),
        userId,
        name: entry.name,
        value: entry.value,
        unit: entry.unit,
        source: entry.source,
        measuredAt: entry.measuredAt,
        createdAt: now,
      });
      count++;
    } catch {
      // Skip duplicates or constraint violations
    }
  }
  return count;
}

export async function integrationsRoutes(app: FastifyInstance) {
  // ─── Status ────────────────────────────────────────────

  /** GET /integrations/status — which providers are connected */
  app.get(
    "/integrations/status",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const tokens = await db
        .select({ provider: schema.integrationTokens.provider, updatedAt: schema.integrationTokens.updatedAt })
        .from(schema.integrationTokens)
        .where(eq(schema.integrationTokens.userId, sub));

      const connected: Record<string, { connectedAt: string }> = {};
      for (const t of tokens) {
        connected[t.provider] = { connectedAt: t.updatedAt };
      }

      reply.send({ data: { connected } });
    }
  );

  // ─── WHOOP ─────────────────────────────────────────────

  /** GET /integrations/whoop/connect — redirect to WHOOP OAuth */
  app.get(
    "/integrations/whoop/connect",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      if (!config.whoop.clientId) {
        return reply.status(501).send({ error: { message: "WHOOP integration not configured", code: "NOT_CONFIGURED" } });
      }
      const state = randomUUID();
      // In production store state in session/Redis; here we embed userId in state
      const { sub } = request.user as { sub: string };
      const authUrl = buildAuthUrl(`${sub}:${state}`);
      reply.redirect(authUrl);
    }
  );

  /** GET /integrations/whoop/callback — OAuth2 callback */
  app.get(
    "/integrations/whoop/callback",
    async (request, reply) => {
      const { code, state, error } = request.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (error || !code || !state) {
        return reply.redirect("/?error=whoop_auth_failed");
      }

      // State format: "{userId}:{nonce}"
      const userId = state.split(":")[0];
      if (!userId) return reply.redirect("/?error=invalid_state");

      try {
        const tokens = await exchangeCode(code);
        await storeTokens(userId, tokens);

        // Immediately fetch and persist initial WHOOP data
        await syncWhoopData(userId);

        reply.redirect("/dashboard?connected=whoop");
      } catch (err: any) {
        app.log.error(err, "WHOOP callback error");
        reply.redirect("/?error=whoop_token_exchange_failed");
      }
    }
  );

  /** POST /integrations/whoop/sync — manual sync */
  app.post(
    "/integrations/whoop/sync",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      try {
        const count = await syncWhoopData(sub);
        reply.send({ data: { synced: count } });
      } catch (err: any) {
        reply.status(400).send({ error: { message: err.message, code: "WHOOP_SYNC_FAILED" } });
      }
    }
  );

  // ─── Apple Health ─────────────────────────────────────

  /**
   * POST /integrations/apple-health/upload
   * Body: { xml: string }  — contents of export.xml (truncated to 2 MB)
   */
  app.post(
    "/integrations/apple-health/upload",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["xml"],
          properties: {
            xml: { type: "string", maxLength: 2_000_000 },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { xml } = request.body as { xml: string };

      const records = parseAppleHealthXml(xml);
      const normalized = normalizeAppleHealthRecords(records);
      const count = await persistBiomarkers(sub, normalized);

      reply.send({
        data: {
          parsed: records.length,
          imported: count,
        },
      });
    }
  );

  // ─── FHIR ─────────────────────────────────────────────

  /** GET /integrations/fhir/connect — SMART on FHIR launch */
  app.get(
    "/integrations/fhir/connect",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      if (!config.fhir.baseUrl || !config.fhir.clientId) {
        return reply.status(501).send({ error: { message: "FHIR integration not configured", code: "NOT_CONFIGURED" } });
      }

      const { sub } = request.user as { sub: string };
      const state = `${sub}:${randomUUID()}`;

      try {
        const smartConfig = await getSmartConfig();
        const authUrl = buildFhirAuthUrl(smartConfig, state);
        reply.redirect(authUrl);
      } catch (err: any) {
        reply.status(502).send({ error: { message: `SMART config fetch failed: ${err.message}`, code: "FHIR_CONNECT_FAILED" } });
      }
    }
  );

  /** GET /integrations/fhir/callback — SMART on FHIR callback */
  app.get(
    "/integrations/fhir/callback",
    async (request, reply) => {
      const { code, state, error } = request.query as {
        code?: string;
        state?: string;
        error?: string;
      };

      if (error || !code || !state) {
        return reply.redirect("/?error=fhir_auth_failed");
      }

      const userId = state.split(":")[0];
      if (!userId) return reply.redirect("/?error=invalid_state");

      try {
        const smartConfig = await getSmartConfig();
        const { accessToken, patientId } = await exchangeFhirCode(smartConfig, code);

        // Store token
        const now = new Date().toISOString();
        const existing = await db
          .select()
          .from(schema.integrationTokens)
          .where(eq(schema.integrationTokens.userId, userId))
          .get();

        const tokenData = {
          accessToken,
          metadata: JSON.stringify({ patientId }),
          updatedAt: now,
        };

        if (existing) {
          await db.update(schema.integrationTokens).set(tokenData).where(eq(schema.integrationTokens.userId, userId));
        } else {
          await db.insert(schema.integrationTokens).values({
            id: randomUUID(),
            userId,
            provider: "fhir",
            ...tokenData,
            createdAt: now,
          });
        }

        // Fetch and persist observations
        const observations = await fetchObservations(accessToken, patientId);
        const normalized = normalizeObservations(observations);
        await persistBiomarkers(userId, normalized);

        reply.redirect("/dashboard?connected=fhir");
      } catch (err: any) {
        app.log.error(err, "FHIR callback error");
        reply.redirect("/?error=fhir_token_exchange_failed");
      }
    }
  );
}

// ─── Helpers ─────────────────────────────────────────────

async function syncWhoopData(userId: string): Promise<number> {
  const [recovery, sleep] = await Promise.all([
    getLatestRecovery(userId),
    getLatestSleep(userId),
  ]);

  const biomarkerEntries: Array<{ name: string; value: number; unit: string; source: string; measuredAt: string }> = [];

  if (recovery?.score_state === "SCORED") {
    const signals = recoveryToSignals(recovery);
    const measuredAt = recovery.created_at;
    for (const s of signals) {
      biomarkerEntries.push({
        name: s.name,
        value: s.value,
        unit: s.unit ?? "",
        source: "whoop",
        measuredAt,
      });
    }
  }

  if (sleep?.score_state === "SCORED") {
    const signals = sleepToSignals(sleep);
    const measuredAt = sleep.end;
    for (const s of signals) {
      biomarkerEntries.push({
        name: s.name,
        value: s.value,
        unit: s.unit ?? "",
        source: "whoop",
        measuredAt,
      });
    }
  }

  return persistBiomarkers(userId, biomarkerEntries);
}
