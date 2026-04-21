import "dotenv/config";

/**
 * Parse ALLOWED_ORIGINS into a clean string[] for CORS.
 *
 * Accepts a comma-separated list of origins. Whitespace is trimmed. Empty
 * entries are dropped. Example:
 *
 *   ALLOWED_ORIGINS="https://aissisted.com,https://app.aissisted.com"
 *
 * Returns an empty array when ALLOWED_ORIGINS is unset or blank. Any
 * environment-specific permissive CORS behavior is handled outside this
 * parser (see index.ts, which enables any-origin only when isDev).
 */
function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  /** Parsed ALLOWED_ORIGINS entries for CORS. Empty list means none were explicitly configured; index.ts then falls back to the hard-coded production allowlist (["https://aissisted.com"]) unless isDev, which permits any origin. */
  allowedOrigins: parseAllowedOrigins(),

  // Jeffrey brain — canonical OpenAI via @aissisted/jeffrey. All surfaces
  // (intent, protocol synthesis, health chat, investor/onboarding/brand)
  // route through this one key. The legacy Anthropic rollback was retired
  // once OpenAI-canonical soaked; no second provider remains.
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  // Jeffrey voice (ElevenLabs streaming TTS). Optional in dev; when unset the
  // /v1/jeffrey/voice/tts endpoint responds 503.
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? "",
    voiceId: process.env.ELEVENLABS_JEFFREY_VOICE_ID ?? "",
  },

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
