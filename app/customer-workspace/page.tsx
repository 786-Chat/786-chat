"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { SharedWorkspaceShell } from "@/components/workspace/shared-workspace-shell"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { getWorkspaceCapabilities } from "@/lib/workspace/roles"

const capabilities = getWorkspaceCapabilities("customer")
const FINAL_DEPLOYMENT_STATES = new Set(["ready", "error", "failed", "canceled", "cancelled"])

type CustomerProject = {
  id: string
  name: string
  template?: string
  files?: Record<string, string>
  buildReady?: boolean
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
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
  const [publishBusy, setPublishBusy] = useState(false)
  const preparingRef = useRef(new Set<string>())

  useEffect(() => {
    setActiveProjectId(routeProjectId)
  }, [routeProjectId])

  const prepareProject = useCallback(async (projectId: string) => {
    if (!projectId || preparingRef.current.has(projectId)) return null
    preparingRef.current.add(projectId)
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepareBuildFiles" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.files) return null
      return data.files as Record<string, string>
    } catch {
      return null
    } finally {
      preparingRef.current.delete(projectId)
    }
  }, [])

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

      let files =
        data.project.files && typeof data.project.files === "object" && !Array.isArray(data.project.files)
          ? (data.project.files as Record<string, string>)
          : {}
      let buildReady = Boolean(data.project.buildReady)

      if (!buildReady && (files["app/page.tsx"] || files["app/page.jsx"])) {
        const preparedFiles = await prepareProject(projectId)
        if (preparedFiles) {
          files = preparedFiles
          buildReady = true
        }
      }

      setProject({
        id: String(data.project.id),
        name: String(data.project.name || "AI Project"),
        template: data.project.template ? String(data.project.template) : "custom",
        files,
        buildReady,
      })
      setRefreshKey((value) => value + 1)
      setViewMode("preview")
    } catch {
      // Keep the workspace usable if a project refresh briefly fails.
    }
  }, [prepareProject])

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

  async function pollDeployment(projectId: string, historyId: string) {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/deploy/${encodeURIComponent(historyId)}`,
        { credentials: "include", cache: "no-store" }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Could not read deployment status")

      const status = String(data?.deployment?.status || "queued").toLowerCase()
      const url = String(data?.deployment?.deployment_url || "")
      if (status === "ready") return { status, url }
      if (FINAL_DEPLOYMENT_STATES.has(status)) {
        throw new Error(data?.deployment?.error_message || "Deployment failed")
      }

      await wait(2000)
    }

    throw new Error("Deployment is still building. Check again shortly.")
  }

  async function publishProject() {
    if (!activeProjectId || publishBusy) return
    setPublishBusy(true)

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(activeProjectId)}/deploy`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) throw new Error(data?.message || data?.error || "Project deployment failed")

      const historyId = data?.deployment?.historyId ? String(data.deployment.historyId) : ""
      const initialUrl = data?.deployment?.url ? String(data.deployment.url) : ""
      const initialStatus = String(data?.deployment?.readyState || "queued").toLowerCase()

      let finalUrl = initialUrl
      if (historyId && initialStatus !== "ready") {
        const result = await pollDeployment(activeProjectId, historyId)
        finalUrl = result.url || finalUrl
      }

      if (finalUrl) {
        setPreviewUrl(finalUrl)
        setViewMode("preview")
        window.open(finalUrl, "_blank", "noopener,noreferrer")
      }
      await loadProject(activeProjectId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Project deployment could not be completed")
    } finally {
      setPublishBusy(false)
    }
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
      onPublish={activeProjectId ? publishProject : undefined}
      publishBusy={publishBusy}
      onSignOut={signOut}
      projectLabel={project?.name || (activeProjectId ? `Project ${activeProjectId.slice(0, 8)}` : "/")}
    />
  )
}
