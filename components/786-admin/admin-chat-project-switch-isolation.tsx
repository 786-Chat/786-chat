"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const RELOAD_GUARD_KEY = "786chat_admin_last_switch_reload_v1"

function activeProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

export function AdminChatProjectSwitchIsolation() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== ADMIN_CHAT_PATH) return

    let previousProjectId = activeProjectId()
    let reloading = false

    const inspect = () => {
      if (reloading) return
      const nextProjectId = activeProjectId()
      if (nextProjectId === previousProjectId) return

      const oldProjectId = previousProjectId
      previousProjectId = nextProjectId

      // Creating the first project and starting a new blank chat are already
      // handled by the page state. A saved-project-to-saved-project switch must
      // rehydrate the page so no old messages, files or preview state survive.
      if (!oldProjectId || !nextProjectId) return

      try {
        if (sessionStorage.getItem(RELOAD_GUARD_KEY) === nextProjectId) {
          sessionStorage.removeItem(RELOAD_GUARD_KEY)
          return
        }
        sessionStorage.setItem(RELOAD_GUARD_KEY, nextProjectId)
      } catch {}

      reloading = true
      document.querySelectorAll<HTMLIFrameElement>('iframe[title*="preview" i]').forEach((frame) => {
        frame.removeAttribute("srcdoc")
        frame.src = "about:blank"
      })
      document.getElementById("admin-chat-final-theme-menu")?.remove()

      const url = new URL(window.location.href)
      url.pathname = ADMIN_CHAT_PATH
      url.searchParams.set("projectId", nextProjectId)
      url.searchParams.set("switch", Date.now().toString(36))
      window.location.replace(url.toString())
    }

    const interval = window.setInterval(inspect, 250)
    return () => window.clearInterval(interval)
  }, [pathname])

  return null
}
