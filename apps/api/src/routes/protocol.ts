import { IncomingMessage, ServerResponse } from "node:http";

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

export async function protocolHandler(req: IncomingMessage, res: ServerResponse) {
  const input = await parseBody(req);

  const recommendations = [];

  // Simple rules engine (Phase 2 starter)
  if (input?.biomarkers) {
    const cholesterol = input.biomarkers.find((b: any) => b.code === "LDL");

    if (cholesterol && cholesterol.value > 160) {
      recommendations.push({
        name: "Omega-3",
        dosage: "2000 mg daily",
        timing: "morning",
        rationale: "Supports lowering elevated LDL cholesterol",
      });
    }
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ recommendations }));
}
