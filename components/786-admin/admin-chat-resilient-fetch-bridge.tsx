"use client"

import { useEffect } from "react"

const LEGACY_PATH = "/api/786-admin/chat"
const RESILIENT_PATH = "/api/786-admin/chat-resilient"

export function AdminChatResilientFetchBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input === LEGACY_PATH) {
        return originalFetch(RESILIENT_PATH, init)
      }
      if (input instanceof URL && input.pathname === LEGACY_PATH) {
        const next = new URL(input)
        next.pathname = RESILIENT_PATH
        return originalFetch(next, init)
      }
      if (input instanceof Request && new URL(input.url).pathname === LEGACY_PATH) {
        const nextUrl = new URL(input.url)
        nextUrl.pathname = RESILIENT_PATH
        return originalFetch(new Request(nextUrl, input), init)
      }
      return originalFetch(input, init)
    }) as typeof window.fetch

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
