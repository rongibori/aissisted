import { NextResponse } from "next/server";
import { synthesizeStream } from "@aissisted/jeffrey/bridge";

/**
 * POST /api/jeffrey/voice/tts
 *
 * ElevenLabs streaming TTS relay. Mirrors apps/api/src/routes/jeffrey.ts
 * voice/tts so xi-api-key never leaves the server.
 *
 * Request:
 *   { text: string, voiceId?: string }
 *
 * Response:
 *   200 audio/mpeg chunked stream
 *   503 when ELEVENLABS_API_KEY or voice ID are missing (precise missing-var list)
 *   502 on provider failure
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  text?: unknown;
  voiceId?: unknown;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON." } },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      {
        error: {
          code: "EMPTY_TEXT",
          message: "A non-empty text field is required.",
        },
      },
      { status: 400 },
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      {
        error: {
          code: "TEXT_TOO_LONG",
          message: "Text must be 4000 characters or fewer.",
        },
      },
      { status: 400 },
    );
  }

  const suppliedVoiceId =
    typeof body.voiceId === "string" && body.voiceId.trim().length > 0
      ? body.voiceId.trim()
      : undefined;

  const envVoiceId =
    process.env.ELEVENLABS_JEFFREY_VOICE_ID ??
    process.env.ELEVENLABS_DEFAULT_VOICE_ID ??
    undefined;

  const effectiveVoiceId = suppliedVoiceId ?? envVoiceId;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || !effectiveVoiceId) {
    const missing = [
      !apiKey ? "ELEVENLABS_API_KEY" : null,
      !effectiveVoiceId ? "ELEVENLABS_JEFFREY_VOICE_ID" : null,
    ].filter((v): v is string => v !== null);
    return NextResponse.json(
      {
        error: {
          code: "VOICE_UNAVAILABLE",
          message: `Voice not configured (${missing.join(", ")} missing)`,
        },
      },
      { status: 503 },
    );
  }

  const encoder = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of synthesizeStream({
          text,
          voiceId: effectiveVoiceId,
        })) {
          if (chunk.final) break;
          if (chunk.bytes.byteLength === 0) continue;
          controller.enqueue(new Uint8Array(chunk.bytes));
        }
        controller.close();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[site/jeffrey/tts] relay failed", err);
        controller.error(err);
      }
    },
  });

  return new Response(encoder, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
      "x-jeffrey-voice": "elevenlabs",
    },
  });
}

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId =
    process.env.ELEVENLABS_JEFFREY_VOICE_ID ??
    process.env.ELEVENLABS_DEFAULT_VOICE_ID;
  return NextResponse.json({
    status: apiKey && voiceId ? "ready" : "unconfigured",
    configured: Boolean(apiKey && voiceId),
  });
}
