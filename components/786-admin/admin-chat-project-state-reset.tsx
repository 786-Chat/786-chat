"use client"

import { useEffect } from "react"

/**
 * Bridges stale-project recovery into the React chat page.
 * The page listens for this event and clears its in-memory project state.
 */
export const ADMIN_PROJECT_CLEARED_EVENT = "786-admin-project-cleared"

export function AdminChatProjectStateReset() {
  useEffect(() => {
    // This component intentionally has no DOM. It documents and centralises the
    // event name used by recovery controllers and the chat page.
  }, [])

  return null
}
