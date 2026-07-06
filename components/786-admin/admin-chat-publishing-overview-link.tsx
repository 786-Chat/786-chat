"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter } from "next/navigation"
import { Globe2 } from "lucide-react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function getProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

export function AdminChatPublishingOverviewLink() {
  const pathname = usePathname()
  const router = useRouter()
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [projectId, setProjectId] = useState("")
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let cancelled = false
    let attempts = 0

    const locate = () => {
      if (cancelled) return
      const publishButton = Array.from(
        document.querySelectorAll<HTMLButtonElement>("main > div > section:last-of-type > header button"),
      ).find((button) => /^(publish|republish|publishing\.\.\.)$/i.test((button.textContent || "").trim()))

      if (publishButton?.parentElement) {
        setHost(publishButton.parentElement)
        return
      }

      attempts += 1
      if (attempts < 30) window.setTimeout(locate, 150)
    }

    locate()
    return () => { cancelled = true }
  }, [pathname])

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    const id = getProjectId()
    setProjectId(id)
    if (!id) return

    let cancelled = false
    fetch(`/api/786-admin/projects/${encodeURIComponent(id)}/publish`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data: { deployment?: { status?: string } | null } | null) => {
        if (!cancelled) setIsLive(data?.deployment?.status === "live")
      })
      .catch(() => undefined)

    return () => { cancelled = true }
  }, [pathname, host])

  if (!host || !projectId || !isLive) return null

  return createPortal(
    <button
      type="button"
      onClick={() => router.push(`/786-admin/publishing/${encodeURIComponent(projectId)}`)}
      className="shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100"
      title="Open publishing overview"
    >
      <Globe2 className="mr-2 inline h-4 w-4" />Publishing
    </button>,
    host,
  )
}
