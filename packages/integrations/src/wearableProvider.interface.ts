export interface WearableMetric {
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface WearableProvider {
  name: string;
  connect(): Promise<void>;
  fetchMetrics(userId: string): Promise<WearableMetric[]>;
}
