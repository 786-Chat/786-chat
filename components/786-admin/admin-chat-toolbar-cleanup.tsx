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

      main > div > section:last-of-type > header {
        min-width: 0 !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        padding-right: max(16px, env(safe-area-inset-right)) !important;
      }

      main > div > section:last-of-type > header::-webkit-scrollbar {
        display: none !important;
      }

      main > div > section:last-of-type > header > * {
        flex-shrink: 0 !important;
      }

      main > div > section:last-of-type > header button {
        white-space: nowrap !important;
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
