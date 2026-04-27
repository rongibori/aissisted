import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StateSliceKey } from "../types.js";

vi.mock("../../services/profile.service.js", () => ({
  getProfile: vi.fn().mockResolvedValue({ firstName: "Test", lastName: "User" }),
}));
vi.mock("../../services/biomarker.service.js", () => ({
  getLatestBiomarkers: vi.fn().mockResolvedValue([{ name: "ldl_mg_dl", value: 100 }]),
}));
vi.mock("../../services/protocol.service.js", () => ({
  getLatestProtocol: vi.fn().mockResolvedValue({ id: "proto-1" }),
}));
vi.mock("../../services/analysis.service.js", () => ({
  getLatestHealthState: vi.fn().mockResolvedValue({ mode: "optimal", confidenceScore: 0.9 }),
}));
vi.mock("../../services/trends.service.js", () => ({
  getBiomarkerTrends: vi.fn().mockResolvedValue([{ biomarkerName: "ldl_mg_dl" }]),
}));
vi.mock("../../services/adherence.service.js", () => ({
  getAdherenceScore: vi.fn().mockResolvedValue({ score: 80, taken: 4, skipped: 1, total: 5, periodDays: 30 }),
}));
vi.mock("../../services/medications.service.js", () => ({
  getMedications: vi.fn().mockResolvedValue([{ name: "Metformin" }]),
}));
vi.mock("../../services/conditions.service.js", () => ({
  getConditions: vi.fn().mockResolvedValue([{ name: "Type 2 Diabetes" }]),
}));
vi.mock("../../services/conversation.service.js", () => ({
  getUserConversations: vi.fn().mockResolvedValue([{ id: "conv-1" }]),
  getConversationHistory: vi.fn().mockResolvedValue([{ role: "user", content: "hello" }]),
}));

const { getStateSlice } = await import("../state-loader.js");

import * as profileService from "../../services/profile.service.js";
import * as biomarkerService from "../../services/biomarker.service.js";
import * as protocolService from "../../services/protocol.service.js";
import * as analysisService from "../../services/analysis.service.js";
import * as trendsService from "../../services/trends.service.js";
import * as adherenceService from "../../services/adherence.service.js";
import * as medicationsService from "../../services/medications.service.js";
import * as conditionsService from "../../services/conditions.service.js";
import * as conversationService from "../../services/conversation.service.js";

const USER_ID = "user-test-123";

beforeEach(() => { vi.clearAllMocks(); });

describe("getStateSlice", () => {
  it("returns empty object when keys array is empty without hitting the DB", async () => {
    const result = await getStateSlice(USER_ID, []);
    expect(result).toEqual({});
    expect(profileService.getProfile).not.toHaveBeenCalled();
    expect(biomarkerService.getLatestBiomarkers).not.toHaveBeenCalled();
    expect(analysisService.getLatestHealthState).not.toHaveBeenCalled();
  });

  it("fetches only the requested keys and returns exactly those keys", async () => {
    const keys: StateSliceKey[] = ["profile", "biomarkers"];
    const result = await getStateSlice(USER_ID, keys);
    expect(profileService.getProfile).toHaveBeenCalledOnce();
    expect(biomarkerService.getLatestBiomarkers).toHaveBeenCalledOnce();
    expect(protocolService.getLatestProtocol).not.toHaveBeenCalled();
    expect(analysisService.getLatestHealthState).not.toHaveBeenCalled();
    expect(trendsService.getBiomarkerTrends).not.toHaveBeenCalled();
    expect(adherenceService.getAdherenceScore).not.toHaveBeenCalled();
    expect(medicationsService.getMedications).not.toHaveBeenCalled();
    expect(conditionsService.getConditions).not.toHaveBeenCalled();
    expect(Object.keys(result)).toEqual(expect.arrayContaining(["profile", "biomarkers"]));
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("fetches all keys when all are requested", async () => {
    const keys: StateSliceKey[] = [
      "profile", "biomarkers", "protocol", "healthState",
      "trends", "adherence", "medications", "conditions", "conversations",
    ];
    const result = await getStateSlice(USER_ID, keys);
    expect(Object.keys(result)).toHaveLength(keys.length);
    expect(profileService.getProfile).toHaveBeenCalledOnce();
    expect(biomarkerService.getLatestBiomarkers).toHaveBeenCalledOnce();
    expect(protocolService.getLatestProtocol).toHaveBeenCalledOnce();
    expect(analysisService.getLatestHealthState).toHaveBeenCalledOnce();
    expect(trendsService.getBiomarkerTrends).toHaveBeenCalledOnce();
    expect(adherenceService.getAdherenceScore).toHaveBeenCalledOnce();
    expect(medicationsService.getMedications).toHaveBeenCalledOnce();
    expect(conditionsService.getConditions).toHaveBeenCalledOnce();
    expect(conversationService.getUserConversations).toHaveBeenCalledOnce();
  });

  it("returns undefined for a key whose fetcher throws, without crashing the loader", async () => {
    vi.mocked(profileService.getProfile).mockRejectedValueOnce(new Error("DB connection error"));
    const result = await getStateSlice(USER_ID, ["profile", "biomarkers"]);
    expect(result.profile).toBeUndefined();
    expect(result.biomarkers).toBeDefined();
    expect(result.biomarkers).toHaveLength(1);
  });

  it("handles multiple concurrent failures without crashing", async () => {
    vi.mocked(profileService.getProfile).mockRejectedValueOnce(new Error("fail-1"));
    vi.mocked(analysisService.getLatestHealthState).mockRejectedValueOnce(new Error("fail-2"));
    const result = await getStateSlice(USER_ID, ["profile", "biomarkers", "healthState"]);
    expect(result.profile).toBeUndefined();
    expect(result.healthState).toBeUndefined();
    expect(result.biomarkers).toBeDefined();
  });

  it("fetches conversations by getting the most recent conversation first", async () => {
    const result = await getStateSlice(USER_ID, ["conversations"]);
    expect(conversationService.getUserConversations).toHaveBeenCalledOnce();
    expect(conversationService.getConversationHistory).toHaveBeenCalledWith("conv-1", 20);
    expect(result.conversations).toHaveLength(1);
  });

  it("returns empty conversations array when user has no conversations", async () => {
    vi.mocked(conversationService.getUserConversations).mockResolvedValueOnce([]);
    const result = await getStateSlice(USER_ID, ["conversations"]);
    expect(conversationService.getConversationHistory).not.toHaveBeenCalled();
    expect(result.conversations).toEqual([]);
  });
});
