import { config } from "../../config.js";
import { getAccessToken } from "./oauth.js";

async function whoopFetch<T>(userId: string, path: string): Promise<T> {
  const token = await getAccessToken(userId);
  const res = await fetch(`${config.whoop.apiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`WHOOP API error ${res.status}: ${txt}`);
  }

  return res.json() as Promise<T>;
}

// ─── Recovery ─────────────────────────────────────────────

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;    // 0-100
    resting_heart_rate: number; // bpm
    hrv_rmssd_milli: number;    // ms
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export async function getLatestRecovery(userId: string): Promise<WhoopRecovery | null> {
  try {
    const data = await whoopFetch<{ records: WhoopRecovery[] }>(
      userId,
      "/recovery?limit=1"
    );
    return data.records?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Sleep ────────────────────────────────────────────────

export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number; // 0-100
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export async function getLatestSleep(userId: string): Promise<WhoopSleep | null> {
  try {
    const data = await whoopFetch<{ records: WhoopSleep[] }>(
      userId,
      "/activity/sleep?limit=1"
    );
    // Filter out naps
    const full = data.records?.filter((s) => !s.nap);
    return full?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Body Measurement ────────────────────────────────────

export interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

export async function getBodyMeasurement(userId: string): Promise<WhoopBodyMeasurement | null> {
  try {
    return await whoopFetch<WhoopBodyMeasurement>(userId, "/user/measurement/body");
  } catch {
    return null;
  }
}

// ─── Profile ─────────────────────────────────────────────

export interface WhoopProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export async function getWhoopProfile(userId: string): Promise<WhoopProfile | null> {
  try {
    return await whoopFetch<WhoopProfile>(userId, "/user/profile/basic");
  } catch {
    return null;
  }
}
