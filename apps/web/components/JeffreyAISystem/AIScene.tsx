"use client";

/**
 * AISSISTED — AI Scene
 *
 * Canvas wrapper. Sets up the camera, lighting, fog, and tonemapping, then
 * renders the three visual layers: AICore, DataModules, DataStreams.
 *
 * The router is owned by the parent JeffreyAISystem and ticked here so the
 * tick happens inside the R3F render loop (no extra rAF).
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { SystemMode, SystemSnapshot, DataModuleType } from "./systemTypes";
import { SignalRouter } from "./SignalRouter";
import { AICore } from "./AICore";
import { DataModules } from "./DataModules";
import { DataStreams } from "./DataStreams";

interface Props {
  mode: SystemMode;
  snapshot: SystemSnapshot;
  activeModules: DataModuleType[];
  router: SignalRouter;
}

/**
 * Inner scene runner — needs to live INSIDE the Canvas so it can use
 * useFrame to tick the router.
 */
function SceneInner({ mode, snapshot, activeModules, router }: Props) {
  // Build moduleStatus map for color biasing
  const moduleStatus = useRef(
    Object.fromEntries(
      Object.entries(snapshot.modules).map(([k, v]) => [k, v.status]),
    ) as Record<DataModuleType, import("./systemTypes").ModuleStatus>,
  ).current;

  useFrame((state, dt) => {
    router.tick(state.clock.elapsedTime, dt, mode, {
      activeModules,
      moduleStatus,
    });
  });

  return (
    <>
      <AICore mode={mode} />
      <DataModules
        snapshot={snapshot}
        mode={mode}
        activeModules={activeModules}
      />
      <DataStreams router={router} mode={mode} activeModules={activeModules} />
    </>
  );
}

export function AIScene(props: Props) {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 95, position: [0, 0, 10], near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(circle at 50% 45%, #0F2A52 0%, #061027 55%, #02060F 100%)",
      }}
    >
      {/* Soft ambient + a subtle key for the additive layers */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 5]} intensity={1.2} color="#00C2D1" />
      <fog attach="fog" args={["#02060F", 8, 18]} />

      <SceneInner {...props} />
    </Canvas>
  );
}

export default AIScene;
