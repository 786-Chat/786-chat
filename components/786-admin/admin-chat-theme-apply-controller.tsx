"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const THEME_MENU_ID = "admin-chat-theme-menu"

function submitThemePrompt() {
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="786.Chat"]')
  if (!textarea || !textarea.value.trim()) return
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    bubbles: true,
    cancelable: true,
  })
  textarea.dispatchEvent(event)
}

export function AdminChatThemeApplyController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const onThemeChoice = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const choice = target?.closest<HTMLButtonElement>(`#${THEME_MENU_ID} button`)
      if (!choice) return
      window.setTimeout(submitThemePrompt, 220)
    }

    document.addEventListener("click", onThemeChoice, true)
    return () => document.removeEventListener("click", onThemeChoice, true)
  }, [pathname])

  return null
}
