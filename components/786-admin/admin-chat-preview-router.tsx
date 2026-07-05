"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function normalizePath(value: string): string {
  let path = value.trim()
  if (!path) return "/"
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || "/"
  } catch {}
  path = path.split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/{2,}/g, "/")
  if (path.length > 1) path = path.replace(/\/$/, "")
  return path || "/"
}

function ensureUrlInput() {
  const container = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-url")
  if (!container || container.querySelector("#admin-chat-preview-url")) return

  container.innerHTML = '<span>🔒</span><input id="admin-chat-preview-url" value="https://preview.786.chat" aria-label="Preview URL" spellcheck="false" />'
  const input = container.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (!input) return

  input.style.width = "100%"
  input.style.minWidth = "0"
  input.style.border = "0"
  input.style.outline = "0"
  input.style.background = "transparent"
  input.style.color = "inherit"
  input.style.font = "inherit"
}

function setUrl(path: string) {
  const input = document.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (!input) return
  const normalized = normalizePath(path)
  input.value = `https://preview.786.chat${normalized === "/" ? "" : normalized}`
}

export function AdminChatPreviewRouter() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    ensureUrlInput()
    const observer = new MutationObserver(ensureUrlInput)
    observer.observe(document.body, { childList: true, subtree: true })

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.id !== "admin-chat-preview-url" || event.key !== "Enter") return
      event.preventDefault()
      setUrl(target.value)
      target.blur()
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      observer.disconnect()
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [pathname])

  return null
}
