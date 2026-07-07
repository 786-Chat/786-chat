"use client"

import { useEffect } from "react"

const LOGOUT_BUTTON_ID = "admin-chat-logout-button"
const HEADER_STYLE_ID = "admin-chat-header-clean-style"
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

function installHeaderStyle() {
  if (document.getElementById(HEADER_STYLE_ID)) return

  const style = document.createElement("style")
  style.id = HEADER_STYLE_ID
  style.textContent = `
    main > div > section:last-of-type > header > div:first-child {
      display: none !important;
    }
    main > div > section:last-of-type > header {
      justify-content: flex-end !important;
      gap: 14px !important;
    }
    #${LOGOUT_BUTTON_ID} {
      shrink: 0;
    }
  `
  document.head.appendChild(style)
}

function installLogoutButton() {
  installHeaderStyle()

  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const existingButton = document.getElementById(LOGOUT_BUTTON_ID)
  const publishButton = Array.from(header.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Publish"))

  if (existingButton && publishButton && existingButton.previousElementSibling !== publishButton) {
    publishButton.insertAdjacentElement("afterend", existingButton)
    return
  }

  if (existingButton) return

  const button = document.createElement("button")
  button.id = LOGOUT_BUTTON_ID
  button.type = "button"
  button.title = "Logout"
  button.setAttribute("aria-label", "Logout from 786.Chat admin")
  button.innerHTML = `<span style="font-size:16px;line-height:1">⎋</span><span>Logout</span>`
  button.style.cssText = "height:44px;border-radius:9999px;border:1px solid rgba(248,113,113,.38);background:rgba(127,29,29,.30);color:#fecaca;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 16px;font:900 14px system-ui;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 24px rgba(248,113,113,.10);white-space:nowrap;"
  button.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    logoutAdmin()
  }

  if (publishButton) publishButton.insertAdjacentElement("afterend", button)
  else header.appendChild(button)
}

export function AdminChatLogoutController() {
  useEffect(() => {
    installLogoutButton()
    const timer = window.setInterval(installLogoutButton, 250)
    const observer = new MutationObserver(installLogoutButton)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      document.getElementById(LOGOUT_BUTTON_ID)?.remove()
      document.getElementById(HEADER_STYLE_ID)?.remove()
    }
  }, [])

  return null
}
