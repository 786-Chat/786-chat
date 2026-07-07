"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STYLE_ID = "admin-chat-final-header-style"
const THEME_MENU_ID = "admin-chat-final-theme-menu"
const THEME_KEY = "786chat_admin_workspace_theme_v1"
const PATH_KEY = "786chat_admin_preview_path_v1"
const OLD_THEME_BUTTON_ID = "admin-chat-theme-prompt"

const themes = [
  { key: "purple", name: "Purple Galaxy", note: "Default", dot: "linear-gradient(135deg,#3b0764,#7c3aed,#c084fc)" },
  { key: "green", name: "Green Aurora", note: "Fresh & Modern", dot: "linear-gradient(135deg,#022c22,#10b981,#67e8f9)" },
  { key: "blue", name: "Blue Ocean", note: "Calm & Professional", dot: "linear-gradient(135deg,#082f49,#0284c7,#60a5fa)" },
  { key: "navy", name: "Dark Navy", note: "Deep & Focused", dot: "linear-gradient(135deg,#020617,#0f172a,#1e3a8a)" },
  { key: "white", name: "White Mode", note: "Clean & Minimal", dot: "linear-gradient(135deg,#ffffff,#e5e7eb,#cbd5e1)" },
]

function themeVars(theme: string) {
  if (theme === "green") {
    return {
      accent: "16,185,129",
      accent2: "34,211,238",
      headerA: "6,78,59",
      headerB: "3,23,35",
      sideA: "3,45,38",
    }
  }
  if (theme === "blue") {
    return {
      accent: "56,189,248",
      accent2: "96,165,250",
      headerA: "12,74,110",
      headerB: "4,14,35",
      sideA: "7,34,64",
    }
  }
  if (theme === "navy") {
    return {
      accent: "148,163,184",
      accent2: "59,130,246",
      headerA: "15,23,42",
      headerB: "2,6,23",
      sideA: "2,6,23",
    }
  }
  if (theme === "white") {
    return {
      accent: "124,58,237",
      accent2: "14,165,233",
      headerA: "76,29,149",
      headerB: "15,23,42",
      sideA: "49,19,91",
    }
  }
  return {
    accent: "168,85,247",
    accent2: "103,232,249",
    headerA: "88,28,135",
    headerB: "10,5,28",
    sideA: "59,7,100",
  }
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    body[data-admin-theme="white"] main { color: #f8fafc !important; }

    main > div > section:first-of-type > header,
    main > div > section:last-of-type > header {
      position: relative !important;
      overflow: hidden !important;
      border-color: rgba(var(--admin-accent), .28) !important;
      background:
        radial-gradient(circle at 14% 18%, rgba(var(--admin-header-a), .38), transparent 34%),
        radial-gradient(circle at 76% 10%, rgba(var(--admin-accent-2), .17), transparent 30%),
        linear-gradient(180deg, rgba(var(--admin-header-a), .88), rgba(var(--admin-header-b), .97)) !important;
      box-shadow: inset 0 -1px 0 rgba(var(--admin-accent), .22), 0 0 55px rgba(var(--admin-accent), .16) !important;
    }

    main > div > section:first-of-type,
    main > div > section:first-of-type > div.flex-1,
    main > div > aside {
      background:
        radial-gradient(circle at 28% 24%, rgba(var(--admin-side-a), .46), transparent 34%),
        linear-gradient(180deg, rgba(var(--admin-side-a), .78), rgba(4,5,18,.98)) !important;
    }

    main > div > section:first-of-type > header::before,
    main > div > section:last-of-type > header::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: .46;
      background-image:
        radial-gradient(#f5d0fe 1px, transparent 1px),
        radial-gradient(rgba(var(--admin-accent-2), .76) 1px, transparent 1px);
      background-size: 72px 72px, 118px 118px;
      background-position: 8px 12px, 42px 38px;
      animation: adminChatHeaderStars 18s linear infinite;
    }

    main > div > section:first-of-type > header > *,
    main > div > section:last-of-type > header > * {
      position: relative;
      z-index: 1;
    }

    @keyframes adminChatHeaderStars {
      from { background-position: 8px 12px, 42px 38px; }
      to { background-position: 80px 84px, 160px 156px; }
    }

    main > div > section:last-of-type > header {
      justify-content: flex-end !important;
      gap: 10px !important;
      padding-left: 18px !important;
      padding-right: 18px !important;
    }

    .admin-chat-path-bar {
      margin-right: auto !important;
      min-width: 220px !important;
      flex: 0 1 420px !important;
      height: 38px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      border-radius: 16px !important;
      border: 1px solid rgba(var(--admin-accent), .28) !important;
      background: rgba(8,7,24,.58) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 22px rgba(var(--admin-accent), .10) !important;
      padding: 0 14px !important;
      color: #dbeafe !important;
      overflow: hidden !important;
    }

    .admin-chat-path-bar span { color: #c4b5fd; font-size: 15px; line-height: 1; }
    .admin-chat-path-bar input {
      width: 100% !important;
      min-width: 0 !important;
      border: 0 !important;
      outline: 0 !important;
      background: transparent !important;
      color: #dbeafe !important;
      font: 800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }

    main > div > section:last-of-type > header button,
    #admin-chat-final-theme-button {
      height: 38px !important;
      min-height: 38px !important;
      border-radius: 14px !important;
      border: 1px solid rgba(var(--admin-accent), .26) !important;
      background: rgba(15,23,42,.58) !important;
      color: #f8fafc !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 20px rgba(var(--admin-accent), .10) !important;
      font-size: 13px !important;
      font-weight: 850 !important;
      padding: 0 13px !important;
    }

    main > div > section:last-of-type > header button:hover,
    #admin-chat-final-theme-button:hover {
      border-color: rgba(var(--admin-accent-2), .46) !important;
      background: rgba(var(--admin-accent), .13) !important;
    }

    main > div > section:last-of-type > header button:has(svg) svg,
    #admin-chat-final-theme-button svg {
      width: 15px !important;
      height: 15px !important;
    }

    #${OLD_THEME_BUTTON_ID} { display: none !important; }

    #admin-chat-final-theme-menu {
      position: fixed;
      z-index: 2147483647;
      width: 300px;
      padding: 12px;
      border-radius: 18px;
      border: 1px solid rgba(var(--admin-accent), .32);
      background: rgba(5, 8, 22, .96);
      box-shadow: 0 28px 90px rgba(0,0,0,.72);
      backdrop-filter: blur(18px);
    }

    .admin-chat-theme-option {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 12px;
      border: 1px solid rgba(148,163,184,.16);
      background: rgba(15,23,42,.78);
      color: white;
      cursor: pointer;
      text-align: left;
      border-radius: 16px;
      padding: 11px 12px;
      margin-bottom: 8px;
      font: 800 13px system-ui;
    }
    .admin-chat-theme-option.active {
      border-color: rgba(var(--admin-accent), .80);
      background: rgba(var(--admin-accent), .18);
    }
  `
  document.head.appendChild(style)
}

function applyTheme(theme: string) {
  const vars = themeVars(theme)
  document.body.dataset.adminTheme = theme
  document.documentElement.style.setProperty("--admin-accent", vars.accent)
  document.documentElement.style.setProperty("--admin-accent-2", vars.accent2)
  document.documentElement.style.setProperty("--admin-header-a", vars.headerA)
  document.documentElement.style.setProperty("--admin-header-b", vars.headerB)
  document.documentElement.style.setProperty("--admin-side-a", vars.sideA)
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

function currentTheme() {
  try { return localStorage.getItem(THEME_KEY) || "purple" } catch { return "purple" }
}

function closeThemeMenu() {
  document.getElementById(THEME_MENU_ID)?.remove()
}

function openThemeMenu(anchor: HTMLButtonElement) {
  closeThemeMenu()
  const rect = anchor.getBoundingClientRect()
  const menu = document.createElement("div")
  menu.id = THEME_MENU_ID
  menu.style.top = `${rect.bottom + 10}px`
  menu.style.right = `${Math.max(18, window.innerWidth - rect.right)}px`
  menu.innerHTML = `<div style="padding:8px 10px 12px;color:#c4b5fd;font:800 13px system-ui;text-align:center">Choose Theme</div>`

  const selected = currentTheme()
  for (const theme of themes) {
    const option = document.createElement("button")
    option.type = "button"
    option.className = `admin-chat-theme-option${theme.key === selected ? " active" : ""}`
    option.innerHTML = `<span style="width:34px;height:34px;border-radius:999px;background:${theme.dot};box-shadow:0 0 18px rgba(var(--admin-accent),.32)"></span><span style="flex:1"><strong style="display:block;font-size:13px">${theme.name}</strong><small style="display:block;color:#94a3b8;margin-top:2px;font-size:11px">${theme.note}</small></span><span>${theme.key === selected ? "✓" : ""}</span>`
    option.onclick = () => {
      applyTheme(theme.key)
      closeThemeMenu()
    }
    menu.appendChild(option)
  }

  document.body.appendChild(menu)
}

function ensurePathInput() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const firstNonButton = Array.from(header.children).find((node) => node instanceof HTMLElement && node.tagName !== "BUTTON") as HTMLElement | undefined
  if (!firstNonButton) return

  if (!firstNonButton.classList.contains("admin-chat-path-bar")) {
    firstNonButton.className = "admin-chat-path-bar"
    firstNonButton.innerHTML = `<span aria-hidden="true">◎</span><input id="admin-chat-path-input" aria-label="Preview path" spellcheck="false" autocomplete="off" />`
  }

  const input = firstNonButton.querySelector<HTMLInputElement>("#admin-chat-path-input")
  if (!input) return
  if (document.activeElement !== input) {
    try { input.value = localStorage.getItem(PATH_KEY) || "/" } catch { input.value = "/" }
  }
  input.onkeydown = (event) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    const path = input.value.trim().startsWith("/") ? input.value.trim() : `/${input.value.trim()}`
    input.value = path || "/"
    try { localStorage.setItem(PATH_KEY, input.value) } catch {}
    input.blur()
  }
}

function ensureThemeButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return
  const publish = Array.from(header.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.includes("Publish"))
  if (!publish) return

  publish.style.background = "rgba(15,23,42,.58)"
  publish.style.color = "#f8fafc"

  let themeButton = document.getElementById("admin-chat-final-theme-button") as HTMLButtonElement | null
  if (!themeButton) {
    themeButton = document.createElement("button")
    themeButton.id = "admin-chat-final-theme-button"
    themeButton.type = "button"
    themeButton.innerHTML = `<span aria-hidden="true">◉</span><span>Theme</span><span aria-hidden="true">⌄</span>`
    themeButton.onclick = (event) => {
      event.preventDefault()
      event.stopPropagation()
      openThemeMenu(themeButton!)
    }
    publish.insertAdjacentElement("afterend", themeButton)
  } else if (themeButton.previousElementSibling !== publish) {
    publish.insertAdjacentElement("afterend", themeButton)
  }
}

export function AdminChatProjectUrlController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installStyle()
    applyTheme(currentTheme())
    ensurePathInput()
    ensureThemeButton()

    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest(`#${THEME_MENU_ID},#admin-chat-final-theme-button`)) closeThemeMenu()
    }

    const timer = window.setInterval(() => {
      ensurePathInput()
      ensureThemeButton()
    }, 500)

    document.addEventListener("click", onDocClick)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("click", onDocClick)
      closeThemeMenu()
      document.getElementById(STYLE_ID)?.remove()
    }
  }, [pathname])

  return null
}
