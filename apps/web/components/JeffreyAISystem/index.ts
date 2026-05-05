/**
 * Barrel export for the Jeffrey AI System.
 *
 * Use:
 *   import { JeffreyAISystem } from "@/components/JeffreyAISystem";
 */

export { JeffreyAISystem, default } from "./JeffreyAISystem";
export { AIScene } from "./AIScene";
export { AICore } from "./AICore";
export { DataModules } from "./DataModules";
export { DataStreams } from "./DataStreams";
export { SignalRouter, bezierPoint } from "./SignalRouter";
export {
  RON_SNAPSHOT,
  DEMO_SCRIPT,
  RECOMMENDATION,
  type DemoStep,
} from "./mockData";
export type {
  SystemMode,
  DataModuleType,
  Signal,
  SignalEndpoint,
  SignalColor,
  ModuleStatus,
  ModuleData,
  UserContext,
  SystemSnapshot,
} from "./systemTypes";
export { modulePosition, BRAND_COLOR, BRAND_VEC3 } from "./systemTypes";
