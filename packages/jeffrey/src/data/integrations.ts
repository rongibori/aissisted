/**
 * Integrations reference — the short narrations Jeffrey uses when guiding a
 * person through connecting a data source. These strings appear in
 * onboarding, so they must be on-brand (short, calm, declarative).
 */

export const integrations = {
  mychart: {
    id: "mychart",
    label: "MyChart",
    protocol: "SMART on FHIR",
    narration:
      "Connect MyChart. We pull your labs and history, so your formula starts with what's already known about you.",
    status: "roadmap" as const,
  },
  whoop: {
    id: "whoop",
    label: "WHOOP",
    protocol: "OAuth + WHOOP API",
    narration:
      "Connect WHOOP. Recovery, strain, and sleep feed your formula nightly.",
    status: "roadmap" as const,
  },
  appleHealth: {
    id: "appleHealth",
    label: "Apple Health / Apple Watch",
    protocol: "HealthKit (native bridge) or export",
    narration:
      "Connect Apple Health. HRV, resting heart rate, and sleep come through continuously.",
    status: "roadmap" as const,
  },
  oura: {
    id: "oura",
    label: "Oura",
    protocol: "OAuth + Oura Cloud API",
    narration:
      "Connect Oura. Readiness and temperature deviation become part of your picture.",
    status: "roadmap" as const,
  },
  labsUpload: {
    id: "labsUpload",
    label: "Lab uploads",
    protocol: "PDF / image OCR fallback",
    narration:
      "If MyChart isn't connected, upload your most recent labs. PDFs and photos both work.",
    status: "roadmap" as const,
  },
} as const;

export type IntegrationId = keyof typeof integrations;
