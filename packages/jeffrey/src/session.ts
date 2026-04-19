/**
 * High-level Jeffrey session.
 *
 * A session is the unit callers interact with. It binds:
 *   - the validated config
 *   - the OpenAI client
 *   - the chosen surface (investor / onboarding / health / ...)
 *   - the memory (ephemeral + long-term adapter)
 *   - the brand-voice guard
 *
 * Callers in apps/api should do:
 *   const session = await createJeffreySession({ surface, userId });
 *   const reply = await session.ask("...");
 */

import { loadConfig } from "./config.js";
import { getOpenAIClient } from "./client.js";
import { JeffreyProviderError, JeffreyScopeError } from "./errors.js";
import {
  checkBrandVoice,
  toneBySurface,
  jeffreyIdentity,
} from "./personality.js";
import {
  composeMemoryPreamble,
  createSessionMemory,
  noopMemoryAdapter,
  type LongTermMemoryAdapter,
  type SessionMemory,
} from "./memory.js";
import { investorSurface, detectInvestorTopic, investorContextFor } from "./investor.js";
import { onboardingSurface } from "./onboarding.js";
import { healthSurface, escalateIfPatternMatches } from "./health-tools.js";
import { competitiveSurface } from "./competitive.js";
import type {
  JeffreyAskOptions,
  JeffreyReply,
  JeffreySessionInput,
  JeffreySurface,
  JeffreyUserProfile,
} from "./types.js";
import { systemPrompt } from "./prompts/index.js";

interface SurfaceDefaults {
  temperature: number;
  maxTokens: number;
}

const SURFACE_DEFAULTS: Record<JeffreySurface, SurfaceDefaults> = {
  investor: investorSurface,
  onboarding: onboardingSurface,
  "product-walkthrough": { temperature: 0.35, maxTokens: 600 },
  health: healthSurface,
  brand: { temperature: 0.5, maxTokens: 450 },
  concierge: { temperature: 0.35, maxTokens: 600 },
};

export interface JeffreySession {
  readonly surface: JeffreySurface;
  readonly userId?: string;
  ask(question: string, options?: JeffreyAskOptions): Promise<JeffreyReply>;
  memory: SessionMemory;
}

export interface CreateSessionOptions extends JeffreySessionInput {
  /** Inject the long-term memory adapter (Postgres, Redis, etc). */
  memoryAdapter?: LongTermMemoryAdapter;
}

export async function createJeffreySession(
  input: CreateSessionOptions,
): Promise<JeffreySession> {
  const cfg = loadConfig();
  const openai = getOpenAIClient(cfg);
  const adapter = input.memoryAdapter ?? noopMemoryAdapter;

  const profile: JeffreyUserProfile | null = input.profile
    ? input.profile
    : input.userId
      ? await adapter.getProfile(input.userId)
      : null;

  const longTerm = input.userId ? await adapter.listEntries(input.userId) : [];
  const memoryPreamble = composeMemoryPreamble(profile, longTerm);

  const tone = toneBySurface[input.surface];
  const defaults = SURFACE_DEFAULTS[input.surface];
  const model = input.model ?? cfg.OPENAI_JEFFREY_MODEL;

  const systemParts: string[] = [
    systemPrompt,
    `### Current surface\n${input.surface} (tone: ${tone})`,
  ];
  if (memoryPreamble) systemParts.push(memoryPreamble);
  if (input.extraContext?.length) {
    systemParts.push("### Additional context\n" + input.extraContext.join("\n\n"));
  }

  const memory = createSessionMemory([
    { role: "system", content: systemParts.join("\n\n") },
  ]);

  const ask = async (
    question: string,
    options: JeffreyAskOptions = {},
  ): Promise<JeffreyReply> => {
    // Pre-flight scope checks.
    if (input.surface === "health") {
      const escalate = escalateIfPatternMatches(question);
      if (escalate) {
        throw new JeffreyScopeError(
          `This pattern (${escalate}) warrants clinical attention — ${jeffreyIdentity.name} defers to a clinician here.`,
        );
      }
    }

    // Investor-surface topic injection.
    if (input.surface === "investor") {
      const topic = detectInvestorTopic(question);
      if (topic) {
        memory.push({ role: "system", content: investorContextFor(topic) });
      }
    }

    memory.push({ role: "user", content: question });

    const temperature = options.temperature ?? defaults.temperature;
    const maxTokens = options.maxTokens ?? defaults.maxTokens;

    let completion;
    try {
      completion = await openai.chat.completions.create(
        {
          model,
          temperature,
          max_tokens: maxTokens,
          messages: memory.snapshot().map((m) => ({
            role: m.role === "tool" ? "tool" : m.role,
            content: m.content,
            ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
          })) as never,
        },
        options.signal ? { signal: options.signal } : undefined,
      );
    } catch (err) {
      throw new JeffreyProviderError(
        "openai",
        "OpenAI completion failed",
        { cause: err },
      );
    }

    const choice = completion.choices[0];
    const text = choice?.message?.content?.trim() ?? "";
    const violations = checkBrandVoice(text);
    if (violations.length > 0) {
      // Soft-fail: log and return. Callers can opt into a retry path.
      // eslint-disable-next-line no-console
      console.warn("[jeffrey] brand-voice violations", violations);
    }

    memory.push({ role: "assistant", content: text });

    return {
      text,
      model: completion.model,
      createdAt: new Date().toISOString(),
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  };

  // Touch unused-but-intentionally-registered surfaces so tree-shaking keeps
  // their modules in the graph (they hold prompt data).
  void competitiveSurface;

  return {
    surface: input.surface,
    userId: input.userId,
    memory,
    ask,
  };
}
