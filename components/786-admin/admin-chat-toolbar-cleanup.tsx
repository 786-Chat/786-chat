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

      main,
      main > div,
      main > div > section:last-of-type {
        max-width: 100vw !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }

      main > div > section:last-of-type > header {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        display: flex !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 7px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
      }

      main > div > section:last-of-type > header::before {
        flex: 0 0 auto !important;
        font-size: 16px !important;
        margin-right: 2px !important;
        white-space: nowrap !important;
      }

      main > div > section:last-of-type > header > * {
        min-width: 0 !important;
        flex-shrink: 1 !important;
      }

      main > div > section:last-of-type > header > div:first-child {
        flex: 1 1 150px !important;
        min-width: 110px !important;
        max-width: 170px !important;
        overflow: hidden !important;
      }

      main > div > section:last-of-type > header > div:first-child * {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      main > div > section:last-of-type > header button {
        flex: 0 0 auto !important;
        min-width: 0 !important;
        height: 40px !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
        white-space: nowrap !important;
        font-size: 13px !important;
      }

      @media (max-width: 1500px) {
        main > div > section:last-of-type > header {
          gap: 5px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        main > div > section:last-of-type > header > div:first-child {
          max-width: 135px !important;
        }

        main > div > section:last-of-type > header button {
          height: 38px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          font-size: 12px !important;
        }
      }

      @media (max-width: 1220px) {
        main > div > section:last-of-type > header > div:first-child {
          display: none !important;
        }

        main > div > section:last-of-type > header button {
          padding-left: 7px !important;
          padding-right: 7px !important;
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
