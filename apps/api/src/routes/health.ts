import { IncomingMessage, ServerResponse } from "node:http";

export function healthHandler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "ok", service: "aissisted-api" }));
}
