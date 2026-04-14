import { randomUUID } from "crypto";
import { config } from "../../config.js";
import { db, schema, eq, and } from "@aissisted/db";
import type { SmartConfiguration } from "./client.js";
import {
  getSmartConfig,
  fetchObservations,
  fetchDiagnosticReports,
  fetchAllergyIntolerance,
  fetchConditions,
  fetchMedicationRequests,
} from "./client.js";
import {
  normalizeObservations,
  normalizeAllergies,
} from "./normalizer.js";
import { persistRawBiomarkers } from "../../services/biomarker.service.js";
import { maybeReanalyze } from "../../services/analysis.service.js";

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
    .select({ id: schema.integrationTokens.id })
    .from(schema.integrationTokens)
    .where(whereUserFhir(userId))
    .get();

  const payload = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
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
    refresh_token: stored.refreshToken!,
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

  let token = stored.accessToken;

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
  resources: Array<{ id: string; [key: string]: any }>
): Promise<void> {
  const now = new Date().toISOString();
  for (const resource of resources) {
    if (!resource.id) continue;
    try {
      await db.insert(schema.rawFhirResources).values({
        id: randomUUID(),
        userId,
        provider: "epic",
        resourceType,
        resourceId: resource.id,
        payload: JSON.stringify(resource),
        syncedAt: now,
      });
    } catch {
      // Skip if already stored (duplicate resourceId for this user)
    }
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
  conditionsUpdated: boolean;
  medicationsUpdated: boolean;
  allergiesUpdated: boolean;
  diagnosticReports: number;
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
  const { token, patientId } = await getFhirAccessToken(userId);

  // 1. Fetch all FHIR resources in parallel
  const [observations, diagnosticReports, allergyResources, conditionNames, medsNames] =
    await Promise.all([
      fetchObservations(token, patientId, fullHistory),
      fetchDiagnosticReports(token, patientId, fullHistory),
      fetchAllergyIntolerance(token, patientId),
      fetchConditions(token, patientId),
      fetchMedicationRequests(token, patientId),
    ]);

  // 2. Store raw FHIR blobs (compliance layer — fire-and-forget, non-blocking on error)
  Promise.allSettled([
    storeRawFhirResources(userId, "Observation", observations),
    storeRawFhirResources(userId, "DiagnosticReport", diagnosticReports),
    storeRawFhirResources(userId, "AllergyIntolerance", allergyResources),
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

  // 5. Merge conditions and medications into profile
  const conditionsUpdated = conditionNames.length > 0;
  const medicationsUpdated = medsNames.length > 0;

  if (conditionsUpdated || medicationsUpdated) {
    const profile = await db
      .select()
      .from(schema.healthProfiles)
      .where(eq(schema.healthProfiles.userId, userId))
      .get();

    if (profile) {
      const existingConditions: string[] = JSON.parse(profile.conditions);
      const existingMeds: string[] = JSON.parse(profile.medications);

      await db
        .update(schema.healthProfiles)
        .set({
          conditions: JSON.stringify(
            Array.from(new Set([...existingConditions, ...conditionNames]))
          ),
          medications: JSON.stringify(
            Array.from(new Set([...existingMeds, ...medsNames]))
          ),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.healthProfiles.userId, userId));
    }
  }

  return {
    observations: count,
    conditionsUpdated,
    medicationsUpdated,
    allergiesUpdated,
    diagnosticReports: diagnosticReports.length,
  };
}
