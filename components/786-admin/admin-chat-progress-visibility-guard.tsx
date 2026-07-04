"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ORIGINAL_DISPLAY_ATTR = "data-generation-original-display"

function restoreHiddenWorkspaceContainers() {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(`main [${ORIGINAL_DISPLAY_ATTR}]`),
  )

  for (const element of elements) {
    const original = element.dataset.generationOriginalDisplay
    if (!original) continue

    element.style.display = original === "__empty__" ? "" : original
    delete element.dataset.generationOriginalDisplay
  }
}

export function AdminChatProgressVisibilityGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let scheduled = false
    const restore = () => {
      scheduled = false
      restoreHiddenWorkspaceContainers()
    }
    const scheduleRestore = () => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(restore)
    }

    restoreHiddenWorkspaceContainers()

    const observer = new MutationObserver(scheduleRestore)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", ORIGINAL_DISPLAY_ATTR],
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
