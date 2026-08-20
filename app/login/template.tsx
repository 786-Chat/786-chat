"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

export default function LoginTemplate({ children }: { children: React.ReactNode }) {
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSessionExpired(params.get("error") === "session-expired")
  }, [])

  return (
    <>
      {sessionExpired ? (
        <div
          role="alert"
          className="fixed left-1/2 top-4 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-amber-300/30 bg-[#15101f]/95 px-4 py-3 text-[13px] font-semibold text-amber-100 shadow-2xl backdrop-blur-xl"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Session expired. Please sign in again to continue.</span>
        </div>
      ) : null}
      {children}
    </>
  )
}
