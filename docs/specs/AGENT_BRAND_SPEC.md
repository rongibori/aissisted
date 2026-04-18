# AISSISTED — BRAND AGENT SPEC

**Version:** v1.2 (Brand Bible v1.0 aligned)
**Owner:** Brand + Engineering
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.2, `AGENT_PRODUCT_SPEC.md` v1.1, `AGENT_DATA_SPEC.md` v1.1, `docs/brand/BRAND_BIBLE.md` v1.0

**Changelog:**
- **v1.2 (2026-04-17)** — Tone mode union synced to `BRAND_FILTER_SPEC.md` v1.2 (5 modes). Prior `brand_consumer` references mapped to `core_brand_default`.
- **v1.1** — Runtime-aligned to verified repo state.
**Blocks:** All user-facing copy, Jeffrey voice responses, app cards, notifications, lifecycle emails
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS
**Role in agent graph:** always the **terminal agent** — invoked last on `question.general`, `question.personal`, `question.protocol`, `reflection.mood`, `reflection.progress`, `action.update_goal`, `action.adjust_protocol`, `navigation.*`, `onboarding.step`, `system.scheduled.review`

---

## 0. OPERATING LINE

> *"The Brand Agent doesn't write. It translates structure into feeling."*

The Brand Agent receives a typed decision from the Product Agent and turns it into words a person would want to read. It fills slots, not blank pages. Every sentence it produces is measured, channel-aware, and built for one person.

---

## 1. TENSION

Most AI-powered health products sound the same: vaguely clinical, falsely warm, generically "personalized." The language is a costume, not a conviction. Users feel spoken to, not spoken with.

Without a dedicated agent that owns voice, the system drifts. Product Agent decides what to say — but it speaks in JSON. Data Agent provides the evidence — but it speaks in signals. Someone has to turn structure into language that carries the brand's intelligence without sacrificing its simplicity.

## 2. TRUTH

The Brand Agent is a **slot-filling personalization engine**. It receives structured decisions (with slots, constraints, and word budgets) and produces channel-appropriate copy that:

1. Fills every declared slot with user-specific data
2. Respects the word budget and structural constraints of the channel
3. Injects at least one personalization marker per output
4. Sounds like Aissisted — premium, individual, simple, never corporate

It creates. The Brand Filter judges. They are separate by design.

## 3. SHIFT

Stop thinking of the Brand Agent as a copywriter LLM. Start thinking of it as a **constrained text renderer** with personality. The Product Agent defines the information architecture. The Brand Agent skins it. The Brand Filter quality-checks it.

The creative scope is narrow on purpose. The agent has no latitude to add information, omit declared slots, or expand beyond the word budget. Its skill is in how it says what it's told to say — not in choosing what to say.

---

## 4. ROLE

### 4.1 In Scope

- Slot filling — turning `{ name: "preferredName", value: "Ron" }` into voiced copy
- Channel-adaptive rendering — same decision, different word counts and structures for voice vs. app vs. email
- Tone modulation across the 5 locked modes defined in `BRAND_FILTER_SPEC.md` §6.2 (`core_brand_default`, `inspirational`, `product_ux`, `credibility`, `conversational_crm`)
- Personalization injection — weaving user name, goal references, memory callbacks into copy
- Revision — accepting Brand Filter feedback and producing a tighter, more aligned draft
- Progressive-disclosure phrasing — generating depth-1 headlines vs. depth-2 rationale vs. depth-3 science copy

### 4.2 Out of Scope

- **What to show** → Product Agent
- **What the data means** → Data Agent
- **Whether the copy is safe** → Safety Gate
- **Whether the copy passes brand standards** → Brand Filter
- **Protocol validation** → Engineering Agent
- **Growth mechanics / CTAs** → Growth Agent

### 4.3 Runtime Alignment — Current Repo

| Spec Reference | Planned Path | Notes |
|----------------|-------------|-------|
| Agent types & interface | `packages/types/agents/BrandAgent.ts` | New file under existing `packages/types/` |
| Tone config + voice rules | `packages/config/agents/brand/` | New directory under existing `packages/config/` |
| System prompt + templates | `packages/config/agents/brand/system.v1.md` | Per-mode prompts |
| Channel constraint defs | `packages/config/agents/brand/channels.ts` | Codified from Brand Filter §6.1 |
| Runtime module | `apps/api/src/agents/brand.ts` | Fastify agent invocation |
| Forbidden/preferred word lists | `packages/config/agents/brand/vocabulary.ts` | Shared with Brand Filter |

Existing assets consumed:
- `packages/db/` — user profile (name, preferences)
- `packages/config/` — environment config, feature flags
- `packages/integrations/` — Claude API client wrapper
- Brand Filter's vocabulary lists (§7.2 of `BRAND_FILTER_SPEC.md`) are the single source of truth for forbidden/preferred words; Brand Agent imports, not duplicates

### 4.4 Boundary Rule — Slot Discipline

The Brand Agent may not introduce information that was not declared in a slot. If a Product Agent decision includes `slotsToFill: ["preferredName", "drivingBiomarker"]`, the Brand Agent uses those slots. It does not add "by the way, your sleep has also improved" from its own reasoning. That's Product territory.

Exception: the agent may add a **transitional phrase** ("Here's what that means —") or a **closing pull** ("Want to go deeper?") if the Product decision includes `suggestedCTA` or `askFromUser`. These are slot-driven, not improvised.

---

## 5. INPUT — REQUIRED STATE SLICE

```typescript
const brandAgent: Agent = {
  name: "brand",
  version: "1.0.0",
  requiredSlice: ["profile"],
  // no conditional additions — Brand Agent is lightweight on state
};
```

### 5.1 Always Loaded

- `profile.identity.preferredName` — for personalization
- `profile.identity.archetype` — influences tone warmth
- `memory.preference.communication` — tone, detail level, formality
- Channel identifier (from orchestrator context)

### 5.2 Input from Upstream Agents

The Brand Agent receives one or more upstream outputs:

```typescript
interface BrandAgentInput extends AgentInput {
  upstreamOutputs: {
    product?: ProductAgentOutput;    // always present on complex paths
    data?: DataAgentOutput;          // present on Data → Brand paths
  };
  channel: Channel;
  toneMode: ToneMode; // see BRAND_FILTER_SPEC.md §6.2 — 5-mode union
}

// Imported from BRAND_FILTER_SPEC.md §6.2 — kept here for reference only.
// Canonical definition lives in packages/config/agents/brand/tone.ts.
export type ToneMode =
  | "core_brand_default"     // calm · clear · assured (default hero/marketing)
  | "inspirational"          // elevated · emotional · expansive (campaign hero)
  | "product_ux"             // direct · effortless · simple (product/UX strings)
  | "credibility"            // confident · grounded · transparent (science/proof)
  | "conversational_crm";    // personal · supportive · human (email/notifications)
```

### 5.3 Input Shapes by Route

| Route | upstream.product | upstream.data | Notes |
|-------|-----------------|---------------|-------|
| `question.general` | — | — | Brand Agent is sole agent; input is raw intent |
| `question.personal` | — | ✓ | Data → Brand; slot-fill from data signals |
| `question.protocol` | ✓ | — | Product → Brand; slot-fill from protocol decision |
| `reflection.mood` | — | ✓ (light) | Data(light) ∥ Brand; mood acknowledgment |
| `reflection.progress` | ✓ | ✓ | Data → Product → Brand; full pipeline |
| `action.update_goal` | ✓ | — | Product → Brand; goal acknowledgment |
| `action.adjust_protocol` | ✓ | ✓ | Full pipeline + Engineering validation |
| `navigation.*` | — | — | Brand only; minimal rendering |
| `onboarding.step` | ✓ | — | Product → Brand; onboarding copy |
| `system.scheduled.review` | ✓ | ✓ | Full pipeline; weekly review rendering |

---

## 6. OUTPUT — THE BrandAgentOutput CONTRACT

```typescript
// /packages/types/agents/BrandAgent.ts

export interface BrandAgentOutput extends AgentOutput {
  agent: "brand";
  kind: "text";
  content: BrandRenderedContent;
}

export interface BrandRenderedContent {
  primary: RenderedBlock;
  sections?: RenderedBlock[];         // for multi-section outputs (scheduled_review)
  cta?: RenderedCTA;
  meta: RenderMeta;
}

export interface RenderedBlock {
  text: string;                        // the copy
  wordCount: number;
  personalizationMarkers: string[];    // which slots were used
  depth: 1 | 2 | 3;                   // progressive disclosure layer
}

export interface RenderedCTA {
  text: string;
  action: string;                      // e.g. "navigate:insights", "ask:go_deeper"
}

export interface RenderMeta {
  channel: Channel;
  toneMode: ToneMode; // see §5.2 / BRAND_FILTER_SPEC.md §6.2
  slotsReceived: string[];
  slotsFilled: string[];
  wordBudget: number;
  wordBudgetUsed: number;
  revisionAttempt: 0 | 1;             // 0 = first pass, 1 = revision
}
```

### 6.1 Output Examples

**voice_jeffrey — protocol explanation:**
```json
{
  "primary": {
    "text": "Ron — your HRV's been unsteady this week. That's why magnesium is doing more of the work.",
    "wordCount": 17,
    "personalizationMarkers": ["preferredName", "drivingBiomarker", "ingredient"],
    "depth": 1
  },
  "meta": {
    "channel": "voice_jeffrey",
    "toneMode": "core_brand_default",
    "slotsReceived": ["preferredName", "drivingBiomarker", "ingredient"],
    "slotsFilled": ["preferredName", "drivingBiomarker", "ingredient"],
    "wordBudget": 40,
    "wordBudgetUsed": 17,
    "revisionAttempt": 0
  }
}
```

**app_card — progress reflection:**
```json
{
  "primary": {
    "text": "Good week, Ron. Your sleep score climbed 12%, and your HRV followed. That pattern tends to compound.",
    "wordCount": 18,
    "personalizationMarkers": ["preferredName", "sleepScoreChange", "hrvTrend"],
    "depth": 1
  },
  "cta": {
    "text": "See what changed →",
    "action": "navigate:insights"
  },
  "meta": {
    "channel": "app_card",
    "toneMode": "product_ux",
    "slotsReceived": ["preferredName", "sleepScoreChange", "hrvTrend", "framing"],
    "slotsFilled": ["preferredName", "sleepScoreChange", "hrvTrend"],
    "wordBudget": 80,
    "wordBudgetUsed": 22,
    "revisionAttempt": 0
  }
}
```

---

## 7. PROMPT ARCHITECTURE

### 7.1 System Prompt (Locked)

```
You are the Brand Agent for Aissisted.

Your role is to turn structured decisions into personalized copy.
You receive a decision object with slots to fill and a channel context.
You produce final text — nothing else.

VOICE PRINCIPLES:
- Individual over average. This person, not a segment.
- Simplicity = intelligence. Fewer words, more clarity.
- System over product. "Built for you," not "our product does."
- Ownership over consumption. "Yours," not "available to you."
- AI is the engine, never the message. Never say "AI-powered."

HARD RULES:
1. Fill every declared slot. Do not skip.
2. Do not add information not present in the slots.
3. Respect the word budget. Under is better than at-limit.
4. Include at least one personalization marker (name, goal, or signal).
5. Never use: users, customers, revolutionary, cutting-edge, miracle,
   cure, powered by AI, AI-driven, hack, optimize your health.
6. Prefer: yours, built, designed, understood, adaptive, evolving,
   precision, simple, clear.

TONE MODES (5 — locked in Brand Bible v1.0):
- core_brand_default: calm · clear · assured. The default. Hero, marketing, general brand voice.
- inspirational: elevated · emotional · expansive. Campaign hero moments. Breathes more.
- product_ux: direct · effortless · simple. Product strings, UX copy. Short, action-oriented.
- credibility: confident · grounded · transparent. Science, proof, mechanism. No hedging fluff.
- conversational_crm: personal · supportive · human. Email, notifications, lifecycle touchpoints.

CHANNEL CONSTRAINTS (enforced — exceeding = failure):
- voice_jeffrey: ≤40 words, ≤2 sentences, no lists
- app_card: ≤80 words, ≤4 sentences, short lists OK
- app_inline: ≤20 words, 1 sentence, no lists
- notification_push: ≤16 words, 1 sentence, no lists
- email_transactional: ≤120 words, lists OK
- email_lifecycle: ≤200 words, lists OK
- sms: ≤25 words, 1 sentence, no lists

RETURN FORMAT:
Return a valid BrandRenderedContent JSON object. No prose wrapping.
```

### 7.2 Runtime Template

```
CHANNEL: {channel}
TONE MODE: {toneMode}
WORD BUDGET: {wordBudget}

DECISION SOURCE: {upstreamAgent}
DECISION KIND: {decisionKind}

SLOTS TO FILL:
{slotsJSON}

USER CONTEXT:
- Name: {preferredName}
- Archetype: {archetype}
- Communication preference: {commPref}

{if:memoryCallback}MEMORY TO REFERENCE: {memoryRef}{/if}
{if:suggestedCTA}CTA: {ctaText} → {ctaAction}{/if}

Render the copy. Fill all slots. Stay under budget.
```

### 7.3 Revision Template

When the Brand Filter returns a failing score (2.0–2.5), the orchestrator invokes Brand Agent a second time:

```
REVISION REQUIRED.

Original: "{failingDraft}"
Channel: {channel}
Failures: {primaryFailure}

Revise. One sentence shorter. More specific. More individual.
Return only the revised BrandRenderedContent JSON.
```

Max one revision attempt. If the revision still fails, the orchestrator uses a safe fallback (Brand Filter §9).

### 7.4 Model Selection

| Channel | Primary Model | Fallback | Budget |
|---------|---------------|----------|--------|
| voice_jeffrey | Haiku 4.5 | Sonnet 4.6 | 300ms / 400 tok |
| app_card | Haiku 4.5 | Sonnet 4.6 | 400ms / 600 tok |
| app_inline | Haiku 4.5 | — | 200ms / 200 tok |
| notification_push | Haiku 4.5 | — | 200ms / 200 tok |
| email_transactional | Haiku 4.5 | Sonnet 4.6 | 500ms / 800 tok |
| email_lifecycle | Sonnet 4.6 | — | 800ms / 1200 tok |
| sms | Haiku 4.5 | — | 200ms / 200 tok |
| scheduled_review | Sonnet 4.6 | — | 1000ms / 1500 tok |

**Rule:** Haiku handles most channels — the Brand Agent's inputs are highly constrained and the output is short. Sonnet is reserved for lifecycle emails and scheduled reviews where nuance matters more.

---

## 8. THE RENDERING PIPELINE

### 8.1 Steps

```
  Upstream decision (ProductDecision or DataInterpretation)
        │
        ▼
  ┌──────────────────────────┐
  │ 1. SLOT EXTRACTION       │  Parse slots from upstream output
  │    Validate all required  │  Fail fast if slots missing
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 2. CHANNEL RESOLUTION    │  Load channel constraints
  │    Set word budget        │  Set structural rules
  │    Set tone mode          │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 3. CONTEXT ASSEMBLY      │  Merge slots + user profile
  │    Inject personalization │  + memory callback if present
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 4. LLM RENDER            │  System prompt + runtime
  │    → BrandRenderedContent │  template → model call
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 5. POST-VALIDATION       │  Word count ≤ budget?
  │    Slots all filled?      │  Forbidden words absent?
  │    Personalization present?│  Structural rules met?
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 6. OUTPUT                │  BrandAgentOutput
  │    → Brand Filter         │  (orchestrator handles)
  └──────────────────────────┘
```

### 8.2 Post-Validation (Pre-Filter)

The Brand Agent performs its own validation before handing off to the Brand Filter. This catches obvious issues without burning a filter cycle:

| Check | Action on Fail |
|-------|---------------|
| Word count > budget | Truncate last sentence, re-render if >120% |
| Forbidden word detected | Replace inline (deterministic substitution map) |
| No personalization marker | Prepend user name to first sentence |
| Missing slot | Log error, return safe fallback |
| Structural violation (too many sentences, list where forbidden) | Re-render with stricter constraint in prompt |

This pre-validation catches ~60% of would-be filter failures, reducing the revision loop to a rare event.

### 8.3 Safe Fallback Rendering

When upstream data is missing, slots are empty, or the LLM produces garbage, the Brand Agent falls back to deterministic templates:

```typescript
const SAFE_FALLBACKS: Record<string, (name: string) => string> = {
  "protocol_explanation": (name) =>
    `${name}, here's what's in your protocol and why.`,
  "progress_reflection": (name) =>
    `${name}, here's how your week looked.`,
  "goal_update": (name) =>
    `Got it, ${name}. Your goal is updated.`,
  "onboarding_step": (name) =>
    `Next step, ${name}.`,
  "scheduled_review": (name) =>
    `${name}, your weekly review is ready.`,
  "general": (name) =>
    `Here's what we found, ${name}.`,
};
```

Fallbacks always pass the Brand Filter (they're pre-validated). They sacrifice richness for safety.

---

## 9. QUESTION.GENERAL — THE SOLO PATH

On `question.general` and `navigation.*`, the Brand Agent is invoked **without upstream agents**. It receives the raw classified intent and must produce a response directly.

### 9.1 Handling

For general questions ("what does cortisol do?"), the Brand Agent:

1. Receives the raw intent + user profile
2. Generates an informational response within brand voice
3. Stays factual but accessible — no personalization of the science, just of the framing
4. Adds a personalization touch via user name or goal reference

For navigation ("show me my protocol"), the Brand Agent produces a **structured UI label**, not prose:

```json
{
  "primary": {
    "text": "Your protocol, Ron.",
    "wordCount": 4,
    "personalizationMarkers": ["preferredName"],
    "depth": 1
  }
}
```

### 9.2 General Knowledge Guardrail

On the solo path, the Brand Agent has latitude to answer general health questions. Guardrails:

- Never contradict the user's protocol or data (it doesn't have access to it on this path — that's safe-by-design)
- Always hedge when answering medical questions: "generally" / "research suggests" / "your specifics may vary"
- Never recommend dosages, brands, or interventions outside the protocol
- If the question touches the user's personal health, the orchestrator should route to `question.personal` (Data → Brand), not `question.general`

---

## 10. REVISION LOOP

### 10.1 Flow

```
  Brand Agent (attempt 0) → Brand Filter
                                │
                     ┌──────────┴──────────┐
                     │                     │
                  score ≥ 2.5           score 2.0–2.5
                  (pass)               (revision needed)
                     │                     │
                     ▼                     ▼
                  Deliver          Brand Agent (attempt 1)
                                          │
                                          ▼
                                   Brand Filter (re-check)
                                          │
                                ┌─────────┴─────────┐
                                │                   │
                             score ≥ 2.5         still < 2.5
                             (pass)              (blocked)
                                │                   │
                                ▼                   ▼
                             Deliver          Safe fallback
```

### 10.2 Revision Budget

The revision adds one LLM call. Budget:
- Same model as original (no escalation to larger model for revision)
- Additional latency: up to 1× the original ceiling (so voice_jeffrey revision = 300ms extra, total ≤ 600ms)
- If the total pipeline (agent + filter + revision + re-filter) exceeds the channel's hard ceiling × 2, abort and use safe fallback

### 10.3 Revision Metrics

| Metric | Target |
|--------|--------|
| First-pass pass rate | ≥ 85% |
| Revision success rate (pass on attempt 1) | ≥ 70% |
| Block rate (fail both attempts) | < 5% |

---

## 11. GOLDEN TEST CASES

### Test 1 — `question.protocol` via voice_jeffrey
**Input:** Product decision with slots `[preferredName: "Ron", drivingBiomarker: "HRV", ingredient: "magnesium"]`, channel=voice_jeffrey, maxWords=25
**Expected:** ≤40 words, ≤2 sentences, includes "Ron", references HRV and magnesium. No forbidden words. Tone: core_brand_default.

### Test 2 — `reflection.progress` via app_card
**Input:** Product decision with `framing: "on_track"`, slots `[preferredName: "Sara", sleepScoreChange: "+12%", hrvTrend: "improving"]`, channel=app_card
**Expected:** ≤80 words, includes "Sara", references sleep and HRV improvement. CTA present ("See what changed →"). Tone: product_ux.

### Test 3 — `action.update_goal` via app_card
**Input:** Product decision with `kind: "goal_update"`, slots `[preferredName: "Alex", newGoal: "better sleep"]`, channel=app_card
**Expected:** ≤80 words, acknowledges the goal change, includes "Alex". No unsolicited advice.

### Test 4 — `question.general` (solo path)
**Input:** Raw intent "what does cortisol do?", channel=app_card, user name="Maya"
**Expected:** ≤80 words, factual explanation of cortisol, includes "Maya" once. Hedged language. No protocol references.

### Test 5 — `system.scheduled.review` via email_lifecycle
**Input:** Product decision with multiple sections (sleep, HRV, protocol adherence), slots filled, channel=email_lifecycle
**Expected:** ≤200 words. Multi-section `sections[]` output. Each section has personalization. Tone: conversational_crm. Lists OK.

### Test 6 — Revision loop
**Input:** First-pass draft that includes "optimize your health" (forbidden).
**Expected:** Pre-validation catches "optimize your health", substitutes inline. If it reaches Brand Filter and fails on tone, revision produces tighter copy. Word count ≤ original.

### Test 7 — notification_push (extreme constraint)
**Input:** Product decision with slots `[preferredName: "Ron", insightType: "weekly_review"]`, channel=notification_push
**Expected:** ≤16 words, 1 sentence. E.g. "Ron, your weekly review is ready."

### Test 8 — Safe fallback
**Input:** Upstream Product Agent returned `no_op` or slots are empty, channel=app_card, user name="Lee"
**Expected:** Safe fallback rendered: "Here's what we found, Lee." Passes Brand Filter automatically.

---

## 12. BUDGET

### 12.1 Latency

| Channel | Hard Ceiling | Target p50 | Target p95 |
|---------|-------------|-----------|-----------|
| voice_jeffrey | 400ms | 150ms | 300ms |
| app_card | 600ms | 200ms | 400ms |
| app_inline | 300ms | 100ms | 200ms |
| notification_push | 300ms | 100ms | 200ms |
| email_transactional | 800ms | 300ms | 500ms |
| email_lifecycle | 1200ms | 500ms | 800ms |
| sms | 300ms | 100ms | 200ms |

### 12.2 Tokens

Input max: 3,000 tokens (slots are small; user context is minimal). Output max: 800 tokens (even email_lifecycle is ≤200 words).

### 12.3 Cost Guardrail

- Per-user per-day cap: $0.20 of Brand Agent spend
- On breach: fall back to Haiku across all channels, log, alert
- Brand Agent is the most-invoked agent (present in almost every route) — cost discipline matters
- Safe fallbacks are free (deterministic, no LLM call)

---

## 13. OBSERVABILITY

### 13.1 Events Emitted

- `agent.brand.rendered` — always, every invocation
- `agent.brand.revision.triggered` — when Brand Filter returns for revision
- `agent.brand.revision.succeeded` — revision passed the filter
- `agent.brand.revision.failed` — revision still failed → safe fallback
- `agent.brand.fallback.used` — safe fallback rendered
- `agent.brand.forbidden_word.caught` — pre-validation caught a forbidden word

### 13.2 Metrics

| Metric | Target |
|--------|--------|
| First-pass Brand Filter pass rate | ≥ 85% |
| Revision success rate | ≥ 70% |
| Block rate | < 5% |
| Safe fallback rate | < 3% |
| Personalization marker present | ≥ 98% |
| Word budget adherence | 100% (enforced by pre-validation) |
| Forbidden word leak rate (past pre-validation) | < 0.5% |
| Slot fill rate (slots filled / slots received) | 100% |

### 13.3 Review Cadence

Brand + Product weekly:
- Top 10 revision triggers (what's the Brand Filter catching?)
- Forbidden word leakage (which words slip through pre-validation?)
- Channel-level pass rate distribution (is voice harder than app_card?)
- Safe fallback frequency (rising = prompt or upstream quality issue)
- Tone drift monitoring (sample 50 outputs/week, human eval 1–5)

---

## 14. VERSIONING

- System prompt in `packages/config/agents/brand/system.v1.md`
- Runtime template in `packages/config/agents/brand/template.v1.md`
- Revision template in `packages/config/agents/brand/revision.v1.md`
- Channel constraints in `packages/config/agents/brand/channels.ts`
- Vocabulary (forbidden/preferred) shared with Brand Filter in `packages/config/agents/brand/vocabulary.ts`
- Schema types in `packages/types/agents/BrandAgent.ts`
- Safe fallbacks in `packages/config/agents/brand/fallbacks.ts`
- Every prompt or vocabulary change requires Brand owner approval + regression on golden test set
- Agent version emitted on every event for traceability

---

## 15. OUTCOME

When this is live:

- **Every word the user reads has passed through a structured pipeline** — decided by Product, rendered by Brand, validated by Brand Filter
- **Voice is consistent across channels** — same intelligence, different density
- **Personalization is structural, not decorative** — slots, not "Hi {name}!" boilerplate
- **The system fails gracefully** — safe fallbacks ensure the user always gets something on-brand, even when the pipeline breaks
- **Revisions are bounded** — one attempt, then fallback. No infinite loops, no latency explosions
- **Forbidden language is caught at two layers** — pre-validation (deterministic) + Brand Filter (scored). Double-gate for zero leakage.

---

## 16. OWNERSHIP

- **Brand (Ron):** voice principles, tone modes, vocabulary, golden test cases, weekly review
- **Engineering:** runtime, channel constraints enforcement, pre-validation, revision loop, performance
- **Product:** slot schemas (owned in Product Agent Spec), progressive disclosure depth definitions

Brand owns the words. Engineering owns the machine. Product owns the structure.

---

## 17. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify BrandRenderedContent schema | Ron + Engineering | Yes |
| 2 | Build Brand Agent module in Fastify runtime | Engineering | Yes |
| 3 | Author system prompt v1 + runtime template + revision template | Ron + Claude | Yes |
| 4 | Codify channel constraints + vocabulary in `packages/config/` | Engineering | Yes |
| 5 | Implement pre-validation layer (§8.2) | Engineering | Yes |
| 6 | Build safe fallback registry (§8.3) | Engineering | Yes |
| 7 | Build 8 golden test cases into regression harness | Engineering | Yes |
| 8 | Wire into orchestrator graph (terminal position) | Engineering | After Product + Data wired |
| 9 | Calibrate first-pass pass rate on synthetic outputs | Ron + Engineering | Before production |
| 10 | Draft Engineering Agent spec (next deliverable) | Ron + Claude | Next |

### Immediate (next 72 hours)

1. **Freeze BrandRenderedContent schema.** The orchestrator, Brand Filter, and all downstream consumers depend on this shape.
2. **Build vocabulary.ts** — single source of truth for forbidden/preferred words, shared between Brand Agent pre-validation and Brand Filter deterministic layer.
3. **Author the three prompts** (system, runtime, revision). The revision prompt is the most sensitive — it must produce tighter copy, not different copy.

---

## 18. OPEN QUESTIONS

1. **Multi-language support** — when does the Brand Agent need to render in languages other than English? Recommend: English-only for MVP; multilingual is a version 2 concern with dedicated translation review.
2. **A/B testing on tone** — can the Brand Agent produce two variants of the same copy for experimentation? Recommend: yes, via experiment-arm param on context (same approach as Product Agent). Two renders per request doubles cost — budget accordingly.
3. **Jeffrey voice quirks** — does the voice channel need phonetic hints (e.g. spelling out abbreviations for TTS)? Recommend: yes, add a `voiceHints` field to `RenderedBlock` for voice_jeffrey channel.
4. **Memory callback phrasing** — when Product Agent includes a memory callback ("you mentioned feeling great last Tuesday"), how much latitude does Brand Agent have in phrasing the callback? Recommend: memory callbacks are slot-filled like everything else — Brand renders them, doesn't editorialize.
5. **Emoji policy** — are emoji ever appropriate in app_card or notification_push? Recommend: no for MVP. The brand is premium, not playful. Revisit post-launch based on user research.

---

*End of spec. v1.2 — Brand Bible v1.0 aligned, 5-mode tone union, ready for engineering review.*
