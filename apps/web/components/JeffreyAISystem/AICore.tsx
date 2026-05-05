"use client";

/**
 * AISSISTED — AI Core
 *
 * Central intelligence node. Three layers, all in one mesh group:
 *   1. Nucleus + halo (custom shader plane)
 *   2. Three concentric ring meshes (TorusGeometry, additive blended)
 *   3. Four rotating arc sprites baked into the shader (no separate meshes)
 *
 * Mode → behavior:
 *   - idle:           slow rotation, low activity (~0.18)
 *   - listening:      moderate activity (0.45), brightening
 *   - thinking:       high activity (0.85), arcs accelerate, ring spins fast
 *   - speaking:       activity 0.7, breathes outward
 *   - recommendation: activity 0.95 with a hint of red
 *
 * Activity is interpolated smoothly toward target each frame so transitions
 * between modes are continuous, never stepped.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SystemMode } from "./systemTypes";
import { BRAND_VEC3 } from "./systemTypes";

// Inline shader strings — Vite/Webpack can also import .glsl with a loader,
// but inline keeps zero-config for the prototype.
const CORE_VERT = `
uniform float uTime;
uniform float uActivity;
varying vec2 vUv;
varying float vRadial;
varying float vAngle;
void main() {
  vUv = uv;
  vec2 c = uv - 0.5;
  vRadial = length(c) * 2.0;
  vAngle = atan(c.y, c.x);
  float breath = 1.0 + sin(uTime * 0.9) * 0.012 * uActivity;
  vec3 pos = position * breath;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const CORE_FRAG = `
uniform float uTime;
uniform float uActivity;
uniform float uMode;
uniform vec3  uAqua;
uniform vec3  uWhite;
uniform vec3  uRed;
varying vec2 vUv;
varying float vRadial;
varying float vAngle;

float arc(float angle, float center, float width, float feather) {
  float d = abs(mod(angle - center + 3.14159, 6.28318) - 3.14159);
  return smoothstep(width + feather, width, d);
}

void main() {
  vec3 col = vec3(0.02, 0.05, 0.10);
  float alpha = 0.0;

  float nucleus = smoothstep(0.20, 0.0, vRadial);
  vec3 nucleusColor = mix(uAqua, uWhite, 0.6 + 0.4 * uActivity);
  col += nucleus * nucleusColor * (0.8 + uActivity * 0.4);
  alpha += nucleus * (0.85 + uActivity * 0.15);

  float halo = smoothstep(0.55, 0.20, vRadial) * (0.45 + uActivity * 0.35);
  col += halo * uAqua * 0.7;
  alpha += halo * 0.6;

  float arcRadius = 0.78;
  float arcRing = smoothstep(0.05, 0.0, abs(vRadial - arcRadius));
  float spinSpeed = 0.18 + uActivity * 0.65;
  float a1 = uTime * spinSpeed;
  float a2 = -uTime * spinSpeed * 0.62 + 1.5;
  float a3 = uTime * spinSpeed * 0.41 + 3.1;
  float a4 = -uTime * spinSpeed * 0.83 + 4.6;
  float arcs = 0.0;
  arcs += arc(vAngle, a1, 0.55, 0.06);
  arcs += arc(vAngle, a2, 0.42, 0.06);
  arcs += arc(vAngle, a3, 0.34, 0.05);
  arcs += arc(vAngle, a4, 0.22, 0.05);
  arcs = clamp(arcs, 0.0, 1.0);
  vec3 arcColor = mix(uAqua, uWhite, 0.15 + uActivity * 0.45);
  if (uMode > 3.5) {
    arcColor = mix(arcColor, uRed, 0.25);
  }
  col += arcRing * arcs * arcColor * (0.85 + uActivity * 0.55);
  alpha += arcRing * arcs * 0.85;

  float edgeFade = smoothstep(1.0, 0.92, vRadial);
  alpha *= edgeFade;
  col *= edgeFade;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

const TARGET_ACTIVITY: Record<SystemMode, number> = {
  idle: 0.18,
  listening: 0.45,
  thinking: 0.85,
  speaking: 0.70,
  recommendation: 0.95,
};

const MODE_INDEX: Record<SystemMode, number> = {
  idle: 0,
  listening: 1,
  thinking: 2,
  speaking: 3,
  recommendation: 4,
};

interface Props {
  mode: SystemMode;
  /** Optional intensity multiplier from the demo controller. */
  intensity?: number;
}

export function AICore({ mode, intensity = 1 }: Props) {
  const planeRef = useRef<THREE.Mesh>(null);
  const ringsGroup = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActivity: { value: TARGET_ACTIVITY.idle },
      uMode: { value: 0 },
      uAqua: { value: new THREE.Color(...BRAND_VEC3.aqua) },
      uWhite: { value: new THREE.Color(...BRAND_VEC3.white) },
      uRed: { value: new THREE.Color(...BRAND_VEC3.red) },
    }),
    [],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    // Smooth activity toward target (tau ≈ 320ms)
    const target = TARGET_ACTIVITY[mode] * intensity;
    const lerp = 1 - Math.exp(-dt / 0.32);
    uniforms.uActivity.value += (target - uniforms.uActivity.value) * lerp;
    uniforms.uMode.value = MODE_INDEX[mode];

    // Counter-rotate the three concentric rings at differing speeds.
    if (ringsGroup.current) {
      const spinScale = 0.2 + uniforms.uActivity.value * 1.4;
      const children = ringsGroup.current.children;
      if (children[0]) children[0].rotation.z += dt * 0.18 * spinScale;
      if (children[1]) children[1].rotation.z -= dt * 0.11 * spinScale;
      if (children[2]) children[2].rotation.z += dt * 0.07 * spinScale;
    }
  });

  return (
    <group>
      {/* ── Layered ring meshes — thin tori at three radii ── */}
      <group ref={ringsGroup}>
        <mesh>
          <torusGeometry args={[1.45, 0.012, 16, 96]} />
          <meshBasicMaterial
            color="#00C2D1"
            transparent
            opacity={0.38}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.85, 0.008, 16, 128]} />
          <meshBasicMaterial
            color="#00C2D1"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[2.25, 0.006, 16, 160]} />
          <meshBasicMaterial
            color="#00C2D1"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── Custom-shader nucleus + arcs plane ── */}
      <mesh ref={planeRef}>
        <planeGeometry args={[3.0, 3.0, 1, 1]} />
        <shaderMaterial
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Inner solid nucleus disc (gives the very center bright body) ── */}
      <mesh>
        <circleGeometry args={[0.28, 64]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default AICore;
