"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { Nav } from "../../components/nav";
import { profile as profileApi } from "../../lib/api";
import { Button, Input, Card, Badge } from "../../components/ui";

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
      <label className="text-sm font-medium text-graphite block mb-2">
        {label}
      </label>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                values.includes(s)
                  ? "bg-midnight border-midnight text-white"
                  : "border-border text-graphite-soft hover:border-midnight hover:text-midnight"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-graphite placeholder-graphite-soft text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua"
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => add(input)}
        >
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-surface-2 border border-border rounded-full text-graphite"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="text-graphite-soft hover:text-signal-red"
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

const STEPS = ["Personal", "Goals", "Medical", "Done"];

function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "" as "" | "male" | "female" | "other",
    goals: [] as string[],
    conditions: [] as string[],
    medications: [] as string[],
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await profileApi.update({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth || undefined,
        sex: data.sex || undefined,
        goals: data.goals,
        conditions: data.conditions,
        medications: data.medications,
      });
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="pt-14 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-2 ${i <= step ? "text-graphite" : "text-graphite-soft"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < step
                        ? "bg-aqua text-white"
                        : i === step
                          ? "border-2 border-aqua text-aqua"
                          : "border border-border"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-sm hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px ${i < step ? "bg-aqua" : "bg-border"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <Card>
            {/* Step 0: Personal */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-graphite">
                  Tell us about yourself
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First name"
                    value={data.firstName}
                    onChange={(e) =>
                      setData((d) => ({ ...d, firstName: e.target.value }))
                    }
                    placeholder="Alex"
                    autoFocus
                  />
                  <Input
                    label="Last name"
                    value={data.lastName}
                    onChange={(e) =>
                      setData((d) => ({ ...d, lastName: e.target.value }))
                    }
                    placeholder="Smith"
                  />
                </div>
                <Input
                  label="Date of birth"
                  type="date"
                  value={data.dateOfBirth}
                  onChange={(e) =>
                    setData((d) => ({ ...d, dateOfBirth: e.target.value }))
                  }
                />
                <div>
                  <label className="text-sm font-medium text-graphite block mb-2">
                    Biological sex
                  </label>
                  <div className="flex gap-2">
                    {(["male", "female", "other"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, sex: s }))}
                        className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${
                          data.sex === s
                            ? "bg-midnight border-midnight text-white"
                            : "border-border text-graphite-soft hover:border-midnight"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => setStep(1)}
                  disabled={!data.firstName || !data.lastName}
                >
                  Continue →
                </Button>
              </div>
            )}

            {/* Step 1: Goals */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-graphite">
                  What are your health goals?
                </h2>
                <p className="text-sm text-graphite-soft">
                  Select all that apply. These drive your protocol
                  recommendations.
                </p>
                <TagInput
                  label="Goals"
                  values={data.goals}
                  onChange={(g) => setData((d) => ({ ...d, goals: g }))}
                  placeholder="Add custom goal…"
                  suggestions={GOAL_OPTIONS}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(0)}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={data.goals.length === 0}
                  >
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Medical */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-graphite">
                  Medical history
                </h2>
                <p className="text-sm text-graphite-soft">
                  Used for contraindication checking. Optional but recommended.
                </p>
                <TagInput
                  label="Conditions"
                  values={data.conditions}
                  onChange={(c) => setData((d) => ({ ...d, conditions: c }))}
                  placeholder="e.g. hypothyroid, PCOS…"
                />
                <TagInput
                  label="Medications"
                  values={data.medications}
                  onChange={(m) => setData((d) => ({ ...d, medications: m }))}
                  placeholder="e.g. warfarin, metformin…"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="flex flex-col gap-5 text-center">
                <div className="text-4xl">🎉</div>
                <h2 className="text-lg font-semibold text-graphite">
                  Profile complete
                </h2>
                <p className="text-sm text-graphite-soft">
                  Your profile is ready. Head to your dashboard to generate
                  your first personalized protocol.
                </p>
                <div className="flex flex-col gap-2 text-left bg-surface-2 rounded-lg p-3">
                  <p className="text-xs text-graphite-soft">
                    Goals: {data.goals.join(", ") || "—"}
                  </p>
                  {data.conditions.length > 0 && (
                    <p className="text-xs text-graphite-soft">
                      Conditions: {data.conditions.join(", ")}
                    </p>
                  )}
                  {data.medications.length > 0 && (
                    <p className="text-xs text-graphite-soft">
                      Medications: {data.medications.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  loading={saving}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function OnboardingPageWrapper() {
  return (
    <AuthProvider>
      <OnboardingPage />
    </AuthProvider>
  );
}
