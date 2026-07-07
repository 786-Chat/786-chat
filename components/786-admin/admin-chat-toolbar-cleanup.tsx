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
      #admin-chat-browser-bar,
      #admin-chat-project-pages {
        display: none !important;
      }

      main > div > section:last-of-type > header > div[class*="rounded-full"][class*="p-1"] {
        display: none !important;
      }

      main > div > section:last-of-type > header button[title="Desktop preview"],
      main > div > section:last-of-type > header button[title="Tablet preview"],
      main > div > section:last-of-type > header button[title="iPad preview"],
      main > div > section:last-of-type > header button[title="Mobile preview"] {
        display: none !important;
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
