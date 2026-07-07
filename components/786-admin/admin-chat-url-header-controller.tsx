"use client"

import { useEffect } from "react"

const STYLE_ID = "admin-chat-url-header-style"

function slugFromTitle(value: string) {
  const clean = value
    .replace(/^editing project\s*/i, "")
    .replace(/^generating new preview.*$/i, "")
    .replace(/^no project yet$/i, "")
    .replace(/[“”"']/g, "")
    .trim()

  if (!clean) return ""

  return clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    main > div > section:first-of-type > header,
    main > div > section:last-of-type > header {
      border-color: rgba(168,85,247,.30) !important;
      background:
        radial-gradient(circle at 15% 18%, rgba(147,51,234,.34), transparent 32%),
        radial-gradient(circle at 78% 12%, rgba(14,165,233,.16), transparent 28%),
        linear-gradient(180deg, rgba(23,8,45,.98), rgba(10,5,28,.96)) !important;
      box-shadow: inset 0 -1px 0 rgba(168,85,247,.22), 0 0 45px rgba(88,28,135,.14) !important;
    }

    main > div > section:first-of-type > header::before,
    main > div > section:last-of-type > header::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: .42;
      background-image:
        radial-gradient(#f5d0fe 1px, transparent 1px),
        radial-gradient(rgba(103,232,249,.72) 1px, transparent 1px);
      background-size: 72px 72px, 118px 118px;
      background-position: 8px 12px, 42px 38px;
      animation: adminChatHeaderStars 18s linear infinite;
    }

    main > div > section:first-of-type > header,
    main > div > section:last-of-type > header {
      position: relative !important;
      overflow: hidden !important;
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

    .admin-chat-url-pill {
      min-width: 190px !important;
      flex: 1 1 auto !important;
      max-width: 520px !important;
      height: 42px !important;
      display: flex !important;
      align-items: center !important;
      gap: 0 !important;
      border-radius: 9999px !important;
      border: 1px solid rgba(168,85,247,.30) !important;
      background: rgba(8,7,24,.66) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 24px rgba(139,92,246,.10) !important;
      padding: 0 16px !important;
      font: 800 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      color: #cbd5e1 !important;
      letter-spacing: -.01em !important;
      white-space: nowrap !important;
      overflow: hidden !important;
    }

    .admin-chat-url-pill .host { color: #e9d5ff; }
    .admin-chat-url-pill .slash { color: #67e8f9; padding: 0 2px; }
    .admin-chat-url-pill .path { color: #94a3b8; overflow: hidden; text-overflow: ellipsis; }
  `
  document.head.appendChild(style)
}

function updateUrlPill() {
  installStyle()

  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return

  const firstNonButton = Array.from(header.children).find((node) => {
    return node instanceof HTMLElement && node.tagName !== "BUTTON"
  }) as HTMLElement | undefined

  if (!firstNonButton) return

  const currentText = firstNonButton.dataset.originalProjectTitle || firstNonButton.textContent?.trim() || ""
  const isAlreadyUrl = firstNonButton.classList.contains("admin-chat-url-pill")
  const titleText = isAlreadyUrl ? currentText : firstNonButton.textContent?.trim() || ""
  const slug = slugFromTitle(titleText)

  firstNonButton.dataset.originalProjectTitle = titleText
  firstNonButton.classList.add("admin-chat-url-pill")
  firstNonButton.innerHTML = `<span class="host">786.chat</span><span class="slash">/</span><span class="path">${slug}</span>`
}

export function AdminChatUrlHeaderController() {
  useEffect(() => {
    updateUrlPill()
    const timer = window.setInterval(updateUrlPill, 700)
    const observer = new MutationObserver(updateUrlPill)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      document.getElementById(STYLE_ID)?.remove()
    }
  }, [])

  return null
}
