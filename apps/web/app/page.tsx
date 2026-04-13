export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px",
        maxWidth: 960,
        margin: "0 auto"
      }}
    >
      <h1 style={{ fontSize: 42, marginBottom: 12 }}>Aissisted</h1>
      <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 720 }}>
        Aissisted is building an AI-driven personalized health platform that turns
        labs, biometrics, wearable data, and user goals into adaptive supplement
        and wellness protocols.
      </p>

      <section style={{ marginTop: 40 }}>
        <h2>Phase 1 Focus</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>Web app shell</li>
          <li>API foundation</li>
          <li>Health profile domain model</li>
          <li>Supplement protocol engine contracts</li>
          <li>Wearable and labs integration stubs</li>
        </ul>
      </section>
    </main>
  );
}
