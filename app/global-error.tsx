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
    console.error("[MujeebProAI] Global error caught:", error)
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
            background: "#0a0a0f",
            color: "#fff",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #06b6d4, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "1.5rem",
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              An unexpected error occurred. You can try again to continue.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#06b6d4",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
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
