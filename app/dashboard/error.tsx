"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Dashboard error caught:", error)
  }, [error])

  return (
    <div className="h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-white/60 text-sm mb-6">
          The chat ran into an unexpected error. Your conversation is saved — just try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-white/[0.06] hover:bg-white/10 text-white/80 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Reload dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
