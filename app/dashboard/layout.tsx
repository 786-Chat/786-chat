"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { WorkspaceTopBar } from "@/components/workspace/top-bar"
import { WorkspaceSidebar } from "@/components/workspace/sidebar"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"
import { WorkspaceDashboardPanel } from "@/components/workspace/dashboard-panel"
import { Button } from "@/components/ui/button"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      setChatWidthPercent(Math.min(75, Math.max(25, percent)))
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const isWorkspaceRoot = pathname === "/dashboard" || pathname === "/dashboard/chat"

  const isSettingsPage =
    pathname.startsWith("/dashboard/settings") ||
    pathname === "/dashboard/billing" ||
    pathname === "/dashboard/usage" ||
    pathname === "/dashboard/profile"

  const isSubPage =
    !isWorkspaceRoot &&
    pathname.startsWith("/dashboard/") &&
    !isSettingsPage

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

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
    return () => window.removeEventListener("top-bar-preview-url", handlePreviewUrl)
  }, [])

  if (isLoading) {
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

  if (isSettingsPage) {
    return <div className="min-h-screen bg-background">{children}</div>
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
        <WorkspaceSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div ref={containerRef} className="flex-1 flex overflow-hidden relative w-full max-w-full">
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
                activeView !== "preview" ? "hidden lg:flex" : "flex w-full md:w-auto"
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

        <AnimatePresence>
          {isSubPage && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => router.push("/dashboard")}
              />

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0d0d14] border border-white/[0.08] rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
                  <h2 className="text-sm font-semibold text-white capitalize">
                    {pathname.split("/").pop()?.replace(/-/g, " ")}
                  </h2>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                    onClick={() => router.push("/dashboard")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">{children}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
