# AISSISTED — BRAND FILTER SPEC

**Version:** v1.1 (Execution-aligned)
**Owner:** Brand + Engineering
**Status:** Production-grade specification, ready for engineering handoff and aligned to the current runtime stack
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0
**Blocks:** Every user-facing agent output (Jeffrey voice, app copy, email, notifications)
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS

---

## 0. OPERATING LINE

> *"If the user has to think, it's broken."*

The Brand Filter is the compiler for voice. Nothing reaches the user without passing it.

---

## 1. TENSION

A brand guide is a PDF no engineer reads. Agents drift. Copy softens. Generic creeps in. By month three, Aissisted sounds like every other wellness app — warm, vague, forgettable.

Voice cannot be a suggestion. It has to be infrastructure.

## 2. TRUTH

**Brand is not style. Brand is decision.** Every word Aissisted says either deepens ownership or erodes it. There is no neutral output. A runtime gate is the only way to keep five agents, three channels, and one thousand daily interactions aligned.

## 3. SHIFT

Stop treating the brand as something that is *reviewed*. Start treating it as something that is *enforced at runtime*.

The Brand Filter is:
- **Deterministic first** — fast, cheap, reliable rules
- **LLM-scored second** — only where nuance requires it
- **Context-aware** — voice ≠ app card ≠ email ≠ investor memo
- **Versioned** — rules live in a registry, not in code
- **Observable** — every failure is logged, every pass is counted

It is **not** the Brand Agent. The Brand Agent *creates*. The Brand Filter *judges*.

---

## 4. SYSTEM — ARCHITECTURE OVERVIEW

```
                    ┌──────────────────────┐
                    │   AGENT OUTPUT       │
                    │   (draft text +      │
                    │    context metadata) │
                    └──────────┬───────────┘
                               │
                               ▼
           ┌──────────────────────────────────────┐
           │   LAYER 1 — DETERMINISTIC RULES      │
           │   ~20ms · always runs · hard fails   │
           │                                      │
           │  · Forbidden words                   │
           │  · Length budget (per channel)       │
           │  · Personalization markers           │
           │  · Structural rules (no lists in    │
           │    voice, no emojis, etc.)           │
           └──────────┬───────────────────────────┘
                      │
                      ├── hard fail ──▶ BLOCK + safe fallback
                      │
                      ▼
           ┌──────────────────────────────────────┐
           │   LAYER 2 — LLM-SCORED CHECKS        │
           │   ~150–400ms · Haiku · rubric-scored │
           │                                      │
           │  · Tone (calm · clear · certain)     │
           │  · Individual-first specificity      │
           │  · Premium feel (effortless,         │
           │    uncluttered, intentional)         │
           │  · Not leading with AI               │
           │  · Not corporate                     │
           └──────────┬───────────────────────────┘
                      │
                      ├── score ≤ 1 ──▶ BLOCK
                      ├── score = 2 ──▶ AUTO-REVISE (1 attempt)
                      └── score ≥ 3 ──▶ PASS
                      │
                      ▼
           ┌──────────────────────────────────────┐
           │   RESPONDER (orchestrator)           │
           └──────────────────────────────────────┘
```

**Two layers. One verdict. Always observable.**

### 4.1 Runtime Alignment

This filter is designed for the current Aissisted runtime path:
- **Orchestration boundary:** Fastify-based orchestrator flow
- **Primary write/read traceability:** PostgreSQL event and audit records
- **Session-speed context:** Redis-backed working state where needed
- **Model scoring layer:** Claude for rubric-based nuance checks
- **Cloud target:** AWS with full observability and HIPAA-oriented controls

---

## 5. SCOPE — WHAT THE FILTER JUDGES

### 5.1 In Scope

Every string that will be **rendered to a user** in any channel:

- Voice output (Jeffrey)
- App UI copy (cards, empty states, notifications, insights)
- Email (transactional, lifecycle, marketing)
- SMS / push notifications
- Protocol rationale text surfaced to users
- Error messages

### 5.2 Out of Scope

- **Internal traces** (CloudWatch, developer logs)
- **Audit records** (event ledger payloads)
- **Clinician-facing text** (if/when a clinician dashboard ships — different voice spec)
- **Legal disclosures** (verbatim required; never rewrite)
- **Raw biomarker values** (numbers are data, not copy)

### 5.3 Overrides

Certain paths can opt a string **out** of the filter:

```typescript
type BrandFilterOverride =
  | "legal_verbatim"     // must render exactly as-authored
  | "numeric_only"       // pure numeric/measurement output
  | "clinician_channel"  // separate voice, separate spec
  | "debug";             // developer-only surfaces
```

Every override is logged and subject to periodic brand audit.

---

## 6. CHANNEL CONTEXTS

The filter is channel-aware. Same content, different constraints.

```typescript
export type Channel =
  | "voice_jeffrey"
  | "app_card"
  | "app_inline"
  | "notification_push"
  | "email_transactional"
  | "email_lifecycle"
  | "sms";

export interface ChannelConstraints {
  maxWords: number;
  maxSentences: number;
  allowLists: boolean;
  allowEmojis: boolean;
  allowLinks: boolean;
  allowHeadings: boolean;
  requiresPersonalization: boolean;
  toneMode: ToneMode;
}
```

### 6.1 Channel Defaults

| Channel | Max Words | Sentences | Lists | Emojis | Personalization Required |
|---------|-----------|-----------|-------|--------|-------------------------|
| `voice_jeffrey` | 40 | 2 | no | no | yes |
| `app_card` | 80 | 4 | yes (short) | no | yes |
| `app_inline` | 20 | 1 | no | no | no |
| `notification_push` | 16 | 1 | no | no | yes |
| `email_transactional` | 120 | — | yes | no | no |
| `email_lifecycle` | 200 | — | yes | no | yes |
| `sms` | 25 | 1 | no | no | yes |

### 6.2 Tone Modes

```typescript
export type ToneMode =
  | "product_ux"         // direct · simple · actionable ("Press. Mix. Go.")
  | "brand_consumer"     // emotional + intelligent ("You feel better. You know why.")
  | "strategy_investor"; // structured · logical · high-signal
```

Tone mode is set by the orchestrator based on intent class and channel, not inferred by the filter.

---

## 7. LAYER 1 — DETERMINISTIC RULES

### 7.1 Why Deterministic First

- **Speed.** ~20ms. Doesn't touch the LLM budget.
- **Reliability.** Same input → same output. Always.
- **Audit.** Rule firings are structured data, not model rationale.
- **Cost.** Free.

80% of brand drift is caught here. The LLM layer is for the remaining 20%.

### 7.2 Rule Categories

#### 7.2.1 Forbidden Words

Authored as a versioned registry. Hard fail on any hit.

```yaml
# /config/brand/forbidden_words.v1.yaml
forbidden:
  - users
  - customers
  - revolutionary
  - cutting-edge
  - miracle
  - cure
  - game-changer
  - unlock
  - next-level
  - hack
  - optimize your health  # phrase-level match
  - powered by AI         # phrase-level match
  - AI-driven             # phrase-level match
```

- Match is **case-insensitive** and **word-boundary aware**
- Phrase-level matches supported
- Registry is loaded at orchestrator boot and hot-reloadable via admin endpoint

#### 7.2.2 Preferred Words (Soft Signal)

Not a hard rule. Logged as a soft signal for LLM-layer scoring.

```yaml
# /config/brand/preferred_words.v1.yaml
preferred:
  - yours
  - built
  - designed
  - understood
  - adaptive
  - evolving
  - precision
  - simple
  - clear
```

Absence does not fail. Presence raises the specificity score.

#### 7.2.3 Length Budget

Per channel, from §6.1. Hard fail if exceeded.

- Word count: tokenized via Intl.Segmenter or compatible
- Sentence count: punctuation-based, validated

#### 7.2.4 Personalization Markers

For channels where personalization is required, output must reference **at least one** of:

- User's first name or preferred name
- An active goal statement (or its category)
- A recent biomarker/wearable signal
- A known preference

Reference detection is deterministic (template slots or explicit name match), not inferred.

#### 7.2.5 Structural Rules

- No bullet lists in `voice_jeffrey` or `sms`
- No URLs spoken in voice; substitute "I've sent it to your app"
- No ALL CAPS except for initialisms (HRV, CRP, LDL)
- No excessive punctuation (`!!`, `...`)
- No trailing self-summary ("Hope this helps!")
- No apologies as filler ("Sorry if that's unclear")

### 7.3 Deterministic Result

```typescript
export interface DeterministicResult {
  passed: boolean;
  failures: DeterministicFailure[];
  softSignals: SoftSignal[];
  latencyMs: number;
}

export type DeterministicFailure =
  | { kind: "forbidden_word"; word: string; index: number }
  | { kind: "over_length"; actualWords: number; maxWords: number }
  | { kind: "over_sentences"; actual: number; max: number }
  | { kind: "missing_personalization"; channel: Channel }
  | { kind: "disallowed_structure"; detail: string };
```

Any hard failure → block, skip Layer 2.

---

## 8. LAYER 2 — LLM-SCORED CHECKS

### 8.1 Why LLM Second

Tone, specificity, and premium feel are judgment calls. Deterministic rules miss them. An LLM layer with a **tight rubric** catches them.

### 8.2 Model

- **Primary:** Claude Haiku 4.5 (speed + cost)
- **Fallback:** Claude Sonnet 4.6 (when Haiku confidence is low)
- **Latency budget:** 400ms p95
- **Skipped entirely** for any path where total budget < 600ms (e.g., voice high-urgency)

### 8.3 Rubric

The LLM scores the output against five dimensions, each 0–1. Total possible score: 5.

```typescript
export interface BrandRubric {
  calm_clear_certain: 0 | 0.5 | 1;      // tone
  individual_first: 0 | 0.5 | 1;         // feels built for one person
  simple: 0 | 0.5 | 1;                   // no jargon, no friction
  premium: 0 | 0.5 | 1;                  // effortless, intentional, uncluttered
  not_ai_led: 0 | 0.5 | 1;               // AI is the engine, not the message
}

export type BrandScore = 0 | 1 | 2 | 3 | 4 | 5;
```

### 8.4 Scoring Prompt (Skeleton)

```
You are the Brand Filter for Aissisted.

Score the following output on five dimensions (0, 0.5, or 1 each).
Return JSON only. No prose.

Brand principles (required):
- Individual over average
- Simplicity = intelligence
- System over product
- Ownership over consumption
- AI is the engine, never the message

Tone: calm. clear. certain.
Channel: {channel}
Tone mode: {toneMode}
User context (for personalization check): {personalizationHints}

OUTPUT TO SCORE:
"""
{draft}
"""

Return:
{
  "calm_clear_certain": 0|0.5|1,
  "individual_first": 0|0.5|1,
  "simple": 0|0.5|1,
  "premium": 0|0.5|1,
  "not_ai_led": 0|0.5|1,
  "primary_failure": "..." // one phrase if any dim < 1
}
```

### 8.5 Thresholds

| Total Score | Verdict |
|-------------|---------|
| 5.0 | Pass, log as gold-standard |
| 4.0 – 4.5 | Pass |
| 3.0 – 3.5 | Pass, flag for retrospective review |
| 2.0 – 2.5 | Auto-revise (1 attempt) |
| ≤ 1.5 | Block, return safe fallback |

---

## 9. AUTO-REVISION LOGIC

### 9.1 When It Runs

- Layer 2 total score is 2.0 – 2.5
- Channel budget allows (≥ 400ms remaining)
- One attempt only. No infinite loops.

### 9.2 How It Runs

The failing draft plus its rubric failure reasons are sent back to the Brand Agent with a narrow revision directive:

```
Original: "{draft}"
Channel: {channel}
Failures: {primary_failure}
Revise. One sentence shorter. More specific. More individual.
Return only the revised text.
```

The revised text re-enters Layer 1 (deterministic) and Layer 2 (scored). If it still fails, it blocks.

### 9.3 Block Behavior

When the filter blocks:
1. The agent output is suppressed
2. A **safe fallback** is substituted (see §9.4)
3. A `brand.filter.blocked` event is written to the ledger
4. The original draft is stored (encrypted) for retrospective review

### 9.4 Safe Fallbacks (Per Channel)

```typescript
const SAFE_FALLBACKS: Record<Channel, string> = {
  voice_jeffrey: "Give me a moment. Let's try that again.",
  app_card: "Something's being refined. Check back shortly.",
  app_inline: "—",
  notification_push: "Aissisted has something for you.",
  email_transactional: "Your update is being finalized. We'll send it shortly.",
  email_lifecycle: "",  // skip sending, retry later
  sms: "",              // skip, never send a bad SMS
};
```

Safe fallbacks are themselves brand-reviewed and pre-approved.

### 9.5 Enforcement Principle

If the filter blocks, the blocked draft is never shown to the user. There is no silent bypass, no developer shortcut, and no agent self-approval path for user-facing copy.

---

## 10. INTEGRATION CONTRACT

### 10.1 Filter API

```typescript
// /packages/core/brand/BrandFilter.ts

export interface BrandFilter {
  check(input: BrandFilterInput): Promise<BrandFilterResult>;
}

export interface BrandFilterInput {
  draft: string;
  channel: Channel;
  toneMode: ToneMode;
  personalizationHints: {
    firstName?: string;
    preferredName?: string;
    activeGoalStatements: string[];
    recentSignalCodes: string[];    // e.g. ["HRV_DROP_7D", "SLEEP_IMPROVE_30D"]
  };
  overrides?: BrandFilterOverride[];
  userId: UserId;
  requestId: RequestId;
  agent: AgentName;                 // who produced the draft
  budgetMs: number;
}

export interface BrandFilterResult {
  verdict: "pass" | "revised" | "blocked";
  finalOutput: string;              // original, revised, or fallback
  deterministic: DeterministicResult;
  scored?: {
    rubric: BrandRubric;
    totalScore: BrandScore;
    primaryFailure?: string;
  };
  revisionAttempted: boolean;
  latencyMs: number;
}
```

### 10.2 Orchestrator Integration

The orchestrator calls `BrandFilter.check()` **after** the Safety Gate and **before** the Responder. The filter never runs in parallel with the safety gate — safety is always first.

For engineering implementation, the filter should be mounted as a shared service in the Fastify runtime boundary, not embedded independently inside agents.

### 10.3 Agent Integration

Agents do **not** call the Brand Filter directly. They produce drafts. The orchestrator routes drafts through the filter. This keeps the contract one-directional and prevents agents from "self-approving."

---

## 11. VERSIONING & REGISTRY

### 11.1 Rules as Data

All brand rules live in version-controlled YAML under `/config/brand/`:

```
/config/brand/
  forbidden_words.v1.yaml
  preferred_words.v1.yaml
  channel_constraints.v1.yaml
  tone_modes.v1.yaml
  safe_fallbacks.v1.yaml
  rubric_prompt.v1.md
```

### 11.2 Change Control

- Every PR to `/config/brand/` requires **brand owner approval** (Ron or delegate)
- Every change is tagged with a semver increment
- The orchestrator emits a `brand.filter.rules.changed` event on hot reload
- Historic rule versions are preserved indefinitely for audit

### 11.3 Schema Version

```yaml
# forbidden_words.v1.yaml
schemaVersion: "1.0.0"
rulesetVersion: "1.0.3"
effectiveFrom: "2026-04-16T00:00:00Z"
forbidden:
  - users
  # ...
```

---

## 12. OBSERVABILITY & METRICS

### 12.1 Events Written

Every filter execution emits a `brand.filter.executed` event to the ledger with:

- `requestId`, `userId`, `agent`, `channel`, `toneMode`
- `verdict`, `totalScore` (if scored), `latencyMs`
- `deterministicFailures[]`, `primaryLLMFailure`
- `revisionAttempted`

### 12.2 Target Metrics

| Metric | Target |
|--------|--------|
| Deterministic-layer p95 latency | < 25ms |
| LLM-layer p95 latency | < 400ms |
| First-pass pass rate (no revision) | ≥ 85% |
| Block rate | < 2% |
| Revision success rate | ≥ 70% |
| Forbidden-word hit rate | Trending to 0 |
| Personalization-marker miss rate | < 5% |

### 12.3 Dashboards

Engineering owns the CloudWatch dashboard. Brand owns a weekly review of:
- Top 10 blocked drafts (with agent attribution)
- Top 10 revised drafts
- Forbidden-word leaderboard (which agent hits which word)
- Rubric score distribution per agent

**Rule:** If an agent's average rubric score drops below 4.0 for a week, its prompt is flagged for review.

---

## 13. THE AISSISTED DECISION FILTER (RUNTIME)

The five-question brand check from the project rules is embedded in the scoring rubric:

| Question | Mapped Dimension |
|----------|------------------|
| Is it simple? | `simple` |
| Is it personal? | `individual_first` |
| Is it intelligent? | `calm_clear_certain` |
| Is it premium? | `premium` |
| Does it feel built for one person? | `individual_first` (weighted double) |

This is the line the filter enforces at runtime. Nothing ships that fails it.

---

## 14. OUTCOME

When this is live:

- **Voice drifts are impossible.** An agent cannot ship the word "users" to a consumer.
- **Personalization is verified, not assumed.** No output reaches a user without at least one personal reference when the channel requires it.
- **Auto-revision is cheap insurance.** Moderate misses become passes without human touch.
- **Every block is traceable.** Brand owns a dashboard. Drift is measurable.
- **The brand is a system, not a PDF.** Which means it actually holds.

---

## 15. OWNERSHIP

The Brand Filter is owned jointly:

- **Brand (Ron):** rules, rubric, safe fallbacks, registry approval
- **Engineering:** runtime, performance, observability
- **Product:** channel constraints, intent-to-tone mapping

If a team wants to add a channel, a tone mode, or a new forbidden phrase — this spec is the path.

---

## 16. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify Layer 1 rule registry v1.1 | Ron | Yes |
| 2 | Implement `BrandFilter.check()` inside Fastify runtime | Engineering | Yes |
| 3 | Wire filter into orchestrator post-safety-gate | Engineering | Yes |
| 4 | Build CloudWatch dashboard + weekly brand review | Engineering + Ron | Yes |
| 5 | Author rubric prompt v1 + calibrate on 50 golden examples | Ron + Claude | Yes |
| 6 | Author safe fallbacks v1 for every channel | Ron | Yes |
| 7 | Dry-run on existing draft library before agent wiring | Ron + Engineering | Yes |
| 8 | Draft Agent specs (Product, Brand, Data, Engineering, Growth) | Ron + Claude | Next |

### Immediate (next 72 hours)

1. **Freeze Layer 1 rules.** Forbidden words, channel constraints, and personalization-marker policy.
2. **Collect 50 golden examples** across every channel. These become the calibration set for the rubric.
3. **Decide Haiku vs. Sonnet default** for Layer 2. Recommend Haiku; fall back to Sonnet on confidence < 2 or when the draft affects a protocol.

---

## 17. OPEN QUESTIONS

1. **Rubric weighting** — should `individual_first` count double, given the brand's core line ("built for one person")? Recommend yes, but this is a brand call.
2. **Retroactive revision** — when a rule changes, do we re-score historical outputs? Cost/value tradeoff.
3. **Per-user tone adaptation** — should the rubric soften "directive" tone if a user's preference memory says `supportive`? Recommend yes, but requires preference memory to be live.
4. **Legal disclosure mixing** — when a message must include a verbatim disclosure AND brand copy, how do we filter the composite? Recommend: filter the brand portion only, concat verbatim disclosure untouched.
5. **Multilingual** — is v1 English-only? Rules and rubrics are language-specific. Recommend English-only for v1, with explicit no-op behavior on other locales.

---

*End of spec. v1.1. — Ready for engineering review.*
