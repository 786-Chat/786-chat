"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { WorkspaceTopBar } from "@/components/workspace/top-bar"
import { WorkspaceSidebar } from "@/components/workspace/sidebar"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { WorkspaceDashboardPanel } from "@/components/workspace/dashboard-panel"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import { cn } from "@/lib/utils"

const OWNER_EMAILS = ["mujeeb@job4u.com"]

function hasVisibleHtmlContent(html: string): boolean {
  if (!html || !html.trim()) return false

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "preview">("chat")
  const [previewDevice, setPreviewDevice] = useState("full")
  const [previewUrl, setPreviewUrl] = useState("")
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [chatWidthPercent, setChatWidthPercent] = useState(50)
  const [hasPreviewBackup, setHasPreviewBackup] = useState(false)

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const userEmail = String(user?.email || "").trim().toLowerCase()
  const isOwner = OWNER_EMAILS.includes(userEmail)

  const previewStorageKey = userEmail
    ? `mujeebproai_last_preview_html_${userEmail}`
    : "mujeebproai_last_preview_html_guest"
  const previewBackupStorageKey = `${previewStorageKey}_backup`
  const previewHistoryStorageKey = `${previewStorageKey}_history`

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
        setHasPreviewBackup(true)
      } else {
        localStorage.removeItem(previewHistoryStorageKey)
        localStorage.removeItem(previewBackupStorageKey)
        setHasPreviewBackup(false)
      }
    },
    [previewBackupStorageKey, previewHistoryStorageKey]
  )

  const isChatWorkspace =
    pathname === "/dashboard/chat" ||
    /^\/dashboard\/sites\/[^/]+\/chat$/.test(pathname)

  const shouldRedirectOwnerToChat = isOwner && pathname === "/dashboard"

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

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

      if (nextHasContent) {
        localStorage.setItem(previewStorageKey, nextHtml)
      } else {
        localStorage.removeItem(previewStorageKey)
      }

      setPreviewHtml(nextHtml)
      setPreviewUrl("")
      setPreviewOpen(true)
      setActiveView("preview")
    },
    [previewHtml, previewStorageKey, readPreviewHistory, writePreviewHistory]
  )

  const restorePreviousPreview = useCallback(() => {
    const history = readPreviewHistory()
    const backupHtml = history.pop() || localStorage.getItem(previewBackupStorageKey) || ""

    if (!backupHtml || !hasVisibleHtmlContent(backupHtml)) return

    localStorage.setItem(previewStorageKey, backupHtml)
    writePreviewHistory(history)
    setPreviewHtml(backupHtml)
    setPreviewUrl("")
    setPreviewOpen(true)
    setActiveView("preview")
  }, [previewBackupStorageKey, previewStorageKey, readPreviewHistory, writePreviewHistory])

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
    const storedBackup = localStorage.getItem(previewBackupStorageKey) || ""
    const history = readPreviewHistory()

    if (storedPreview && hasVisibleHtmlContent(storedPreview)) {
      setPreviewHtml(storedPreview)
    }

    setHasPreviewBackup(
      history.length > 0 || Boolean(storedBackup && hasVisibleHtmlContent(storedBackup))
    )
  }, [previewBackupStorageKey, previewStorageKey, userEmail, readPreviewHistory])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100

      setChatWidthPercent(Math.min(75, Math.max(25, percent)))
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return

      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
        setPreviewOpen(false)
      } else if (window.innerWidth < 1200) {
        setPreviewOpen(false)
      } else {
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

      let finalUrl = detail.url

      if (detail.url.startsWith("/")) {
        try {
          const res = await fetch("/api/sites/my-site", {
            credentials: "include",
            cache: "no-store",
          })

          if (res.ok) {
            const data = await res.json()

            if (data.subdomain) {
              finalUrl = `/site/${data.subdomain}${detail.url}`
            } else if (data.siteUrl) {
              finalUrl = `${data.siteUrl.replace(/\/$/, "")}${detail.url}`
            }
          }
        } catch {
          finalUrl = ""
        }
      }

      setPreviewUrl(finalUrl)
      setPreviewHtml("")
      setPreviewOpen(true)
      setActiveView("preview")
    }

    window.addEventListener("top-bar-preview-url", handlePreviewUrl)

    return () =>
      window.removeEventListener("top-bar-preview-url", handlePreviewUrl)
  }, [])

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

      <div className="border-b border-white/[0.06] bg-[#0f1118]/95 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs text-white/45">
            Preview safety is active. MujeebProAI saves the previous preview before applying a new AI preview.
          </p>

          <button
            type="button"
            onClick={restorePreviousPreview}
            disabled={!hasPreviewBackup}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              hasPreviewBackup
                ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
                : "border-white/10 bg-white/[0.03] text-white/25 cursor-not-allowed"
            )}
            title="Rollback / Restore Previous Version"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Rollback
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <WorkspaceSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div
          ref={containerRef}
          className="flex-1 flex overflow-hidden relative w-full max-w-full"
        >
          <div
            className={`flex flex-col min-w-0 overflow-hidden ${
              activeView !== "chat" ? "hidden md:flex" : "flex w-full md:w-auto"
            }`}
            style={{
              width:
                activeView === "chat" &&
                typeof window !== "undefined" &&
                window.innerWidth < 768
                  ? "100%"
                  : previewOpen
                    ? `${chatWidthPercent}%`
                    : "100%",
              flexShrink: 0,
            }}
          >
            <WorkspaceChatPanel
              onPreviewUpdate={handlePreviewUpdate}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {previewOpen && (
            <div
              className="relative z-10 flex-shrink-0 group hidden md:block"
              style={{ width: "6px" }}
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/[0.06] group-hover:bg-cyan-500/50 group-active:bg-cyan-400 transition-colors" />
              <div
                className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize"
                onMouseDown={handleMouseDown}
              />
            </div>
          )}

          {previewOpen && (
            <div
              className={`${
                activeView !== "preview"
                  ? "hidden lg:flex"
                  : "flex w-full md:w-auto"
              } flex-col min-w-0 overflow-hidden`}
              style={{
                width:
                  activeView === "preview" &&
                  typeof window !== "undefined" &&
                  window.innerWidth < 768
                    ? "100%"
                    : `${100 - chatWidthPercent}%`,
                flexShrink: 0,
              }}
            >
              <WorkspacePreviewPanel
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
