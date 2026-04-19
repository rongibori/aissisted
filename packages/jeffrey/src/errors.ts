/**
 * Typed errors for @aissisted/jeffrey.
 *
 * Callers in apps/api should catch the specific subclass they care about and
 * let the rest bubble to the generic error handler.
 */

export class JeffreyError extends Error {
  public readonly code: string;
  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "JeffreyError";
    this.code = code;
  }
}

/** Missing or invalid environment configuration. */
export class JeffreyConfigError extends JeffreyError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("JEFFREY_CONFIG_ERROR", message, options);
    this.name = "JeffreyConfigError";
  }
}

/** Provider (OpenAI / ElevenLabs) returned a non-recoverable error. */
export class JeffreyProviderError extends JeffreyError {
  public readonly provider: "openai" | "elevenlabs";
  constructor(
    provider: "openai" | "elevenlabs",
    message: string,
    options?: { cause?: unknown },
  ) {
    super("JEFFREY_PROVIDER_ERROR", message, options);
    this.name = "JeffreyProviderError";
    this.provider = provider;
  }
}

/** The caller asked Jeffrey to do something outside his scope (medical, legal, etc). */
export class JeffreyScopeError extends JeffreyError {
  constructor(message: string) {
    super("JEFFREY_SCOPE_ERROR", message);
    this.name = "JeffreyScopeError";
  }
}

/** The voice pipeline failed mid-stream. */
export class JeffreyVoiceError extends JeffreyError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("JEFFREY_VOICE_ERROR", message, options);
    this.name = "JeffreyVoiceError";
  }
}
