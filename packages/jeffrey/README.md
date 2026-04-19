# @aissisted/jeffrey

The operating intelligence of Aissisted.

Jeffrey is not a feature. He is the brain and voice that every Aissisted surface
— investor site, onboarding, product walkthrough, health interpretation, internal
concierge — speaks through.

This package is the single source of truth for his identity, tone, memory, and
the bridge between OpenAI (brain) and ElevenLabs (voice).

---

## Non-negotiables

1. **Server-only.** Nothing in this package is safe to import from the browser.
   It holds prompts, memory adapters, and will at runtime hold provider keys.
   Import it from `apps/api` routes; never from client React.
2. **OpenAI is the brain.** Jeffrey's reasoning, tone, and response logic come
   from the OpenAI system prompt and the supporting context in this package.
   Do not fork a "local" Jeffrey.
3. **ElevenLabs is the voice.** For premium British voice fidelity, audio is
   delivered via ElevenLabs streaming TTS. Text reasoning stays with OpenAI.
4. **Preserve continuity.** Brand bible, investor narrative, integrations
   roadmap, onboarding logic, personalisation rules — all live in `data/` and
   are loaded into context on every session.
5. **Same brain first, same voice as close as possible second.**

---

## Layout

```
packages/jeffrey/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts                 // public barrel
    ├── system-prompt.md         // canonical Jeffrey system prompt
    ├── personality.ts           // tone, principles, forbidden words
    ├── voice.ts                 // voice config (ElevenLabs + OpenAI Realtime)
    ├── memory.ts                // session + long-term memory adapters
    ├── investor.ts              // investor Q&A surface
    ├── onboarding.ts            // guided onboarding surface
    ├── health-tools.ts          // biomarker / wearable interpretation tools
    ├── competitive.ts           // comparables + positioning
    ├── types.ts                 // shared types
    ├── errors.ts                // typed errors
    ├── config.ts                // env config, zod-validated
    ├── client.ts                // OpenAI client factory
    ├── session.ts               // high-level session orchestration
    ├── bridge/
    │   ├── index.ts
    │   ├── openai-realtime.ts   // OpenAI Realtime WS bridge
    │   ├── elevenlabs-tts.ts    // ElevenLabs streaming TTS
    │   └── audio-pipeline.ts    // OpenAI text → ElevenLabs audio handoff
    ├── prompts/
    │   ├── index.ts
    │   ├── investor.md
    │   ├── onboarding.md
    │   ├── health.md
    │   └── competitive.md
    └── data/
        ├── index.ts
        ├── brand-bible.ts
        ├── investor-facts.ts
        ├── competitors.ts
        └── integrations.ts
```

---

## Usage (from `apps/api`)

```ts
import { createJeffreySession } from "@aissisted/jeffrey";

const session = await createJeffreySession({
  surface: "investor",
  userId: req.user.id,
});

const reply = await session.ask("Walk me through the moat.");
```

For voice:

```ts
import { createVoiceSession } from "@aissisted/jeffrey/bridge";

const voice = await createVoiceSession({
  surface: "onboarding",
  userId: req.user.id,
  transport: "elevenlabs", // OpenAI Realtime for reasoning, ElevenLabs for delivery
});
```

---

## Phase 0 — persona extraction (pending)

The existing OpenAI Jeffrey lives in Ron's ad-hoc ChatGPT conversations. The
canonical system prompt in `src/system-prompt.md` is a distilled first pass. It
will be refined once Ron provides 3–5 representative ChatGPT share links so the
actual tone, cadence, and phrasing from live conversations can be merged in.

Until then, treat `system-prompt.md` as the working draft, not the final.

---

## Environment

```
OPENAI_API_KEY=sk-...                 # required
OPENAI_JEFFREY_MODEL=gpt-4o            # default; override per surface
OPENAI_JEFFREY_REALTIME_MODEL=gpt-4o-realtime-preview
ELEVENLABS_API_KEY=...                 # required for voice surfaces
ELEVENLABS_JEFFREY_VOICE_ID=...        # British premium voice
ELEVENLABS_MODEL=eleven_flash_v2_5
```

All validated at session start via `config.ts`. Missing required keys throw
`JeffreyConfigError` before any provider call.
