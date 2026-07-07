"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const STYLE_ID = "admin-chat-toolbar-cleanup-style"

function getPreviewIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
  return iframes.find((iframe) => /preview/i.test(iframe.title || "")) || iframes[0] || null
}

function installPreviewEscapeGuard() {
  let guardedIframe: HTMLIFrameElement | null = null
  let originalSrcDoc = ""
  let resetting = false

  const remember = (iframe: HTMLIFrameElement) => {
    const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
    if (srcDoc && srcDoc !== originalSrcDoc) originalSrcDoc = srcDoc
  }

  const resetIfEscaped = () => {
    const iframe = getPreviewIframe()
    if (!iframe) return
    remember(iframe)
    if (!originalSrcDoc || resetting) return

    let href = ""
    try { href = iframe.contentWindow?.location?.href || "" } catch {}

    const src = iframe.getAttribute("src") || ""
    const escapedToRealSite = /^https?:\/\/(?:www\.)?786\.chat\//i.test(href) || /^https?:\/\/(?:www\.)?786\.chat\//i.test(src)
    const escapedToAdmin = /\/786-admin(?:\/|$)/i.test(href) || /\/786-admin(?:\/|$)/i.test(src)

    if (!escapedToRealSite && !escapedToAdmin) return

    resetting = true
    iframe.removeAttribute("src")
    iframe.srcdoc = originalSrcDoc
    window.setTimeout(() => { resetting = false }, 150)
  }

  const bind = () => {
    const iframe = getPreviewIframe()
    if (!iframe || iframe === guardedIframe) return
    if (guardedIframe) guardedIframe.removeEventListener("load", resetIfEscaped)
    guardedIframe = iframe
    remember(iframe)
    iframe.addEventListener("load", resetIfEscaped)
  }

  bind()
  const observer = new MutationObserver(() => {
    bind()
    window.setTimeout(resetIfEscaped, 0)
  })
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcdoc"] })
  const interval = window.setInterval(resetIfEscaped, 800)

  return () => {
    observer.disconnect()
    window.clearInterval(interval)
    if (guardedIframe) guardedIframe.removeEventListener("load", resetIfEscaped)
  }
}

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
    const cleanupPreviewGuard = installPreviewEscapeGuard()

    return () => {
      cleanupPreviewGuard()
      style.remove()
    }
  }, [pathname])

  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
