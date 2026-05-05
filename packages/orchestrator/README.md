# @aissisted/orchestrator

The intelligence bridge between Jeffrey's voice layer and AISSISTED's visualization + product surfaces.

> **voice input → semantic intent → system state → visual response → product behavior**

---

## What this package does

Subscribes to the existing `useJeffreyRealtime` hook events, classifies the live transcript semantically (not by keyword), and emits a single reactive state object that any UI surface can subscribe to.

UI components don't know about voice events or LLM calls. They just read `mode`, `activeModules`, `primaryFocus`, etc. from selector hooks and re-render when those slices change.

## What it explicitly does NOT do

- Render any UI itself
- Make decisions about *what* Jeffrey says (that's the realtime hook + system prompt)
- Cache user data (that's apps/api)
- Hold any audio buffers (that's the realtime hook)
- Define module visual behavior (that's `apps/web/components/JeffreyAISystem`)

It is a **pure state layer**. Zero rendering. Pure reducers. Side effects isolated to adapters.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/web (browser)                                              │
│                                                                   │
│   useJeffreyRealtime  ──events──▶  Realtime Adapter              │
│   (existing)                            │                         │
│                                         ▼                         │
│                                  Embedding Classifier             │
│                                  (cached anchors,                 │
│                                   in-browser cosine sim)          │
│                                         │                         │
│                                         ▼                         │
│                                   ┌──────────────┐                │
│                                   │  Zustand     │                │
│                                   │  store       │                │
│                                   └──────┬───────┘                │
│                                          │                         │
│            ┌─────────────────────────────┼──────────────────────┐ │
│            ▼                             ▼                      ▼ │
│      useOrchestratorMode      useActiveModules       usePrimaryFocus
│            │                             │                      │ │
│            ▼                             ▼                      ▼ │
│  Neural Core, module tiles, transcript display, etc.              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ for accurate intent routing
                               ▼
                    apps/api  (server)
                       /v1/jeffrey/classify    (gpt-4o-mini)
                       /v1/jeffrey/embeddings  (text-embedding-3-small)
```

## Canonical types

Module identity (`ModuleId`) and system mode (`SystemMode`) **mirror** `apps/web/components/JeffreyAISystem/systemTypes.ts` exactly. That file is the source of truth. Any change to the module list must update both files.

The 7 modules:

```
sleep · recovery · stress · performance · metabolic · labs · stack
```

The 6 modes (canonical 5 from `JeffreyAISystem/systemTypes.ts` + `analyzing` extension):

```
idle · listening · thinking · analyzing · speaking · recommendation
```

`analyzing` is orchestrator-only. Visualization consumers that only understand the canonical 5 should map `analyzing → thinking`.

## State shape

```typescript
interface OrchestrationState {
  // Voice + connection
  mode: SystemMode;
  voiceConnection: VoiceConnectionState;
  isAssistantSpeaking: boolean;

  // Topic awareness
  activeModules: Set<ModuleId>;
  primaryFocus: ModuleId | null;
  topicConfidence: Record<ModuleId, number>;  // 0..1, decays over time

  // Narrative position
  narrative: NarrativePosition;

  // Live data
  userData: PersonalizationSnapshot | null;
  moduleData: Partial<Record<ModuleId, ModuleData>>;

  // Last-pass debug
  lastClassification: Classification | null;
  lastUserUtterance: string;
  lastAssistantUtterance: string;
}
```

## Tunables

Defined in `state/reducers.ts` `TUNABLES`:

| Constant | Default | Meaning |
|---|---|---|
| `DECAY_PER_SECOND` | 0.18 | Per-second confidence decay rate (~5s half-life) |
| `ACTIVATION_THRESHOLD` | 0.42 | Module is "active" when confidence >= this |

Adjust during the dry-run loop (we're targeting `feels right` not theoretical correctness).

## Build sequence (where we are)

- [x] Foundation — types, Zustand store, pure reducers, module concept anchors (this commit)
- [ ] Embedding classifier — browser cosine similarity + apps/api proxy for batch embedding
- [ ] LLM classifier — apps/api `/v1/jeffrey/classify` endpoint (gpt-4o-mini)
- [ ] Realtime adapter — subscribes to useJeffreyRealtime, dispatches orchestration events
- [ ] React hooks — `useOrchestratorMode`, `useActiveModules`, etc.
- [ ] Narrative engine — hand-built nodes mapped from master deck v3
- [ ] Test surface at `/demo/orchestrator-test` — minimal UI that proves the loop

## First milestone

The system is working when:

1. Jeffrey speaks → `mode` updates correctly (listening / thinking / analyzing / speaking)
2. Relevant modules activate in real time as Jeffrey discusses them
3. The system can react VISUALLY before Jeffrey finishes speaking (streaming embedding classifier on partial transcript)
4. Interruption works cleanly (mid-sentence cutoff, route to new question, audio cancelled at the audio layer — already wired in `useJeffreyRealtime`)
5. Resume behavior is **natural and subtle** — default is a conversational "let's continue from where we left off" transition, not a question every time. Configurable per narrative node.
6. UI visibly changes based on what Jeffrey is saying — not hardcoded triggers

UI can remain minimal. The point of the first milestone is to prove the system loop, not polish visuals.

## Hard constraints

- No keyword matching for module activation. Embedding similarity only.
- API keys never reach the browser. LLM classifier always runs server-side via apps/api.
- Pure reducers. Side effects ONLY in adapters.
- Reducer is exhaustive: TS `never` cast catches any unhandled event.
- No fabricated metrics in any UI bound to this state. If a number isn't real, surface as null and let the UI hide.

## Testing

```bash
pnpm --filter @aissisted/orchestrator typecheck
pnpm --filter @aissisted/orchestrator test
```

(Tests come with the classifier + adapter in the next commit.)

## Status

`v0.0.1` — foundation. Not yet wired into any UI. Next commit adds the classifier and the realtime adapter.
