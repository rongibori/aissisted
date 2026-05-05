import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { db, schema, eq, desc, and } from "@aissisted/db";
import { persistRawBiomarkers } from "../services/biomarker.service.js";

// WHOOP
import { buildAuthUrl, exchangeCode, storeTokens } from "../integrations/whoop/oauth.js";
import { syncWhoopForUser } from "../integrations/whoop/sync.js";

// Apple Health
import { parseAppleHealthXml } from "../integrations/apple-health/parser.js";
import { normalizeAppleHealthRecords } from "../integrations/apple-health/normalizer.js";

// FHIR
import { getSmartConfig, buildFhirAuthUrl, exchangeFhirCode } from "../integrations/fhir/client.js";
import { storeFhirTokens, syncFhirForUser } from "../integrations/fhir/sync.js";


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

  /**
   * GET /integrations/sync-status
   *
   * Returns the most recent sync_batches row per provider for the
   * authenticated user. Used by the dashboard + integrations UI to surface
   * "Last synced N ago" indicators per source.
   */
  app.get(
    "/integrations/sync-status",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };

      // Pull recent batches for this user; we filter to the latest per source
      // in app code rather than fighting drizzle/sqlite for `MAX` + `GROUP BY`.
      const batches = await db
        .select({
          source: schema.syncBatches.source,
          status: schema.syncBatches.status,
          startedAt: schema.syncBatches.startedAt,
          completedAt: schema.syncBatches.completedAt,
          biomarkersInserted: schema.syncBatches.biomarkersInserted,
          errorMessage: schema.syncBatches.errorMessage,
        })
        .from(schema.syncBatches)
        .where(eq(schema.syncBatches.userId, sub))
        .orderBy(desc(schema.syncBatches.startedAt))
        .limit(200);

      const latestBySource = new Map<string, (typeof batches)[number]>();
      for (const b of batches) {
        if (!latestBySource.has(b.source)) latestBySource.set(b.source, b);
      }

      const data = {
        sources: Array.from(latestBySource.values()).map((b) => ({
          provider: b.source,
          status: b.status,
          startedAt: b.startedAt,
          lastCompletedAt: b.completedAt ?? null,
          biomarkersInserted: b.biomarkersInserted,
          errorMessage: b.errorMessage ?? null,
        })),
      };

      reply.send({ data });
    },
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
        await syncWhoopForUser(userId);

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
        const count = await syncWhoopForUser(sub);
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
      const count = await persistRawBiomarkers(sub, normalized);

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
        const { accessToken, refreshToken, expiresIn, patientId } =
          await exchangeFhirCode(smartConfig, code);

        // Store tokens via the sync module (handles provider filter correctly)
        await storeFhirTokens(userId, { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn }, patientId);

        // Full longitudinal history on initial connect
        const result = await syncFhirForUser(userId, true);
        app.log.info(
          `FHIR initial sync for ${userId}: ${result.observations} obs, ${result.diagnosticReports} reports, allergies=${result.allergiesUpdated}`
        );

        reply.redirect("/dashboard?connected=fhir");
      } catch (err: any) {
        app.log.error(err, "FHIR callback error");
        reply.redirect("/?error=fhir_token_exchange_failed");
      }
    }
  );

  /** POST /integrations/fhir/sync — manual re-sync */
  app.post(
    "/integrations/fhir/sync",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      try {
        const result = await syncFhirForUser(sub);
        reply.send({ data: result });
      } catch (err: any) {
        reply
          .status(400)
          .send({ error: { message: err.message, code: "FHIR_SYNC_FAILED" } });
      }
    }
  );
}

