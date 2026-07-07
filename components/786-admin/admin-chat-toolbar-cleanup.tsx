"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const STYLE_ID = "admin-chat-toolbar-cleanup-style"

export function AdminChatToolbarCleanup() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      #admin-chat-browser-bar button[title="Open preview"],
      #admin-chat-browser-bar button[title="Light/Dark"],
      #admin-chat-project-pages {
        display: none !important;
      }

      html[data-real-admin-theme] main > div > section:last-of-type > header,
      main > div > section:last-of-type > header {
        min-width: 0 !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        padding-left: 14px !important;
        padding-right: max(32px, env(safe-area-inset-right)) !important;
      }

      html[data-real-admin-theme] main > div > section:last-of-type > header::-webkit-scrollbar,
      main > div > section:last-of-type > header::-webkit-scrollbar {
        display: none !important;
      }

      html[data-real-admin-theme] main > div > section:last-of-type > header > *,
      main > div > section:last-of-type > header > * {
        flex-shrink: 0 !important;
      }

      html[data-real-admin-theme] main > div > section:last-of-type > header > div:first-child,
      main > div > section:last-of-type > header > div:first-child {
        flex: 1 1 220px !important;
        min-width: 150px !important;
        max-width: min(360px, 30vw) !important;
      }

      html[data-real-admin-theme] main > div > section:last-of-type > header button,
      main > div > section:last-of-type > header button {
        white-space: nowrap !important;
      }

      @media (max-width: 1280px) {
        html[data-real-admin-theme] main > div > section:last-of-type > header,
        main > div > section:last-of-type > header {
          gap: 8px !important;
          padding-left: 12px !important;
          padding-right: 38px !important;
        }

        html[data-real-admin-theme] main > div > section:last-of-type > header::before,
        main > div > section:last-of-type > header::before {
          font-size: 16px !important;
          margin-right: 2px !important;
        }

        html[data-real-admin-theme] main > div > section:last-of-type > header > div:first-child,
        main > div > section:last-of-type > header > div:first-child {
          max-width: 230px !important;
        }

        html[data-real-admin-theme] main > div > section:last-of-type > header button,
        main > div > section:last-of-type > header button {
          padding-left: 11px !important;
          padding-right: 11px !important;
        }
      }

      @media (max-width: 1100px) {
        html[data-real-admin-theme] main > div > section:last-of-type > header > div:first-child,
        main > div > section:last-of-type > header > div:first-child {
          max-width: 180px !important;
        }

        html[data-real-admin-theme] main > div > section:last-of-type > header button,
        main > div > section:last-of-type > header button {
          padding-left: 9px !important;
          padding-right: 9px !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => style.remove()
  }, [pathname])

  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
