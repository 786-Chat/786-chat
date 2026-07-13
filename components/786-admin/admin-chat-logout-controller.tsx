"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const VERIFIED_SESSION_CACHE_KEY = "786chat_verified_session_user_v1"
let logoutInFlight = false

async function logoutAdmin() {
  if (logoutInFlight) return
  logoutInFlight = true

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
  } catch {
    // Navigation below still moves the user to the protected login route.
  } finally {
    try {
      sessionStorage.clear()
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
      localStorage.removeItem(VERIFIED_SESSION_CACHE_KEY)
    } catch {}

    window.location.replace(`/786-admin/login?logged_out=1&t=${Date.now()}`)
  }
}

function isPowerButton(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  const button = target.closest("button")
  if (!button) return false

  const title = (button.getAttribute("title") || "").toLowerCase()
  const aria = (button.getAttribute("aria-label") || "").toLowerCase()
  return title === "power" || title.includes("logout") || aria.includes("logout")
}

export function AdminChatLogoutController() {
  useEffect(() => {
    const interceptPowerClick = (event: MouseEvent) => {
      if (!isPowerButton(event.target)) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      void logoutAdmin()
    }

    document.addEventListener("click", interceptPowerClick, true)
    return () => document.removeEventListener("click", interceptPowerClick, true)
  }, [])

  return null
}
