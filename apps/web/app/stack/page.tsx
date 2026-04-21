"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { protocol as protocolApi } from "../../lib/api";
import { Card, Badge, Button, Spinner, EmptyState } from "../../components/ui";
import { useRouter } from "next/navigation";

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

interface ProtocolSummary {
  id: string;
  summary: string;
  warnings: string[];
  createdAt: string;
}

function StackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentProtocol, setCurrentProtocol] = useState<Protocol | null>(null);
  const [history, setHistory] = useState<ProtocolSummary[]>([]);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const [latestData, historyData] = await Promise.allSettled([
        protocolApi.latest(),
        protocolApi.history(),
      ]);
      if (latestData.status === "fulfilled") setCurrentProtocol(latestData.value.protocol);
      if (historyData.status === "fulfilled") setHistory(historyData.value.protocols);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) load();
  }, [user, loading, load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await protocolApi.run();
      setCurrentProtocol(data.protocol);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || fetching) {
    return (
      <>
        <Nav />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="pt-14 max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">My Stack</h1>
            {currentProtocol && (
              <p className="text-xs text-muted mt-1">
                Generated{" "}
                {new Date(currentProtocol.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button onClick={handleGenerate} loading={generating} size="sm">
            Regenerate
          </Button>
        </div>

        {!currentProtocol ? (
          <Card>
            <EmptyState
              title="No protocol yet"
              description="Generate your first personalized supplement stack."
              action={
                <Button onClick={handleGenerate} loading={generating}>
                  Generate protocol
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card className="mb-5">
              <p className="text-sm text-muted leading-relaxed">
                {currentProtocol.summary}
              </p>
              {currentProtocol.warnings.length > 0 && (
                <div className="mt-3 p-3 bg-warn-soft border border-warn/20 rounded-lg">
                  {currentProtocol.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-warn">
                      ⚠ {w}
                    </p>
                  ))}
                </div>
              )}
            </Card>

            {/* Supplement cards */}
            <div className="flex flex-col gap-3">
              {currentProtocol.recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  onClick={() =>
                    setExpanded(expanded === rec.id ? null : rec.id)
                  }
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Score indicator */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center">
                        <span className="text-xs font-bold text-signal">
                          {Math.round(rec.score * 100)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted">score</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-ink">
                          {rec.name}
                        </span>
                        <Badge variant="info">{rec.dosage}</Badge>
                      </div>
                      <p className="text-xs text-muted">
                        🕐 {rec.timing}
                      </p>

                      {expanded === rec.id && (
                        <p className="mt-3 text-sm text-muted leading-relaxed">
                          {rec.rationale}
                        </p>
                      )}
                    </div>

                    <span className="text-muted text-sm shrink-0">
                      {expanded === rec.id ? "▲" : "▼"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Protocol history */}
            {history.length > 1 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHistory((s) => !s)}
                  className="text-sm text-muted hover:text-ink transition-colors mb-3 flex items-center gap-1"
                >
                  {showHistory ? "▲" : "▼"} Protocol history ({history.length})
                </button>
                {showHistory && (
                  <div className="flex flex-col gap-2">
                    {history.slice(1).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-surface-2 rounded-lg border border-line"
                      >
                        <p className="text-xs text-muted mb-1">
                          {new Date(p.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted leading-relaxed line-clamp-2">
                          {p.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-muted mt-6">
              Not medical advice. Discuss with your physician before starting
              any supplement regimen.
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default function StackPageWrapper() {
  return (
    <AuthProvider>
      <StackPage />
    </AuthProvider>
  );
}
