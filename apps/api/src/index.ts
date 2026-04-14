import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { registerJwt } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { biomarkerRoutes } from "./routes/biomarkers.js";
import { protocolRoutes } from "./routes/protocol.js";

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

await registerJwt(app);

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

// ─── Start ───────────────────────────────────────────────
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Aissisted API running on http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
