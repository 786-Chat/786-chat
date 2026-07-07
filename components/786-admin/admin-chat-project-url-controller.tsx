"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STYLE_ID = "admin-chat-redesigned-url-header-style"

function slugFromTitle(value: string): string {
  const text = value
    .replace(/^generating new preview.*$/i, "")
    .replace(/^no project yet$/i, "")
    .replace(/^editing project/i, "")
    .replace(/[“”"']/g, "")
    .trim()

  if (!text) return ""

  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54)
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    main > div > section:first-of-type > header,
    main > div > section:last-of-type > header {
      position: relative !important;
      overflow: hidden !important;
      border-color: rgba(168,85,247,.28) !important;
      background:
        radial-gradient(circle at 14% 18%, rgba(147,51,234,.36), transparent 34%),
        radial-gradient(circle at 76% 10%, rgba(14,165,233,.17), transparent 30%),
        linear-gradient(180deg, rgba(18,8,42,.98), rgba(8,5,25,.97)) !important;
      box-shadow: inset 0 -1px 0 rgba(168,85,247,.22), 0 0 55px rgba(88,28,135,.16) !important;
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
        radial-gradient(rgba(103,232,249,.76) 1px, transparent 1px);
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

    .admin-chat-url-bar {
      min-width: 220px !important;
      flex: 1 1 auto !important;
      max-width: 560px !important;
      height: 42px !important;
      display: flex !important;
      align-items: center !important;
      border-radius: 9999px !important;
      border: 1px solid rgba(168,85,247,.30) !important;
      background: rgba(8,7,24,.66) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 24px rgba(139,92,246,.10) !important;
      padding: 0 16px !important;
      color: #cbd5e1 !important;
      overflow: hidden !important;
    }

    .admin-chat-url-bar input {
      width: 100% !important;
      min-width: 0 !important;
      border: 0 !important;
      outline: 0 !important;
      background: transparent !important;
      color: #dbeafe !important;
      font: 800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      letter-spacing: -.01em !important;
    }

    .admin-chat-url-bar input::selection {
      background: rgba(103,232,249,.25) !important;
    }

    main > div > section:last-of-type > header button {
      border-radius: 16px !important;
      height: 42px !important;
      min-height: 42px !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 24px rgba(139,92,246,.10) !important;
    }
  `
  document.head.appendChild(style)
}

function readNativeProjectTitle(container: HTMLElement): string {
  const saved = container.dataset.nativeProjectTitle || ""
  const current = (container.textContent || "").trim()

  if (!current || /^786\.chat\//i.test(current)) return saved

  container.dataset.nativeProjectTitle = current
  return current
}

function renderUrlBar() {
  installStyle()

  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const container = Array.from(header.children).find((node) => {
    return node instanceof HTMLElement && node.tagName !== "BUTTON"
  }) as HTMLElement | undefined

  if (!container) return

  const title = readNativeProjectTitle(container)
  const slug = slugFromTitle(title)
  const url = `786.chat/${slug}`

  if (!container.classList.contains("admin-chat-url-bar")) {
    container.className = "admin-chat-url-bar"
    container.innerHTML = '<input id="admin-chat-project-url" aria-label="Project preview URL" spellcheck="false" autocomplete="off" />'
  }

  const input = container.querySelector<HTMLInputElement>("#admin-chat-project-url")
  if (input && document.activeElement !== input) input.value = url
}

export function AdminChatProjectUrlController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    renderUrlBar()
    const timer = window.setInterval(renderUrlBar, 800)

    return () => {
      window.clearInterval(timer)
      document.getElementById(STYLE_ID)?.remove()
    }
  }, [pathname])

  return null
}
