"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatGenerationIntegrityGuard } from "@/components/786-admin/admin-chat-generation-integrity-guard"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type SavedPreviewLocation = {
  path: string
  category: string
  view: string
}

const safeSrcDoc = new WeakMap<HTMLIFrameElement, string>()
const completedInitialLoad = new WeakSet<HTMLIFrameElement>()
const resettingIframe = new WeakSet<HTMLIFrameElement>()

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

function isPreviewIframe(frame: HTMLIFrameElement): boolean {
  return /preview/i.test(frame.title || frame.getAttribute("title") || "")
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find(isPreviewIframe) || null
}

function rememberPreview(frame: HTMLIFrameElement) {
  if (!isPreviewIframe(frame)) return
  const srcDoc = frame.getAttribute("srcdoc") || frame.srcdoc || ""
  if (!srcDoc) return
  const previous = safeSrcDoc.get(frame)
  if (previous !== srcDoc) {
    safeSrcDoc.set(frame, srcDoc)
    completedInitialLoad.delete(frame)
  }
}

function restoreProjectPreview(frame: HTMLIFrameElement) {
  const srcDoc = safeSrcDoc.get(frame)
  if (!srcDoc || resettingIframe.has(frame)) return
  resettingIframe.add(frame)
  frame.removeAttribute("src")
  frame.removeAttribute("srcdoc")
  frame.src = "about:blank"
  window.setTimeout(() => {
    frame.removeAttribute("src")
    frame.srcdoc = srcDoc
    window.setTimeout(() => resettingIframe.delete(frame), 250)
  }, 20)
}

function handlePreviewLoad(frame: HTMLIFrameElement) {
  if (!isPreviewIframe(frame)) return
  rememberPreview(frame)
  if (resettingIframe.has(frame)) return
  if (!completedInitialLoad.has(frame)) {
    completedInitialLoad.add(frame)
    return
  }
  // A srcDoc preview should not perform a second document load. A later load means
  // generated code escaped to a real route; restore the original isolated project.
  restoreProjectPreview(frame)
}

function isRefreshButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const exact = target.closest<HTMLButtonElement>('#admin-chat-browser-bar button[title="Refresh preview"]')
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

    const inspectFrames = () => {
      for (const frame of Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))) rememberPreview(frame)
    }

    const onFrameLoad = (event: Event) => {
      if (event.target instanceof HTMLIFrameElement) handlePreviewLoad(event.target)
    }

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
      safeSrcDoc.set(iframe, srcDoc)
      completedInitialLoad.delete(iframe)

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
        iframe.contentWindow?.postMessage({ type: "786-preview-navigate", path: location.path }, "*")

        window.setTimeout(() => {
          iframe.contentWindow?.postMessage({ type: "786-preview-apply-view", view: location.view }, "*")
          iframe.contentWindow?.postMessage({ type: "786-preview-apply-category", category: location.category }, "*")
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
      resettingIframe.add(iframe)
      iframe.removeAttribute("srcdoc")
      iframe.src = "about:blank"

      window.setTimeout(() => {
        iframe.removeAttribute("src")
        iframe.srcdoc = srcDoc
        resettingIframe.delete(iframe)
      }, 60)

      window.setTimeout(() => {
        if (!refreshing) return
        finish()
      }, 1800)
    }

    inspectFrames()
    document.addEventListener("click", onClick, true)
    document.addEventListener("load", onFrameLoad, true)
    const observer = new MutationObserver(inspectFrames)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc", "src"] })

    return () => {
      observer.disconnect()
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("load", onFrameLoad, true)
    }
  }, [pathname])

  return <AdminChatGenerationIntegrityGuard />
}
