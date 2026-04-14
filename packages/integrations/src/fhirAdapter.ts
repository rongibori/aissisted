export interface FHIRObservation {
  code: string;
  value: number;
  unit: string;
  issued: string;
}

export class FHIRAdapter {
  async connect(): Promise<void> {
    // TODO: Implement SMART on FHIR OAuth2 flow
    console.log("Connecting to FHIR / MyChart...");
  }

  async fetchObservations(patientId: string): Promise<FHIRObservation[]> {
    // TODO: Replace with real FHIR API call
    return [
      {
        code: "LDL",
        value: 172,
        unit: "mg/dL",
        issued: new Date().toISOString(),
      },
    ];
  }
}
