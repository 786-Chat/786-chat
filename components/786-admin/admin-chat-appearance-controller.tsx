"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const APPEARANCE_KEY = "786chat_admin_appearance_v1"
type AppearanceMode = "dark" | "light"

function readMode(): AppearanceMode {
  try {
    return localStorage.getItem(APPEARANCE_KEY) === "light" ? "light" : "dark"
  } catch {
    return "dark"
  }
}

function installStyles() {
  if (document.getElementById("admin-chat-appearance-style")) return

  const style = document.createElement("style")
  style.id = "admin-chat-appearance-style"
  style.textContent = `
    html[data-admin-appearance="light"] body,
    html[data-admin-appearance="light"] main,
    html[data-admin-appearance="light"] main > div > section:last-of-type,
    html[data-admin-appearance="light"] main > div > section:last-of-type > div {
      background: #edf3ff !important;
      color: #172033 !important;
    }

    html[data-admin-appearance="light"] main > div > section:last-of-type > header,
    html[data-admin-appearance="light"] #admin-chat-browser-bar {
      background: rgba(255,255,255,.96) !important;
      border-color: rgba(79,70,229,.18) !important;
      color: #172033 !important;
    }

    html[data-admin-appearance="light"] #admin-chat-browser-bar .browser-label,
    html[data-admin-appearance="light"] #admin-chat-browser-bar .browser-chip,
    html[data-admin-appearance="light"] #admin-chat-browser-bar .browser-url,
    html[data-admin-appearance="light"] #admin-chat-browser-bar input,
    html[data-admin-appearance="light"] #admin-chat-project-pages-select {
      color: #172033 !important;
    }

    html[data-admin-appearance="light"] #admin-chat-browser-bar .browser-chip,
    html[data-admin-appearance="light"] #admin-chat-browser-bar .browser-url {
      background: rgba(255,255,255,.94) !important;
      border-color: rgba(79,70,229,.22) !important;
      box-shadow: inset 0 0 0 1px rgba(79,70,229,.04) !important;
    }

    html[data-admin-appearance="light"] main > div > section:last-of-type > div:not(#admin-chat-browser-bar) {
      background: #f5f8ff !important;
    }

    html[data-admin-appearance="light"] iframe {
      background: white !important;
    }
  `
  document.head.appendChild(style)
}

function findAppearanceButton(): HTMLButtonElement | null {
  const bar = document.getElementById("admin-chat-browser-bar")
  if (!bar) return null

  const stable = bar.querySelector<HTMLButtonElement>("[data-admin-appearance-toggle]")
  if (stable) return stable

  const exact = bar.querySelector<HTMLButtonElement>(
    'button[title="Light/Dark"], button[aria-label="Switch to light mode"], button[aria-label="Switch to dark mode"]',
  )
  if (exact) {
    exact.setAttribute("data-admin-appearance-toggle", "true")
    return exact
  }

  const actions = bar.querySelector<HTMLElement>(".browser-actions")
  if (!actions) return null

  const buttons = Array.from(actions.querySelectorAll<HTMLButtonElement>(":scope > button"))
  const soundIndex = buttons.findIndex((button) => {
    const title = (button.getAttribute("title") || "").toLowerCase()
    const label = (button.getAttribute("aria-label") || "").toLowerCase()
    return title === "sound" || label.includes("sound") || label.includes("mute")
  })

  const candidate = soundIndex > 0 ? buttons[soundIndex - 1] : buttons[2]
  if (!candidate) return null

  candidate.setAttribute("data-admin-appearance-toggle", "true")
  candidate.setAttribute("title", "Light/Dark")
  return candidate
}

function updateButton(mode: AppearanceMode) {
  const button = findAppearanceButton()
  if (!button) return

  button.textContent = mode === "light" ? "☾" : "☀︎"
  button.setAttribute("aria-label", mode === "light" ? "Switch to dark mode" : "Switch to light mode")
  button.setAttribute("aria-pressed", mode === "light" ? "true" : "false")
  button.style.pointerEvents = "auto"
  button.style.cursor = "pointer"
}

function applyMode(mode: AppearanceMode) {
  try { localStorage.setItem(APPEARANCE_KEY, mode) } catch {}
  document.documentElement.setAttribute("data-admin-appearance", mode)
  updateButton(mode)
}

export function AdminChatAppearanceController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installStyles()
    applyMode(readMode())

    const sync = () => updateButton(readMode())
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(sync, 700)

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("#admin-chat-browser-bar [data-admin-appearance-toggle]")
      if (!button) return

      event.preventDefault()
      event.stopPropagation()
      applyMode(readMode() === "light" ? "dark" : "light")
    }

    document.addEventListener("click", onClick, true)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      document.removeEventListener("click", onClick, true)
      document.documentElement.removeAttribute("data-admin-appearance")
    }
  }, [pathname])

  return null
}
