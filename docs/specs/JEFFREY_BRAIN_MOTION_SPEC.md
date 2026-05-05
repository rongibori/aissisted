# Jeffrey Brain — Motion + Timing Spec v1

**Date:** 2026-05-03
**Status:** **CANONICAL.** Governs the WebGL brain microinteraction system.
**Related:** `JEFFREY_NEURAL_INDICATOR_SPEC.md` (visual structure), `JEFFREY_VOICE_LOCK.md` (audio side).
**Implementation:** `aissisted-app.html#BrainGL` (vanilla Three.js + physics). The engine reads from this spec; never edit timings ad-hoc in code.

---

## 0. Operating line

> *Not an animation. A responsive, state-driven simulation.*

Five states, one continuous physics loop, never-looped feel. Every transition is spring-driven; never linear; never bounce-spin-playful.

---

## 1. Five states

| # | State | Trigger | Duration |
|---|---|---|---|
| 1 | **Idle** | Default | continuous loop, must not feel looped |
| 2 | **Pre-Activation** | Hover · cursor proximity (≤80px) · voice listening · touch proximity | 220–320ms |
| 3 | **Neural Explosion** | Click · tap · voice activation · strong hover | 1,400–1,600ms total |
| 4 | **Peak Processing** | Continuation of explosion | 900–1,800ms |
| 5 | **Reformation** | Hover exit · touch release · voice idle · processing complete | 1,400–2,200ms |

---

## 2. Idle state

| Aspect | Value |
|---|---|
| Node breathing cycle | 4.8–6.5s (per cluster, randomized) |
| Node opacity pulse | 3.2–5.4s (per cluster, randomized) |
| Signal travel event | every 1.8–4.5s (randomized) |
| Signal duration | 900–1,400ms |
| Easing (signal travel) | `cubic-bezier(0.33, 0.00, 0.20, 1.00)` |
| Easing (breathing) | `cubic-bezier(0.45, 0.05, 0.25, 0.95)` |

**Rules:**
- **Never pulse all nodes at once.** Use staggered clusters.
- Motion must feel alive, not decorative.
- Color: aqua 60% · white 30% · red 5% · violet/cyan 5%.

---

## 3. Pre-activation state

**Triggers:** hover · touch proximity · voice listening · mouse within 80px.

| Phase | Timing | Behavior |
|---|---|---|
| Immediate response | 0–40ms | Activity ramps near interaction origin |
| Brightness ramp | 0–180ms | Nodes near cursor brighten |
| Local node pull | 0–240ms | Nearest nodes lean toward cursor |
| Edge tension | 0–260ms | Edges tighten subtly |

**Easing (anticipation):** `cubic-bezier(0.16, 1.00, 0.30, 1.00)`

> Feels like the system waking up.

---

## 4. Neural explosion state

**Triggers:** click · tap · voice activation · strong hover.
**Total:** 1,400–1,600ms (primary 680ms · secondary scatter 1,200ms).

### Phase A · Impact recognition (0–80ms)
- Interaction point flashes (white → red).
- Nearby nodes compress inward very slightly before release.
- Edges brighten.
- **Easing:** `cubic-bezier(0.20, 0.00, 0.10, 1.00)`

### Phase B · Primary neural burst (80–360ms)
- Nodes closest to interaction shoot outward first.
- Signal radiates through brain shape.
- Edges begin stretching.
- **Easing:** `cubic-bezier(0.10, 0.90, 0.20, 1.00)` (explosive outward)

### Phase C · Full deconstruction (360–680ms)
- Brain silhouette dissolves.
- Most nodes in motion.
- Edges break into faint light trails.
- **Easing:** `cubic-bezier(0.22, 1.00, 0.36, 1.00)`

### Phase D · Drift + processing (680–1,400ms)
- Nodes drift with inertia.
- Motion slows naturally.
- Some clusters reconnect temporarily.
- Sparks fire between dispersed nodes.
- **Easing:** `cubic-bezier(0.18, 0.80, 0.25, 1.00)`

**Rules:**
- Explosion not random — must feel intelligent.
- Larger clusters move slower; smaller move faster + farther.
- Outer particles get longer trails.
- Core nodes maintain gravitational pull throughout.

---

## 5. Peak processing state

**Duration:** 900–1,800ms based on interaction.

| Aspect | Value |
|---|---|
| Cluster pulse interval | 320–700ms |
| Signal jump duration | 180–420ms |
| Color decay onset | 600ms |
| Red accent peak | early (180–480ms) → fades |

**Easings:**
- Signal jumps: `cubic-bezier(0.12, 0.75, 0.25, 1.00)`
- Cluster pulse: `cubic-bezier(0.42, 0.00, 0.18, 1.00)`
- Color decay: `cubic-bezier(0.30, 0.00, 0.20, 1.00)`

**Rules:** the "thinking" state. Intelligent, not chaotic. Subtle asymmetry. Cascading activity.

---

## 6. Reformation state

**Duration:** 1,400–2,200ms.

### Phase A · Attraction begins (0–400ms)
- Drift slows. Core nodes return first. Network gravity visible.
- **Easing:** `cubic-bezier(0.33, 0.00, 0.20, 1.00)`

### Phase B · Structural rebuild (400–1,200ms)
- Brain silhouette becomes recognizable. Primary edges reconnect. Density increases.
- **Easing (spring-like return):** `cubic-bezier(0.25, 1.25, 0.35, 1.00)`

### Phase C · Final settling (1,200–2,200ms)
- Micro-nodes return. Edge opacity stabilizes. Breathing motion resumes.
- **Easing (soft settle):** `cubic-bezier(0.19, 1.00, 0.22, 1.00)`

**Rules:**
- Never snap nodes back instantly.
- Reformation must feel magnetic, biological.
- **Stagger by depth:** core first → mid second → outer atmosphere last.

---

## 7. Voice-specific timings

### Listening
- Continuous while listening.
- Scan wave every 2.4s.
- Low flicker every 700–1,200ms.
- Slight node lift near center every 1.8s.
- **Easing:** `cubic-bezier(0.40, 0.00, 0.20, 1.00)`
- Color: mostly aqua, minimal white, very restrained red.

### Speaking
- Matches speech duration.
- Micro pulse every 120–260ms.
- Larger emphasis pulse every 800–1,400ms.
- Signal propagation: starts 40ms after speech amplitude spike.
- **Cadence pulse easing:** `cubic-bezier(0.18, 0.85, 0.32, 1.00)`
- **Emphasis pulse easing:** `cubic-bezier(0.12, 1.00, 0.20, 1.00)`
- Color: aqua for regular speech, red on emphasis, white glow for clarity.

### Thinking
- 1.5–4s typical.
- Cluster ignition: 180ms.
- Regional pulse: 600–900ms.
- Cross-brain signal jump: 300–500ms.
- Final answer-ready pulse: 420ms.
- **Easing:** `cubic-bezier(0.16, 1.00, 0.30, 1.00)`
- **Final answer-ready pulse:** `cubic-bezier(0.08, 0.82, 0.17, 1.00)`

---

## 8. Spring physics — recommended values per state

| State | Stiffness | Damping | Mass |
|---|---|---|---|
| Idle breathing | 35 | 22 | 1.2 |
| Pre-activation pull | 90 | 18 | 0.8 |
| Explosion | 180 | 14 | 0.65 |
| Peak drift | 22 | 30 | 1.4 |
| Reformation | 75 | 20 | 1.0 |
| Final settle | 45 | 28 | 1.1 |

---

## 9. Staggering rules

**Never animate all nodes together.**

| Cluster | Delay range |
|---|---|
| Core brain nodes | 0–80ms |
| Mid-layer nodes | 80–220ms |
| Outer nodes | 180–420ms |
| Micro-particles | randomized 40–600ms |

**Signal propagation by distance:**
```
delay = distanceFromOrigin * 0.45 + random(0, 80)
```
Closer nodes activate first; farther nodes activate later.

---

## 10. Color timing

### Idle
- Aqua 60% · White 30% · Red 5% · Violet/cyan 5%

### Activation
- Aqua ramps up in 120ms
- Red flashes 180–480ms
- Cyan/violet sparks 260–900ms
- White glow stabilizes after 600ms

### Reformation
- Violet disappears first
- Red fades second
- Aqua remains
- White returns to subtle glow

**Color easing:** `cubic-bezier(0.30, 0.00, 0.20, 1.00)`

---

## 11. Non-negotiables

- Do not make this look like generic particles.
- Do not make this feel random.
- Do not use bounce, spin, or playful motion.
- Do not make the brain disappear completely.
- Do not overuse red.
- Do not animate all nodes at the same time.

The final result should feel like a living brain — a responsive intelligence layer — a biological system becoming activated.

---

## 12. Implementation map

| Spec section | Code location in `aissisted-app.html#BrainGL` |
|---|---|
| Idle physics | `STATES.idle` profile + spring constants |
| Pre-activation | cursor proximity check + `cursor.amp` smoothing |
| Explosion | click handler + phased timer (`explosion.t`) drives spring weakening |
| Peak processing | `STATES.thinking` + signal-jump random fire |
| Reformation | spring strength returns to idle baseline; depth-staggered |
| Voice modes | external state attr `data-state` drives `STATES[state]` |

---

*Locked: 2026-05-03 · Next review: post first-50-user feedback on the brain interaction.*
