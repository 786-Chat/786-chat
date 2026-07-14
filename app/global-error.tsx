"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[786 Chat AI] Global error caught:", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050713",
            color: "#fff",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "30rem", textAlign: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "1.25rem",
                background: "linear-gradient(135deg, #22d3ee, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "1.3rem",
                fontWeight: 800,
                boxShadow: "0 0 40px rgba(34,211,238,.2)",
              }}
            >
              786
            </div>
            <p style={{ color: "#22d3ee", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>
              786 Chat AI
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              An unexpected error occurred. Try again to return to your workspace.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.75rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
