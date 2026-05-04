"use client";

import React, { useEffect, useState, useCallback } from "react";
import { protocol as protocolApi, adherence as adherenceApi } from "../../lib/api";
import { Card, Button, Badge, Spinner, EmptyState } from "../../components/ui";

// ─── Types ────────────────────────────────────────────────

interface Recommendation {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  timeSlot: string | null;
  rationale: string;
  score: number;
}

interface AdherenceLog {
  id: string;
  supplementName: string;
  dosage: string | null;
  timeSlot: string | null;
  takenAt: string | null;
  skipped: boolean;
  note: string | null;
  createdAt: string;
}

interface AdherenceScore {
  score: number;
  taken: number;
  skipped: number;
  total: number;
  periodDays: number;
}

// ─── Constants ────────────────────────────────────────────

const TIME_SLOT_ORDER = [
  "morning_fasted",
  "morning_with_food",
  "midday",
  "afternoon",
  "evening",
  "presleep",
];

const TIME_SLOT_LABELS: Record<string, string> = {
  morning_fasted: "Morning · Fasted",
  morning_with_food: "Morning · With Food",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
  presleep: "Before Bed",
};

const TIME_SLOT_ICONS: Record<string, string> = {
  morning_fasted: "🌅",
  morning_with_food: "🍳",
  midday: "☀️",
  afternoon: "🌤",
  evening: "🌙",
  presleep: "💤",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-aqua";
  if (score >= 60) return "text-warn";
  return "text-signal-red";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "#2EC4B6";
  if (score >= 60) return "#F59E0B";
  return "#E63946";
}

// ─── Adherence Ring ───────────────────────────────────────

function AdherenceRing({ score }: { score: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute" width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#E5E5E0" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className={`text-2xl font-bold font-data ${scoreColor(score)}`}>{score}%</span>
        <span className="text-[10px] text-graphite-soft uppercase tracking-wide">adherence</span>
      </div>
    </div>
  );
}

// ─── Supplement Row ───────────────────────────────────────

function SupplementRow({
  rec,
  log,
  onLog,
  logging,
}: {
  rec: Recommendation;
  log: AdherenceLog | undefined;
  onLog: (name: string, dosage: string, timeSlot: string | null, skipped: boolean) => void;
  logging: boolean;
}) {
  const taken = log && !log.skipped;
  const skipped = log && log.skipped;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      {/* Status indicator */}
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-medium ${
          taken
            ? "bg-aqua/15 text-aqua"
            : skipped
            ? "bg-surface-2 text-graphite-soft"
            : "bg-surface-2 text-graphite-soft border border-border"
        }`}
      >
        {taken ? "✓" : skipped ? "–" : "○"}
      </div>

      {/* Supplement info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${
              taken ? "text-graphite-soft line-through" : "text-graphite"
            }`}
          >
            {rec.name}
          </span>
          <span className="text-xs text-graphite-soft">{rec.dosage}</span>
        </div>
        {taken && log?.takenAt && (
          <p className="text-[11px] text-graphite-soft mt-0.5">
            Taken at{" "}
            {new Date(log.takenAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {!log ? (
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onLog(rec.name, rec.dosage, rec.timeSlot, false)}
            disabled={logging}
          >
            Took it
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLog(rec.name, rec.dosage, rec.timeSlot, true)}
            disabled={logging}
          >
            Skip
          </Button>
        </div>
      ) : (
        <Badge variant={taken ? "success" : "default"}>
          {taken ? "Taken" : "Skipped"}
        </Badge>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────

export default function AdherencePage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [todayLogs, setTodayLogs] = useState<AdherenceLog[]>([]);
  const [weekScore, setWeekScore] = useState<AdherenceScore | null>(null);
  const [monthScore, setMonthScore] = useState<AdherenceScore | null>(null);
  const [history, setHistory] = useState<AdherenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [protocolId, setProtocolId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [protoData, logsData, week, month, hist] = await Promise.allSettled([
        protocolApi.latest(),
        adherenceApi.today(),
        adherenceApi.score(7),
        adherenceApi.score(30),
        adherenceApi.history(),
      ]);

      if (protoData.status === "fulfilled" && protoData.value.protocol) {
        setRecommendations(protoData.value.protocol.recommendations ?? []);
        setProtocolId(protoData.value.protocol.id ?? null);
      }
      if (logsData.status === "fulfilled") setTodayLogs(logsData.value.logs);
      if (week.status === "fulfilled") setWeekScore(week.value);
      if (month.status === "fulfilled") setMonthScore(month.value);
      if (hist.status === "fulfilled") setHistory(hist.value.logs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLog = async (
    supplementName: string,
    dosage: string,
    timeSlot: string | null,
    skipped: boolean
  ) => {
    setLogging(true);
    try {
      const newLog = await adherenceApi.log({
        supplementName,
        dosage: dosage || undefined,
        timeSlot: timeSlot || undefined,
        skipped,
        takenAt: skipped ? undefined : new Date().toISOString(),
        protocolId: protocolId || undefined,
      });
      setTodayLogs((prev) => [...prev, newLog.log]);
      // Refresh scores after logging
      const [week, month] = await Promise.all([
        adherenceApi.score(7),
        adherenceApi.score(30),
      ]);
      setWeekScore(week);
      setMonthScore(month);
    } catch {
      // silently ignore log errors — don't interrupt the user
    } finally {
      setLogging(false);
    }
  };

  // Group recommendations by time slot, preserving order
  const grouped = TIME_SLOT_ORDER.reduce<Record<string, Recommendation[]>>(
    (acc, slot) => {
      const recs = recommendations.filter((r) => r.timeSlot === slot);
      if (recs.length) acc[slot] = recs;
      return acc;
    },
    {}
  );

  // Recommendations with no time slot go to a misc group
  const unslotted = recommendations.filter((r) => !r.timeSlot);

  // Find today's log for a given supplement name
  const logFor = (name: string): AdherenceLog | undefined =>
    todayLogs.find(
      (l) => l.supplementName.toLowerCase() === name.toLowerCase()
    );

  // Group recent history by date
  const historyByDate = history.slice(0, 50).reduce<Record<string, AdherenceLog[]>>(
    (acc, log) => {
      const date = new Date(log.createdAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-graphite">Adherence</h1>
        <p className="text-graphite-soft text-sm mt-0.5">
          Track your daily supplement schedule
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-5">
            <AdherenceRing score={weekScore?.score ?? 0} />
            <div>
              <p className="text-sm font-medium text-graphite">This Week</p>
              <p className="text-xs text-graphite-soft mt-1">
                {weekScore?.taken ?? 0} taken · {weekScore?.skipped ?? 0} skipped
              </p>
              <p className="text-xs text-graphite-soft">
                {weekScore?.total ?? 0} logged total
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-5">
            <AdherenceRing score={monthScore?.score ?? 0} />
            <div>
              <p className="text-sm font-medium text-graphite">Last 30 Days</p>
              <p className="text-xs text-graphite-soft mt-1">
                {monthScore?.taken ?? 0} taken · {monthScore?.skipped ?? 0} skipped
              </p>
              <p className="text-xs text-graphite-soft">
                {monthScore?.total ?? 0} logged total
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-graphite">Today's Schedule</h2>
          <span className="text-xs text-graphite-soft">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <EmptyState
            title="No protocol yet"
            description="Generate a protocol first — your daily schedule will appear here."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([slot, recs]) => (
              <div key={slot}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{TIME_SLOT_ICONS[slot]}</span>
                  <span className="text-xs font-semibold text-graphite-soft uppercase tracking-wider">
                    {TIME_SLOT_LABELS[slot]}
                  </span>
                  <div className="flex-1 h-px bg-surface-2" />
                </div>
                {recs.map((rec) => (
                  <SupplementRow
                    key={rec.id}
                    rec={rec}
                    log={logFor(rec.name)}
                    onLog={handleLog}
                    logging={logging}
                  />
                ))}
              </div>
            ))}

            {unslotted.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-graphite-soft uppercase tracking-wider">
                    Anytime
                  </span>
                  <div className="flex-1 h-px bg-surface-2" />
                </div>
                {unslotted.map((rec) => (
                  <SupplementRow
                    key={rec.id}
                    rec={rec}
                    log={logFor(rec.name)}
                    onLog={handleLog}
                    logging={logging}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Recent History */}
      {Object.keys(historyByDate).length > 0 && (
        <Card>
          <h2 className="font-semibold text-graphite mb-4">Recent History</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(historyByDate).map(([date, logs]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-graphite-soft uppercase tracking-wider mb-2">
                  {date}
                </p>
                <div className="flex flex-col gap-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          log.skipped ? "bg-graphite-soft" : "bg-aqua"
                        }`}
                      />
                      <span
                        className={
                          log.skipped ? "text-graphite-soft" : "text-graphite"
                        }
                      >
                        {log.supplementName}
                      </span>
                      {log.dosage && (
                        <span className="text-graphite-soft">{log.dosage}</span>
                      )}
                      <span
                        className={`ml-auto text-xs ${
                          log.skipped ? "text-graphite-soft" : "text-aqua"
                        }`}
                      >
                        {log.skipped ? "Skipped" : "Taken"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
