import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db, schema, eq } from "@aissisted/db";
import { config } from "../config.js";
import { getLatestBiomarkers } from "./biomarker.service.js";
import { getProfile } from "./profile.service.js";
import { writeAuditLog } from "./audit.service.js";
import {
  evaluate,
  buildSignalsFromBiomarkers,
  buildSignalsFromGoals,
} from "../engine/evaluator.js";
import { desc } from "@aissisted/db";
import {
  checkInteractions,
  formatInteractionWarnings,
  checkAllergyContraindications,
  formatAllergyWarnings,
} from "../engine/interactions.js";
import { gte, and } from "@aissisted/db";

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
  const allergies: string[] = JSON.parse((profile as any)?.allergies ?? "[]");

  const biomarkerSignals = buildSignalsFromBiomarkers(biomarkers);
  const goalSignals = buildSignalsFromGoals(goals);
  const allSignals = [...biomarkerSignals, ...goalSignals];

  // 2. Run rules engine
  const scored = evaluate(allSignals, conditions, medications);

  // 2b. Load last-30-day adherence logs to personalize scoring
  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentLogs = await db
    .select({
      supplementName: schema.supplementLogs.supplementName,
      skipped: schema.supplementLogs.skipped,
      takenAt: schema.supplementLogs.takenAt,
    })
    .from(schema.supplementLogs)
    .where(
      and(
        eq(schema.supplementLogs.userId, userId),
        gte(schema.supplementLogs.createdAt, cutoff30)
      )
    );

  // Build per-supplement adherence rate (lower score for consistently skipped)
  const adherenceMap = new Map<string, { taken: number; skipped: number }>();
  for (const log of recentLogs) {
    const key = log.supplementName.toLowerCase();
    const curr = adherenceMap.get(key) ?? { taken: 0, skipped: 0 };
    if (log.skipped) curr.skipped++;
    else if (log.takenAt) curr.taken++;
    adherenceMap.set(key, curr);
  }

  const scoredAdjusted = scored.map((r) => {
    const key = r.recommendation.name.toLowerCase();
    const adhData = adherenceMap.get(key);
    if (!adhData || adhData.taken + adhData.skipped < 3) return r;
    const rate = adhData.taken / (adhData.taken + adhData.skipped);
    if (rate < 0.3) return { ...r, score: r.score * 0.75 }; // frequently skipped
    if (rate >= 0.8) return { ...r, score: Math.min(r.score * 1.08, 1.0) }; // consistently taken
    return r;
  });

  // Re-sort after score adjustment
  scoredAdjusted.sort((a, b) => b.score - a.score);

  // 3. Take top 6 recommendations
  const topRecs = scoredAdjusted.slice(0, 6);

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

  // 4b. Run safety checks: interactions + allergy blocking
  const supplementNames = topRecs.map((r) => r.recommendation.name);
  const interactions = checkInteractions(supplementNames, medications, conditions);
  const interactionWarnings = formatInteractionWarnings(interactions);

  const allergyBlocks = checkAllergyContraindications(supplementNames, allergies);
  const allergyWarnings = formatAllergyWarnings(allergyBlocks);
  const blockedByAllergy = new Set(allergyBlocks.map((b) => b.supplement.toLowerCase()));

  // Contraindicated by drug interaction (severity = contraindicated)
  const blockedByInteraction = new Set(
    interactions
      .filter((i) => i.severity === "contraindicated")
      .flatMap((i) => [i.supplement, i.interactsWith])
  );

  // 5. Synthesize with Claude
  let summary = "";
  let warnings: string[] = [...interactionWarnings, ...allergyWarnings];

  if (config.anthropicApiKey) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: "You are Aissisted's protocol synthesis engine. Given a user's health data and a set of ranked supplement recommendations, write a concise, personalized protocol summary (3-4 sentences). Focus on the highest-impact interventions and explain the physiological rationale in plain language. Also identify any additional warnings or cautions specific to this user's profile (beyond those already listed). Respond in JSON: { \"summary\": \"...\", \"warnings\": [\"...\"] }",
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: JSON.stringify({ ...signalsSummary, interactionWarnings }),
          },
        ],
      });

      const raw =
        message.content[0].type === "text" ? message.content[0].text : "";
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
      summary = parsed.summary ?? "";
      // Merge interaction warnings with any additional Claude warnings (deduplicated)
      const claudeWarnings: string[] = parsed.warnings ?? [];
      const allWarnings = [...interactionWarnings];
      for (const w of claudeWarnings) {
        if (!allWarnings.includes(w)) allWarnings.push(w);
      }
      warnings = allWarnings;
    } catch {
      summary = buildFallbackSummary(topRecs, goals);
    }
  } else {
    summary = buildFallbackSummary(topRecs, goals);
  }

  // 6. Persist protocol
  const protocolId = randomUUID();
  const now = new Date();

  await db.insert(schema.protocols).values({
    id: protocolId,
    userId,
    summary,
    warnings,
    signals: signalsSummary,
    createdAt: now,
  });

  if (topRecs.length > 0) {
    await db.insert(schema.recommendations).values(
      topRecs.map((r) => {
        const nameLower = r.recommendation.name.toLowerCase();
        const isBlockedAllergy = blockedByAllergy.has(nameLower);
        const isBlockedInteraction = blockedByInteraction.has(nameLower);
        const isBlocked = isBlockedAllergy || isBlockedInteraction;

        const allergyNote = isBlockedAllergy
          ? allergyBlocks.find((b) => b.supplement.toLowerCase() === nameLower)?.reason
          : undefined;
        const interactionNote = isBlockedInteraction
          ? interactions.find(
              (i) => i.severity === "contraindicated" &&
                (i.supplement === nameLower || i.interactsWith === nameLower)
            )?.description
          : undefined;

        return {
          id: randomUUID(),
          protocolId,
          name: r.recommendation.name,
          dosage: r.recommendation.dosage,
          timing: r.recommendation.timing,
          timeSlot: r.recommendation.timeSlot ?? null,
          rationale: r.recommendation.rationale,
          score: r.score,
          safetyStatus: isBlocked ? ("blocked" as const) : ("allowed" as const),
          safetyNote: allergyNote ?? interactionNote ?? null,
        };
      })
    );
  }

  writeAuditLog(userId, "protocol.generated", "protocols", protocolId, {
    recommendationCount: topRecs.length,
    warningCount: warnings.length,
    hasClaude: !!config.anthropicApiKey,
  }).catch(() => {});

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
    .orderBy(desc(schema.protocols.createdAt))
    .get();

  if (!protocol) return null;
  return getProtocol(protocol.id);
}

export async function getUserProtocols(userId: string, limit = 20) {
  const protocols = await db
    .select({
      id: schema.protocols.id,
      summary: schema.protocols.summary,
      warnings: schema.protocols.warnings,
      createdAt: schema.protocols.createdAt,
    })
    .from(schema.protocols)
    .where(eq(schema.protocols.userId, userId))
    .orderBy(desc(schema.protocols.createdAt))
    .limit(limit);

  return protocols.map((p) => ({
    ...p,
    warnings: JSON.parse(p.warnings) as string[],
  }));
}

function buildFallbackSummary(
  topRecs: { recommendation: { name: string } }[],
  goals: string[]
): string {
  const names = topRecs.map((r) => r.recommendation.name).join(", ");
  const goalText = goals.length > 0 ? `goals around ${goals.join(", ")}` : "your health signals";
  return `Based on ${goalText}, your protocol includes: ${names}. Each recommendation has been selected based on your biomarker data and personalized for your profile.`;
}
