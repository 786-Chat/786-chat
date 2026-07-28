"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatGenerationIntegrityGuard } from "@/components/786-admin/admin-chat-generation-integrity-guard"

function isRefreshButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null
  const button = target.closest<HTMLButtonElement>('button[title="Refresh preview"]')
  if (button) return button
  const candidate = target.closest<HTMLButtonElement>("button")
  const label = (candidate?.textContent || "").trim()
  return candidate && (label === "↻" || label === "⟳") ? candidate : null
}

function previewFrame() {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) =>
    /preview/i.test(frame.title || frame.getAttribute("title") || ""),
  ) || null
}

export function AdminChatPreviewRefreshController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const onClick = (event: MouseEvent) => {
      const button = isRefreshButton(event.target)
      if (!button || button.dataset.routeRefresh === "true") return
      const iframe = previewFrame()
      if (!iframe) return

      event.preventDefault()
      event.stopPropagation()

      const src = iframe.getAttribute("src") || ""
      if (src && src !== "about:blank") {
        const url = new URL(src, window.location.origin)
        url.searchParams.set("v", String(Date.now()))
        iframe.src = `${url.pathname}${url.search}`
        return
      }

      const srcdoc = iframe.getAttribute("srcdoc") || ""
      if (srcdoc) iframe.srcdoc = srcdoc
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  return <AdminChatGenerationIntegrityGuard />
}
