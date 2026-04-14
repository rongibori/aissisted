import type { Signal } from "../../engine/types.js";
import type { WhoopRecovery, WhoopSleep } from "./client.js";

/**
 * Convert WHOOP recovery data into engine Signals.
 */
export function recoveryToSignals(recovery: WhoopRecovery): Signal[] {
  const signals: Signal[] = [];
  const { score } = recovery;

  if (!score || recovery.score_state !== "SCORED") return signals;

  signals.push({
    name: "whoop_recovery_score",
    value: score.recovery_score,
    unit: "%",
    source: "wearable",
  });

  signals.push({
    name: "whoop_hrv_rmssd",
    value: score.hrv_rmssd_milli,
    unit: "ms",
    source: "wearable",
  });

  signals.push({
    name: "whoop_resting_hr",
    value: score.resting_heart_rate,
    unit: "bpm",
    source: "wearable",
  });

  if (score.spo2_percentage > 0) {
    signals.push({
      name: "whoop_spo2",
      value: score.spo2_percentage,
      unit: "%",
      source: "wearable",
    });
  }

  return signals;
}

/**
 * Convert WHOOP sleep data into engine Signals.
 */
export function sleepToSignals(sleep: WhoopSleep): Signal[] {
  const signals: Signal[] = [];
  const { score } = sleep;

  if (!score || sleep.score_state !== "SCORED") return signals;

  signals.push({
    name: "whoop_sleep_performance",
    value: score.sleep_performance_percentage,
    unit: "%",
    source: "wearable",
  });

  signals.push({
    name: "whoop_sleep_efficiency",
    value: score.sleep_efficiency_percentage,
    unit: "%",
    source: "wearable",
  });

  // Total sleep in hours
  const totalSleepMs =
    score.stage_summary.total_light_sleep_time_milli +
    score.stage_summary.total_slow_wave_sleep_time_milli +
    score.stage_summary.total_rem_sleep_time_milli;

  signals.push({
    name: "whoop_total_sleep_hours",
    value: Math.round((totalSleepMs / 3_600_000) * 10) / 10,
    unit: "h",
    source: "wearable",
  });

  // REM percentage
  if (totalSleepMs > 0) {
    const remPct =
      (score.stage_summary.total_rem_sleep_time_milli / totalSleepMs) * 100;
    signals.push({
      name: "whoop_rem_pct",
      value: Math.round(remPct),
      unit: "%",
      source: "wearable",
    });
  }

  signals.push({
    name: "whoop_respiratory_rate",
    value: score.respiratory_rate,
    unit: "rpm",
    source: "wearable",
  });

  return signals;
}

/**
 * Map WHOOP signals to biomarker-compatible session_history entries.
 */
export function signalsToBiomarkerRows(
  signals: Signal[],
  measuredAt: string
): Array<{ metric: string; value: number; unit: string }> {
  return signals.map((s) => ({
    metric: s.name,
    value: s.value,
    unit: s.unit ?? "",
  }));
}
