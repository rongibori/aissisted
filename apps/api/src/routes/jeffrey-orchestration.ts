/**
 * /v1/jeffrey/embeddings + /v1/jeffrey/classify
 *
 * Server-side proxies for the orchestration layer:
 *
 *   - POST /v1/jeffrey/embeddings — batch embed concept anchors + streaming
 *     utterances via OpenAI text-embedding-3-small. Browser does cosine
 *     similarity locally.
 *
 *   - POST /v1/jeffrey/classify  — accurate intent + topic extraction on a
 *     finalized user utterance via gpt-4o-mini. Structured JSON output.
 *
 * OPENAI_API_KEY stays server-side. Both endpoints require auth.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "../middleware/auth.js";

// Module IDs and Intent enum mirrored locally so we don't reach into
// @aissisted/orchestrator from apps/api (cleaner dependency graph — the
// orchestrator package is a browser-side library).
const MODULE_IDS = [
  "sleep",
  "recovery",
  "stress",
  "performance",
  "metabolic",
  "labs",
  "stack",
] as const;
type ModuleId = (typeof MODULE_IDS)[number];

const INTENTS = [
  "question_about_data",
  "question_about_methodology",
  "question_about_trust",
  "objection",
  "request_for_change",
  "meta_navigation",
  "narrative_continue",
  "unknown",
] as const;
type Intent = (typeof INTENTS)[number];

const URGENCY_LEVELS = ["low", "normal", "high"] as const;
type Urgency = (typeof URGENCY_LEVELS)[number];

const EMBEDDING_MODEL = "text-embedding-3-small";
const CLASSIFY_MODEL = "gpt-4o-mini";

// Per-request hard caps so a runaway client can't burn budget.
const MAX_EMBED_TEXTS_PER_REQUEST = 64;
const MAX_EMBED_TEXT_LENGTH = 2000;
const MAX_CLASSIFY_TEXT_LENGTH = 1000;
const MAX_CLASSIFY_CONTEXT_TURNS = 8;

// ─── OpenAI client (lazy) ─────────────────────────────────────────────────

interface OpenAIEmbeddingsResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
}

interface OpenAIChatResponse {
  choices: { message: { content: string } }[];
  model: string;
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is required for orchestration endpoints",
    );
  }
  return key;
}

async function openaiEmbed(texts: string[]): Promise<OpenAIEmbeddingsResponse> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`OpenAI embeddings ${resp.status}: ${body.slice(0, 200)}`);
  }
  return (await resp.json()) as OpenAIEmbeddingsResponse;
}

async function openaiChatJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ parsed: T; model: string }> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAIKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLASSIFY_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`OpenAI chat ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI chat returned empty content");
  let parsed: T;
  try {
    parsed = JSON.parse(content) as T;
  } catch {
    throw new Error(`OpenAI chat returned non-JSON: ${content.slice(0, 200)}`);
  }
  return { parsed, model: data.model };
}

// ─── Classify prompt ──────────────────────────────────────────────────────

const CLASSIFY_SYSTEM_PROMPT = `You are a classifier for the AISSISTED Jeffrey orchestration layer.

Given a user utterance (and optional context + narrative hint), output a
structured JSON object with:

- intent: one of ${INTENTS.join(", ")}
- topics: array of zero or more module IDs from this set:
    ${MODULE_IDS.join(", ")}
  Topics are SEMANTIC — what the utterance is about, not keyword matches.
  An utterance like "how was my night?" is about "sleep" + "recovery".
  An utterance like "what's in my stack today?" is about "stack".
  Empty array is valid if the utterance is generic ("hello", "wait").
- topicConfidence: object mapping each topic in topics[] to a number 0..1.
- urgency: "low" | "normal" | "high".
  - high = user wants immediate action / safety concern / interruption
  - low = passing curiosity / aside
  - normal = default
- requiresDataLookup: true if answering will need the user's biomarkers,
  wearable data, or supplement protocol; false if it's a methodology/trust
  question or generic conversation.

Output ONLY the JSON object. No prose. No markdown fences.`;

interface ClassifyLlmResult {
  intent: Intent;
  topics: ModuleId[];
  topicConfidence: Partial<Record<ModuleId, number>>;
  urgency: Urgency;
  requiresDataLookup: boolean;
}

function isValidIntent(x: unknown): x is Intent {
  return typeof x === "string" && (INTENTS as readonly string[]).includes(x);
}
function isValidModuleId(x: unknown): x is ModuleId {
  return (
    typeof x === "string" && (MODULE_IDS as readonly string[]).includes(x)
  );
}
function isValidUrgency(x: unknown): x is Urgency {
  return (
    typeof x === "string" && (URGENCY_LEVELS as readonly string[]).includes(x)
  );
}

/** Defensive coercion of the LLM JSON into our schema. Drops unknown keys. */
function coerceClassifyResult(raw: unknown): ClassifyLlmResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const intent: Intent = isValidIntent(r.intent) ? r.intent : "unknown";

  const rawTopics = Array.isArray(r.topics) ? r.topics : [];
  const topics = rawTopics.filter(isValidModuleId);

  const rawConf =
    typeof r.topicConfidence === "object" && r.topicConfidence !== null
      ? (r.topicConfidence as Record<string, unknown>)
      : {};
  const topicConfidence: Partial<Record<ModuleId, number>> = {};
  for (const m of topics) {
    const v = Number(rawConf[m]);
    if (Number.isFinite(v)) topicConfidence[m] = Math.max(0, Math.min(1, v));
  }

  const urgency: Urgency = isValidUrgency(r.urgency) ? r.urgency : "normal";
  const requiresDataLookup = Boolean(r.requiresDataLookup);

  return { intent, topics, topicConfidence, urgency, requiresDataLookup };
}

// ─── Fastify plugin ───────────────────────────────────────────────────────

export async function jeffreyOrchestrationRoutes(
  app: FastifyInstance,
): Promise<void> {
  // ── POST /v1/jeffrey/embeddings ────────────────────────────────────────
  app.post(
    "/v1/jeffrey/embeddings",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["texts"],
          properties: {
            texts: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: MAX_EMBED_TEXTS_PER_REQUEST,
            },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as { texts: string[] };
      const texts = body.texts.map((t) => t.slice(0, MAX_EMBED_TEXT_LENGTH));

      try {
        const data = await openaiEmbed(texts);
        // Sort embeddings by index to be safe (OpenAI usually returns ordered).
        const sorted = [...data.data].sort((a, b) => a.index - b.index);
        return reply.send({
          embeddings: sorted.map((d) => d.embedding),
          count: sorted.length,
          model: data.model,
        });
      } catch (err) {
        req.log.error({ err }, "embeddings proxy failed");
        return reply
          .code(502)
          .send({ error: err instanceof Error ? err.message : "embed failed" });
      }
    },
  );

  // ── POST /v1/jeffrey/classify ──────────────────────────────────────────
  app.post(
    "/v1/jeffrey/classify",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", minLength: 1 },
            context: {
              type: "array",
              maxItems: MAX_CLASSIFY_CONTEXT_TURNS,
              items: {
                type: "object",
                required: ["role", "text"],
                properties: {
                  role: { type: "string", enum: ["user", "assistant"] },
                  text: { type: "string" },
                },
              },
            },
            narrativeHint: { type: "string" },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = req.body as {
        text: string;
        context?: { role: "user" | "assistant"; text: string }[];
        narrativeHint?: string;
      };
      const text = body.text.slice(0, MAX_CLASSIFY_TEXT_LENGTH);
      const context = body.context ?? [];
      const narrativeHint = body.narrativeHint?.slice(0, 500) ?? "";

      const userPrompt = JSON.stringify({
        utterance: text,
        narrative_hint: narrativeHint || null,
        recent_context: context.slice(-MAX_CLASSIFY_CONTEXT_TURNS),
      });

      try {
        const { parsed, model } = await openaiChatJson<unknown>(
          CLASSIFY_SYSTEM_PROMPT,
          userPrompt,
        );
        const result = coerceClassifyResult(parsed);
        return reply.send({ ...result, model });
      } catch (err) {
        req.log.error({ err }, "classify proxy failed");
        return reply
          .code(502)
          .send({ error: err instanceof Error ? err.message : "classify failed" });
      }
    },
  );

  // ── POST /v1/jeffrey/narrative-resolve ─────────────────────────────────
  // Skeleton — returns the next narrative node id given current node + intent.
  // Implementation lands in the next commit alongside the narrative tree.
  app.post(
    "/v1/jeffrey/narrative-resolve",
    {
      preHandler: [requireAuth],
      schema: {
        body: {
          type: "object",
          required: ["currentNodeId", "intent"],
          properties: {
            currentNodeId: { type: "string" },
            intent: { type: "string" },
            topics: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (
      _req: FastifyRequest,
      reply: FastifyReply,
    ) => {
      // Placeholder: returns null → orchestrator falls back to default branch.
      return reply.send({ nextNodeId: null });
    },
  );
}
