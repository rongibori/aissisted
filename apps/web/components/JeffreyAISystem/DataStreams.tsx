"use client";

/**
 * AISSISTED — Data Streams
 *
 * Renders two layers per active path:
 *   1. The path itself — a thin curved line (Line2 from drei) at low alpha
 *   2. The signal packets traveling along the path — billboard sprites
 *
 * Paths are the 7 module ↔ core lines. They render at low opacity always so
 * the system structure is always visible; signal packets bring them to life.
 *
 * Voice → core paths render only during listening mode and originate from
 * just outside the canvas frame at a position above the core (representing
 * "input from outside").
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { Signal, DataModuleType, SystemMode } from "./systemTypes";
import { modulePosition, BRAND_VEC3 } from "./systemTypes";
import { SignalRouter, bezierPoint } from "./SignalRouter";

interface Props {
  router: SignalRouter;
  mode: SystemMode;
  activeModules: DataModuleType[];
}

// Voice input anchor — just above the canvas frame
const VOICE_ANCHOR: [number, number, number] = [0, 4.4, 0];
const CORE_ANCHOR: [number, number, number] = [0, 0, 0];

// Pre-compute the 7 module-to-core paths once
function buildBaseline(): Map<DataModuleType, [number, number, number]> {
  const m = new Map<DataModuleType, [number, number, number]>();
  (
    ["sleep", "recovery", "stress", "performance", "metabolic", "labs", "stack"] as DataModuleType[]
  ).forEach((t) => m.set(t, modulePosition(t)));
  return m;
}

const SIGNAL_BUDGET = 60;

export function DataStreams({ router, mode, activeModules }: Props) {
  const positions = useMemo(() => buildBaseline(), []);

  // ── Static path layer — 7 module-to-core lines ──────────────────────────
  const pathLines = useMemo(() => {
    const lines: { type: DataModuleType; pts: [number, number, number][] }[] = [];
    positions.forEach((to, type) => {
      const pts: [number, number, number][] = [];
      const STEPS = 24;
      for (let i = 0; i <= STEPS; i++) {
        pts.push(bezierPoint(to, CORE_ANCHOR, i / STEPS));
      }
      lines.push({ type, pts });
    });
    return lines;
  }, [positions]);

  // ── Signal packet layer — instanced via raw BufferGeometry ──────────────
  // We use a simple approach: maintain a Points THREE.BufferGeometry that we
  // update each frame with positions/colors/sizes from the router's signal
  // queue. This avoids React reconciler overhead per signal.
  const signalsGeom = useRef<THREE.BufferGeometry>(null);
  const positionsArr = useMemo(() => new Float32Array(SIGNAL_BUDGET * 3), []);
  const colorsArr = useMemo(() => new Float32Array(SIGNAL_BUDGET * 3), []);
  const sizesArr = useMemo(() => new Float32Array(SIGNAL_BUDGET), []);
  const alphasArr = useMemo(() => new Float32Array(SIGNAL_BUDGET), []);

  // Trail layer — same geometry but with a slight progress offset for motion
  // blur effect.
  const trailPositionsArr = useMemo(() => new Float32Array(SIGNAL_BUDGET * 3), []);
  const trailColorsArr = useMemo(() => new Float32Array(SIGNAL_BUDGET * 3), []);
  const trailSizesArr = useMemo(() => new Float32Array(SIGNAL_BUDGET), []);
  const trailAlphasArr = useMemo(() => new Float32Array(SIGNAL_BUDGET), []);
  const trailGeom = useRef<THREE.BufferGeometry>(null);

  useFrame((state, dt) => {
    // The router is ticked by the parent JeffreyAISystem; we just READ here.
    const signals = router.signals;
    const len = Math.min(signals.length, SIGNAL_BUDGET);

    for (let i = 0; i < len; i++) {
      const s = signals[i];
      const from = endpointPos(s.from, positions);
      const to = endpointPos(s.to, positions);

      const t = Math.min(1, s.progress);
      const [x, y, z] = bezierPoint(from, to, t);

      const ix = i * 3;
      positionsArr[ix] = x;
      positionsArr[ix + 1] = y;
      positionsArr[ix + 2] = z;

      const c = colorVec(s.color);
      colorsArr[ix] = c[0];
      colorsArr[ix + 1] = c[1];
      colorsArr[ix + 2] = c[2];

      // Size pulses slightly with progress (peaks mid-flight)
      const sizePulse = 1 + Math.sin(t * Math.PI) * 0.45;
      sizesArr[i] = (8 + s.intensity * 14) * sizePulse;
      // Fade in at start, fade out at end so the dot doesn't pop
      const edgeFade =
        Math.min(t / 0.08, 1.0) * Math.min((1 - t) / 0.08, 1.0);
      alphasArr[i] = s.intensity * 0.95 * edgeFade;

      // Trail dot — same path, lagging slightly behind
      const tt = Math.max(0, t - 0.07);
      const [tx, ty, tz] = bezierPoint(from, to, tt);
      trailPositionsArr[ix] = tx;
      trailPositionsArr[ix + 1] = ty;
      trailPositionsArr[ix + 2] = tz;
      trailColorsArr[ix] = c[0];
      trailColorsArr[ix + 1] = c[1];
      trailColorsArr[ix + 2] = c[2];
      trailSizesArr[i] = (8 + s.intensity * 14) * 1.4;
      trailAlphasArr[i] = s.intensity * 0.32 * edgeFade;
    }

    // Hide unused slots by parking them off-screen with size 0
    for (let i = len; i < SIGNAL_BUDGET; i++) {
      const ix = i * 3;
      positionsArr[ix] = 999;
      positionsArr[ix + 1] = 999;
      positionsArr[ix + 2] = 999;
      sizesArr[i] = 0;
      alphasArr[i] = 0;
      trailPositionsArr[ix] = 999;
      trailPositionsArr[ix + 1] = 999;
      trailPositionsArr[ix + 2] = 999;
      trailSizesArr[i] = 0;
      trailAlphasArr[i] = 0;
    }

    if (signalsGeom.current) {
      const g = signalsGeom.current;
      (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.size as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
    }
    if (trailGeom.current) {
      const g = trailGeom.current;
      (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.size as THREE.BufferAttribute).needsUpdate = true;
      (g.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ── Static curved paths ── */}
      {pathLines.map(({ type, pts }) => {
        const dim = activeModules.includes(type) ? 0.55 : 0.18;
        const v3pts: THREE.Vector3[] = pts.map(
          ([x, y, z]) => new THREE.Vector3(x, y, z),
        );
        return (
          <Line
            key={type}
            points={v3pts}
            color="#00C2D1"
            transparent
            opacity={dim}
            lineWidth={1}
            depthWrite={false}
          />
        );
      })}

      {/* Voice input path (only listening mode) */}
      {mode === "listening" && (
        <Line
          points={[new THREE.Vector3(...VOICE_ANCHOR), new THREE.Vector3(...CORE_ANCHOR)]}
          color="#FFFFFF"
          transparent
          opacity={0.45}
          lineWidth={1.5}
          dashed
          dashSize={0.18}
          gapSize={0.12}
          depthWrite={false}
        />
      )}

      {/* ── Trail layer (drawn before main so it sits behind) ── */}
      <points>
        <bufferGeometry ref={trailGeom}>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositionsArr, 3]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[trailColorsArr, 3]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[trailSizesArr, 1]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-alpha"
            args={[trailAlphasArr, 1]}
            count={SIGNAL_BUDGET}
          />
        </bufferGeometry>
        <SignalPointsMaterial />
      </points>

      {/* ── Main signal layer ── */}
      <points>
        <bufferGeometry ref={signalsGeom}>
          <bufferAttribute
            attach="attributes-position"
            args={[positionsArr, 3]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colorsArr, 3]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizesArr, 1]}
            count={SIGNAL_BUDGET}
          />
          <bufferAttribute
            attach="attributes-alpha"
            args={[alphasArr, 1]}
            count={SIGNAL_BUDGET}
          />
        </bufferGeometry>
        <SignalPointsMaterial />
      </points>
    </group>
  );
}

// ─── Custom point material ─────────────────────────────────────────────────

function SignalPointsMaterial() {
  // Soft circular sprite, additive-blended, color + alpha from per-vertex attrs.
  return (
    <shaderMaterial
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      vertexShader={`
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * (200.0 / -mv.z);
        }
      `}
      fragmentShader={`
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          if (r > 1.0) discard;
          float core = smoothstep(0.35, 0.0, r);
          float halo = smoothstep(1.0, 0.4, r) * 0.5;
          float a = (core + halo) * vAlpha;
          gl_FragColor = vec4(vColor * (0.8 + core * 0.5), a);
        }
      `}
    />
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function endpointPos(
  ep: Signal["from"] | Signal["to"],
  modules: Map<DataModuleType, [number, number, number]>,
): [number, number, number] {
  if (ep === "core") return CORE_ANCHOR;
  if (ep === "voice") return VOICE_ANCHOR;
  return modules.get(ep) ?? CORE_ANCHOR;
}

function colorVec(c: Signal["color"]): [number, number, number] {
  if (c === "aqua") return BRAND_VEC3.aqua;
  if (c === "red") return BRAND_VEC3.red;
  return BRAND_VEC3.white;
}

export default DataStreams;
