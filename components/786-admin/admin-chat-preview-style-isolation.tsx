"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"

function isPreviewFrame(frame: HTMLIFrameElement): boolean {
  return /preview/i.test(frame.title || frame.getAttribute("title") || "")
}

function cleanAdminPreviewOverrides(source: string): string {
  let next = source

  // The admin workspace theme must never flatten or recolour the generated
  // customer project. These rules were injected by the old preview renderer.
  next = next.replace(
    /#root>\*\{[^}]*border-radius\s*:\s*0\s*!important[^}]*box-shadow\s*:\s*none\s*!important[^}]*\}/gi,
    "",
  )
  next = next.replace(
    /#root\s*\{\s*filter\s*:\s*hue-rotate\([^)]*\)[^}]*\}/gi,
    "",
  )

  return next
}

function patchFrame(frame: HTMLIFrameElement) {
  if (!isPreviewFrame(frame)) return
  const current = frame.getAttribute("srcdoc") || frame.srcdoc || ""
  if (!current) return

  const cleaned = cleanAdminPreviewOverrides(current)
  if (cleaned === current) return
  frame.srcdoc = cleaned
}

export function AdminChatPreviewStyleIsolation() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== ADMIN_CHAT_PATH) return

    const inspect = () => {
      document.querySelectorAll<HTMLIFrameElement>("iframe").forEach(patchFrame)
    }

    inspect()
    const observer = new MutationObserver(inspect)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["srcdoc"],
    })
    const interval = window.setInterval(inspect, 600)

    return () => {
      window.clearInterval(interval)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
