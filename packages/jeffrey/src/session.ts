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
  CapturedTurnResult,
  JeffreyAskOptions,
  JeffreyReply,
  JeffreySessionInput,
  JeffreySurface,
  JeffreyUserProfile,
  TurnCost,
} from "./types.js";
import { systemPrompt } from "./prompts/index.js";

interface SurfaceDefaults {
  temperature: number;
  maxTokens: number;
}

// OpenAI list pricing as of 2026-04-29; review quarterly.
const OPENAI_PRICING: Record<string, { promptPer1M: number; completionPer1M: number }> = {
  "gpt-4o":              { promptPer1M: 2.50,  completionPer1M: 10.00 },
  "gpt-4o-mini":         { promptPer1M: 0.15,  completionPer1M: 0.60  },
  "gpt-4-turbo":         { promptPer1M: 10.00, completionPer1M: 30.00 },
  "gpt-4-turbo-preview": { promptPer1M: 10.00, completionPer1M: 30.00 },
};

function deriveCost(model: string, usage: JeffreyReply["usage"]): TurnCost {
  const promptTokens = usage?.promptTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? 0;
  const pricing = OPENAI_PRICING[model];
  let usd: number | null;
  if (pricing) {
    usd = (promptTokens * pricing.promptPer1M + completionTokens * pricing.completionPer1M) / 1_000_000;
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[jeffrey] unknown model for cost derivation: ${model}`);
    usd = null;
  }
  return { model, promptTokens, completionTokens, usd };
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
  ask(question: string, options?: JeffreyAskOptions): Promise<CapturedTurnResult>;
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
  ): Promise<CapturedTurnResult> => {
    const turnStart = performance.now();

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
    const llmStart = performance.now();
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
    const llmMs = performance.now() - llmStart;

    const choice = completion.choices[0];
    const text = choice?.message?.content?.trim() ?? "";
    const violations = checkBrandVoice(text);
    if (violations.length > 0) {
      // Soft-fail: log and return. Callers can opt into a retry path.
      // eslint-disable-next-line no-console
      console.warn("[jeffrey] brand-voice violations", violations);
    }

    memory.push({ role: "assistant", content: text });

    const reply: JeffreyReply = {
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

    const totalMs = performance.now() - turnStart;

    return {
      reply,
      timing: { totalMs, llmMs },
      cost: deriveCost(completion.model, reply.usage),
      ...(options.captureRaw ? { raw: completion } : {}),
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
