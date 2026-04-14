"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { biomarkers as biomarkersApi } from "../../lib/api";
import { Card, Button, Input, Spinner, EmptyState, Badge } from "../../components/ui";
import { getRangeStatus, STATUS_LABELS, STATUS_COLORS, TREND_ICONS, TREND_COLORS, type TrendDirection } from "../../lib/biomarker-ranges";

interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  source?: string;
  measuredAt: string;
  trend?: TrendDirection;
  previousValue?: number;
}

const COMMON_BIOMARKERS = [
  { name: "vitamin_d_ng_ml", label: "Vitamin D", unit: "ng/mL" },
  { name: "b12_pg_ml", label: "B12", unit: "pg/mL" },
  { name: "ferritin_ng_ml", label: "Ferritin", unit: "ng/mL" },
  { name: "crp_mg_l", label: "CRP", unit: "mg/L" },
  { name: "testosterone_ng_dl", label: "Testosterone", unit: "ng/dL" },
  { name: "cortisol_mcg_dl", label: "Cortisol", unit: "mcg/dL" },
  { name: "tsh_miu_l", label: "TSH", unit: "mIU/L" },
  { name: "hemoglobin_g_dl", label: "Hemoglobin", unit: "g/dL" },
];

function LabsPage() {
  const { user, loading } = useAuth();
  const [allBiomarkers, setAllBiomarkers] = useState<Biomarker[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    customName: "",
    value: "",
    unit: "",
    source: "manual",
    measuredAt: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const data = await biomarkersApi.list();
      setAllBiomarkers(data.biomarkers);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) load();
  }, [user, loading, load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name === "custom" ? form.customName : form.name;
    if (!name || !form.value || !form.unit) return;

    setSaving(true);
    try {
      await biomarkersApi.add({
        name,
        value: parseFloat(form.value),
        unit: form.unit,
        source: form.source || "manual",
        measuredAt: new Date(form.measuredAt).toISOString(),
      });
      setShowForm(false);
      setForm({
        name: "",
        customName: "",
        value: "",
        unit: "",
        source: "manual",
        measuredAt: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold text-[#e8e8f0]">Labs</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add result"}
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <Card className="mb-5">
            <h3 className="font-medium text-[#e8e8f0] mb-4">
              Add biomarker reading
            </h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-[#e8e8f0] block mb-1.5">
                  Biomarker
                </label>
                <select
                  value={form.name}
                  onChange={(e) => {
                    const selected = COMMON_BIOMARKERS.find(
                      (b) => b.name === e.target.value
                    );
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      unit: selected?.unit ?? f.unit,
                    }));
                  }}
                  className="w-full bg-[#1c1c26] border border-[#2a2a38] rounded-lg px-3 py-2 text-[#e8e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select biomarker…</option>
                  {COMMON_BIOMARKERS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.label} ({b.unit})
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </div>

              {form.name === "custom" && (
                <Input
                  label="Custom name"
                  value={form.customName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customName: e.target.value }))
                  }
                  placeholder="e.g. hs_crp_mg_l"
                  required
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Value"
                  type="number"
                  step="any"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="ng/mL"
                  required
                />
              </div>

              <Input
                label="Date measured"
                type="date"
                value={form.measuredAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, measuredAt: e.target.value }))
                }
                required
              />

              <Button
                type="submit"
                loading={saving}
                className="w-full mt-1"
              >
                Save reading
              </Button>
            </form>
          </Card>
        )}

        {/* Biomarker list */}
        {allBiomarkers.length === 0 ? (
          <Card>
            <EmptyState
              title="No biomarkers yet"
              description="Add your lab results to power personalized supplement recommendations."
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Add first result
                </Button>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-[#2a2a38]">
              {allBiomarkers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#e8e8f0] capitalize">
                      {b.name.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-[#7a7a98]">
                      {new Date(b.measuredAt).toLocaleDateString()}
                      {b.source && b.source !== "manual" && (
                        <> · {b.source}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.trend && b.trend !== "new" && (
                      <span className={`text-sm font-bold ${TREND_COLORS[b.trend]}`}>
                        {TREND_ICONS[b.trend]}
                      </span>
                    )}
                    <span className="text-sm font-medium text-[#e8e8f0]">
                      {b.value} {b.unit}
                    </span>
                    {(() => {
                      const status = getRangeStatus(b.name, b.value);
                      if (status === "unknown") return null;
                      return (
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

export default function LabsPageWrapper() {
  return (
    <AuthProvider>
      <LabsPage />
    </AuthProvider>
  );
}
