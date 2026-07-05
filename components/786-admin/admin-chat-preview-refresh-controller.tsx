"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type SavedPreviewLocation = {
  path: string
  category: string
  view: string
}

function getActiveProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function getSavedLocation(projectId: string): SavedPreviewLocation {
  if (!projectId) return { path: "/", category: "", view: "" }

  try {
    const raw = localStorage.getItem(`786chat_admin_preview_location_v2_${projectId}`)
    if (!raw) return { path: "/", category: "", view: "" }

    const parsed = JSON.parse(raw) as { path?: string; category?: string; view?: string }
    const category = typeof parsed.category === "string" ? parsed.category.trim() : ""
    return {
      path: typeof parsed.path === "string" && parsed.path.trim() ? parsed.path.trim() : "/",
      category,
      view: typeof parsed.view === "string" ? parsed.view.trim() : category,
    }
  } catch {
    return { path: "/", category: "", view: "" }
  }
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) =>
      /preview/i.test(frame.title || ""),
    ) || null
  )
}

function isRefreshButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const exact = target.closest<HTMLButtonElement>(
    '#admin-chat-browser-bar button[title="Refresh preview"]',
  )
  if (exact) return exact

  const candidate = target.closest<HTMLButtonElement>("#admin-chat-browser-bar button")
  if (!candidate) return null

  const title = (candidate.getAttribute("title") || "").trim().toLowerCase()
  const label = (candidate.textContent || "").trim()
  return title === "refresh preview" || label === "↻" || label === "⟳" ? candidate : null
}

export function AdminChatPreviewRefreshController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let refreshing = false

    const onClick = (event: MouseEvent) => {
      const button = isRefreshButton(event.target)
      if (!button || refreshing) return

      const iframe = getPreviewIframe()
      if (!iframe) return

      const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
      if (!srcDoc) return

      event.preventDefault()
      event.stopPropagation()
      refreshing = true

      const projectId = getActiveProjectId()
      const location = getSavedLocation(projectId)
      const originalLabel = button.textContent || "↻"

      button.disabled = true
      button.setAttribute("aria-busy", "true")
      button.setAttribute("data-refreshing", "true")
      button.textContent = "⟳"
      button.style.transition = "transform 500ms linear, opacity 180ms ease"
      button.style.transform = "rotate(360deg)"
      button.style.opacity = "0.75"

      const finish = () => {
        iframe.contentWindow?.postMessage(
          { type: "786-preview-navigate", path: location.path },
          "*",
        )

        window.setTimeout(() => {
          iframe.contentWindow?.postMessage(
            { type: "786-preview-apply-view", view: location.view },
            "*",
          )
          iframe.contentWindow?.postMessage(
            { type: "786-preview-apply-category", category: location.category },
            "*",
          )
        }, 120)

        window.setTimeout(() => {
          refreshing = false
          button.disabled = false
          button.removeAttribute("aria-busy")
          button.removeAttribute("data-refreshing")
          button.textContent = originalLabel
          button.style.transform = ""
          button.style.opacity = ""
        }, 420)
      }

      iframe.addEventListener("load", finish, { once: true })

      iframe.removeAttribute("srcdoc")
      iframe.src = "about:blank"

      window.setTimeout(() => {
        iframe.removeAttribute("src")
        iframe.srcdoc = srcDoc
      }, 60)

      window.setTimeout(() => {
        if (!refreshing) return
        finish()
      }, 1800)
    }

    document.addEventListener("click", onClick, true)

    return () => {
      document.removeEventListener("click", onClick, true)
    }
  }, [pathname])

  return null
}
