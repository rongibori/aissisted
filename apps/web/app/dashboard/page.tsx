"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { protocol, biomarkers as biomarkersApi, profile as profileApi } from "../../lib/api";
import { Card, Button, Badge, Spinner, EmptyState } from "../../components/ui";
import { getRangeStatus, STATUS_COLORS, STATUS_LABELS, TREND_ICONS, TREND_COLORS, type TrendDirection } from "../../lib/biomarker-ranges";
import { Sparkline } from "../../components/sparkline";

interface Recommendation {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
  score: number;
}

interface Protocol {
  id: string;
  summary: string;
  warnings: string[];
  recommendations: Recommendation[];
  createdAt: string;
}

interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  measuredAt: string;
  trend?: TrendDirection;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentProtocol, setCurrentProtocol] = useState<Protocol | null>(null);
  const [latestBiomarkers, setLatestBiomarkers] = useState<Biomarker[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [hasProfile, setHasProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [protoData, bioData, profileData] = await Promise.allSettled([
        protocol.latest(),
        biomarkersApi.list({ latest: true }),
        profileApi.get(),
      ]);
      if (protoData.status === "fulfilled") {
        setCurrentProtocol(protoData.value.protocol);
      }
      if (profileData.status === "rejected") {
        setHasProfile(false);
      } else if (profileData.status === "fulfilled") {
        const p = profileData.value.profile;
        setHasProfile(!!(p?.firstName));
      }
      if (bioData.status === "fulfilled") {
        const markers: Biomarker[] = bioData.value.biomarkers;
        setLatestBiomarkers(markers);
        // Fetch sparkline history in background
        const names = markers.map((b) => b.name);
        Promise.allSettled(
          names.map((name) =>
            biomarkersApi.history(name).then((h) => ({
              name,
              values: [...h.biomarkers].reverse().map((b: Biomarker) => b.value),
            }))
          )
        ).then((results) => {
          const map: Record<string, number[]> = {};
          for (const r of results) {
            if (r.status === "fulfilled" && r.value.values.length > 1) {
              map[r.value.name] = r.value.values;
            }
          }
          setSparklines(map);
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await protocol.run();
      setCurrentProtocol(data.protocol);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e8e8f0]">Dashboard</h1>
          <p className="text-[#7a7a98] text-sm mt-0.5">{user?.email}</p>
        </div>
        <Button onClick={handleGenerate} loading={generating}>
          Generate Protocol
        </Button>
      </div>

      {/* Onboarding checklist — shown until all three steps are done */}
      {(!hasProfile || latestBiomarkers.length === 0 || !currentProtocol) && (
        <div className="mb-6 p-4 bg-indigo-950 border border-indigo-800 rounded-xl">
          <p className="text-sm font-medium text-indigo-300 mb-3">
            Complete your setup to unlock your personalized protocol
          </p>
          <div className="flex flex-col gap-2">
            {[
              {
                done: hasProfile,
                label: "Complete your profile",
                action: () => router.push("/profile"),
                cta: "Go to Profile",
              },
              {
                done: latestBiomarkers.length > 0,
                label: "Add at least one biomarker reading",
                action: () => router.push("/labs"),
                cta: "Add labs",
              },
              {
                done: !!currentProtocol,
                label: "Generate your first protocol",
                action: handleGenerate,
                cta: "Generate now",
              },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    step.done
                      ? "bg-emerald-600 text-white"
                      : "bg-[#2a2a38] text-[#7a7a98]"
                  }`}
                >
                  {step.done ? "✓" : "○"}
                </span>
                <span
                  className={`text-sm flex-1 ${
                    step.done ? "line-through text-[#7a7a98]" : "text-[#e8e8f0]"
                  }`}
                >
                  {step.label}
                </span>
                {!step.done && (
                  <button
                    onClick={step.action}
                    className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
                  >
                    {step.cta} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Protocol Summary */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#e8e8f0]">
                Current Protocol
              </h2>
              {currentProtocol && (
                <Badge variant="info">
                  {currentProtocol.recommendations.length} supplements
                </Badge>
              )}
            </div>

            {!currentProtocol ? (
              <EmptyState
                title="No protocol yet"
                description="Generate your first protocol based on your health data and goals."
                action={
                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    size="sm"
                  >
                    Generate now
                  </Button>
                }
              />
            ) : (
              <>
                <p className="text-sm text-[#7a7a98] mb-4 leading-relaxed">
                  {currentProtocol.summary}
                </p>
                {currentProtocol.warnings.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-950 border border-amber-900 rounded-lg">
                    {currentProtocol.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-400">
                        ⚠ {w}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {currentProtocol.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-3 p-3 bg-[#1c1c26] rounded-lg"
                    >
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-[#e8e8f0]">
                            {rec.name}
                          </span>
                          <Badge variant="default">{rec.dosage}</Badge>
                        </div>
                        <p className="text-xs text-[#7a7a98]">{rec.timing}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push("/stack")}
                >
                  View full stack →
                </Button>
              </>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Biomarkers */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#e8e8f0]">Biomarkers</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/labs")}
              >
                View all
              </Button>
            </div>
            {latestBiomarkers.length === 0 ? (
              <EmptyState
                title="No labs yet"
                description="Add your first biomarker reading."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push("/labs")}
                  >
                    Add labs
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {latestBiomarkers.slice(0, 6).map((b) => {
                  const status = getRangeStatus(b.name, b.value);
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#7a7a98] capitalize truncate mr-2">
                        {b.name.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sparklines[b.name] && (
                          <Sparkline
                            values={sparklines[b.name]}
                            width={48}
                            height={20}
                            color={
                              status === "optimal" ? "#34d399"
                              : status === "high" || status === "low" ? "#fbbf24"
                              : "#6366f1"
                            }
                          />
                        )}
                        {b.trend && b.trend !== "new" && (
                          <span className={`text-xs font-bold ${TREND_COLORS[b.trend]}`}>
                            {TREND_ICONS[b.trend]}
                          </span>
                        )}
                        <span className="text-[#e8e8f0] font-medium">
                          {b.value} {b.unit}
                        </span>
                        {status !== "unknown" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="font-semibold text-[#e8e8f0] mb-4">
              Quick actions
            </h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/chat")}
              >
                💬 Ask Jeffrey
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/labs")}
              >
                🧪 Add lab results
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/stack")}
              >
                💊 View my stack
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
