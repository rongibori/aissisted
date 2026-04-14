import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";

const app = Fastify({
  logger: {
    level: config.isDev ? "info" : "warn",
  },
});

await app.register(cors, {
  origin: config.isDev ? true : ["https://aissisted.com"],
  credentials: true,
});

// ─── Health check ────────────────────────────────────────
app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "0.1.0",
}));

// ─── Start ───────────────────────────────────────────────
try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Aissisted API running on http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
