"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { SharedWorkspaceShell } from "@/components/workspace/shared-workspace-shell"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { getWorkspaceCapabilities } from "@/lib/workspace/roles"

const capabilities = getWorkspaceCapabilities("customer")

export default function CustomerWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [device, setDevice] = useState("full")
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [refreshKey, setRefreshKey] = useState(0)

  const projectId = searchParams.get("projectId") || undefined

  function startNewChat() {
    const nextUrl = `/dashboard/chat?newProject=1&fresh=${Date.now()}`
    window.history.replaceState({}, "", nextUrl)
    window.dispatchEvent(new PopStateEvent("popstate"))
    window.dispatchEvent(new CustomEvent("new-chat", { detail: { fresh: true } }))
    window.dispatchEvent(new CustomEvent("preview-cleared", { detail: { fresh: true } }))
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
      projectId={projectId}
      onPreviewUpdate={setPreviewHtml}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  )

  const preview = (
    <WorkspacePreviewPanel
      key={refreshKey}
      project={null}
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
      onRefresh={() => setRefreshKey((value) => value + 1)}
      onSignOut={signOut}
      projectLabel={projectId ? `Project ${projectId.slice(0, 8)}` : "/"}
    />
  )
}
