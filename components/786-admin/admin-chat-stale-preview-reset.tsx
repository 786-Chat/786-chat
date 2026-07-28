"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

const EMPTY_PREVIEW = `<!doctype html><html><body style="margin:0;min-height:100vh;background:#020617;color:#94a3b8;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center"><div style="text-align:center;padding:32px"><div style="font-size:44px;line-height:1">▣</div><h2 style="margin:18px 0 8px;color:#f8fafc;font-size:28px">No Preview Yet</h2><p style="margin:0;font-size:15px">Create or open a project to display its preview.</p></div></body></html>`

function previewFrames() {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[title*="preview" i]'))
}

function resetFrames() {
  for (const frame of previewFrames()) {
    frame.removeAttribute("src")
    frame.srcdoc = EMPTY_PREVIEW
    delete frame.dataset.previewRoute
    delete frame.dataset.previewProject
    delete frame.dataset.previewRoutePending
  }
}

export function AdminChatStalePreviewReset() {
  useEffect(() => {
    let stopped = false
    let validating = false
    let lastProjectId = ""

    async function validate() {
      if (stopped || validating) return
      const projectId = (() => {
        try {
          return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
        } catch {
          return ""
        }
      })()

      if (!projectId) {
        resetFrames()
        lastProjectId = ""
        return
      }

      if (projectId === lastProjectId) return
      validating = true
      lastProjectId = projectId

      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" })
        const payload = response.ok ? await response.json().catch(() => null) : null
        if (response.status === 404 || !response.ok || !payload?.project?.id) {
          try {
            localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
            localStorage.removeItem(`786chat_admin_preview_location_v2_${projectId}`)
          } catch {}
          resetFrames()
          const url = new URL(window.location.href)
          url.searchParams.delete("projectId")
          url.searchParams.delete("switch")
          window.history.replaceState({}, "", url.toString())
          window.dispatchEvent(new CustomEvent("786-admin-project-cleared"))
          lastProjectId = ""
        }
      } catch {
        lastProjectId = ""
      } finally {
        validating = false
      }
    }

    const observer = new MutationObserver(() => void validate())
    observer.observe(document.body, { childList: true, subtree: true })
    const interval = window.setInterval(() => void validate(), 500)
    void validate()

    return () => {
      stopped = true
      observer.disconnect()
      window.clearInterval(interval)
    }
  }, [])

  return null
}
