"use client"

import { useEffect } from "react"

const MENU_ID = "admin-chat-theme-menu"
const BUTTON_ID = "admin-chat-theme-prompt"
const STYLE_ID = "admin-chat-safe-theme-style"
const STORAGE_KEY = "786chat_admin_safe_theme_v1"

function removeThemeUi() {
  document.getElementById(MENU_ID)?.remove()
  document.getElementById(BUTTON_ID)?.remove()
  document.getElementById(STYLE_ID)?.remove()
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export function AdminChatSafeThemeController() {
  useEffect(() => {
    removeThemeUi()
    const timer = window.setInterval(removeThemeUi, 250)
    const observer = new MutationObserver(removeThemeUi)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
    }
  }, [])

  return null
}
