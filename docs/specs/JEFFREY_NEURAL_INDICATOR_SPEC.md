# Jeffrey Neural Voice Indicator — Design Spec v1

**Date:** 2026-05-02
**Status:** **CANONICAL.** Replaces the 5-bar voice indicator (deprecated 2026-05-02).
**Owners:** Brand + Engineering
**Related:** `JEFFREY_VOICE_LOCK.md` (audio side), `JEFFREY_VOICE_LAYER_SPEC.md` (turn handling).

---

## 0. Operating line

> *Jeffrey doesn't pulse. He thinks.*

The visual identity of Jeffrey on every surface — dock chip, in-line card, full-screen voice modal — is a **neural field**. Not bars, not an orb, not a waveform. A small, living network of nodes and synapses that visibly process. State changes are observed shifts in network activity, not separate animations.

---

## 1. Visual model

### 1.1 Topology

- **9 nodes** in a brain-cluster: 1 center + 4 inner ring + 4 outer ring, slight asymmetry baked in.
- **18 edges** forming a small-world network: every node connects to 2–3 neighbors. No two layouts are identical at the pixel level — each instance gets a deterministic seed so the same Jeffrey surface shows the same brain across reloads.
- **Frame** is the existing circular chrome (drop-in replacement). Three sizes preserved:
  - `sm` — 24px (dock chip, badges)
  - `md` — 80px (recommendation cards, inline)
  - `lg` — 240px (full-screen voice modal)

### 1.2 Visual elements

| Element | What it is | How it renders |
|---|---|---|
| **Node** | A neuron | `<circle>` with two-layer fill: base aqua + bright aqua core whose radius scales with activation 0→1 |
| **Synapse** | A connection | `<line>` graphite at 8–14% opacity. Constant. |
| **Signal** | A firing pulse traveling node→node | `<circle>` with motion along the line (linear interpolation). Aqua. Trail rendered as fading dots. |
| **Activation glow** | Halo around an activated node | Soft drop-shadow on the node, opacity tracks activation. |
| **Red accent** | Adaptation moment / formula change | Rare red signal (color #EE2B37) replacing aqua on a single signal. Processing state only. ≤8% of all signals. |

### 1.3 Color discipline

| Color | Hex | Use |
|---|---|---|
| Aqua | `#00C2D1` | Primary neural activity — nodes, signals, glow |
| Graphite | `#1C1C1E` | Edges (at 8–14% opacity), background structure |
| White | `#FFFFFF` | Node core highlight (innermost circle when activation > 0.6) |
| Signal Red | `#EE2B37` | Reserved. One signal in fifteen during `processing`. Adaptation/identity moments only. |

No gradients on red. No purple, no blue. Aqua is the brand of intelligence; red is the brand of action. They never blur together.

---

## 2. State machine (4 states)

Animation is a continuous loop. State changes adjust **rates and amplitudes**, never start/stop separate animations.

| State | Spawn rate | Baseline activation | Drift amplitude | Network scale | Red accent | Notes |
|---|---|---|---|---|---|---|
| **idle** | 0.4 sig/s | 0.20 | low (1.5px @ md) | 1.00 | none | Background intelligence — one slow signal every 2–3 seconds |
| **listening** | 2.0 sig/s | 0.40 | medium (2.5px @ md) | 1.04 (subtle expansion) | none | Network listens outward, gathering |
| **processing** | 5.0 sig/s | 0.60 | low (1.5px @ md) | 0.96 (slight tightening) | 8% of signals | Highest activity, network focuses inward |
| **speaking** | 3.0 sig/s | 0.50 | medium (2.0px @ md) | 1.02 (rhythmic) | none | Center-outward synchronized bursts at ~1.5Hz |
| **error** | 0 sig/s | 0.15 | none | 1.00 | n/a | Frozen low. One desaturated red signal. Used only on connection failure. |

### 2.1 State transitions

- **All transitions are 320ms ease-out cross-fades on rates and amplitudes.** No hard cuts.
- The rAF loop runs continuously; transitions just reinterpolate target values for spawn rate, baseline activation, and drift.
- `useReducedMotion` collapses all states to a static rendering with a single 3s opacity breathe on each node. Identity preserved, motion intent dialed to ambient.

---

## 3. Motion system

### 3.1 Per-node behavior

Each node carries:
- `(x, y)` — base position, normalized 0–1, computed once at mount from the seed
- `(dx, dy)` — current drift offset, smoothly interpolated each frame
- `activation` — 0→1, rises instantly when fired, decays exponentially (τ = 600ms)
- `driftSeed` — phase offset so nodes don't drift in lockstep

**Drift function:** sinusoidal noise at very low frequency:
```
dx(t) = amplitude * sin(t * 0.0006 + seed * 6.28)
dy(t) = amplitude * cos(t * 0.0008 + seed * 4.71)
```
Different x/y frequencies prevent circular drift. Different per-node seeds prevent collective drift. Result: organic micro-motion at the limit of perceptibility.

### 3.2 Per-edge behavior

Each edge carries an array of `signals`, where each signal has `progress` (0→1) and `redAccent` (boolean).

**Each frame:**
1. Advance progress: `signal.progress += signalSpeed * dt`
2. Drop signals where `progress >= 1`
3. On signal completion, fire the destination node (set `activation = 1`)
4. Spawn new signals stochastically, biased toward edges incident on recently-fired nodes (so signals propagate through the network rather than randomly)

### 3.3 Network scale

`scale` is a single global multiplier interpolated toward the state's target (1.00 / 1.04 / 0.96 / 1.02). Applied as SVG `<g transform="scale(s)">` at the cluster level. Eased with τ = 400ms.

### 3.4 Speaking state — synchronized bursts

`speaking` overrides the stochastic spawning with a rhythmic component: every 666ms, spawn signals from the center node radiating outward (one signal on each edge incident to the center, then on each edge incident to the just-fired ring-1 nodes). Visible as a wavefront pulse at ~1.5Hz.

### 3.5 Timing curves

| Transition | Duration | Easing |
|---|---|---|
| Activation rise | 60ms | linear (instant on fire) |
| Activation decay | 600ms | exponential (τ = 200ms) |
| State change rates | 320ms | cubic-bezier(0.2, 0, 0, 1) |
| Network scale | 400ms | cubic-bezier(0.2, 0, 0, 1) |
| Drift | continuous | sinusoidal noise |
| Signal travel | 250–450ms per edge | linear |

---

## 4. Component API

### 4.1 React (canonical)

```tsx
import { NeuralVoiceIndicator } from "@/components/jeffrey/NeuralVoiceIndicator";

<NeuralVoiceIndicator state="processing" size="lg" />
```

**Props:**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `state` | `'idle' \| 'listening' \| 'processing' \| 'speaking' \| 'error'` | `'idle'` | Drives the entire animation. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24/80/240px. |
| `intensity` | `number` (0–1) | `1` | Multiplier on spawn rate + activation amplitude. |
| `seed` | `number` | `1` | Topology seed. Same seed = same brain. |
| `ariaLabel` | `string` | (state-derived) | Default: "Jeffrey listening" / "Jeffrey thinking" etc. |

### 4.2 Vanilla / HTML (prototype)

The prototype declares `<div class="neural" data-state="processing" data-size="lg"></div>` and the bootstrap script populates it. Same SVG output, no React dependency.

---

## 5. Implementation approach

### 5.1 SVG over Canvas

Chosen because:
- 9 nodes + 18 edges + ≤30 in-flight signals = ~60 elements peak. SVG handles this trivially.
- Crisp at every size from 24px to 240px.
- Inherits CSS color tokens (no manual repainting on theme change).
- DOM-inspectable for debug.
- No 60fps redraw cost — only the changed `cx/cy/r/opacity` attributes mutate.

Canvas would only win at >100 nodes or particle-style trails. We don't go there.

### 5.2 Animation loop

A single shared `requestAnimationFrame` loop at the module level:
- Drives all mounted indicators from one ticker.
- Pauses when document is hidden (`visibilitychange`).
- Skips frames when `prefers-reduced-motion: reduce` (renders a static breathing dot pattern instead).
- Per-frame work is O(nodes + edges + signals). At 60fps with 9 nodes, ~57 ops/frame. Negligible.

### 5.3 Performance

| Metric | Budget | Actual |
|---|---|---|
| Per-frame DOM mutations | < 80 attr writes | ~60 |
| Memory per indicator | < 4 KB | ~2 KB |
| CPU at idle (1 indicator visible) | < 0.5% | ~0.2% on M1 |
| CPU at processing (10 indicators visible) | < 5% | ~3.5% |
| First paint cost | < 16ms | ~6ms |

### 5.4 Accessibility

- `role="img"` with `aria-label` derived from state.
- `prefers-reduced-motion` respected (static breathing).
- High-contrast: all visible elements meet 3:1 against the background.

---

## 6. Files

| File | Role |
|---|---|
| `apps/web/components/jeffrey/NeuralVoiceIndicator.tsx` | React component — canonical |
| `apps/web/components/jeffrey/neural-engine.ts` | Pure animation engine (no React deps) |
| `aissisted-app.html` | Prototype — inline vanilla JS implementation |
| `apps/landing/preview.html` | Mirror of the prototype (auto-synced) |
| `docs/specs/JEFFREY_NEURAL_INDICATOR_SPEC.md` | This file |

---

## 7. Design filter checklist

Before shipping any change to this component, validate:

- [ ] Does it feel like intelligence, not animation?
- [ ] Does it feel biological, not digital?
- [ ] Does it pass the WHOOP test — clean, controlled, high-signal?
- [ ] Does it pass the BrainFutures test — neural, organic, alive?
- [ ] Does idle state read as ambient intelligence (not a screensaver)?
- [ ] Does processing state read as cognition (not noise)?
- [ ] Is red used at most once every 12.5 signals during processing?
- [ ] Does motion stay within ±2.5px amplitude at every size?

If any answer is no, refine. Don't ship a "close enough" neural visual.

---

*Locked: 2026-05-02. Next review: post-beta, when we have first-user "what is that thing?" feedback.*
