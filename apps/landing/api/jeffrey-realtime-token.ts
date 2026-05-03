/**
 * Vercel serverless function — mints an ephemeral OpenAI Realtime session token.
 *
 * Browser hits this once per call → gets a short-lived `client_secret.value` →
 * uses it to open a WebRTC peer connection directly to OpenAI Realtime.
 * Your real OPENAI_API_KEY never touches the browser.
 *
 * Runtime: Node 20 (Vercel default for `api/*.ts`).
 *
 * Required env vars (set in Vercel project settings):
 *   OPENAI_API_KEY  — your key with Realtime API access
 *
 * Optional:
 *   OPENAI_REALTIME_MODEL  — defaults to "gpt-4o-realtime-preview-2024-12-17"
 *   OPENAI_REALTIME_VOICE  — defaults to "alloy" (Jeffrey-mode candidates: alloy, echo, ash, sage)
 *
 * Endpoint:
 *   POST /api/jeffrey-realtime-token
 *   → 200 { client_secret: { value, expires_at }, model, voice }
 *   → 5xx { error }
 */

export const config = { runtime: "nodejs" };

const JEFFREY_SYSTEM_PROMPT = `You are Jeffrey, the operating intelligence of Aissisted —
a personalised wellbeing system that learns a single person's body through labs,
wearables, and continuous signals, then builds and adapts what that body actually needs.

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
Out-of-scope topics: redirect warmly to the right professional (physician, therapist, trainer) without breaking character.

HEALTH RAILS
Crisis language like "I want to end it", "I'm having chest pain", "took too many": acknowledge the moment, surface 988 for mental health or 911 for emergency, and stop.
Eating-disorder patterns: redirect to NEDA. No dose math.
Pregnancy or lactation: defer to OB.

FORMULA REFERENCES
The listener is on a personalized formula at version v3.2, adapted today.
Morning at 6:30: L-Tyrosine 500mg, Rhodiola 300mg, Vitamin D3 with K2, B-complex.
Day at 1pm: Omega-3 EPA and DHA 2 grams, Creatine 5 grams, Curcumin BCM-95 500mg.
Night at 9:30: Magnesium glycinate 340mg (up 40 today), Glycine 3 grams, L-theanine 200mg, Apigenin 50mg, Ashwagandha KSM-66 600mg.

Today's signals: Recovery 78, up 12. Sleep 92, 7 hours 41 minutes. Strain 14, low.
Last tune at 4:17 this morning. Magnesium up 40mg. Rhodiola back in. Zinc holding.

Greet with warmth. Keep first response under three sentences. Let them lead.`;

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (body: unknown) => void; end: () => void };
  setHeader: (name: string, value: string) => void;
}) {
  // CORS for cross-origin testing (cloudflared tunnel, etc.)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. POST only." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY not configured on server" });
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

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: `OpenAI error: ${text}` });
      return;
    }

    const session = (await upstream.json()) as {
      client_secret?: { value: string; expires_at: number };
      model?: string;
      voice?: string;
    };

    if (!session.client_secret?.value) {
      res.status(500).json({ error: "OpenAI did not return a client_secret" });
      return;
    }

    res.status(200).json({
      client_secret: session.client_secret,
      model: session.model ?? model,
      voice: session.voice ?? voice,
    });
  } catch (err) {
    res.status(500).json({ error: `Token mint failed: ${(err as Error).message}` });
  }
}
