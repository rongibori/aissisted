/**
 * /jeffrey-system — viewing route for the Jeffrey AI System.
 *
 * The page is a server component that hands off to JeffreySystemClient,
 * which fetches the per-user SystemSnapshot from /v1/system/snapshot and
 * passes it down to <JeffreyAISystem />. When the visitor is not
 * authenticated, the client falls back to the in-component RON_SNAPSHOT
 * default so the route still demos publicly.
 */

import JeffreySystemClient from "./JeffreySystemClient";

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
      <JeffreySystemClient />
    </main>
  );
}
