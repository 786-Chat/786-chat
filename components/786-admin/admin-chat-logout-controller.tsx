"use client"

import { useEffect } from "react"

const LOGOUT_BUTTON_ID = "admin-chat-logout-button"
const HEADER_STYLE_ID = "admin-chat-header-clean-style"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const VERIFIED_SESSION_CACHE_KEY = "786chat_verified_session_user_v1"

async function logoutAdmin() {
  const button = document.getElementById(LOGOUT_BUTTON_ID) as HTMLButtonElement | null
  if (button) button.disabled = true

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
  } catch {
    // Local session state is still cleared below. Middleware will reject the old page.
  } finally {
    try {
      sessionStorage.clear()
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
      localStorage.removeItem(VERIFIED_SESSION_CACHE_KEY)
    } catch {}

    window.location.replace(`/786-admin/login?logged_out=1&t=${Date.now()}`)
  }
}

function installHeaderStyle() {
  if (document.getElementById(HEADER_STYLE_ID)) return

  const style = document.createElement("style")
  style.id = HEADER_STYLE_ID
  style.textContent = `
    main > div > section:first-of-type > header,
    main > div > section:last-of-type > header {
      border-color: rgba(168,85,247,.30) !important;
      background:
        radial-gradient(circle at 16% 20%, rgba(147,51,234,.34), transparent 32%),
        radial-gradient(circle at 78% 8%, rgba(14,165,233,.16), transparent 28%),
        linear-gradient(180deg, rgba(23,8,45,.98), rgba(10,5,28,.96)) !important;
      box-shadow: inset 0 -1px 0 rgba(168,85,247,.22), 0 0 45px rgba(88,28,135,.14) !important;
    }

    main > div > section:last-of-type > header {
      justify-content: flex-end !important;
      gap: 10px !important;
      padding-left: 14px !important;
      padding-right: 16px !important;
      overflow: hidden !important;
    }

    main > div > section:last-of-type > header > div:first-child,
    main > div > section:last-of-type > header > div:first-child + span,
    main > div > section:last-of-type > header > span:first-child,
    main > div > section:last-of-type > header > [class*="truncate"]:first-child {
      display: none !important;
    }

    main > div > section:last-of-type > header button {
      height: 42px !important;
      min-height: 42px !important;
      border-radius: 16px !important;
      font-size: 14px !important;
      line-height: 1 !important;
    }

    main > div > section:last-of-type > header button:not([id="${LOGOUT_BUTTON_ID}"]) {
      padding-left: 15px !important;
      padding-right: 15px !important;
    }

    #${LOGOUT_BUTTON_ID} {
      width: 44px !important;
      min-width: 44px !important;
      max-width: 44px !important;
      padding: 0 !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255,255,255,.14) !important;
      background: rgba(15,23,42,.72) !important;
      color: #e5e7eb !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 24px rgba(139,92,246,.10) !important;
    }

    #${LOGOUT_BUTTON_ID}:hover {
      border-color: rgba(248,113,113,.44) !important;
      background: rgba(127,29,29,.22) !important;
      color: #fecaca !important;
    }

    #${LOGOUT_BUTTON_ID}:disabled {
      cursor: wait !important;
      opacity: .55 !important;
    }

    main > div > button[title*="resize"],
    main > div > button[title*="Drag"] {
      width: 3px !important;
      background: linear-gradient(180deg, rgba(147,51,234,.2), rgba(14,165,233,.75), rgba(147,51,234,.2)) !important;
      border: 0 !important;
      box-shadow: 0 0 20px rgba(14,165,233,.35) !important;
    }
  `
  document.head.appendChild(style)
}

function cleanHeader() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const firstNonButton = Array.from(header.children).find((node) => node instanceof HTMLElement && node.tagName !== "BUTTON" && node.id !== LOGOUT_BUTTON_ID) as HTMLElement | undefined

  if (firstNonButton) {
    firstNonButton.style.display = "none"
    firstNonButton.setAttribute("aria-hidden", "true")
  }
}

function installLogoutButton() {
  installHeaderStyle()
  cleanHeader()

  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const publishButton = Array.from(header.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Publish"))
  const existingButton = document.getElementById(LOGOUT_BUTTON_ID) as HTMLButtonElement | null

  if (existingButton) {
    existingButton.innerHTML = `<span aria-hidden="true" style="font-size:18px;line-height:1;transform:translateY(-1px)">⏻</span>`
    existingButton.title = "Logout"
    existingButton.setAttribute("aria-label", "Logout from 786.Chat admin")
    if (publishButton && existingButton.previousElementSibling !== publishButton) {
      publishButton.insertAdjacentElement("afterend", existingButton)
    }
    return
  }

  const button = document.createElement("button")
  button.id = LOGOUT_BUTTON_ID
  button.type = "button"
  button.title = "Logout"
  button.setAttribute("aria-label", "Logout from 786.Chat admin")
  button.innerHTML = `<span aria-hidden="true" style="font-size:18px;line-height:1;transform:translateY(-1px)">⏻</span>`
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
    const timer = window.setInterval(installLogoutButton, 500)
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
