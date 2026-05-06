import type { getProfile } from "../services/profile.service.js";
import type { getLatestBiomarkers } from "../services/biomarker.service.js";
import type { getLatestProtocol } from "../services/protocol.service.js";
import type { HealthState } from "../services/analysis.service.js";
import type { BiomarkerTrendRecord } from "../services/trends.service.js";
import type { getAdherenceScore } from "../services/adherence.service.js";
import type { getMedications } from "../services/medications.service.js";
import type { getConditions } from "../services/conditions.service.js";

export type ProfileData = Awaited<ReturnType<typeof getProfile>>;
export type BiomarkerData = Awaited<ReturnType<typeof getLatestBiomarkers>>[number];
export type ProtocolData = Awaited<ReturnType<typeof getLatestProtocol>>;
export type HealthStateData = HealthState;
export type TrendData = BiomarkerTrendRecord;
export type AdherenceData = Awaited<ReturnType<typeof getAdherenceScore>>;
export type MedicationData = Awaited<ReturnType<typeof getMedications>>[number];
export type ConditionData = Awaited<ReturnType<typeof getConditions>>[number];
