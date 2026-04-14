import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",
  // WHOOP integration
  whoop: {
    clientId: process.env.WHOOP_CLIENT_ID ?? "",
    clientSecret: process.env.WHOOP_CLIENT_SECRET ?? "",
    redirectUri: process.env.WHOOP_REDIRECT_URI ?? "http://localhost:4000/integrations/whoop/callback",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    apiBase: "https://api.prod.whoop.com/developer/v1",
    scopes: "read:recovery read:sleep read:workout read:body_measurement read:profile",
  },
  // FHIR integration
  fhir: {
    baseUrl: process.env.FHIR_BASE_URL ?? "",
    clientId: process.env.FHIR_CLIENT_ID ?? "",
    redirectUri: process.env.FHIR_REDIRECT_URI ?? "http://localhost:4000/integrations/fhir/callback",
  },
} as const;
