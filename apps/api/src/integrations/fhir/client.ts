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
      "patient/DiagnosticReport.read",
      "patient/AllergyIntolerance.read",
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
  /** Clinical reference range from the originating lab */
  referenceRange?: Array<{
    low?: { value: number; unit?: string };
    high?: { value: number; unit?: string };
    text?: string;
  }>;
  /** Panel grouping — member observations returned separately in the Bundle */
  hasMember?: Array<{ reference: string }>;
  component?: Array<{
    code: { coding: Array<{ system: string; code: string; display?: string }> };
    valueQuantity?: { value: number; unit: string };
    referenceRange?: Array<{ low?: { value: number }; high?: { value: number } }>;
  }>;
}

// ─── DiagnosticReport ─────────────────────────────────────

export interface FhirDiagnosticReport {
  resourceType: "DiagnosticReport";
  id: string;
  status: string;
  category?: Array<{ coding?: Array<{ code: string; system: string }> }>;
  code: {
    coding?: Array<{ system: string; code: string; display?: string }>;
    text?: string;
  };
  subject: { reference: string };
  effectiveDateTime?: string;
  issued?: string;
  result?: Array<{ reference: string }>; // references to Observation resources
  presentedForm?: Array<{ contentType: string; data?: string; url?: string }>;
}

// ─── AllergyIntolerance ──────────────────────────────────

export interface FhirAllergyIntolerance {
  resourceType: "AllergyIntolerance";
  id: string;
  clinicalStatus?: { coding?: Array<{ code: string }> };
  verificationStatus?: { coding?: Array<{ code: string }> };
  category?: string[]; // "food", "medication", "environment", "biologic"
  criticality?: "low" | "high" | "unable-to-assess";
  code?: {
    coding?: Array<{ system: string; code: string; display?: string }>;
    text?: string;
  };
  reaction?: Array<{
    manifestation?: Array<{ coding?: Array<{ display?: string }>; text?: string }>;
    severity?: "mild" | "moderate" | "severe";
  }>;
}

export interface FhirBundle<R = FhirObservation> {
  resourceType: "Bundle";
  total?: number;
  entry?: Array<{ resource: R }>;
  link?: Array<{ relation: string; url: string }>;
}

/** Generic paginated FHIR fetcher. Pass pageLimit=0 for full history. */
async function fetchAllPages<R>(
  accessToken: string,
  initialUrl: string,
  resourceType: string,
  pageLimit = 0 // 0 = unlimited (full history)
): Promise<R[]> {
  const results: R[] = [];
  let url: string | null = initialUrl;
  let pages = 0;
  const MAX_PAGES = pageLimit > 0 ? pageLimit : 500; // safety cap at 50,000 records

  while (url && pages < MAX_PAGES) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/fhir+json",
      },
    });
    if (!res.ok) break;

    const bundle = (await res.json()) as FhirBundle<R>;
    for (const entry of bundle.entry ?? []) {
      const r = entry.resource as any;
      if (r?.resourceType === resourceType) results.push(r as R);
    }

    const nextLink = bundle.link?.find((l) => l.relation === "next");
    url = nextLink?.url ?? null;
    pages++;
  }
  return results;
}

/**
 * Fetch Observation resources for a patient.
 * @param fullHistory  When true, follows all next-page links (full longitudinal history).
 *                     When false, fetches up to 3 pages (~300 records) for incremental syncs.
 */
export async function fetchObservations(
  accessToken: string,
  patientId: string,
  fullHistory = false
): Promise<FhirObservation[]> {
  return fetchAllPages<FhirObservation>(
    accessToken,
    `${config.fhir.baseUrl}/Observation?patient=${patientId}&_count=100&_sort=-date`,
    "Observation",
    fullHistory ? 0 : 3
  );
}

/**
 * Fetch DiagnosticReport resources (lab panels, pathology, imaging reports).
 * The result references contain Observation IDs already fetched separately.
 */
export async function fetchDiagnosticReports(
  accessToken: string,
  patientId: string,
  fullHistory = false
): Promise<FhirDiagnosticReport[]> {
  return fetchAllPages<FhirDiagnosticReport>(
    accessToken,
    `${config.fhir.baseUrl}/DiagnosticReport?patient=${patientId}&_count=50&_sort=-date&category=LAB`,
    "DiagnosticReport",
    fullHistory ? 0 : 3
  );
}

/**
 * Fetch AllergyIntolerance resources.
 */
export async function fetchAllergyIntolerance(
  accessToken: string,
  patientId: string
): Promise<FhirAllergyIntolerance[]> {
  return fetchAllPages<FhirAllergyIntolerance>(
    accessToken,
    `${config.fhir.baseUrl}/AllergyIntolerance?patient=${patientId}&_count=100`,
    "AllergyIntolerance",
    5
  );
}

// ─── Patient resource ─────────────────────────────────────

export interface FhirPatient {
  resourceType: "Patient";
  id: string;
  /** ISO date string e.g. "1985-03-14" */
  birthDate?: string;
  /** FHIR administrative gender */
  gender?: "male" | "female" | "other" | "unknown";
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  telecom?: Array<{ system: string; value: string }>;
}

/**
 * Fetch the Patient resource for the given FHIR patient ID.
 * Returns null on any error — demographics are enrichment, not critical path.
 */
export async function fetchPatient(
  accessToken: string,
  patientId: string
): Promise<FhirPatient | null> {
  try {
    const res = await fetch(`${config.fhir.baseUrl}/Patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/fhir+json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json() as FhirPatient;
    if (data.resourceType !== "Patient") return null;
    return data;
  } catch {
    return null;
  }
}
