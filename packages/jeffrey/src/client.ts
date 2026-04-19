/**
 * OpenAI client factory.
 *
 * Single responsibility: produce a configured OpenAI SDK client using the
 * validated Jeffrey config. Session and bridge modules consume this — they
 * should not instantiate the SDK directly.
 *
 * Server-only. Never bundle into the browser.
 */

import OpenAI from "openai";
import { loadConfig, type JeffreyConfig } from "./config.js";
import { JeffreyProviderError } from "./errors.js";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(cfg: JeffreyConfig = loadConfig()): OpenAI {
  if (cachedClient) return cachedClient;
  try {
    cachedClient = new OpenAI({ apiKey: cfg.OPENAI_API_KEY });
    return cachedClient;
  } catch (err) {
    throw new JeffreyProviderError(
      "openai",
      "Failed to initialise OpenAI client",
      { cause: err },
    );
  }
}

/** For tests only. */
export function resetClientForTests(): void {
  cachedClient = null;
}
