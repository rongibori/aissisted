import { randomUUID } from "crypto";
import { db, schema, eq, and, gte, desc } from "@aissisted/db";
import type { TimeSlot } from "../engine/types.js";

// ─── Log a supplement taken or skipped ───────────────────

export async function logSupplement(
  userId: string,
  data: {
    supplementName: string;
    dosage?: string;
    timeSlot?: TimeSlot;
    takenAt?: string; // ISO timestamp; omit for "skipped"
    skipped?: boolean;
    protocolId?: string;
    recommendationId?: string;
    note?: string;
  }
) {
  const id = randomUUID();
  const now = new Date();

  await db.insert(schema.supplementLogs).values({
    id,
    userId,
    protocolId: data.protocolId ?? null,
    recommendationId: data.recommendationId ?? null,
    supplementName: data.supplementName,
    dosage: data.dosage ?? null,
    timeSlot: data.timeSlot ?? null,
    takenAt: data.takenAt ?? null,
    skipped: data.skipped ?? false,
    note: data.note ?? null,
    createdAt: now,
  });

  return { id, ...data, userId, createdAt: now };
}

// ─── Get today's adherence ────────────────────────────────

export async function getTodayLogs(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;

  return db
    .select()
    .from(schema.supplementLogs)
    .where(
      and(
        eq(schema.supplementLogs.userId, userId),
        gte(schema.supplementLogs.createdAt, startOfDay)
      )
    )
    .orderBy(desc(schema.supplementLogs.createdAt));
}

// ─── Adherence score (last N days) ───────────────────────

export async function getAdherenceScore(
  userId: string,
  days = 30
): Promise<{
  score: number; // 0–100
  taken: number;
  skipped: number;
  total: number;
  periodDays: number;
}> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const logs = await db
    .select()
    .from(schema.supplementLogs)
    .where(
      and(
        eq(schema.supplementLogs.userId, userId),
        gte(schema.supplementLogs.createdAt, cutoff)
      )
    );

  const taken = logs.filter((l) => !l.skipped && l.takenAt).length;
  const skipped = logs.filter((l) => l.skipped).length;
  const total = logs.length;
  const score = total > 0 ? Math.round((taken / total) * 100) : 0;

  return { score, taken, skipped, total, periodDays: days };
}

// ─── History (paginated) ──────────────────────────────────

export async function getAdherenceHistory(userId: string, limit = 100) {
  return db
    .select()
    .from(schema.supplementLogs)
    .where(eq(schema.supplementLogs.userId, userId))
    .orderBy(desc(schema.supplementLogs.createdAt))
    .limit(limit);
}
