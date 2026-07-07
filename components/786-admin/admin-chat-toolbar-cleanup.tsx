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

      main > div > section:last-of-type {
        background: #05060d !important;
      }

      main > div > section:last-of-type > header {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        height: 60px !important;
        min-height: 60px !important;
        display: flex !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 10px !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 9px 14px !important;
        border-bottom: 1px solid rgba(255,255,255,.08) !important;
        background: linear-gradient(180deg, rgba(12,13,22,.98), rgba(7,8,15,.96)) !important;
        box-shadow: 0 10px 34px rgba(0,0,0,.34) !important;
        backdrop-filter: blur(18px) !important;
      }

      main > div > section:last-of-type > header::before {
        content: "✦ 786.Chat" !important;
        flex: 0 0 auto !important;
        color: #f8fafc !important;
        font-size: 18px !important;
        font-weight: 900 !important;
        letter-spacing: -.04em !important;
        margin-right: 4px !important;
        white-space: nowrap !important;
      }

      main > div > section:last-of-type > header > div:first-child {
        flex: 1 1 240px !important;
        min-width: 150px !important;
        max-width: 330px !important;
        height: 36px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(148,163,184,.17) !important;
        background: rgba(15,17,28,.92) !important;
        color: #94a3b8 !important;
        overflow: hidden !important;
      }

      main > div > section:last-of-type > header > div:first-child * {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      main > div > section:last-of-type > header > div:nth-child(2) {
        flex: 0 0 auto !important;
        height: 42px !important;
        padding: 4px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(148,163,184,.14) !important;
        background: rgba(17,19,33,.88) !important;
      }

      main > div > section:last-of-type > header button {
        flex: 0 0 auto !important;
        min-width: 0 !important;
        height: 36px !important;
        padding: 0 13px !important;
        border-radius: 999px !important;
        white-space: nowrap !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        border-color: rgba(148,163,184,.16) !important;
        background: rgba(16,18,30,.92) !important;
        color: #e5e7eb !important;
      }

      main > div > section:last-of-type > header button:last-of-type {
        background: linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4) !important;
        border-color: rgba(125,211,252,.45) !important;
        color: white !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
        box-shadow: 0 12px 30px rgba(37,99,235,.34) !important;
      }

      #admin-chat-browser-bar {
        min-height: 56px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 9px 14px !important;
        border-bottom: 1px solid rgba(255,255,255,.07) !important;
        background: rgba(7,9,18,.94) !important;
        backdrop-filter: blur(18px) !important;
      }

      #admin-chat-browser-bar .browser-label {
        flex: 0 0 auto !important;
        font-size: 16px !important;
        font-weight: 900 !important;
        color: #e5e7eb !important;
      }

      #admin-chat-browser-bar .browser-url {
        flex: 1 1 auto !important;
        min-width: 120px !important;
        height: 38px !important;
        border-radius: 16px !important;
        border: 1px solid rgba(148,163,184,.14) !important;
        background: rgba(15,17,28,.92) !important;
        color: #cbd5e1 !important;
      }

      #admin-chat-browser-bar .browser-actions {
        flex: 0 0 auto !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }

      #admin-chat-browser-bar .browser-chip,
      #admin-chat-real-theme-menu button {
        height: 38px !important;
        border-radius: 15px !important;
        border: 1px solid rgba(148,163,184,.16) !important;
        background: rgba(16,18,30,.92) !important;
        color: #f8fafc !important;
        padding: 0 12px !important;
        font-weight: 850 !important;
      }

      #admin-chat-browser-bar .browser-avatar {
        width: 38px !important;
        height: 38px !important;
        border-radius: 999px !important;
        background: linear-gradient(135deg,#22d3ee,#6366f1) !important;
      }

      @media (max-width: 1500px) {
        main > div > section:last-of-type > header {
          gap: 7px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        main > div > section:last-of-type > header > div:first-child {
          max-width: 230px !important;
        }
        main > div > section:last-of-type > header button {
          padding-left: 10px !important;
          padding-right: 10px !important;
          font-size: 12px !important;
        }
        #admin-chat-browser-bar {
          gap: 8px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        #admin-chat-browser-bar .browser-label {
          font-size: 14px !important;
        }
      }

      @media (max-width: 1220px) {
        main > div > section:last-of-type > header > div:first-child {
          display: none !important;
        }
        main > div > section:last-of-type > header button {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
        #admin-chat-browser-bar .browser-label {
          display: none !important;
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
