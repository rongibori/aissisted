/**
 * Seeds a single rich demo profile so a fresh checkout shows an interesting
 * dashboard immediately, without depending on live OAuth credentials.
 *
 * - Creates (or refreshes) `demo@aissisted.health` / `demo1234!`
 * - Wipes the demo user's domain data on each run; user row is preserved
 *   so the password stays valid.
 * - Drives data through the real services so trends, health state, and
 *   protocol pipelines all see realistic input.
 *
 * Run with: pnpm seed:demo
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, schema, eq } from "@aissisted/db";

import { upsertProfile } from "../src/services/profile.service.js";
import { addBiomarker } from "../src/services/biomarker.service.js";
import { generateProtocol } from "../src/services/protocol.service.js";
import { logSupplement } from "../src/services/adherence.service.js";
import {
  getOrCreateConversation,
  addMessage,
} from "../src/services/conversation.service.js";
import { computeBiomarkerTrends } from "../src/services/trends.service.js";
import { computeHealthState } from "../src/services/analysis.service.js";

const DEMO_EMAIL = "demo@aissisted.health";
const DEMO_PASSWORD = "demo1234!";

// ─── Helpers ─────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(8, 0, 0, 0);
  return d.toISOString();
}

// Tiny seeded RNG so noise is deterministic across runs.
function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 10000) / 10000;
  };
}

// ─── Reset domain data for the demo user ─────────────────

async function wipeUserData(userId: string) {
  // Order matters because of FKs (messages → conversations,
  // recommendations → protocols).
  const convos = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(eq(schema.conversations.userId, userId));
  for (const c of convos) {
    await db
      .delete(schema.messages)
      .where(eq(schema.messages.conversationId, c.id));
  }
  await db
    .delete(schema.conversations)
    .where(eq(schema.conversations.userId, userId));

  // Recommendations belong to protocols
  const protocols = await db
    .select({ id: schema.protocols.id })
    .from(schema.protocols)
    .where(eq(schema.protocols.userId, userId));
  for (const p of protocols) {
    await db
      .delete(schema.recommendations)
      .where(eq(schema.recommendations.protocolId, p.id));
  }
  await db.delete(schema.protocols).where(eq(schema.protocols.userId, userId));

  await db.delete(schema.biomarkers).where(eq(schema.biomarkers.userId, userId));
  await db
    .delete(schema.supplementLogs)
    .where(eq(schema.supplementLogs.userId, userId));
  await db
    .delete(schema.healthStateSnapshots)
    .where(eq(schema.healthStateSnapshots.userId, userId));
  await db
    .delete(schema.biomarkerTrends)
    .where(eq(schema.biomarkerTrends.userId, userId));
  await db
    .delete(schema.healthSignals)
    .where(eq(schema.healthSignals.userId, userId));
}

// ─── Lab biomarkers (3 readings each, t-90 → t-60 → t-0) ─

const LAB_SERIES: Array<{
  name: string;
  unit: string;
  values: [number, number, number];
}> = [
  { name: "glucose_mg_dl", unit: "mg/dL", values: [92, 99, 108] }, // worsening → metabolic
  { name: "hba1c_percent", unit: "%", values: [5.5, 5.8, 6.0] }, // worsening → compound risk
  { name: "ldl_mg_dl", unit: "mg/dL", values: [142, 138, 132] }, // improving but still high
  { name: "hdl_mg_dl", unit: "mg/dL", values: [38, 41, 44] }, // improving
  { name: "triglycerides_mg_dl", unit: "mg/dL", values: [180, 165, 145] },
  { name: "crp_mg_l", unit: "mg/L", values: [3.4, 2.8, 2.1] },
  { name: "vitamin_d_ng_ml", unit: "ng/mL", values: [22, 26, 32] },
  { name: "b12_pg_ml", unit: "pg/mL", values: [280, 320, 360] },
  { name: "ferritin_ng_ml", unit: "ng/mL", values: [45, 50, 55] },
  { name: "testosterone_ng_dl", unit: "ng/dL", values: [380, 410, 440] },
  { name: "tsh_miu_l", unit: "mIU/L", values: [2.2, 2.4, 2.6] },
];

const LAB_OFFSETS = [90, 60, 0];

// ─── WHOOP daily series (14 days) ────────────────────────

interface WhoopSpec {
  name: string;
  unit: string;
  start: number;
  end: number;
  precision: number;
}

const WHOOP_SERIES: WhoopSpec[] = [
  { name: "whoop_recovery_score", unit: "%", start: 45, end: 72, precision: 0 },
  { name: "whoop_hrv_rmssd", unit: "ms", start: 38, end: 52, precision: 0 },
  { name: "whoop_resting_hr", unit: "bpm", start: 64, end: 58, precision: 0 },
  {
    name: "whoop_sleep_performance",
    unit: "%",
    start: 76,
    end: 88,
    precision: 0,
  },
  {
    name: "whoop_total_sleep_hours",
    unit: "h",
    start: 6.4,
    end: 7.6,
    precision: 1,
  },
];

// ─── Conversation seeds ──────────────────────────────────

const CONVERSATION = {
  title: "Understanding my labs",
  turns: [
    {
      user: "Why is my glucose creeping up?",
      assistant:
        "Your glucose has trended from 92 to 108 mg/dL over the last three months, and your HbA1c moved from 5.5% to 6.0% — both signals point toward early insulin resistance. The combination is sometimes called a prediabetes pattern. The good news: it's reversible with consistent training, lower glycemic carbs, and adequate sleep. Want me to flag supplements that support glucose regulation in your next protocol?",
      intent: "explain_biomarker",
    },
    {
      user: "Should I add berberine to my stack?",
      assistant:
        "Berberine is one of the better-studied options for glucose control — meta-analyses show roughly a 0.5% drop in HbA1c at 1,500 mg/day split with meals, similar to low-dose metformin. Since you're already on metformin, I'd want to check that you don't run into additive GI effects, and you should clear the combination with your physician. Logging it as 'considering' so we can revisit after your next labs.",
      intent: "explain_supplement",
    },
    {
      user: "Build me a cognition stack",
      assistant:
        "Running the analysis. I've folded your goals (cognition, energy, longevity), your improving but still-flagged labs, and the rising glucose pattern into the new protocol. Head to your dashboard to review the full list — I prioritized supplements that double-task on metabolic and cognitive endpoints.",
      intent: "generate_protocol",
    },
  ],
};

// ─── Run ─────────────────────────────────────────────────

async function main() {
  console.log("[seed] starting demo seed…");

  // 1. Find or create the user
  let user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_EMAIL))
    .get();

  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const id = randomUUID();
    const now = new Date().toISOString();
    await db.insert(schema.users).values({
      id,
      email: DEMO_EMAIL,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();
    console.log(`[seed] created user ${DEMO_EMAIL}`);
  } else {
    // Refresh password so old runs that may have changed it still work
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await db
      .update(schema.users)
      .set({ passwordHash, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, user.id));
    console.log(`[seed] refreshed user ${DEMO_EMAIL}`);
  }

  if (!user) throw new Error("failed to ensure demo user");
  const userId = user.id;

  // 2. Wipe domain data
  console.log("[seed] wiping prior demo data…");
  await wipeUserData(userId);

  // 3. Profile
  console.log("[seed] writing profile…");
  await upsertProfile(userId, {
    firstName: "Demo",
    lastName: "Pilot",
    dateOfBirth: "1983-03-12",
    sex: "male",
    goals: ["energy", "longevity", "cognition"],
    conditions: ["prediabetes"],
    medications: ["metformin 500mg BID"],
    supplements: ["vitamin D 5000IU", "omega-3 2g"],
  });

  // 4. Lab biomarkers
  console.log("[seed] inserting lab biomarkers…");
  for (const series of LAB_SERIES) {
    for (let i = 0; i < 3; i++) {
      try {
        await addBiomarker(userId, {
          name: series.name,
          value: series.values[i],
          unit: series.unit,
          source: "manual",
          measuredAt: daysAgo(LAB_OFFSETS[i]),
        });
      } catch (err) {
        // Skip duplicates from re-runs (unique index)
        if (!(err as Error).message?.includes("UNIQUE")) throw err;
      }
    }
  }

  // 5. WHOOP biomarkers (14 daily readings each)
  console.log("[seed] inserting WHOOP biomarkers…");
  const random = rng(42);
  for (const spec of WHOOP_SERIES) {
    for (let day = 13; day >= 0; day--) {
      const t = (13 - day) / 13;
      const linear = spec.start + (spec.end - spec.start) * t;
      const noise = (random() - 0.5) * (spec.start - spec.end) * 0.15;
      const raw = linear + noise;
      const value =
        spec.precision === 0
          ? Math.round(raw)
          : parseFloat(raw.toFixed(spec.precision));
      try {
        await addBiomarker(userId, {
          name: spec.name,
          value,
          unit: spec.unit,
          source: "whoop",
          measuredAt: daysAgo(day),
        });
      } catch (err) {
        if (!(err as Error).message?.includes("UNIQUE")) throw err;
      }
    }
  }

  // 6. Compute trends so the trends API has real data
  console.log("[seed] computing biomarker trends…");
  await computeBiomarkerTrends(userId);

  // 7. Generate a protocol via the real engine
  console.log("[seed] generating protocol…");
  const protocol = await generateProtocol(userId);
  console.log(
    `[seed]   → ${protocol.recommendations?.length ?? 0} recommendations`
  );

  // 8. Adherence: 14 days at ~70% adherence per recommendation
  console.log("[seed] logging adherence…");
  if (protocol.recommendations && protocol.recommendations.length > 0) {
    const adherenceRng = rng(101);
    for (let day = 13; day >= 0; day--) {
      for (const rec of protocol.recommendations) {
        const skipped = adherenceRng() > 0.7;
        const takenAt = skipped ? undefined : daysAgo(day);
        await logSupplement(userId, {
          supplementName: rec.name,
          dosage: rec.dosage,
          timeSlot: rec.timeSlot ?? undefined,
          skipped,
          takenAt,
          protocolId: protocol.id,
          recommendationId: rec.id,
        });
      }
    }
  }

  // 9. Conversation history
  console.log("[seed] seeding conversation…");
  const convo = await getOrCreateConversation(userId);
  await db
    .update(schema.conversations)
    .set({ title: CONVERSATION.title })
    .where(eq(schema.conversations.id, convo.id));
  for (const turn of CONVERSATION.turns) {
    await addMessage(convo.id, "user", turn.user, turn.intent);
    await addMessage(convo.id, "assistant", turn.assistant, undefined, {
      seeded: true,
    });
  }

  // 10. Compute the health-state snapshot so dashboard renders interestingly
  console.log("[seed] computing health state…");
  await computeHealthState(userId);

  console.log("");
  console.log("─".repeat(60));
  console.log("Demo profile ready:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("  pnpm dev → http://localhost:3000/login");
  console.log("─".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
