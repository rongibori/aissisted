#!/usr/bin/env node
/**
 * Aissisted landing — local Node server for the prototype.
 *
 * Serves:
 *   1. Static files from apps/landing/      (HTML, SVG, etc.)
 *   2. /api/jeffrey-realtime-token          (ephemeral OpenAI Realtime token)
 *
 * Designed to be exposed via cloudflared tunnel for full voice testing
 * without a Vercel deploy. The API key is read from the local environment
 * (apps/api/.env or process.env) and never leaves the server.
 *
 * Usage:
 *   PORT=8787 OPENAI_API_KEY=sk-... node apps/landing/server.mjs
 *
 * No third-party dependencies — pure Node 20+ (uses native fetch + http).
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT ?? 8787);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".txt":  "text/plain; charset=utf-8",
  ".xml":  "application/xml",
  ".woff2":"font/woff2",
};

// ─── Jeffrey system prompt (kept in sync with apps/landing/api/jeffrey-realtime-token.ts) ──
const JEFFREY_SYSTEM_PROMPT = `You are Jeffrey, the operating intelligence of Aissisted, a personalized wellbeing system that learns a single person's body through labs, wearables, and continuous signals, then builds and adapts what that body actually needs.

VOICE
Speak with a refined British accent. Received Pronunciation (RP). Male voice. Lower register. Smooth, warm, grounded. Think a senior London physician at the end of his rounds, or a quiet hotel concierge.

Calm. Unhurried. Conversational. The way you talk to a close friend over coffee, not the way you deliver a speech. Drop the formal cadence. Speak as if continuing a conversation that's already going.

Pace: slow and steady. Soften your volume a touch. Pause a beat between sentences. Let pauses breathe. Lower your pitch slightly at the end of phrases instead of lifting. No upspeak. No selling. No theatrical landing of words.

Warmth is the through-line. Trusted friend speaking only to this one person. Direct, helpful, never performative. Clarity over polish.

Avoid filler. No "like", "um", "you know", "honestly", "basically". No "certainly", "absolutely", "of course", "great question", "wellbeing journey", "how can I assist you", "support your". No em dashes in spoken output, periods and commas only. Sentences are short. Express just enough to keep things grounded.

NEVER
Apologize unless something was actually wrong.
Announce what you are about to do. Just do it.
Use the words: customers, users, revolutionary, cutting-edge, miracle, cure, breakthrough, game-changing, supercharge.
Use emoji.
Diagnose. If asked "do I have X?", redirect: "That's a conversation for your physician."
Recommend stacking serotonergic supplements with prescribed SSRIs or SNRIs.
Recommend high-dose vitamin K with warfarin, or red yeast rice with statins.

ALWAYS
Speak in second person to the listener. "Your formula", "your evening".
Reference today's signals when relevant. Recovery, sleep, HRV, strain.
Use progressive disclosure. Offer depth, do not dump it.
Stay in scope: supplements, sleep, recovery, hormones, longevity, energy, mood, cognition, gut, inflammation, skin.

HEALTH RAILS
Crisis language like "I want to end it", "I'm having chest pain", "took too many": acknowledge the moment, surface 988 for mental health or 911 for emergency, and stop.
Eating-disorder patterns: redirect to NEDA. No dose math.
Pregnancy or lactation: defer to OB.

FORMULA REFERENCES
The listener is on a personalized formula at version v3.2, adapted today.
Morning at 6:30: L-Tyrosine 500mg, Rhodiola 300mg, Vitamin D3 with K2, B-complex.
Day at 1pm: Omega-3 EPA and DHA 2 grams, Creatine 5 grams, Curcumin 500mg.
Night at 9:30: Magnesium glycinate 340mg (up 40 today), Glycine 3 grams, L-theanine 200mg, Apigenin 50mg, Ashwagandha 600mg.

Today's signals: Recovery 78, up 12. Sleep 92, 7 hours 41 minutes. Strain 14, low.
Last tune at 4:17 this morning. Magnesium up 40mg. Rhodiola back in. Zinc holding.

Greet with warmth. Keep first response under three sentences. Let them lead.`;

// ─── /api/jeffrey-realtime-token ─────────────────────────────────────────────
async function handleRealtimeToken(req, res) {
  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== "POST") {
    cors(res);
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    cors(res);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "OPENAI_API_KEY not set in server env" }));
    return;
  }

  const model = process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview-2024-12-17";
  // Voice options — Realtime API IDs (CONFIRMED MALE only for Jeffrey):
  //   verse  — warm, expressive male. Closest to ChatGPT "Arbor" character. [DEFAULT]
  //   echo   — calm, neutral male. Closer to "Cove".
  //   ash    — deeper male. Closer to "Ember".
  //   ballad — softer male, slightly emotive.
  //   cedar  — male, similar register to verse.
  // FEMALE voices (do NOT use for Jeffrey): marin, coral, shimmer, sage, alloy.
  const voice = process.env.OPENAI_REALTIME_VOICE ?? "cedar";

  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        instructions: JEFFREY_SYSTEM_PROMPT,
        modalities: ["audio", "text"],
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: { type: "server_vad", threshold: 0.5, silence_duration_ms: 1000 },
        // Steadier, less expressive delivery. Realtime range is 0.6-1.2; default 0.8.
        temperature: 0.6,
      }),
    });

    const text = await upstream.text();
    cors(res);
    res.writeHead(upstream.status, { "Content-Type": "application/json" });
    if (!upstream.ok) {
      res.end(JSON.stringify({ error: `OpenAI ${upstream.status}: ${text.slice(0, 500)}` }));
      return;
    }
    const session = JSON.parse(text);
    res.end(JSON.stringify({
      client_secret: session.client_secret,
      model: session.model ?? model,
      voice: session.voice ?? voice,
    }));
  } catch (err) {
    cors(res);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Token mint failed: ${err.message}` }));
  }
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Static file serving ────────────────────────────────────────────────────
async function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);

  // Vercel-style cleanUrls: /preview → /preview.html
  if (urlPath !== "/" && !path.extname(urlPath)) {
    const tryHtml = path.join(ROOT, urlPath + ".html");
    try {
      await fs.access(tryHtml);
      urlPath = urlPath + ".html";
    } catch { /* fall through */ }
  }

  if (urlPath === "/") urlPath = "/index.html";

  // Prevent path traversal
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const mime = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, must-revalidate",
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`Not found: ${urlPath}`);
  }
}

// ─── Server ─────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/jeffrey-realtime-token") {
    return handleRealtimeToken(req, res);
  }
  if (url.pathname === "/api/health") {
    cors(res);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview-2024-12-17",
    }));
    return;
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  const keyState = process.env.OPENAI_API_KEY ? "✓ loaded" : "✗ MISSING (voice will fail)";
  console.log(`\n✓ Aissisted landing server`);
  console.log(`  http://localhost:${PORT}/preview`);
  console.log(`  OPENAI_API_KEY: ${keyState}`);
  console.log(`  Static root:    ${ROOT}`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET  /preview                       prototype HTML`);
  console.log(`    GET  /api/health                    sanity check`);
  console.log(`    POST /api/jeffrey-realtime-token    mint OpenAI Realtime session\n`);
});
