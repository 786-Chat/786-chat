"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { SharedWorkspaceShell } from "@/components/workspace/shared-workspace-shell"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { getWorkspaceCapabilities } from "@/lib/workspace/roles"

const capabilities = getWorkspaceCapabilities("customer")

type CustomerProject = {
  id: string
  name: string
  template?: string
  files?: Record<string, string>
}

export default function CustomerWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const routeProjectId = searchParams.get("projectId") || ""
  const [activeProjectId, setActiveProjectId] = useState(routeProjectId)
  const [project, setProject] = useState<CustomerProject | null>(null)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [device, setDevice] = useState("full")
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setActiveProjectId(routeProjectId)
  }, [routeProjectId])

  const loadProject = useCallback(async (projectId: string) => {
    if (!projectId) {
      setProject(null)
      return
    }

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.project) return

      const nextProject: CustomerProject = {
        id: String(data.project.id),
        name: String(data.project.name || "AI Project"),
        template: data.project.template ? String(data.project.template) : "custom",
        files:
          data.project.files && typeof data.project.files === "object" && !Array.isArray(data.project.files)
            ? (data.project.files as Record<string, string>)
            : {},
      }

      setProject(nextProject)
      setRefreshKey((value) => value + 1)
      setViewMode("preview")
    } catch {
      // Keep the workspace usable if a project refresh briefly fails.
    }
  }, [])

  useEffect(() => {
    loadProject(activeProjectId)
  }, [activeProjectId, loadProject])

  useEffect(() => {
    const handleChatSelected = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const nextProjectId = detail?.projectId ? String(detail.projectId) : ""
      if (!nextProjectId) return

      setActiveProjectId(nextProjectId)
      loadProject(nextProjectId)
    }

    const handleChatUpdated = async () => {
      if (activeProjectId) {
        await loadProject(activeProjectId)
        return
      }

      try {
        const response = await fetch("/api/projects/latest", {
          credentials: "include",
          cache: "no-store",
        })
        const data = await response.json().catch(() => ({}))
        const nextProjectId = data?.project?.id ? String(data.project.id) : ""
        if (!response.ok || !nextProjectId) return

        const nextUrl = `/dashboard/chat?projectId=${encodeURIComponent(nextProjectId)}`
        window.history.replaceState({}, "", nextUrl)
        setActiveProjectId(nextProjectId)
        await loadProject(nextProjectId)
      } catch {
        // The generated project can still be opened from My Projects.
      }
    }

    window.addEventListener("chat-selected", handleChatSelected)
    window.addEventListener("chat-updated", handleChatUpdated)
    return () => {
      window.removeEventListener("chat-selected", handleChatSelected)
      window.removeEventListener("chat-updated", handleChatUpdated)
    }
  }, [activeProjectId, loadProject])

  function startNewChat() {
    const nextUrl = `/dashboard/chat?newProject=1&fresh=${Date.now()}`
    window.history.replaceState({}, "", nextUrl)
    window.dispatchEvent(new PopStateEvent("popstate"))
    window.dispatchEvent(new CustomEvent("new-chat", { detail: { fresh: true } }))
    window.dispatchEvent(new CustomEvent("preview-cleared", { detail: { fresh: true } }))
    setActiveProjectId("")
    setProject(null)
    setPreviewHtml("")
    setPreviewUrl("")
    setViewMode("preview")
  }

  async function signOut() {
    await logout()
    router.replace("/")
    router.refresh()
  }

  const chat = (
    <WorkspaceChatPanel
      projectId={activeProjectId || undefined}
      onPreviewUpdate={setPreviewHtml}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  )

  const preview = (
    <WorkspacePreviewPanel
      key={`${refreshKey}-${activeProjectId}`}
      project={project}
      device={device}
      setDevice={setDevice}
      previewUrl={previewUrl}
      setPreviewUrl={setPreviewUrl}
      onClose={() => undefined}
      expanded={expanded}
      setExpanded={setExpanded}
      previewHtml={previewHtml}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  )

  return (
    <SharedWorkspaceShell
      capabilities={capabilities}
      chat={chat}
      preview={preview}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onNewChat={startNewChat}
      onRefresh={() => {
        setRefreshKey((value) => value + 1)
        if (activeProjectId) loadProject(activeProjectId)
      }}
      onSignOut={signOut}
      projectLabel={project?.name || (activeProjectId ? `Project ${activeProjectId.slice(0, 8)}` : "/")}
    />
  )
}
