import { WearableProvider, WearableMetric } from "./wearableProvider.interface";

export class WhoopAdapter implements WearableProvider {
  name = "whoop";

  async connect(): Promise<void> {
    // TODO: OAuth connection
    console.log("Connecting to WHOOP...");
  }

  async fetchMetrics(userId: string): Promise<WearableMetric[]> {
    // TODO: Replace with real API call
    return [
      {
        type: "HRV",
        value: 38,
        unit: "ms",
        recordedAt: new Date().toISOString(),
      },
    ];
  }
}
