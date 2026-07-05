"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const UI_MODE_KEY = "786chat_admin_ui_mode_v1"
const SOUND_KEY = "786chat_admin_sound_v1"

function getPreviewIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
  return iframes.find((iframe) => /preview/i.test(iframe.title || "")) || iframes[0] || null
}

function refreshPreview() {
  const iframe = getPreviewIframe()
  if (!iframe) return

  const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc
  if (srcDoc) {
    iframe.srcdoc = ""
    window.requestAnimationFrame(() => {
      iframe.srcdoc = srcDoc
    })
    return
  }

  try {
    iframe.contentWindow?.location.reload()
  } catch {
    const src = iframe.getAttribute("src")
    if (src) iframe.setAttribute("src", src)
  }
}

function openPreview() {
  const iframe = getPreviewIframe()
  if (!iframe) return

  const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc
  if (srcDoc) {
    const url = URL.createObjectURL(new Blob([srcDoc], { type: "text/html" }))
    window.open(url, "_blank", "noopener,noreferrer")
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }

  const src = iframe.getAttribute("src") || iframe.src
  if (src && src !== "about:blank") window.open(src, "_blank", "noopener,noreferrer")
}

function installModeStyles() {
  if (document.getElementById("admin-chat-ui-mode-style")) return

  const style = document.createElement("style")
  style.id = "admin-chat-ui-mode-style"
  style.textContent = `
    html[data-admin-ui-mode="light"] body,
    html[data-admin-ui-mode="light"] main,
    html[data-admin-ui-mode="light"] main > div > section:last-of-type,
    html[data-admin-ui-mode="light"] main > div > section:last-of-type > div {
      background: #eef4ff !important;
      color: #172033 !important;
    }
    html[data-admin-ui-mode="light"] main > div > section:last-of-type > header,
    html[data-admin-ui-mode="light"] #admin-chat-browser-bar {
      background: rgba(255,255,255,.96) !important;
      border-color: rgba(79,70,229,.18) !important;
      color: #172033 !important;
    }
    html[data-admin-ui-mode="light"] #admin-chat-browser-bar .browser-label,
    html[data-admin-ui-mode="light"] #admin-chat-browser-bar .browser-chip,
    html[data-admin-ui-mode="light"] #admin-chat-real-theme-menu button {
      color: #172033 !important;
    }
    html[data-admin-ui-mode="light"] #admin-chat-browser-bar .browser-url,
    html[data-admin-ui-mode="light"] #admin-chat-browser-bar .browser-chip,
    html[data-admin-ui-mode="light"] #admin-chat-real-theme-menu button {
      background: rgba(255,255,255,.92) !important;
      border-color: rgba(79,70,229,.22) !important;
    }
    #admin-chat-profile-menu {
      position: fixed;
      z-index: 2147483646;
      width: 210px;
      padding: 10px;
      border-radius: 18px;
      border: 1px solid rgba(168,85,247,.34);
      background: rgba(2,6,23,.98);
      box-shadow: 0 28px 90px rgba(0,0,0,.65), 0 0 48px rgba(88,28,135,.36);
      color: white;
      font: 700 13px system-ui, sans-serif;
    }
    #admin-chat-profile-menu button,
    #admin-chat-profile-menu a {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      margin: 0 0 6px;
      border: 0;
      border-radius: 12px;
      background: rgba(15,23,42,.9);
      color: white;
      text-decoration: none;
      cursor: pointer;
      font: inherit;
      text-align: left;
    }
    #admin-chat-profile-menu button:last-child,
    #admin-chat-profile-menu a:last-child { margin-bottom: 0; }
    #admin-chat-profile-menu button:hover,
    #admin-chat-profile-menu a:hover { background: rgba(88,28,135,.88); }
    .browser-avatar { cursor: pointer; user-select: none; }
  `
  document.head.appendChild(style)
}

function applySavedState() {
  installModeStyles()

  const mode = localStorage.getItem(UI_MODE_KEY) === "light" ? "light" : "dark"
  document.documentElement.setAttribute("data-admin-ui-mode", mode)

  const soundEnabled = localStorage.getItem(SOUND_KEY) !== "off"
  const soundButton = document.querySelector<HTMLElement>('#admin-chat-browser-bar [title="Sound"]')
  if (soundButton) {
    soundButton.textContent = soundEnabled ? "🔊" : "🔇"
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false")
    soundButton.setAttribute("aria-label", soundEnabled ? "Mute interface sounds" : "Enable interface sounds")
  }

  const modeButton = document.querySelector<HTMLElement>('#admin-chat-browser-bar [title="Light/Dark"]')
  if (modeButton) {
    modeButton.textContent = mode === "light" ? "☾" : "☀︎"
    modeButton.setAttribute("aria-label", mode === "light" ? "Switch to dark mode" : "Switch to light mode")
  }

  const refreshButton = document.querySelector<HTMLElement>('#admin-chat-browser-bar [title="Refresh preview"]')
  refreshButton?.setAttribute("aria-label", "Refresh preview")

  const openButton = document.querySelector<HTMLElement>('#admin-chat-browser-bar [title="Open preview"]')
  openButton?.setAttribute("aria-label", "Open preview in new tab")

  const avatar = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-avatar")
  avatar?.setAttribute("role", "button")
  avatar?.setAttribute("tabindex", "0")
  avatar?.setAttribute("aria-label", "Open admin menu")
}

function playClickSound() {
  if (localStorage.getItem(SOUND_KEY) === "off") return

  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 560
    gain.gain.setValueAtTime(0.035, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.07)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.07)
    oscillator.addEventListener("ended", () => void context.close(), { once: true })
  } catch {
    // Browsers can block audio before a user gesture. The toolbar still remains functional.
  }
}

function closeProfileMenu() {
  document.getElementById("admin-chat-profile-menu")?.remove()
}

function openProfileMenu(anchor: HTMLElement) {
  const existing = document.getElementById("admin-chat-profile-menu")
  if (existing) {
    existing.remove()
    return
  }

  const rect = anchor.getBoundingClientRect()
  const menu = document.createElement("div")
  menu.id = "admin-chat-profile-menu"
  menu.style.top = `${Math.min(window.innerHeight - 150, rect.bottom + 8)}px`
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`
  menu.innerHTML = `
    <a href="/786-admin/projects">▦ My Projects</a>
    <button type="button" data-admin-new-chat>＋ New Chat</button>
  `
  menu.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (!target.closest("[data-admin-new-chat]")) return

    const newChatButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.trim().toLowerCase().includes("new chat"))
    newChatButton?.click()
    closeProfileMenu()
  })
  document.body.appendChild(menu)
}

export function AdminChatBrowserControls() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    applySavedState()

    const observer = new MutationObserver(applySavedState)
    observer.observe(document.body, { childList: true, subtree: true })

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const refresh = target.closest<HTMLElement>('#admin-chat-browser-bar [title="Refresh preview"]')
      if (refresh) {
        event.preventDefault()
        refreshPreview()
        playClickSound()
        return
      }

      const open = target.closest<HTMLElement>('#admin-chat-browser-bar [title="Open preview"]')
      if (open) {
        event.preventDefault()
        openPreview()
        playClickSound()
        return
      }

      const modeButton = target.closest<HTMLElement>('#admin-chat-browser-bar [title="Light/Dark"]')
      if (modeButton) {
        event.preventDefault()
        const nextMode = document.documentElement.getAttribute("data-admin-ui-mode") === "light" ? "dark" : "light"
        localStorage.setItem(UI_MODE_KEY, nextMode)
        document.documentElement.setAttribute("data-admin-ui-mode", nextMode)
        applySavedState()
        playClickSound()
        return
      }

      const soundButton = target.closest<HTMLElement>('#admin-chat-browser-bar [title="Sound"]')
      if (soundButton) {
        event.preventDefault()
        const enabled = localStorage.getItem(SOUND_KEY) !== "off"
        localStorage.setItem(SOUND_KEY, enabled ? "off" : "on")
        applySavedState()
        if (enabled === false) playClickSound()
        return
      }

      const avatar = target.closest<HTMLElement>("#admin-chat-browser-bar .browser-avatar")
      if (avatar) {
        event.preventDefault()
        openProfileMenu(avatar)
        playClickSound()
        return
      }

      if (target.closest("#admin-chat-real-theme-menu")) {
        playClickSound()
        window.setTimeout(applySavedState, 0)
        return
      }

      if (!target.closest("#admin-chat-profile-menu")) closeProfileMenu()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProfileMenu()
      if (event.key !== "Enter" && event.key !== " ") return
      const target = event.target
      if (!(target instanceof HTMLElement) || !target.matches("#admin-chat-browser-bar .browser-avatar")) return
      event.preventDefault()
      openProfileMenu(target)
    }

    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKeyDown)

    return () => {
      observer.disconnect()
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKeyDown)
      closeProfileMenu()
      document.documentElement.removeAttribute("data-admin-ui-mode")
    }
  }, [pathname])

  return null
}
