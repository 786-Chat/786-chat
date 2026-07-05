"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const PREVIEW_ORIGIN = "https://preview.786.chat"

function getProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function storageKey(projectId: string): string {
  return `786chat_admin_preview_location_v2_${projectId}`
}

function normalizePath(value: string): string {
  let path = value.trim() || "/"
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || "/"
  } catch {}
  path = path.split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/{2,}/g, "/")
  if (path.length > 1) path = path.replace(/\/$/, "")
  return path || "/"
}

function readLocation(projectId: string): { path: string; category: string } {
  if (!projectId) return { path: "/", category: "" }
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(projectId)) || "{}") as { path?: string; category?: string }
    return { path: normalizePath(value.path || "/"), category: String(value.category || "") }
  } catch {
    return { path: "/", category: "" }
  }
}

function saveLocation(projectId: string, path: string, category: string): void {
  if (!projectId) return
  try { localStorage.setItem(storageKey(projectId), JSON.stringify({ path, category })) } catch {}
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) => /preview/i.test(frame.title || "")) || null
}

function visibleUrl(projectId: string, path: string, category: string): string {
  const route = path === "/" ? "" : path
  const query = category ? `?category=${encodeURIComponent(category)}` : ""
  return projectId ? `${PREVIEW_ORIGIN}/${projectId}${route}${query}` : `${PREVIEW_ORIGIN}${route}${query}`
}

function parseInput(value: string, projectId: string): { path: string; category: string } {
  let raw = value.trim()
  let category = ""
  try {
    const url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw || "/", PREVIEW_ORIGIN)
    raw = url.pathname
    category = (url.searchParams.get("category") || "").trim().toLowerCase()
  } catch {}

  let path = normalizePath(raw)
  if (projectId) {
    const full = `/${projectId}`
    const short = `/${projectId.slice(0, 8)}`
    if (path === full || path === short) path = "/"
    else if (path.startsWith(`${full}/`)) path = path.slice(full.length) || "/"
    else if (path.startsWith(`${short}/`)) path = path.slice(short.length) || "/"
  }
  return { path: normalizePath(path), category }
}

export function AdminChatProjectUrlController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let projectId = getProjectId()
    let location = readLocation(projectId)

    const ensureInput = () => {
      const container = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-url")
      if (!container) return
      let input = container.querySelector<HTMLInputElement>("#admin-chat-project-url")
      if (!input) {
        container.innerHTML = '<span aria-hidden="true">🔒</span><input id="admin-chat-project-url" aria-label="Project preview URL" autocomplete="off" spellcheck="false" />'
        input = container.querySelector<HTMLInputElement>("#admin-chat-project-url")
      }
      if (!input) return
      input.style.width = "100%"
      input.style.minWidth = "0"
      input.style.border = "0"
      input.style.outline = "0"
      input.style.background = "transparent"
      input.style.color = "inherit"
      input.style.font = "inherit"
      input.style.cursor = "text"
      input.style.pointerEvents = "auto"
      if (document.activeElement !== input) input.value = visibleUrl(projectId, location.path, location.category)
    }

    const navigate = (next: { path: string; category: string }) => {
      location = next
      saveLocation(projectId, location.path, location.category)
      ensureInput()
      const frame = getPreviewIframe()
      frame?.contentWindow?.postMessage({ type: "786-preview-navigate", path: location.path }, "*")
      window.setTimeout(() => {
        frame?.contentWindow?.postMessage({ type: "786-preview-apply-category", category: location.category }, "*")
      }, 100)
    }

    const syncProject = () => {
      const nextId = getProjectId()
      if (nextId === projectId) return
      projectId = nextId
      location = readLocation(projectId)
      ensureInput()
      window.setTimeout(() => navigate(location), 120)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.id !== "admin-chat-project-url" || event.key !== "Enter") return
      event.preventDefault()
      navigate(parseInput(target.value, projectId))
      target.blur()
    }

    const onMessage = (event: MessageEvent) => {
      const frame = getPreviewIframe()
      if (!frame || event.source !== frame.contentWindow) return
      const data = event.data as { type?: string; path?: string; category?: string } | null
      if (!data) return
      if (data.type === "786-preview-route-changed" && typeof data.path === "string") {
        location.path = normalizePath(data.path)
      } else if (data.type === "786-preview-category-changed") {
        location.category = String(data.category || "").trim().toLowerCase()
      } else {
        return
      }
      saveLocation(projectId, location.path, location.category)
      ensureInput()
    }

    const apply = () => {
      syncProject()
      ensureInput()
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(apply, 800)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("message", onMessage)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("message", onMessage)
    }
  }, [pathname])

  return null
}
