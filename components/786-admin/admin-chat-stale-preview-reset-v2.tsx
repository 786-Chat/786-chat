"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function previewFrames() {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[title*="preview" i]'))
}

function cleanBrowserState(projectId?: string) {
  try {
    localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
    if (projectId) localStorage.removeItem(`786chat_admin_preview_location_v2_${projectId}`)
  } catch {}

  const url = new URL(window.location.href)
  url.searchParams.delete("projectId")
  url.searchParams.delete("switch")
  window.history.replaceState({}, "", url.toString())
}

function clickNewChat(): boolean {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (item) => item.textContent?.trim().toLowerCase() === "new chat",
  )
  if (!button) return false
  button.click()
  return true
}

export function AdminChatStalePreviewResetV2() {
  useEffect(() => {
    let stopped = false
    let validating = false
    let lastCheckedId = ""

    const clearMissingProject = (projectId?: string) => {
      cleanBrowserState(projectId)
      window.dispatchEvent(new CustomEvent("786-admin-project-cleared"))

      // Use the page's own React action. This calls setProject(null), clears the
      // saved chat state and removes the iframe from the React tree.
      if (!clickNewChat()) {
        for (const frame of previewFrames()) frame.remove()
      }
      lastCheckedId = ""
    }

    const validate = async () => {
      if (stopped || validating) return

      let projectId = ""
      try { projectId = (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch {}

      // No active project must never have a project preview iframe. This catches
      // stale React/bfcache state even when localStorage was already cleared.
      if (!projectId) {
        if (previewFrames().length > 0) clearMissingProject()
        return
      }

      if (projectId === lastCheckedId) return
      validating = true
      lastCheckedId = projectId

      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" })
        const payload = response.ok ? await response.json().catch(() => null) : null
        if (!response.ok || !payload?.project?.id) clearMissingProject(projectId)
      } catch {
        lastCheckedId = ""
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
