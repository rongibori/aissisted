"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { protocol, biomarkers as biomarkersApi } from "../../lib/api";
import { Card, Button, Badge, Spinner, EmptyState } from "../../components/ui";
import { getRangeStatus, STATUS_COLORS, STATUS_LABELS, TREND_ICONS, TREND_COLORS, type TrendDirection } from "../../lib/biomarker-ranges";

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [protoData, bioData] = await Promise.allSettled([
        protocol.latest(),
        biomarkersApi.list({ latest: true }),
      ]);
      if (protoData.status === "fulfilled") {
        setCurrentProtocol(protoData.value.protocol);
      }
      if (bioData.status === "fulfilled") {
        setLatestBiomarkers(bioData.value.biomarkers);
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
