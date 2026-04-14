import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { registerJwt } from "./middleware/auth.js";
import { registerAuditLog } from "./middleware/audit.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { biomarkerRoutes } from "./routes/biomarkers.js";
import { protocolRoutes } from "./routes/protocol.js";
import { chatRoutes } from "./routes/chat.js";
import { integrationsRoutes } from "./routes/integrations.js";

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

// ─── Health ──────────────────────────────────────────────
app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "0.1.0",
}));

// ─── Routes ──────────────────────────────────────────────
await app.register(authRoutes);
await app.register(profileRoutes);
await app.register(biomarkerRoutes);
await app.register(protocolRoutes);
await app.register(chatRoutes);
await app.register(integrationsRoutes);

// ─── Start ───────────────────────────────────────────────
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Aissisted API running on http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
