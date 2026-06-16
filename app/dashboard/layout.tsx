"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { WorkspaceTopBar } from "@/components/workspace/top-bar"
import { WorkspaceSidebar } from "@/components/workspace/sidebar"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { WorkspaceDashboardPanel } from "@/components/workspace/dashboard-panel"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

const OWNER_EMAILS = ["mujeeb@job4u.com"]

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

  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const userEmail = String(user?.email || "").trim().toLowerCase()
  const isOwner = OWNER_EMAILS.includes(userEmail)

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
              onPreviewUpdate={setPreviewHtml}
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
