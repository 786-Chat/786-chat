"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function getActiveProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function getSavedLocation(projectId: string): { path: string; category: string } {
  if (!projectId) return { path: "/", category: "" }

  try {
    const raw = localStorage.getItem(`786chat_admin_preview_location_v2_${projectId}`)
    if (!raw) return { path: "/", category: "" }

    const parsed = JSON.parse(raw) as { path?: string; category?: string }
    return {
      path: typeof parsed.path === "string" && parsed.path.trim() ? parsed.path.trim() : "/",
      category: typeof parsed.category === "string" ? parsed.category.trim() : "",
    }
  } catch {
    return { path: "/", category: "" }
  }
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) =>
      /preview/i.test(frame.title || ""),
    ) || null
  )
}

export function AdminChatPreviewRefreshController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let refreshing = false

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>(
        '#admin-chat-browser-bar button[title="Refresh preview"]',
      )
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
      button.textContent = "⟳"
      button.style.transform = "rotate(180deg)"
      button.style.transition = "transform 300ms ease"

      const restoreRoute = () => {
        iframe.contentWindow?.postMessage(
          { type: "786-preview-navigate", path: location.path },
          "*",
        )

        window.setTimeout(() => {
          iframe.contentWindow?.postMessage(
            { type: "786-preview-apply-category", category: location.category },
            "*",
          )
        }, 100)

        window.setTimeout(() => {
          refreshing = false
          button.disabled = false
          button.removeAttribute("aria-busy")
          button.textContent = originalLabel
          button.style.transform = ""
        }, 250)
      }

      iframe.addEventListener("load", restoreRoute, { once: true })
      iframe.srcdoc = srcDoc
    }

    document.addEventListener("click", onClick, true)

    return () => {
      document.removeEventListener("click", onClick, true)
    }
  }, [pathname])

  return null
}
