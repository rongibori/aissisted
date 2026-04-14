"use client";

import React, { useEffect, useState, useCallback } from "react";
import { profile as profileApi } from "../../lib/api";
import { Card, Button, Input, Spinner } from "../../components/ui";

const GOAL_OPTIONS = [
  "Better sleep",
  "More energy",
  "Reduce inflammation",
  "Hormone optimization",
  "Cognitive performance",
  "Stress resilience",
  "Athletic recovery",
  "Longevity",
];

function TagInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  const add = (val: string) => {
    const v = val.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  return (
    <div>
      <label className="text-sm font-medium text-[#e8e8f0] block mb-2">{label}</label>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                values.includes(s)
                  ? onChange(values.filter((x) => x !== s))
                  : add(s)
              }
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                values.includes(s)
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-[#2a2a38] text-[#7a7a98] hover:border-indigo-500 hover:text-indigo-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-[#1c1c26] border border-[#2a2a38] rounded-lg px-3 py-2 text-[#e8e8f0] placeholder-[#7a7a98] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => add(input)}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-[#1c1c26] border border-[#2a2a38] rounded-full text-[#e8e8f0]"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-[#7a7a98] hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "" as "" | "male" | "female" | "other",
    goals: [] as string[],
    conditions: [] as string[],
    medications: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileApi.get();
      if (data.profile) {
        const p = data.profile;
        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          dateOfBirth: p.dateOfBirth ?? "",
          sex: p.sex ?? "",
          goals: p.goals ?? [],
          conditions: p.conditions ?? [],
          medications: p.medications ?? [],
        });
      }
    } catch {
      // No profile yet — start blank
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await profileApi.update({
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth || undefined,
        sex: form.sex || undefined,
        goals: form.goals,
        conditions: form.conditions,
        medications: form.medications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#e8e8f0]">Profile</h1>
        {saved && (
          <span className="text-sm text-emerald-400">✓ Saved</span>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Personal */}
        <Card>
          <h2 className="font-semibold text-[#e8e8f0] mb-4">Personal</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Alex"
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Smith"
              />
            </div>
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium text-[#e8e8f0] block mb-2">
                Biological sex
              </label>
              <div className="flex gap-2">
                {(["male", "female", "other"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, sex: s }))}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${
                      form.sex === s
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-[#2a2a38] text-[#7a7a98] hover:border-indigo-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Goals */}
        <Card>
          <h2 className="font-semibold text-[#e8e8f0] mb-4">Health Goals</h2>
          <TagInput
            label=""
            values={form.goals}
            onChange={(g) => setForm((f) => ({ ...f, goals: g }))}
            placeholder="Add custom goal…"
            suggestions={GOAL_OPTIONS}
          />
        </Card>

        {/* Medical */}
        <Card>
          <h2 className="font-semibold text-[#e8e8f0] mb-1">Medical History</h2>
          <p className="text-xs text-[#7a7a98] mb-4">
            Used for contraindication checking. Never shared.
          </p>
          <div className="flex flex-col gap-4">
            <TagInput
              label="Conditions"
              values={form.conditions}
              onChange={(c) => setForm((f) => ({ ...f, conditions: c }))}
              placeholder="e.g. hypothyroid, PCOS…"
            />
            <TagInput
              label="Medications"
              values={form.medications}
              onChange={(m) => setForm((f) => ({ ...f, medications: m }))}
              placeholder="e.g. warfarin, metformin…"
            />
          </div>
        </Card>

        <Button type="submit" loading={saving} className="w-full">
          Save changes
        </Button>
      </form>
    </div>
  );
}
