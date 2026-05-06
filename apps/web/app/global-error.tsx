"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#FFFFFF",
          color: "#1C1C1E",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
        }}
      >
        <div style={{ maxWidth: "24rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6E6E73",
              marginBottom: "0.75rem",
            }}
          >
            Something&rsquo;s off
          </p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            We hit a snag.
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6E6E73",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            Try again in a moment. If it keeps happening, refresh the page.
          </p>
          <button
            onClick={reset}
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1C1C1E",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.625rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9E9EA3",
                fontFamily:
                  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              Ref · {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
