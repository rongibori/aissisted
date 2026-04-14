import { config } from "../../config.js";
import { db, schema, eq } from "@aissisted/db";

/**
 * FHIR R4 + SMART on FHIR client stub.
 *
 * Supports:
 *   - SMART on FHIR authorization code flow
 *   - Fetching Observation resources for a patient
 */

export interface SmartConfiguration {
  authorization_endpoint: string;
  token_endpoint: string;
  scopes_supported?: string[];
}

export async function getSmartConfig(): Promise<SmartConfiguration> {
  const url = `${config.fhir.baseUrl}/.well-known/smart-configuration`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`SMART config fetch failed: ${res.status}`);
  return res.json() as Promise<SmartConfiguration>;
}

export function buildFhirAuthUrl(smartConfig: SmartConfiguration, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.fhir.clientId,
    redirect_uri: config.fhir.redirectUri,
    scope: [
      "launch/patient",
      "openid",
      "fhirUser",
      "offline_access",
      "patient/Observation.read",
      "patient/Patient.read",
      "patient/Condition.read",
      "patient/MedicationRequest.read",
    ].join(" "),
    state,
    aud: config.fhir.baseUrl,
  });
  return `${smartConfig.authorization_endpoint}?${params}`;
}

export async function exchangeFhirCode(
  smartConfig: SmartConfiguration,
  code: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; patientId: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.fhir.redirectUri,
    client_id: config.fhir.clientId,
  });

  const res = await fetch(smartConfig.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error("FHIR token exchange failed");

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    patient?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    patientId: data.patient ?? "",
  };
}

// ─── Condition resources ──────────────────────────────────

interface FhirCondition {
  resourceType: "Condition";
  clinicalStatus?: { coding?: Array<{ code: string }> };
  code?: {
    coding?: Array<{ system: string; code: string; display?: string }>;
    text?: string;
  };
}

/**
 * Fetch active Conditions and return plain-text names suitable for
 * auto-populating the user's conditions list.
 */
export async function fetchConditions(
  accessToken: string,
  patientId: string
): Promise<string[]> {
  try {
    const res = await fetch(
      `${config.fhir.baseUrl}/Condition?patient=${patientId}&clinical-status=active&_count=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/fhir+json",
        },
      }
    );
    if (!res.ok) return [];
    const bundle = await res.json() as { entry?: Array<{ resource: FhirCondition }> };
    const names: string[] = [];
    for (const entry of bundle.entry ?? []) {
      const r = entry.resource;
      if (r.resourceType !== "Condition") continue;
      const status = r.clinicalStatus?.coding?.[0]?.code;
      if (status && status !== "active") continue;
      const display = r.code?.text ?? r.code?.coding?.[0]?.display;
      if (display) names.push(display.toLowerCase());
    }
    return [...new Set(names)];
  } catch {
    return [];
  }
}

// ─── MedicationRequest resources ─────────────────────────

interface FhirMedRequest {
  resourceType: "MedicationRequest";
  status?: string;
  medicationCodeableConcept?: {
    coding?: Array<{ system: string; code: string; display?: string }>;
    text?: string;
  };
  medicationReference?: { display?: string };
}

/**
 * Fetch active MedicationRequests and return medication names.
 */
export async function fetchMedicationRequests(
  accessToken: string,
  patientId: string
): Promise<string[]> {
  try {
    const res = await fetch(
      `${config.fhir.baseUrl}/MedicationRequest?patient=${patientId}&status=active&_count=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/fhir+json",
        },
      }
    );
    if (!res.ok) return [];
    const bundle = await res.json() as { entry?: Array<{ resource: FhirMedRequest }> };
    const names: string[] = [];
    for (const entry of bundle.entry ?? []) {
      const r = entry.resource;
      if (r.resourceType !== "MedicationRequest") continue;
      if (r.status && r.status !== "active") continue;
      const display =
        r.medicationCodeableConcept?.text ??
        r.medicationCodeableConcept?.coding?.[0]?.display ??
        r.medicationReference?.display;
      if (display) names.push(display.toLowerCase());
    }
    return [...new Set(names)];
  } catch {
    return [];
  }
}

// ─── FHIR Resources ──────────────────────────────────────

export interface FhirObservation {
  resourceType: "Observation";
  id: string;
  status: string;
  code: {
    coding: Array<{ system: string; code: string; display?: string }>;
    text?: string;
  };
  subject: { reference: string };
  effectiveDateTime?: string;
  effectivePeriod?: { start: string; end: string };
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  /** Panel grouping — member observations returned separately in the Bundle */
  hasMember?: Array<{ reference: string }>;
  component?: Array<{
    code: { coding: Array<{ system: string; code: string; display?: string }> };
    valueQuantity?: { value: number; unit: string };
  }>;
}

export interface FhirBundle {
  resourceType: "Bundle";
  total?: number;
  entry?: Array<{ resource: FhirObservation }>;
  link?: Array<{ relation: string; url: string }>;
}

export async function fetchObservations(
  accessToken: string,
  patientId: string,
  pageLimit = 3
): Promise<FhirObservation[]> {
  const observations: FhirObservation[] = [];
  let url: string | null =
    `${config.fhir.baseUrl}/Observation?patient=${patientId}&_count=100&_sort=-date`;

  let pages = 0;
  while (url && pages < pageLimit) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/fhir+json",
      },
    });

    if (!res.ok) break;

    const bundle = (await res.json()) as FhirBundle;

    for (const entry of bundle.entry ?? []) {
      if (entry.resource?.resourceType === "Observation") {
        observations.push(entry.resource);
      }
    }

    // Follow next page link
    const nextLink = bundle.link?.find((l) => l.relation === "next");
    url = nextLink?.url ?? null;
    pages++;
  }

  return observations;
}
