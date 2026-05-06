import { getProfile } from "../services/profile.service.js";
import { getLatestBiomarkers } from "../services/biomarker.service.js";
import { getLatestProtocol } from "../services/protocol.service.js";
import { getLatestHealthState } from "../services/analysis.service.js";
import { getBiomarkerTrends } from "../services/trends.service.js";
import { getAdherenceScore } from "../services/adherence.service.js";
import { getMedications } from "../services/medications.service.js";
import { getConditions } from "../services/conditions.service.js";
import {
  getUserConversations,
  getConversationHistory,
} from "../services/conversation.service.js";
import type { StateSlice, StateSliceKey } from "./types.js";

type Fetcher = () => Promise<unknown>;

function buildFetchers(userId: string): Map<StateSliceKey, Fetcher> {
  return new Map<StateSliceKey, Fetcher>([
    ["profile", () => getProfile(userId)],
    ["biomarkers", () => getLatestBiomarkers(userId)],
    ["protocol", () => getLatestProtocol(userId)],
    ["healthState", () => getLatestHealthState(userId)],
    ["trends", () => getBiomarkerTrends(userId)],
    ["adherence", () => getAdherenceScore(userId)],
    ["medications", () => getMedications(userId)],
    ["conditions", () => getConditions(userId)],
    [
      "conversations",
      async () => {
        const convos = await getUserConversations(userId);
        if (convos.length === 0) return [];
        return getConversationHistory(convos[0].id, 20);
      },
    ],
  ]);
}

export async function getStateSlice(
  userId: string,
  keys: StateSliceKey[]
): Promise<StateSlice> {
  if (keys.length === 0) return {};
  const fetchers = buildFetchers(userId);
  const results = await Promise.all(
    keys.map(async (key) => {
      const fetch = fetchers.get(key);
      if (!fetch) return [key, undefined] as const;
      try {
        const value = await fetch();
        return [key, value] as const;
      } catch (err) {
        console.error(`[state-loader] failed to fetch slice "${key}" for user ${userId}:`, err);
        return [key, undefined] as const;
      }
    })
  );
  return Object.fromEntries(results) as StateSlice;
}
