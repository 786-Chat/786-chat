"use client"

import { useEffect } from "react"

const LOGOUT_BUTTON_ID = "admin-chat-logout-button"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const VERIFIED_SESSION_CACHE_KEY = "786chat_verified_session_user_v1"

async function logoutAdmin() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  } catch {
  } finally {
    try {
      sessionStorage.removeItem(VERIFIED_SESSION_CACHE_KEY)
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
    } catch {}

    window.location.href = "/786-admin/login"
  }
}

function installLogoutButton() {
  if (document.getElementById(LOGOUT_BUTTON_ID)) return

  const publishButton = Array.from(
    document.querySelectorAll<HTMLButtonElement>("main > div > section:last-of-type > header button")
  ).find((button) => button.textContent?.includes("Publish"))

  if (!publishButton) return

  const button = document.createElement("button")
  button.id = LOGOUT_BUTTON_ID
  button.type = "button"
  button.title = "Logout"
  button.setAttribute("aria-label", "Logout from 786.Chat admin")
  button.innerHTML = `<span style="font-size:15px;line-height:1">⎋</span><span>Logout</span>`
  button.style.cssText = "shrink:0;height:40px;border-radius:9999px;border:1px solid rgba(248,113,113,.34);background:rgba(127,29,29,.25);color:#fecaca;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;font:800 14px system-ui;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);"
  button.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    logoutAdmin()
  }

  publishButton.insertAdjacentElement("afterend", button)
}

export function AdminChatLogoutController() {
  useEffect(() => {
    installLogoutButton()
    const timer = window.setInterval(installLogoutButton, 500)
    const observer = new MutationObserver(installLogoutButton)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      document.getElementById(LOGOUT_BUTTON_ID)?.remove()
    }
  }, [])

  return null
}
