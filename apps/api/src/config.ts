import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",
} as const;
