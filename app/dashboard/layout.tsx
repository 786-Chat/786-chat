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
    },
    [previewBackupStorageKey, previewHistoryStorageKey]
  )

  const isChatWorkspace =
    pathname === "/dashboard/chat" ||
    /^\/dashboard\/sites\/[^/]+\/chat$/.test(pathname)

  const shouldRedirectOwnerToChat = isOwner && pathname === "/dashboard"

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
        setPreviewHtml(nextHtml)
        setPreviewUrl("")
        setPreviewOpen(true)
        return
      }

      localStorage.removeItem(previewStorageKey)
      setPreviewHtml("")
      setPreviewUrl("")
      setPreviewOpen(true)
    },
    [previewHtml, previewStorageKey, readPreviewHistory, writePreviewHistory]
  )

  const startPreviewResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingPreview(true)
  }, [])

  useEffect(() => {
    if (!isDraggingPreview) return

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const nextWidth = rect.right - event.clientX
      const minWidth = 360
      const maxWidth = Math.min(980, Math.max(420, rect.width - 420))
      const clampedWidth = Math.min(Math.max(nextWidth, minWidth), maxWidth)

      setPreviewWidth(clampedWidth)
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
  }, [previewStorageKey, previewBackupStorageKey, previewHistoryStorageKey, userEmail])

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
        <p className="truncate text-xs text-white/45">
          Preview safety is active. MujeebProAI saves the previous preview before applying a new AI preview.
        </p>
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
                className="flex-shrink-0 overflow-hidden"
                style={{ width: `${previewWidth}px` }}
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
