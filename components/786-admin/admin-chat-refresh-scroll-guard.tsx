"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const PROGRESS_HOST_ID = "admin-chat-generation-progress-host"
const STYLE_ID = "admin-chat-preview-background-style"

function findChatScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    "main > div > section:first-of-type div.flex-1.overflow-y-auto",
  )
}

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 140
}

function installPreviewBackgroundStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    body:has(main > div > section:last-of-type iframe) main > div > section:last-of-type iframe,
    body:has(main > div > section:last-of-type iframe) main > div > section:last-of-type div:has(> iframe) {
      background: #070b12 !important;
    }
  `
  document.head.appendChild(style)
}

export function AdminChatRefreshScrollGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    installPreviewBackgroundStyle()

    let chatScroller: HTMLElement | null = null
    let userNearBottom = true

    const handleScroll = () => {
      if (!chatScroller) return
      userNearBottom = isNearBottom(chatScroller)
    }

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

    bindScroller()

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
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      chatScroller?.removeEventListener("scroll", handleScroll)
      Element.prototype.scrollIntoView = originalScrollIntoView
    }
  }, [pathname])

  return null
}
