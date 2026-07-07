"use client"

import { useEffect } from "react"

const MENU_ID = "admin-chat-theme-menu"
const STYLE_ID = "admin-chat-safe-theme-style"
const THEME_KEY = "786chat_admin_safe_theme_v1"

const THEMES: Record<string, string> = {
  "Purple Premium": `aside,main>div>section:first-of-type{background:radial-gradient(circle at 18% 0%,rgba(126,34,206,.45),transparent 34%),linear-gradient(180deg,#18072f,#080314)!important}main>div>section:last-of-type>header{border-color:rgba(168,85,247,.35)!important;background:linear-gradient(180deg,rgba(17,8,40,.98),rgba(8,7,24,.96))!important}`,
  "Blue Premium": `aside,main>div>section:first-of-type{background:radial-gradient(circle at 18% 0%,rgba(14,165,233,.45),transparent 34%),linear-gradient(180deg,#061a38,#020617)!important}main>div>section:last-of-type>header{border-color:rgba(56,189,248,.38)!important;background:linear-gradient(180deg,rgba(8,20,44,.98),rgba(2,6,23,.96))!important}`,
  "Green Premium": `aside,main>div>section:first-of-type{background:radial-gradient(circle at 18% 0%,rgba(16,185,129,.45),transparent 34%),linear-gradient(180deg,#052e2b,#020617)!important}main>div>section:last-of-type>header{border-color:rgba(52,211,153,.38)!important;background:linear-gradient(180deg,rgba(5,46,43,.98),rgba(2,6,23,.96))!important}`,
  "Dark Premium": `aside,main>div>section:first-of-type{background:radial-gradient(circle at 18% 0%,rgba(100,116,139,.32),transparent 34%),linear-gradient(180deg,#111827,#020617)!important}main>div>section:last-of-type>header{border-color:rgba(148,163,184,.28)!important;background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(2,6,23,.96))!important}`,
  "White Premium": `aside,main>div>section:first-of-type{background:radial-gradient(circle at 18% 0%,rgba(255,255,255,.40),transparent 34%),linear-gradient(180deg,#eef2ff,#dbeafe)!important;color:#0f172a!important}main>div>section:first-of-type *{color:#0f172a!important}main>div>section:last-of-type>header{border-color:rgba(148,163,184,.38)!important;background:linear-gradient(180deg,rgba(248,250,252,.98),rgba(226,232,240,.96))!important}main>div>section:last-of-type>header button{color:#0f172a!important}`,
}

function applyTheme(name: string) {
  const css = THEMES[name]
  if (!css) return
  try { localStorage.setItem(THEME_KEY, name) } catch {}
  document.getElementById(STYLE_ID)?.remove()
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}

export function AdminChatSafeThemeController() {
  useEffect(() => {
    try { applyTheme(localStorage.getItem(THEME_KEY) || "Purple Premium") } catch { applyTheme("Purple Premium") }

    const onThemeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest<HTMLButtonElement>(`#${MENU_ID} button`)
      if (!button) return
      const name = Object.keys(THEMES).find((theme) => button.textContent?.includes(theme))
      if (!name) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      applyTheme(name)
      document.getElementById(MENU_ID)?.remove()
    }

    document.addEventListener("click", onThemeClick, true)
    return () => document.removeEventListener("click", onThemeClick, true)
  }, [])

  return null
}
