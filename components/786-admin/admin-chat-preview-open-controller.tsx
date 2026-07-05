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

    const parsed = JSON.parse(raw) as Partial<SavedPreviewLocation>
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

function isOpenPreviewButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLButtonElement>('#admin-chat-browser-bar button[title="Open preview"]')
}

function injectOpenState(srcDoc: string, location: SavedPreviewLocation): string {
  const payload = JSON.stringify(location).replace(/</g, "\\u003c")
  const bootstrap = `<script data-786-preview-open-state="true">
(function(){
  var locationState = ${payload};
  var attempts = 0;
  function apply(){
    attempts += 1;
    try {
      if (typeof window.__786PreviewNavigate === 'function') {
        window.__786PreviewNavigate(locationState.path || '/');
        setTimeout(function(){
          window.postMessage({ type: '786-preview-apply-view', view: locationState.view || '' }, '*');
          window.postMessage({ type: '786-preview-apply-category', category: locationState.category || '' }, '*');
        }, 120);
        return;
      }
    } catch (_) {}
    if (attempts < 80) setTimeout(apply, 50);
  }
  setTimeout(apply, 0);
})();
<\/script>`

  if (srcDoc.includes("</body>")) return srcDoc.replace("</body>", `${bootstrap}\n</body>`)
  return `${srcDoc}\n${bootstrap}`
}

export function AdminChatPreviewOpenController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const onClick = (event: MouseEvent) => {
      const button = isOpenPreviewButton(event.target)
      if (!button) return

      const iframe = getPreviewIframe()
      if (!iframe) return

      const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
      if (!srcDoc) return

      event.preventDefault()
      event.stopPropagation()

      const projectId = getActiveProjectId()
      const location = getSavedLocation(projectId)
      const documentWithState = injectOpenState(srcDoc, location)
      const url = URL.createObjectURL(new Blob([documentWithState], { type: "text/html" }))
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  return null
}
