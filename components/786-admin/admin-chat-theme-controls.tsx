"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const THEME_KEY = "786chat_admin_real_theme_v1"
type AdminTheme = "galaxy" | "ocean" | "forest"

const THEMES: Array<{ value: AdminTheme; label: string }> = [
  { value: "galaxy", label: "🟣 Galaxy Neon" },
  { value: "ocean", label: "🔵 Ocean Breeze" },
  { value: "forest", label: "🟢 Forest Mint" },
]

function readTheme(): AdminTheme {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === "ocean" || saved === "forest" ? saved : "galaxy"
}

function applyTheme(theme: AdminTheme) {
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.setAttribute("data-real-admin-theme", theme)
}

function removeMenu() {
  document.getElementById("admin-chat-theme-portal")?.remove()
}

function installStyles() {
  if (document.getElementById("admin-chat-theme-control-style")) return

  const style = document.createElement("style")
  style.id = "admin-chat-theme-control-style"
  style.textContent = `
    #admin-chat-real-theme-options { display: none !important; }

    #admin-chat-theme-portal {
      position: fixed;
      z-index: 2147483647;
      width: 250px;
      padding: 10px;
      border-radius: 20px;
      border: 1px solid rgba(168,85,247,.38);
      background: rgba(2,6,23,.98);
      box-shadow: 0 28px 90px rgba(0,0,0,.72), 0 0 44px rgba(88,28,135,.38);
      backdrop-filter: blur(20px);
      color: white;
      font: 800 13px system-ui, sans-serif;
    }

    #admin-chat-theme-portal button {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 10px;
      margin: 0 0 7px;
      padding: 11px 13px;
      border-radius: 14px;
      border: 1px solid rgba(168,85,247,.24);
      background: rgba(15,23,42,.92);
      color: white;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }

    #admin-chat-theme-portal button:last-child { margin-bottom: 0; }
    #admin-chat-theme-portal button:hover,
    #admin-chat-theme-portal button[data-selected="true"] {
      border-color: rgba(216,180,254,.62);
      background: linear-gradient(135deg, rgba(126,34,206,.92), rgba(30,41,59,.96));
      box-shadow: 0 0 22px rgba(168,85,247,.34);
    }

    html[data-real-admin-theme="ocean"] main > div > aside,
    html[data-real-admin-theme="ocean"] main > div > section:first-of-type {
      background: radial-gradient(circle at 30% 20%, rgba(34,211,238,.20), transparent 32%), linear-gradient(180deg, rgba(3,37,65,.98), rgba(2,6,23,.98)) !important;
      border-color: rgba(34,211,238,.30) !important;
      box-shadow: inset -1px 0 0 rgba(34,211,238,.16), 0 0 55px rgba(8,145,178,.18) !important;
    }

    html[data-real-admin-theme="ocean"] main > div > section:first-of-type::before {
      background-image: radial-gradient(#cffafe 1px, transparent 1px), radial-gradient(rgba(103,232,249,.70) 1px, transparent 1px) !important;
    }

    html[data-real-admin-theme="ocean"] main > div > section:last-of-type > header,
    html[data-real-admin-theme="ocean"] #admin-chat-browser-bar {
      border-color: rgba(34,211,238,.24) !important;
      background: linear-gradient(180deg, rgba(3,18,34,.98), rgba(3,18,34,.92)) !important;
    }

    html[data-real-admin-theme="forest"] main > div > aside,
    html[data-real-admin-theme="forest"] main > div > section:first-of-type {
      background: radial-gradient(circle at 30% 20%, rgba(52,211,153,.20), transparent 32%), linear-gradient(180deg, rgba(3,46,30,.98), rgba(2,12,10,.98)) !important;
      border-color: rgba(52,211,153,.30) !important;
      box-shadow: inset -1px 0 0 rgba(52,211,153,.16), 0 0 55px rgba(5,150,105,.18) !important;
    }

    html[data-real-admin-theme="forest"] main > div > section:first-of-type::before {
      background-image: radial-gradient(#d1fae5 1px, transparent 1px), radial-gradient(rgba(110,231,183,.70) 1px, transparent 1px) !important;
    }

    html[data-real-admin-theme="forest"] main > div > section:last-of-type > header,
    html[data-real-admin-theme="forest"] #admin-chat-browser-bar {
      border-color: rgba(52,211,153,.24) !important;
      background: linear-gradient(180deg, rgba(3,25,20,.98), rgba(3,25,20,.92)) !important;
    }
  `
  document.head.appendChild(style)
}

function openMenu(anchor: HTMLElement) {
  const existing = document.getElementById("admin-chat-theme-portal")
  if (existing) {
    existing.remove()
    return
  }

  const rect = anchor.getBoundingClientRect()
  const menu = document.createElement("div")
  menu.id = "admin-chat-theme-portal"
  menu.setAttribute("role", "menu")
  menu.style.top = `${Math.min(window.innerHeight - 190, rect.bottom + 8)}px`
  menu.style.left = `${Math.max(12, Math.min(window.innerWidth - 262, rect.right - 250))}px`

  const selected = readTheme()
  menu.innerHTML = THEMES.map(
    ({ value, label }) => `<button type="button" role="menuitemradio" data-admin-theme="${value}" data-selected="${selected === value}">${label}</button>`,
  ).join("")

  document.body.appendChild(menu)
}

export function AdminChatThemeControls() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installStyles()
    applyTheme(readTheme())

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const toggle = target.closest<HTMLElement>("#admin-chat-real-theme-menu [data-theme-toggle]")
      if (toggle) {
        event.preventDefault()
        event.stopPropagation()
        openMenu(toggle)
        return
      }

      const choice = target.closest<HTMLElement>("#admin-chat-theme-portal [data-admin-theme]")
      if (choice) {
        event.preventDefault()
        const value = choice.dataset.adminTheme
        if (value === "galaxy" || value === "ocean" || value === "forest") applyTheme(value)
        removeMenu()
        return
      }

      if (!target.closest("#admin-chat-theme-portal")) removeMenu()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") removeMenu()
    }

    document.addEventListener("click", onClick, true)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("keydown", onKeyDown)
      removeMenu()
    }
  }, [pathname])

  return null
}
