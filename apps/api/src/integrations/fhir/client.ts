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
    scope: "launch/patient openid fhirUser patient/Observation.read patient/Patient.read",
    state,
    aud: config.fhir.baseUrl,
  });
  return `${smartConfig.authorization_endpoint}?${params}`;
}

export async function exchangeFhirCode(
  smartConfig: SmartConfiguration,
  code: string
): Promise<{ accessToken: string; patientId: string }> {
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
    patient?: string;
  };

  return {
    accessToken: data.access_token,
    patientId: data.patient ?? "",
  };
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
