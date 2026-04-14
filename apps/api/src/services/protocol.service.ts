import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db, schema, eq } from "@aissisted/db";
import { config } from "../config.js";
import { getLatestBiomarkers } from "./biomarker.service.js";
import { getProfile } from "./profile.service.js";
import {
  evaluate,
  buildSignalsFromBiomarkers,
  buildSignalsFromGoals,
} from "../engine/evaluator.js";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

export async function generateProtocol(userId: string) {
  // 1. Gather all signals
  const [profile, biomarkers] = await Promise.all([
    getProfile(userId),
    getLatestBiomarkers(userId),
  ]);

  const conditions = profile?.conditions ?? [];
  const medications = profile?.medications ?? [];
  const goals = profile?.goals ?? [];

  const biomarkerSignals = buildSignalsFromBiomarkers(biomarkers);
  const goalSignals = buildSignalsFromGoals(goals);
  const allSignals = [...biomarkerSignals, ...goalSignals];

  // 2. Run rules engine
  const scored = evaluate(allSignals, conditions, medications);

  // 3. Take top 6 recommendations
  const topRecs = scored.slice(0, 6);

  // 4. Build signals summary for Claude
  const signalsSummary = {
    biomarkers: biomarkers.map((b) => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
    })),
    goals,
    conditions,
    medications,
    recommendations: topRecs.map((r) => ({
      name: r.recommendation.name,
      dosage: r.recommendation.dosage,
      timing: r.recommendation.timing,
      rationale: r.recommendation.rationale,
      score: r.score,
    })),
  };

  // 5. Synthesize with Claude
  let summary = "";
  let warnings: string[] = [];

  if (config.anthropicApiKey) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `You are Aissisted's protocol synthesis engine. Given a user's health data and a set of ranked supplement recommendations, write a concise, personalized protocol summary (3-4 sentences). Focus on the highest-impact interventions and explain the physiological rationale in plain language. Also identify any warnings or cautions specific to this user's profile. Respond in JSON: { "summary": "...", "warnings": ["..."] }`,
        messages: [
          {
            role: "user",
            content: JSON.stringify(signalsSummary),
          },
        ],
      });

      const raw =
        message.content[0].type === "text" ? message.content[0].text : "";
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
      summary = parsed.summary ?? "";
      warnings = parsed.warnings ?? [];
    } catch {
      summary = buildFallbackSummary(topRecs, goals);
    }
  } else {
    summary = buildFallbackSummary(topRecs, goals);
  }

  // 6. Persist protocol
  const protocolId = randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.protocols).values({
    id: protocolId,
    userId,
    summary,
    warnings: JSON.stringify(warnings),
    signals: JSON.stringify(signalsSummary),
    createdAt: now,
  });

  if (topRecs.length > 0) {
    await db.insert(schema.recommendations).values(
      topRecs.map((r) => ({
        id: randomUUID(),
        protocolId,
        name: r.recommendation.name,
        dosage: r.recommendation.dosage,
        timing: r.recommendation.timing,
        rationale: r.recommendation.rationale,
        score: r.score,
      }))
    );
  }

  return getProtocol(protocolId);
}

export async function getProtocol(protocolId: string) {
  const protocol = await db
    .select()
    .from(schema.protocols)
    .where(eq(schema.protocols.id, protocolId))
    .get();

  if (!protocol) return null;

  const recs = await db
    .select()
    .from(schema.recommendations)
    .where(eq(schema.recommendations.protocolId, protocolId));

  return {
    ...protocol,
    warnings: JSON.parse(protocol.warnings),
    signals: JSON.parse(protocol.signals),
    recommendations: recs,
  };
}

export async function getLatestProtocol(userId: string) {
  const protocol = await db
    .select()
    .from(schema.protocols)
    .where(eq(schema.protocols.userId, userId))
    .orderBy(schema.protocols.createdAt)
    .get();

  if (!protocol) return null;
  return getProtocol(protocol.id);
}

function buildFallbackSummary(
  topRecs: { recommendation: { name: string } }[],
  goals: string[]
): string {
  const names = topRecs.map((r) => r.recommendation.name).join(", ");
  const goalText = goals.length > 0 ? `goals around ${goals.join(", ")}` : "your health signals";
  return `Based on ${goalText}, your protocol includes: ${names}. Each recommendation has been selected based on your biomarker data and personalized for your profile.`;
}
