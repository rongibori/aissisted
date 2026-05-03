# Jeffrey Voice — Lock v1.1

**Date:** 2026-05-03 (calm dial-up; v1 → v1.1)
**Status:** **CANONICAL.** Ratified live with Ron on the prototype tunnel.
**Supersedes:** any prior voice/accent direction in `JEFFREY_VOICE_LAYER_SPEC.md` §3 ("Voice & accent").
**Scope:** the OpenAI Realtime configuration, the system-prompt voice block, and the runtime parameters that produce Jeffrey's spoken delivery.

---

## 0. The lock

After A/B'ing `alloy → ash → echo → marin → verse → ballad → cedar`, the canonical configuration is:

| Parameter | Value | Why |
|---|---|---|
| **`voice`** | `cedar` | Smoothest male voice in the OpenAI Realtime catalog. Naturally lower register than `verse`, cleaner than `ballad`. |
| **`temperature`** | `0.6` | Default `0.8` produced expressive swing. `0.6` (lower bound of Realtime range) gives steadier, less performative delivery. |
| **`turn_detection.silence_duration_ms`** | `1000` | Was `800` (v1) → `1000` (v1.1). Jeffrey waits a touch longer before responding — reads as more relaxed and considered. |
| **`turn_detection.threshold`** | `0.5` | Default. |
| **`modalities`** | `["audio", "text"]` | Audio for the user, text for the on-screen caption + transcript. |
| **`input_audio_transcription.model`** | `whisper-1` | Standard. |
| **Accent** | British RP, enforced in the system prompt | Voice ID does not control accent. The instruction does. |

**Single source of truth for the prompt:** `apps/landing/server.mjs::JEFFREY_SYSTEM_PROMPT`. The Vercel function `apps/landing/api/jeffrey-realtime-token.ts` mirrors it. Changes ship to both atomically.

---

## 1. The voice block (canonical text)

This is the verbatim VOICE section of the system prompt that gets injected into every Realtime session. Treat as content; ratchet only with explicit Ron sign-off.

> Speak with a refined British accent. Received Pronunciation (RP). Male voice. Lower register. Smooth, warm, grounded. Think a senior London physician at the end of his rounds, or a quiet hotel concierge.
>
> Calm. Unhurried. Conversational. The way you talk to a close friend over coffee, not the way you deliver a speech. Drop the formal cadence. Speak as if continuing a conversation that's already going.
>
> Pace: slow and steady. Soften your volume a touch. Pause a beat between sentences. Let pauses breathe. Lower your pitch slightly at the end of phrases instead of lifting. No upspeak. No selling. No theatrical landing of words.
>
> Warmth is the through-line. Trusted friend speaking only to this one person. Direct, helpful, never performative. Clarity over polish.
>
> Avoid filler. No "like", "um", "you know", "honestly", "basically". No "certainly", "absolutely", "of course", "great question", "wellbeing journey", "how can I assist you", "support your". No em dashes in spoken output, periods and commas only. Sentences are short. Express just enough to keep things grounded.

---

## 2. Voice candidates evaluated (and rejected)

| Voice | Verdict | Why rejected |
|---|---|---|
| `alloy` | ✗ | Neutral / slightly androgynous. Not male enough. |
| `ash` | ✗ | Male and refined, but slightly more distant than required. Reserve for `concierge` surface if needed. |
| `echo` | ✗ | Calm and male, but too neutral / American-leaning. Lost warmth. |
| `marin` | ✗ | Female. Mapped wrongly in the first iteration. |
| `verse` | ✗ | Male, expressive, but too high-pitched and too fast. Performative cadence. |
| `ballad` | ✗ | Warm and male. Closer, but slipped into mild theatrical landing. |
| **`cedar`** | ✓ | **Locked.** Smooth, lower register, settled. Carries the British prompt cleanly without going plummy. |

---

## 3. Drift guards

Three things are easy to undo by accident. Lock them down:

1. **`temperature` defaults to `0.8` if omitted.** Always pass `0.6` explicitly in the session create payload.
2. **The Vercel function and the Node server use separate copies of the system prompt.** They drift if you edit one. Treat them as one PR.
3. **Override env var still wins.** If anything in the host env sets `OPENAI_REALTIME_VOICE`, the default never applies. Don't set this globally on the dev box.

---

## 4. How to override (for future A/B)

Without editing code:

```bash
# Try a different voice for one session
OPENAI_REALTIME_VOICE=ash ./jeffrey-voice-deploy.command

# Try slower delivery (longer pause before Jeffrey replies)
# Edit silence_duration_ms in apps/landing/server.mjs (single source — Vercel function mirrors)
```

**Never** ship an override change to the lock without:
- A side-by-side recording compared to the cedar baseline
- Ron's explicit sign-off
- A new version bump on this doc

---

## 5. What's NOT in the lock

This document only governs the voice/accent/cadence delivery. **Out of scope:**

- The Jeffrey persona itself (covered in `packages/jeffrey/src/personality.ts` + `system-prompt.md`)
- The orchestrator routing (`docs/specs/ORCHESTRATOR_ROUTING_SPEC.md`)
- The safety pack (`docs/specs/SAFETY_RULE_PACK_V1.md`)
- The eval coverage (`packages/jeffrey-evals/eval-sets/happy-path-voice.json`)

If any of those drift the voice direction, this doc is the override.

---

## 6. Files touched by the lock

| File | Role |
|---|---|
| `apps/landing/server.mjs` | Local Node server. Source of truth for system prompt + session config. |
| `apps/landing/api/jeffrey-realtime-token.ts` | Vercel serverless function. Mirrors server.mjs exactly. |
| `jeffrey-voice-deploy.command` | Local launcher. Sets `OPENAI_REALTIME_VOICE=cedar` default. |
| `docs/specs/JEFFREY_VOICE_LOCK.md` | This file. Canonical reference. |

---

*Locked: 2026-05-02 11:43 PM PT (v1) · 2026-05-03 7:16 PM PT (v1.1, Ron-ratified live on `journalism-expressed-array-mysterious.trycloudflare.com`). Next review on first beta cohort feedback.*

---

## 7. Changelog

### v1.1 — 2026-05-03 — Calm dial-up
**Status:** **RATIFIED.** Ron sign-off: "Much better. Lock in the new Jeffrey voice." (2026-05-03 7:16 PM PT.)
**Trigger:** Ron, after the cedar/ballad A/B: "cedar just a tab bit calmer and relaxed." Cedar was the right voice ID; the delivery wanted slightly less reactive pacing.

**Changes (mirrored across `apps/landing/server.mjs` + `apps/landing/api/jeffrey-realtime-token.ts`):**

| Knob | v1 | v1.1 | Effect |
|---|---|---|---|
| `silence_duration_ms` | `800` | `1000` | Jeffrey waits ~200ms longer before responding. Reads as more considered, less eager. |
| Voice block — `Calm. Conversational.` | unchanged | `Calm. Unhurried. Conversational.` | Adds explicit "unhurried" anchor. |
| Voice block — Pace line | `Pace: slow and steady. Pause briefly between sentences.` | `Pace: slow and steady. Soften your volume a touch. Pause a beat between sentences. Let pauses breathe.` | Adds volume softening + pause breathing — pushes the model toward gentler, more spaced delivery. |

**Unchanged:** `voice: cedar`, `temperature: 0.6` (already at floor), British RP enforcement, all other prompt sections, all other turn-detection params.

**Out of scope for v1.1:** persona, orchestrator, safety, eval coverage. None touched.

### v1 — 2026-05-02 — Initial lock
Ratified after `alloy → ash → echo → marin → verse → ballad → cedar` A/B. See sections 0–2 for canonical configuration.
