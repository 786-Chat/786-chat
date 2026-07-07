"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STYLE_ID = "admin-chat-clean-header-no-url-style"

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

    main > div > section:last-of-type > header {
      justify-content: flex-end !important;
      gap: 12px !important;
      padding-left: 18px !important;
      padding-right: 22px !important;
    }

    main > div > section:last-of-type > header > div:first-child {
      display: none !important;
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

export function AdminChatProjectUrlController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installStyle()

    return () => {
      document.getElementById(STYLE_ID)?.remove()
    }
  }, [pathname])

  return null
}
