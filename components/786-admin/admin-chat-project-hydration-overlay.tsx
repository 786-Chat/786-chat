"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, Monitor } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type OverlayRect = {
  top: number
  left: number
  width: number
  height: number
}

function findPreviewPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>("main > div > section:last-of-type")
}

function findPreviewIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
  return iframes.find((iframe) => /preview/i.test(iframe.title || "")) || null
}

function hasHydratedProject(): boolean {
  const panel = findPreviewPanel()
  if (!panel) return false

  const headerText = panel.querySelector("header")?.textContent || ""
  if (/no project yet/i.test(headerText) || /restoring active project/i.test(headerText)) return false

  const iframe = findPreviewIframe()
  if (!iframe) return false
  if (iframe.dataset.previewLoaded === "true") return true

  try {
    return iframe.contentDocument?.readyState === "complete"
  } catch {
    return false
  }
}

export function AdminChatProjectHydrationOverlay() {
  const pathname = usePathname()
  const { isLoading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [rect, setRect] = useState<OverlayRect | null>(null)

  useEffect(() => {
    if (pathname !== "/786-admin/chat" || isLoading) {
      setVisible(false)
      setRect(null)
      return
    }

    let activeProjectId: string | null = null
    try {
      activeProjectId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY)
    } catch {}

    if (!activeProjectId) {
      setVisible(false)
      setRect(null)
      return
    }

    let disposed = false
    let scheduled = false
    let currentIframe: HTMLIFrameElement | null = null

    const updateRect = () => {
      const panel = findPreviewPanel()
      if (!panel) return
      const next = panel.getBoundingClientRect()
      setRect({ top: next.top, left: next.left, width: next.width, height: next.height })
    }

    const finish = () => {
      if (disposed) return
      setVisible(false)
    }

    const bindIframe = () => {
      const iframe = findPreviewIframe()
      if (iframe === currentIframe) return

      currentIframe?.removeEventListener("load", finish)
      currentIframe = iframe
      currentIframe?.addEventListener("load", finish, { once: true })
    }

    const inspect = () => {
      scheduled = false
      if (disposed) return
      updateRect()
      bindIframe()

      if (hasHydratedProject()) finish()
      else setVisible(true)
    }

    const scheduleInspect = () => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(inspect)
    }

    setVisible(true)
    inspect()

    const observer = new MutationObserver(scheduleInspect)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-preview-loaded", "srcdoc", "style"],
    })

    window.addEventListener("resize", scheduleInspect)

    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener("resize", scheduleInspect)
      currentIframe?.removeEventListener("load", finish)
    }
  }, [pathname, isLoading])

  if (!visible || !rect) return null

  return createPortal(
    <div
      aria-live="polite"
      className="fixed z-[2147482000] flex items-center justify-center bg-[#070b12] text-white"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      <div className="rounded-3xl border border-cyan-300/20 bg-[#0b1220]/95 px-8 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10">
          <Monitor className="h-7 w-7 text-cyan-200" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
          <p className="font-black text-slate-100">Loading saved project…</p>
        </div>
        <p className="mt-2 text-xs text-slate-400">Restoring files, chat history and preview from Neon.</p>
      </div>
    </div>,
    document.body,
  )
}
