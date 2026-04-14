import { WearableProvider, WearableMetric } from "./wearableProvider.interface";

export class AppleHealthAdapter implements WearableProvider {
  name = "apple-health";

  async connect(): Promise<void> {
    // TODO: Implement HealthKit bridge or platform-specific sync flow
    console.log("Connecting to Apple Health...");
  }

  async fetchMetrics(userId: string): Promise<WearableMetric[]> {
    // TODO: Replace with real Apple Health ingestion pipeline
    return [
      {
        type: "RESTING_HEART_RATE",
        value: 58,
        unit: "bpm",
        recordedAt: new Date().toISOString(),
      },
      {
        type: "HRV",
        value: 42,
        unit: "ms",
        recordedAt: new Date().toISOString(),
      },
    ];
  }
}
