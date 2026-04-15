import { randomUUID, createHash } from "crypto";
import { config } from "../../config.js";
import { db, schema, eq, and } from "@aissisted/db";
import { encrypt, decrypt } from "../../utils/token-encryption.js";
import type { SmartConfiguration } from "./client.js";
import {
  getSmartConfig,
  fetchObservations,
  fetchDiagnosticReports,
  fetchAllergyIntolerance,
  fetchConditions,
  fetchMedicationRequests,
  fetchPatient,
  type FhirPatient,
} from "./client.js";
import {
  normalizeObservations,
  normalizeAllergies,
  normalizeConditions,
  normalizeMedications,
} from "./normalizer.js";
import { persistRawBiomarkers } from "../../services/biomarker.service.js";
import { persistConditions } from "../../services/conditions.service.js";
import { persistMedications } from "../../services/medications.service.js";
import { maybeReanalyze } from "../../services/analysis.service.js";
import { writeAuditLog } from "../../services/audit.service.js";

// ─── Token storage ────────────────────────────────────────

export interface FhirTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  patient?: string;
}

const whereUserFhir = (userId: string) =>
  and(
    eq(schema.integrationTokens.userId, userId),
    eq(schema.integrationTokens.provider, "fhir")
  );

export async function storeFhirTokens(
  userId: string,
  tokens: FhirTokens,
  patientId: string
): Promise<void> {
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : undefined;
  const now = new Date().toISOString();

  const existing = await db
    .select({ id: schema.integrationTokens.id, refreshToken: schema.integrationTokens.refreshToken })
    .from(schema.integrationTokens)
    .where(whereUserFhir(userId))
    .get();

  // When the token response omits refresh_token (common on refresh flows), preserve the stored value.
  const encryptedRefreshToken = tokens.refresh_token
    ? encrypt(tokens.refresh_token)
    : (existing?.refreshToken ?? null);

  const payload = {
    accessToken: encrypt(tokens.access_token),
    refreshToken: encryptedRefreshToken,
    expiresAt: expiresAt ?? null,
    metadata: JSON.stringify({ patientId }),
    updatedAt: now,
  };

  if (existing) {
    await db
      .update(schema.integrationTokens)
      .set(payload)
      .where(whereUserFhir(userId));
  } else {
    await db.insert(schema.integrationTokens).values({
      id: randomUUID(),
      userId,
      provider: "fhir",
      ...payload,
      createdAt: now,
    });
  }
}

async function refreshFhirToken(
  userId: string,
  stored: { refreshToken: string | null; metadata: string | null }
): Promise<string> {
  const smartConfig = await getSmartConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: decrypt(stored.refreshToken!),
    client_id: config.fhir.clientId,
  });

  const res = await fetch(smartConfig.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error("FHIR token refresh failed");

  const data = (await res.json()) as FhirTokens;
  const meta = stored.metadata ? JSON.parse(stored.metadata) : {};
  await storeFhirTokens(userId, data, meta.patientId ?? "");
  return data.access_token;
}

export async function getFhirAccessToken(
  userId: string
): Promise<{ token: string; patientId: string }> {
  const stored = await db
    .select()
    .from(schema.integrationTokens)
    .where(whereUserFhir(userId))
    .get();

  if (!stored?.accessToken) throw new Error("Epic/FHIR not connected");

  let token = decrypt(stored.accessToken);

  // Refresh if expired or expiring within 5 min
  if (stored.expiresAt) {
    const expiresAt = new Date(stored.expiresAt).getTime();
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      if (!stored.refreshToken) throw new Error("FHIR access token expired — please reconnect");
      token = await refreshFhirToken(userId, stored);
    }
  }

  const meta = stored.metadata ? JSON.parse(stored.metadata) : {};
  return { token, patientId: meta.patientId ?? "" };
}

// ─── Raw FHIR storage ─────────────────────────────────────

async function storeRawFhirResources(
  userId: string,
  resourceType: string,
  resources: Array<{ id: string; [key: string]: any }>,
  syncBatchId: string
): Promise<void> {
  const now = new Date().toISOString();
  for (const resource of resources) {
    if (!resource.id) continue;
    const payload = JSON.stringify(resource);
    const payloadHash = createHash("sha256").update(payload).digest("hex");
    await db
      .insert(schema.rawFhirResources)
      .values({
        id: randomUUID(),
        userId,
        provider: "epic",
        resourceType,
        resourceId: resource.id,
        payload,
        payloadHash,
        syncBatchId,
        syncedAt: now,
      })
      .onConflictDoNothing();
  }
}

// ─── Patient demographics hydration ──────────────────────

/**
 * Hydrate the user's health profile with demographics pulled from FHIR Patient.
 * Never overwrites values the user set manually (only fills empty fields).
 */
async function hydratePatientDemographics(
  userId: string,
  patient: FhirPatient
): Promise<void> {
  const profile = await db
    .select({
      dateOfBirth: schema.healthProfiles.dateOfBirth,
      sex: schema.healthProfiles.sex,
    })
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();

  if (!profile) return;

  const fhirSex =
    patient.gender === "male"
      ? "male"
      : patient.gender === "female"
      ? "female"
      : patient.gender === "other"
      ? "other"
      : undefined;

  // Only set fields that are currently empty
  const updates: Record<string, string | undefined> = {};
  if (!profile.dateOfBirth && patient.birthDate) {
    updates.dateOfBirth = patient.birthDate;
  }
  if (!profile.sex && fhirSex) {
    updates.sex = fhirSex;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(schema.healthProfiles)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(schema.healthProfiles.userId, userId));
  }
}

// ─── Allergy persistence ──────────────────────────────────

async function persistAllergies(userId: string, allergyNames: string[]): Promise<void> {
  if (allergyNames.length === 0) return;

  const profile = await db
    .select({ allergies: schema.healthProfiles.allergies })
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();

  if (!profile) return;

  const existing: string[] = JSON.parse(profile.allergies);
  const merged = Array.from(new Set([...existing, ...allergyNames]));

  await db
    .update(schema.healthProfiles)
    .set({ allergies: JSON.stringify(merged), updatedAt: new Date().toISOString() })
    .where(eq(schema.healthProfiles.userId, userId));
}

// ─── Sync ────────────────────────────────────────────────

export interface FhirSyncResult {
  observations: number;
  conditionsUpdated: number;
  medicationsUpdated: number;
  allergiesUpdated: boolean;
  diagnosticReports: number;
  syncBatchId: string;
}

/**
 * Sync FHIR data for a user.
 * @param fullHistory  When true, pulls complete longitudinal history (initial sync).
 *                     When false, fetches recent pages only (incremental sync).
 */
export async function syncFhirForUser(
  userId: string,
  fullHistory = false
): Promise<FhirSyncResult> {
  // Create sync batch record
  const batchId = randomUUID();
  const startedAt = new Date().toISOString();
  await db.insert(schema.syncBatches).values({
    id: batchId,
    userId,
    source: "fhir",
    status: "running",
    fullHistory,
    startedAt,
  });

  writeAuditLog(userId, "sync.start", "fhir", batchId, { fullHistory }).catch(() => {});

  try {
    const { token, patientId } = await getFhirAccessToken(userId);

    // 1. Fetch all FHIR resources in parallel (including Patient demographics)
    const [observations, diagnosticReports, allergyResources, conditionResources, medResources, patient] =
      await Promise.all([
        fetchObservations(token, patientId, fullHistory),
        fetchDiagnosticReports(token, patientId, fullHistory),
        fetchAllergyIntolerance(token, patientId),
        fetchConditions(token, patientId),
        fetchMedicationRequests(token, patientId),
        fetchPatient(token, patientId),
      ]);

    // 1b. Hydrate profile demographics from Patient resource (non-blocking)
    if (patient) {
      hydratePatientDemographics(userId, patient).catch(() => {});
    }

    // 2. Store raw FHIR blobs (compliance layer — fire-and-forget, non-blocking on error)
    Promise.allSettled([
      storeRawFhirResources(userId, "Observation", observations, batchId),
      storeRawFhirResources(userId, "DiagnosticReport", diagnosticReports, batchId),
      storeRawFhirResources(userId, "AllergyIntolerance", allergyResources, batchId),
    ]).catch(() => {});

    // 3. Normalize and persist observations (unit-converter applied inside normalizeObservations)
    const normalized = normalizeObservations(observations);
    const count = await persistRawBiomarkers(userId, normalized);

    // Trigger background health-state re-analysis if new data arrived
    maybeReanalyze(userId, count).catch(() => {});

    // 4. Normalize and persist allergies
    const allergies = normalizeAllergies(allergyResources);
    const allergyNames = allergies.map((a) => a.name);
    const allergiesUpdated = allergyNames.length > 0;
    if (allergiesUpdated) await persistAllergies(userId, allergyNames);

    // 5. Normalize and persist conditions into longitudinal table
    const normalizedConditions = normalizeConditions(conditionResources);
    const conditionsInserted = await persistConditions(userId, normalizedConditions);

    // 6. Normalize and persist medications into longitudinal table
    const normalizedMedications = normalizeMedications(medResources);
    const medicationsInserted = await persistMedications(userId, normalizedMedications);

    // Update sync batch to completed
    const completedAt = new Date().toISOString();
    await db
      .update(schema.syncBatches)
      .set({
        status: "completed",
        resourcesFetched: observations.length + diagnosticReports.length + conditionResources.length + medResources.length,
        biomarkersInserted: count,
        completedAt,
      })
      .where(eq(schema.syncBatches.id, batchId));

    writeAuditLog(userId, "sync.complete", "fhir", batchId, {
      biomarkersInserted: count,
      conditionsInserted,
      medicationsInserted,
      diagnosticReports: diagnosticReports.length,
      fullHistory,
    }).catch(() => {});

    return {
      observations: count,
      conditionsUpdated: conditionsInserted,
      medicationsUpdated: medicationsInserted,
      allergiesUpdated,
      diagnosticReports: diagnosticReports.length,
      syncBatchId: batchId,
    };
  } catch (err) {
    // Mark batch as failed
    await db
      .update(schema.syncBatches)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        completedAt: new Date().toISOString(),
      })
      .where(eq(schema.syncBatches.id, batchId));

    writeAuditLog(userId, "sync.fail", "fhir", batchId, {
      error: err instanceof Error ? err.message : String(err),
    }).catch(() => {});

    throw err;
  }
}
