"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function getProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) =>
      /preview/i.test(frame.title || ""),
    ) || null
  )
}

function getPublishButton(): HTMLButtonElement | null {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return null
  return (
    Array.from(header.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
      /^(publish|republish|publishing\.\.\.)$/i.test((button.textContent || "").trim()),
    ) || null
  )
}

function showPublishNotice(message: string, url?: string, isError = false) {
  document.getElementById("admin-chat-publish-notice")?.remove()

  const notice = document.createElement("div")
  notice.id = "admin-chat-publish-notice"
  notice.style.position = "fixed"
  notice.style.right = "20px"
  notice.style.bottom = "20px"
  notice.style.zIndex = "2147483647"
  notice.style.maxWidth = "420px"
  notice.style.padding = "16px"
  notice.style.borderRadius = "16px"
  notice.style.border = isError ? "1px solid rgba(248,113,113,.45)" : "1px solid rgba(34,211,238,.35)"
  notice.style.background = "rgba(2,6,23,.97)"
  notice.style.color = "white"
  notice.style.boxShadow = "0 20px 70px rgba(0,0,0,.55)"
  notice.style.font = "700 14px system-ui, sans-serif"

  const text = document.createElement("div")
  text.textContent = message
  notice.appendChild(text)

  if (url) {
    const link = document.createElement("a")
    link.href = url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.textContent = `Open live project: ${window.location.origin}${url}`
    link.style.display = "block"
    link.style.marginTop = "10px"
    link.style.color = "#67e8f9"
    link.style.textDecoration = "underline"
    notice.appendChild(link)
  }

  document.body.appendChild(notice)
  window.setTimeout(() => notice.remove(), url ? 12000 : 7000)
}

export function AdminChatPublishController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let busy = false

    const syncStatus = async () => {
      const projectId = getProjectId()
      const button = getPublishButton()
      if (!projectId || !button || busy) return

      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/publish`, {
          cache: "no-store",
        })
        if (!response.ok) return
        const data = (await response.json()) as { deployment?: { status?: string } | null }
        if (data.deployment?.status === "live") button.textContent = "Republish"
      } catch {}
    }

    const onClick = async (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("main > div > section:last-of-type > header button")
      if (!button || !/^(publish|republish)$/i.test((button.textContent || "").trim())) return

      event.preventDefault()
      event.stopPropagation()
      if (busy) return

      const projectId = getProjectId()
      if (!projectId) {
        showPublishNotice("Create or open a project before publishing.", undefined, true)
        return
      }

      const iframe = getPreviewIframe()
      const html = iframe?.getAttribute("srcdoc") || iframe?.srcdoc || ""
      if (!iframe || !html) {
        showPublishNotice("The active project preview is not ready to publish.", undefined, true)
        return
      }

      busy = true
      const originalLabel = button.textContent || "Publish"
      button.disabled = true
      button.textContent = "Publishing..."
      button.setAttribute("aria-busy", "true")

      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        })
        const data = (await response.json().catch(() => ({}))) as {
          error?: string
          url?: string
          deployment?: { version?: number }
        }

        if (!response.ok || !data.url) throw new Error(data.error || "Publish failed")

        button.textContent = "Republish"
        showPublishNotice(
          `Project published successfully${data.deployment?.version ? ` — version ${data.deployment.version}` : ""}.`,
          data.url,
        )
      } catch (error) {
        button.textContent = originalLabel
        showPublishNotice(error instanceof Error ? error.message : "Publish failed", undefined, true)
      } finally {
        busy = false
        button.disabled = false
        button.removeAttribute("aria-busy")
      }
    }

    document.addEventListener("click", onClick, true)
    window.setTimeout(syncStatus, 400)

    return () => {
      document.removeEventListener("click", onClick, true)
      document.getElementById("admin-chat-publish-notice")?.remove()
    }
  }, [pathname])

  return null
}
