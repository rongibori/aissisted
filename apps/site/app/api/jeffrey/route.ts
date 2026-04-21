import { NextResponse } from "next/server";
import {
  createJeffreySession,
  noopMemoryAdapter,
  type JeffreySurface,
} from "@aissisted/jeffrey";

/**
 * POST /api/jeffrey
 *
 * Public, unauthenticated Jeffrey surface for the Investor Room and other
 * marketing pages.
 *
 * Data-isolation posture:
 *   · memoryAdapter → noopMemoryAdapter (no PHI, no cross-session memory)
 *   · no userId
 *   · surface defaults to "investor"
 *   · surface allowlist is enforced — only investor / brand / product-walkthrough
 *
 * The private/authenticated Jeffrey (health, concierge, onboarding with
 * self-context) lives on apps/api /v1/jeffrey/ask. This route never touches
 * user health data.
 *
 * Request:
 *   { message: string, surface?: "investor" | "brand" | "product-walkthrough" }
 *
 * Response (200):
 *   { reply: string, surface: string, model?: string }
 *
 * Graceful degrade when OPENAI_API_KEY is missing — returns a polite
 * placeholder string with status 200 so the UI stays conversational and the
 * preview URL is demo-able the moment the key lands.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_SURFACES: ReadonlyArray<JeffreySurface> = [
  "investor",
  "brand",
  "product-walkthrough",
];

function isPublicSurface(x: unknown): x is JeffreySurface {
  return typeof x === "string" && PUBLIC_SURFACES.includes(x as JeffreySurface);
}

type AskBody = {
  message?: unknown;
  surface?: unknown;
};

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON." } },
      { status: 400 },
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      {
        error: {
          code: "EMPTY_MESSAGE",
          message: "A non-empty message is required.",
        },
      },
      { status: 400 },
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      {
        error: {
          code: "MESSAGE_TOO_LONG",
          message: "Message must be 4000 characters or fewer.",
        },
      },
      { status: 400 },
    );
  }

  const surface: JeffreySurface = isPublicSurface(body.surface)
    ? body.surface
    : "investor";

  // Graceful fallback when the OpenAI key hasn't landed yet — the UI stays
  // live and we can screenshot the investor room without a 500.
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      surface,
      reply: unkeyedFallback(surface),
      model: "offline-fallback",
    });
  }

  try {
    const session = await createJeffreySession({
      surface,
      memoryAdapter: noopMemoryAdapter,
    });
    const result = await session.ask(message);
    return NextResponse.json({
      surface,
      reply: result.text,
      model: result.model,
    });
  } catch (err) {
    const e = err as Error;
    // eslint-disable-next-line no-console
    console.error("[site/jeffrey] ask failed", e);
    return NextResponse.json(
      {
        error: {
          code: "JEFFREY_ASK_FAILED",
          message:
            "Jeffrey couldn't answer that just now. Try again in a moment.",
        },
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    surface: "investor",
    publicSurfaces: PUBLIC_SURFACES,
    voice: Boolean(
      process.env.ELEVENLABS_API_KEY &&
        (process.env.ELEVENLABS_JEFFREY_VOICE_ID ??
          process.env.ELEVENLABS_DEFAULT_VOICE_ID),
    ),
    brain: Boolean(process.env.OPENAI_API_KEY),
  });
}

function unkeyedFallback(surface: JeffreySurface): string {
  // Stays in-brand. No apologies. The room continues to feel built-for-one.
  switch (surface) {
    case "investor":
      return "Good. The investor surface is online. Voice and reasoning activate the moment the operator provisions the keys. Ask me about the thesis, the business model, the moat, or the peptide roadmap and I'll walk you through it.";
    case "brand":
      return "The brand surface is awake. Ask me how we say things here — I'll return once the brain layer is connected.";
    case "product-walkthrough":
    default:
      return "The walkthrough surface is ready. Once the brain layer lands I'll narrate the product the way it was designed to be experienced.";
  }
}
