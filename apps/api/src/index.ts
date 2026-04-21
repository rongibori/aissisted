import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { registerJwt } from "./middleware/auth.js";
import { registerAuditLog } from "./middleware/audit.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { biomarkerRoutes } from "./routes/biomarkers.js";
import { protocolRoutes } from "./routes/protocol.js";
import { chatRoutes } from "./routes/chat.js";
import { jeffreyRoutes } from "./routes/jeffrey.js";
import { jeffreyRealtimeRoutes } from "./routes/jeffrey-realtime.js";
import { integrationsRoutes } from "./routes/integrations.js";
import { adherenceRoutes } from "./routes/adherence.js";
import { healthStateRoutes } from "./routes/health-state.js";
import { startScheduler } from "./scheduler.js";
import { db, schema, sql } from "@aissisted/db";
import { migrate } from "drizzle-orm/libsql/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const app = Fastify({
  logger: {
    level: config.isDev ? "info" : "warn",
  },
});

// ─── Plugins ────────────────────────────────────────────
await app.register(cors, {
  origin: config.isDev ? true : ["https://aissisted.com"],
  credentials: true,
});

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
await app.register(helmet, {
  contentSecurityPolicy: config.isDev ? false : undefined,
});

// Rate limiting: 100 req/min per IP globally, stricter on auth routes
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: () => ({
    error: { message: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
  }),
});

await registerJwt(app);
await registerAuditLog(app);

// WebSocket support for Jeffrey Realtime proxy. Must register before routes
// that declare `{ websocket: true }`.
await app.register(websocket, {
  options: {
    // 1 MiB per frame is ample for JSON events; audio should be small chunks.
    maxPayload: 1 * 1024 * 1024,
  },
});

// ─── Health ──────────────────────────────────────────────
app.get("/health", async (_request, reply) => {
  let dbStatus = "ok";
  try {
    await db.run(sql`SELECT 1`);
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  reply.status(dbStatus === "ok" ? 200 : 503).send({
    status,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    checks: { db: dbStatus },
  });
});

// ─── Routes ──────────────────────────────────────────────
await app.register(authRoutes);
await app.register(profileRoutes);
await app.register(biomarkerRoutes);
await app.register(protocolRoutes);
await app.register(chatRoutes);
await app.register(jeffreyRoutes);
await app.register(jeffreyRealtimeRoutes);
await app.register(integrationsRoutes);
await app.register(adherenceRoutes);
await app.register(healthStateRoutes);

// ─── DB Migration ────────────────────────────────────────
try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = resolve(__dirname, "../../packages/db/drizzle");
  await migrate(db, { migrationsFolder });
  app.log.info("DB migrations applied");
} catch (err: any) {
  // Skip if no migration files exist yet (dev / push-based workflow)
  if (!err?.message?.includes("ENOENT")) {
    app.log.warn({ err }, "DB migration warning — continuing");
  }
}

// ─── Start ───────────────────────────────────────────────
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Aissisted API running on http://${config.host}:${config.port}`);
  startScheduler(app.log);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
