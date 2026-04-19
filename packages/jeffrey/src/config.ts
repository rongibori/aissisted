/**
 * Environment configuration for Jeffrey.
 *
 * Validated once per process via zod. Missing required keys throw
 * JeffreyConfigError at session start — never at request time inside a user
 * interaction.
 *
 * Server-only. Do not import from client bundles.
 */

import { z } from "zod";
import { JeffreyConfigError } from "./errors.js";

const envSchema = z.object({
  // --- OpenAI (brain, required) ---
  OPENAI_API_KEY: z
    .string()
    .min(20, "OPENAI_API_KEY is missing or malformed"),
  OPENAI_JEFFREY_MODEL: z.string().default("gpt-4o"),
  OPENAI_JEFFREY_REALTIME_MODEL: z
    .string()
    .default("gpt-4o-realtime-preview"),

  // --- ElevenLabs (voice, optional for text-only surfaces) ---
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_JEFFREY_VOICE_ID: z.string().optional(),
  ELEVENLABS_MODEL: z.string().default("eleven_flash_v2_5"),

  // --- Runtime tuning ---
  JEFFREY_DEFAULT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.4),
  JEFFREY_DEFAULT_MAX_TOKENS: z.coerce.number().int().positive().default(800),
});

export type JeffreyConfig = z.infer<typeof envSchema>;

let cached: JeffreyConfig | null = null;

/**
 * Load + validate Jeffrey config. Throws JeffreyConfigError if invalid.
 * Cached per process; call `resetConfigForTests()` in test setup if needed.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): JeffreyConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new JeffreyConfigError(`Invalid Jeffrey config — ${detail}`);
  }
  cached = parsed.data;
  return cached;
}

/** Require ElevenLabs config for voice surfaces. */
export function requireVoiceConfig(cfg: JeffreyConfig): void {
  if (!cfg.ELEVENLABS_API_KEY) {
    throw new JeffreyConfigError(
      "ELEVENLABS_API_KEY is required for voice surfaces",
    );
  }
  if (!cfg.ELEVENLABS_JEFFREY_VOICE_ID) {
    throw new JeffreyConfigError(
      "ELEVENLABS_JEFFREY_VOICE_ID is required for voice surfaces",
    );
  }
}

/** For tests only. */
export function resetConfigForTests(): void {
  cached = null;
}
