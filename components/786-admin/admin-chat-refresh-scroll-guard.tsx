"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STYLE_ID = "admin-chat-refresh-scroll-guard-style"
const PROGRESS_HOST_ID = "admin-chat-generation-progress-host"

function findChatScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    "main > div > section:first-of-type div.flex-1.overflow-y-auto",
  )
}

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 140
}

function installPreviewStyles() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    html[data-admin-chat-preview-guard="true"] main > div > section:last-of-type iframe {
      background: #070b12 !important;
      opacity: 0;
      transition: opacity 140ms ease;
    }

    html[data-admin-chat-preview-guard="true"] main > div > section:last-of-type iframe[data-preview-loaded="true"] {
      opacity: 1;
    }

    html[data-admin-chat-preview-guard="true"] main > div > section:last-of-type iframe,
    html[data-admin-chat-preview-guard="true"] main > div > section:last-of-type iframe + *,
    html[data-admin-chat-preview-guard="true"] main > div > section:last-of-type div:has(> iframe) {
      background-color: #070b12 !important;
    }
  `
  document.head.appendChild(style)
}

function preparePreviewIframe(iframe: HTMLIFrameElement) {
  if (!/preview/i.test(iframe.title || "")) return
  if (iframe.dataset.previewGuardReady === "true") return

  iframe.dataset.previewGuardReady = "true"
  iframe.dataset.previewLoaded = "false"

  const reveal = () => {
    window.requestAnimationFrame(() => {
      iframe.dataset.previewLoaded = "true"
    })
  }

  iframe.addEventListener("load", reveal)

  try {
    if (iframe.contentDocument?.readyState === "complete") reveal()
  } catch {}
}

export function AdminChatRefreshScrollGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installPreviewStyles()
    document.documentElement.setAttribute("data-admin-chat-preview-guard", "true")

    let chatScroller: HTMLElement | null = null
    let userNearBottom = true

    const bindScroller = () => {
      const next = findChatScroller()
      if (next === chatScroller) return

      chatScroller?.removeEventListener("scroll", handleScroll)
      chatScroller = next
      if (chatScroller) {
        userNearBottom = isNearBottom(chatScroller)
        chatScroller.addEventListener("scroll", handleScroll, { passive: true })
      }
    }

    const handleScroll = () => {
      if (!chatScroller) return
      userNearBottom = isNearBottom(chatScroller)
    }

    const prepareIframes = () => {
      const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
      for (const iframe of iframes) preparePreviewIframe(iframe)
    }

    bindScroller()
    prepareIframes()

    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function scrollIntoViewGuard(
      arg?: boolean | ScrollIntoViewOptions,
    ) {
      const element = this as Element
      const isProgressHost = element.id === PROGRESS_HOST_ID

      if (isProgressHost) {
        bindScroller()
        if (chatScroller && !userNearBottom) return
      }

      return originalScrollIntoView.call(this, arg)
    }

    let scheduled = false
    const observer = new MutationObserver(() => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(() => {
        scheduled = false
        bindScroller()
        prepareIframes()
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      chatScroller?.removeEventListener("scroll", handleScroll)
      Element.prototype.scrollIntoView = originalScrollIntoView
      document.documentElement.removeAttribute("data-admin-chat-preview-guard")
    }
  }, [pathname])

  return null
}
