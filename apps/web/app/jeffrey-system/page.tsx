/**
 * /jeffrey-system — viewing route for the Jeffrey AI System scaffold.
 *
 * This is the verification surface: open this route to see the Three.js
 * scaffold running with the mock Ron snapshot, all 5 mode buttons, and the
 * scripted demo. Production product surfaces will compose
 * <JeffreyAISystem /> directly with real bridge data.
 */

import { JeffreyAISystem } from "../../components/JeffreyAISystem";

export const metadata = {
  title: "Jeffrey AI System — Aissisted",
  description:
    "Personal biological operating system. Real-time biometric and lab signals consumed by Jeffrey.",
};

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1D3A",
      }}
    >
      <JeffreyAISystem />
    </main>
  );
}
