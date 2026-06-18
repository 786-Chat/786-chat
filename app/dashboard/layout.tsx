"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { WorkspaceTopBar } from "@/components/workspace/top-bar"
import { WorkspaceSidebar } from "@/components/workspace/sidebar"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspaceDashboardPanel } from "@/components/workspace/dashboard-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

const OWNER_EMAILS = ["mujeeb@job4u.com"]

type ProjectFileMap = Record<string, string>

type WorkspaceProject = {
  id: string
  name: string
  template?: string
  files: ProjectFileMap
}

function looksLikeReactOrTsxCode(value: string): boolean {
  const text = value.trim()
  if (!text) return false

  const hasHtmlDocument =
    /<!doctype html/i.test(text) ||
    /<html[\s>]/i.test(text) ||
    /<body[\s>]/i.test(text)

  if (hasHtmlDocument) return false

  const reactSignals = [
    /^["']use client["']/,
    /\bimport\s+.+\s+from\s+["'][^"']+["']/,
    /\bexport\s+default\s+function\b/,
    /\bexport\s+function\b/,
    /\bfunction\s+[A-Z][A-Za-z0-9_]*\s*\(/,
    /\bconst\s+[A-Z][A-Za-z0-9_]*\s*=\s*\(/,
    /\binterface\s+[A-Z][A-Za-z0-9_]*/,
    /\btype\s+[A-Z][A-Za-z0-9_]*\s*=/,
    /\buseState\s*\(/,
    /\buseEffect\s*\(/,
    /className=/,
    /onClick=/,
  ]

  return reactSignals.some((pattern) => pattern.test(text))
}

function isFakeComponentCodePreview(html: string): boolean {
  const text = html.trim().toLowerCase()

  return (
    text.includes("<h3>component code</h3>") ||
    (text.includes("component code") &&
      text.includes("<pre") &&
      text.includes("import ") &&
      text.includes("export default"))
  )
}

function hasVisibleHtmlContent(html: string): boolean {
  if (!html || !html.trim()) return false
  if (looksLikeReactOrTsxCode(html)) return false
  if (isFakeComponentCodePreview(html)) return false

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = bodyMatch ? bodyMatch[1] : html

  const withoutInvisible = content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()

  const hasRealElements =
    /<(main|section|header|footer|nav|div|article|aside|h1|h2|h3|p|button|form|img|a|ul|ol|li|table|canvas|svg)\b/i.test(content)

  return withoutInvisible.length > 3 || hasRealElements
}

function normalizeOwnerPreviewPath(path: string): string {
  const cleanPath = path.trim()

  if (!cleanPath || cleanPath === "about:blank") return ""

  const withoutDomain = cleanPath
    .replace(/^https:\/\/www\.mujeebproai\.com/i, "")
    .replace(/^https:\/\/mujeebproai\.com/i, "")

  const normalized = withoutDomain.startsWith("/") ? withoutDomain : `/${withoutDomain}`

  const lower = normalized.toLowerCase()

  if (lower === "/home" || lower === "/homepage" || lower === "/main") return "/"
  if (lower === "/theme" || lower === "/themse" || lower === "/themes-card") return "/themes"

  return normalized
}

function isBlockedOwnerPreviewPath(path: string): boolean {
  const lower = path.trim().toLowerCase()

  return (
    lower.includes("/admin") ||
    lower.includes("/admin-login") ||
    lower.includes("/dashboard") ||
    lower.includes("/api/admin") ||
    lower.includes("/settings") ||
    lower.includes("/users") ||
    lower.includes("/subscriptions") ||
    lower.includes("/balances") ||
    lower.includes("/logs")
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [activeView, setActiveView] = useState<"chat">("chat")
  const [previewDevice, setPreviewDevice] = useState("full")
  const [previewUrl, setPreviewUrl] = useState("")
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [previewWidth, setPreviewWidth] = useState(560)
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)
  const [canRollbackPreview, setCanRollbackPreview] = useState(false)
  const [currentProject, setCurrentProject] = useState<WorkspaceProject | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const userEmail = String(user?.email || "").trim().toLowerCase()
  const isOwner = OWNER_EMAILS.includes(userEmail)

  const previewStorageKey = userEmail
    ? `mujeebproai_last_preview_html_${userEmail}`
    : "mujeebproai_last_preview_html_guest"
  const previewBackupStorageKey = `${previewStorageKey}_backup`
  const previewHistoryStorageKey = `${previewStorageKey}_history`
  const previewWidthStorageKey = userEmail
    ? `mujeebproai_preview_width_${userEmail}`
    : "mujeebproai_preview_width_guest"

  const readPreviewHistory = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(previewHistoryStorageKey) || "[]"
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) return []

      return parsed.filter(
        (item): item is string =>
          typeof item === "string" && hasVisibleHtmlContent(item)
      )
    } catch {
      return []
    }
  }, [previewHistoryStorageKey])

  const writePreviewHistory = useCallback(
    (history: string[]) => {
      const cleanHistory = history
        .filter((item) => hasVisibleHtmlContent(item))
        .slice(-20)

      if (cleanHistory.length > 0) {
        localStorage.setItem(previewHistoryStorageKey, JSON.stringify(cleanHistory))
        localStorage.setItem(previewBackupStorageKey, cleanHistory[cleanHistory.length - 1])
      } else {
        localStorage.removeItem(previewHistoryStorageKey)
        localStorage.removeItem(previewBackupStorageKey)
      }

      setCanRollbackPreview(cleanHistory.length > 0)
    },
    [previewBackupStorageKey, previewHistoryStorageKey]
  )

  const isChatWorkspace =
    pathname === "/dashboard/chat" ||
    /^\/dashboard\/sites\/[^/]+\/chat$/.test(pathname)

  const shouldRedirectOwnerToChat = isOwner && pathname === "/dashboard"

  const loadLatestProject = useCallback(async () => {
    if (!userEmail || !isChatWorkspace) return

    try {
      const res = await fetch("/api/projects/latest", {
        credentials: "include",
        cache: "no-store",
      })

      if (!res.ok) {
        setCurrentProject(null)
        return
      }

      const data = await res.json()
      setCurrentProject(data.project || null)
    } catch {
      setCurrentProject(null)
    }
  }, [userEmail, isChatWorkspace])

  useEffect(() => {
    loadLatestProject()

    const handleProjectChanged = () => loadLatestProject()
    window.addEventListener("project-files-changed", handleProjectChanged)

    return () => {
      window.removeEventListener("project-files-changed", handleProjectChanged)
    }
  }, [loadLatestProject])

  const handlePreviewUpdate = useCallback(
    (nextHtml: string) => {
      const currentHtml = previewHtml || localStorage.getItem(previewStorageKey) || ""
      const nextHasContent = hasVisibleHtmlContent(nextHtml)

      if (
        currentHtml &&
        nextHasContent &&
        hasVisibleHtmlContent(currentHtml) &&
        currentHtml.trim() !== nextHtml.trim()
      ) {
        const history = readPreviewHistory()
        const lastHistoryItem = history[history.length - 1] || ""
        const nextHistory =
          lastHistoryItem.trim() === currentHtml.trim()
            ? history
            : [...history, currentHtml]

        writePreviewHistory(nextHistory)
      }

    const handleMouseUp = () => {
      setIsDraggingPreview(false)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDraggingPreview])

  useEffect(() => {
    if (!userEmail) return

    const storedWidth = Number(localStorage.getItem(previewWidthStorageKey))
    if (Number.isFinite(storedWidth) && storedWidth >= 360 && storedWidth <= 980) {
      setPreviewWidth(storedWidth)
    }
  }, [previewWidthStorageKey, userEmail])

  useEffect(() => {
    if (!userEmail) return
    localStorage.setItem(previewWidthStorageKey, String(Math.round(previewWidth)))
  }, [previewWidth, previewWidthStorageKey, userEmail])

  useEffect(() => {
    if (!userEmail) return
    setCanRollbackPreview(readPreviewHistory().length > 0)
  }, [readPreviewHistory, userEmail])

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!isLoading && shouldRedirectOwnerToChat) {
      router.replace("/dashboard/chat")
    }
  }, [isLoading, shouldRedirectOwnerToChat, router])

  useEffect(() => {
    if (!userEmail) return

    const storedPreview = localStorage.getItem(previewStorageKey) || ""

    if (storedPreview && hasVisibleHtmlContent(storedPreview)) {
      setPreviewHtml(storedPreview)
      setPreviewOpen(true)
    } else if (storedPreview) {
      localStorage.removeItem(previewStorageKey)
      localStorage.removeItem(previewBackupStorageKey)
      localStorage.removeItem(previewHistoryStorageKey)
      setPreviewHtml("")
      setPreviewOpen(true)
    }

    setCanRollbackPreview(readPreviewHistory().length > 0)
  }, [
    previewStorageKey,
    previewBackupStorageKey,
    previewHistoryStorageKey,
    userEmail,
    readPreviewHistory,
  ])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
        setPreviewOpen(false)
      } else {
        setSidebarOpen(true)
        setPreviewOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const handlePreviewUrl = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.url) return

      const rawUrl = String(detail.url).trim()
      let finalUrl = rawUrl

      if (isOwner) {
        finalUrl = normalizeOwnerPreviewPath(rawUrl)

        if (!finalUrl || isBlockedOwnerPreviewPath(finalUrl)) {
          setPreviewUrl("")
          setPreviewHtml("")
          setPreviewOpen(true)
          return
        }

        setPreviewUrl(finalUrl)
        setPreviewHtml("")
        setPreviewOpen(true)
        return
      }

      if (rawUrl.startsWith("/")) {
        try {
          const res = await fetch("/api/sites/my-site", {
            credentials: "include",
            cache: "no-store",
          })

          if (res.ok) {
            const data = await res.json()

            if (data.subdomain) {
              finalUrl = `/site/${data.subdomain}${rawUrl}`
            } else if (data.siteUrl) {
              finalUrl = `${data.siteUrl.replace(/\/$/, "")}${rawUrl}`
            }
          }
        } catch {
          finalUrl = ""
        }
      }

      setPreviewUrl(finalUrl)
      setPreviewHtml("")
      setPreviewOpen(true)
    }

    window.addEventListener("top-bar-preview-url", handlePreviewUrl)

    return () =>
      window.removeEventListener("top-bar-preview-url", handlePreviewUrl)
  }, [isOwner])

  if (isLoading || shouldRedirectOwnerToChat) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-6 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <MujeebProAILogo variant="icon" size="xl" animated={false} />
          <p className="text-white/50 text-sm">Loading workspace...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  if (!isChatWorkspace) {
    return <>{children}</>
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      <WorkspaceTopBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        dashboardOpen={dashboardOpen}
        setDashboardOpen={setDashboardOpen}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        activeView={activeView}
        setActiveView={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <WorkspaceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div
          ref={containerRef}
          className="flex-1 flex overflow-hidden relative w-full max-w-full"
        >
          <div className="flex flex-col min-w-0 overflow-hidden flex-1">
            <WorkspaceChatPanel
              onPreviewUpdate={handlePreviewUpdate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {previewOpen && (
            <>
              <div
                role="separator"
                aria-label="Resize preview panel"
                aria-orientation="vertical"
                onMouseDown={startPreviewResize}
                className={`
                  relative z-30 w-[7px] flex-shrink-0 cursor-col-resize
                  bg-cyan-500/20 hover:bg-cyan-400/50
                  border-l border-cyan-500/20 border-r border-cyan-500/20
                  transition-colors
                  ${isDraggingPreview ? "bg-cyan-400/60" : ""}
                `}
              >
                <div className="absolute left-1/2 top-1/2 h-20 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/60" />
              </div>

              <div
                className="relative flex-shrink-0 overflow-hidden"
                style={{ width: `${previewWidth}px` }}
              >
                <button
                  type="button"
                  onClick={restorePreviousPreview}
                  disabled={!canRollbackPreview}
                  title={
                    canRollbackPreview
                      ? "Restore previous preview"
                      : "No previous preview saved yet"
                  }
                  className={`
                    absolute right-12 top-3 z-40 flex h-6 w-6 items-center justify-center
                    rounded-md border border-cyan-500/30 bg-[#071018]/90 text-xs
                    text-cyan-300 shadow-lg backdrop-blur transition-colors
                    ${
                      canRollbackPreview
                        ? "hover:bg-cyan-500/20 hover:text-white"
                        : "cursor-not-allowed opacity-35"
                    }
                  `}
                >
                  ↶
                </button>

            <WorkspacePreviewPanel
  project={currentProject}
  device={previewDevice}
  setDevice={setPreviewDevice}
  previewUrl={previewUrl}
  setPreviewUrl={setPreviewUrl}
  onClose={() => setPreviewOpen(false)}
  expanded={previewExpanded}
  setExpanded={setPreviewExpanded}
  previewHtml={previewHtml}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>
              </div>
            </>
          )}
        </div>

        <WorkspaceDashboardPanel
          isOpen={dashboardOpen}
          onClose={() => setDashboardOpen(false)}
        />
      </div>
    </div>
  )
}
