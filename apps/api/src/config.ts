import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  // Jeffrey brain (canonical = OpenAI via @aissisted/jeffrey).
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  // Anthropic — retained for safe rollback of legacy jeffrey.service path and
  // for the intent parser (Haiku) until that is migrated too. Do not remove
  // without coordinating with services/intent.ts.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",

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
