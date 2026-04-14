import { createServer } from "node:http";
import { protocolHandler } from "./routes/protocol";
import { healthHandler } from "./routes/health";

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Missing URL");
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    return healthHandler(req, res);
  }

  if (req.method === "POST" && req.url === "/protocol") {
    return protocolHandler(req, res);
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

server.listen(port, () => {
  console.log(`Aissisted API listening on port ${port}`);
});
