"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Globe2,
  Grid3X3,
  Loader2,
  Monitor,
  Paperclip,
  Rocket,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const workspaceNav = [
  { label: "Projects", icon: Grid3X3, href: "/786-admin/projects", active: true },
]

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [sidebarWidth, setSidebarWidth] = useState(88)
  const [savedSidebarWidth, setSavedSidebarWidth] = useState(88)
  const [chatWidth, setChatWidth] = useState(420)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  const visibleSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth
  const isSidebarExpanded = !sidebarCollapsed && sidebarWidth > 120

  const toggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarWidth(savedSidebarWidth)
      setSidebarCollapsed(false)
      return
    }

    setSavedSidebarWidth(sidebarWidth)
    setSidebarCollapsed(true)
  }

  const startSidebarResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const handleMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(Math.max(moveEvent.clientX, 68), 210)
      setSidebarCollapsed(false)
      setSidebarWidth(nextWidth)
      setSavedSidebarWidth(nextWidth)
    }

    const stopMove = () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", stopMove)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", stopMove)
  }

  const startChatResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const handleMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(Math.max(moveEvent.clientX - visibleSidebarWidth, 320), 720)
      setChatWidth(nextWidth)
    }

    const stopMove = () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", stopMove)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", stopMove)
  }

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/[0.05] p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.18)] backdrop-blur-2xl">
          <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-cyan-200" />
          <h1 className="text-xl font-bold">Loading 786.Chat Admin Workspace</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full min-w-0">
        {!sidebarCollapsed && (
          <aside
            className="hidden h-full shrink-0 bg-[#06101c] lg:flex lg:flex-col"
            style={{ width: `${sidebarWidth}px` }}
          >
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.30)]"
            >
              786
            </button>

            <div className="mt-10 flex flex-1 flex-col gap-3 px-3">
              {workspaceNav.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    title={item.label}
                    className={`group relative flex h-11 items-center rounded-2xl transition ${
                      isSidebarExpanded ? "w-full justify-start gap-3 px-3" : "mx-auto w-11 justify-center"
                    } ${
                      item.active
                        ? "bg-cyan-300/14 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.16)]"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-cyan-100"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarExpanded ? (
                      <span className="truncate text-sm font-semibold">{item.label}</span>
                    ) : (
                      <span className="pointer-events-none absolute left-14 z-50 rounded-xl border border-white/10 bg-[#101827] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mb-5 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
                M
              </div>
            </div>
          </aside>
        )}

        <div className="relative hidden h-full shrink-0 lg:block">
          {!sidebarCollapsed && (
            <div
              onMouseDown={startSidebarResize}
              className="h-full w-[3px] cursor-col-resize bg-cyan-300/60 shadow-[0_0_16px_rgba(34,211,238,0.50)] transition hover:bg-cyan-200"
              aria-label="Resize sidebar"
              role="separator"
            />
          )}
          <button
            onClick={toggleSidebar}
            className="absolute left-1/2 top-4 z-30 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-cyan-300/35 bg-[#07101d] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.24)] transition hover:bg-cyan-300/15"
            aria-label={sidebarCollapsed ? "Restore sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <section
          className="relative flex h-full min-h-0 shrink-0 flex-col bg-[#081322]"
          style={{ width: `${chatWidth}px` }}
        >
          <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/10 bg-[#07101d] px-5">
            <div>
              <button className="inline-flex items-center gap-2 text-base font-bold text-white">
                New Chat
                <span className="text-xs text-slate-400">⌄</span>
              </button>
            </div>
            <button className="text-cyan-200 hover:text-cyan-100" aria-label="Open">
              ↗
            </button>
          </header>

          <div className="flex flex-1 min-h-0 items-center justify-center px-6 pb-28 pt-10">
            <div className="w-full max-w-[560px] text-center">
              <p className="text-xl text-cyan-100/70">How can I help you today?</p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/96 p-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 text-slate-400 shadow-[0_0_35px_rgba(0,0,0,0.22)]">
              <button className="text-slate-500 hover:text-cyan-100" aria-label="Attachment">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 text-sm">Ask me anything...</div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.34)]" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              Unlimited
            </div>
          </div>
        </section>

        <div
          onMouseDown={startChatResize}
          className="h-full w-[3px] shrink-0 cursor-col-resize bg-cyan-300/60 shadow-[0_0_16px_rgba(34,211,238,0.50)] transition hover:bg-cyan-200"
          aria-label="Resize panels"
          role="separator"
        />

        <section className="flex h-full min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c0c12] px-5">
            <div className="flex h-10 flex-1 max-w-[560px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-400">
              <Globe2 className="h-4 w-4" />
              Enter URL to preview or ask AI...
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Monitor className="h-4 w-4" />
                Preview
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400">
                <Code2 className="h-4 w-4" />
                Code
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)]">
                <Rocket className="h-4 w-4" />
                Publish
              </button>
            </div>
          </header>

          <div className="shrink-0 border-b border-cyan-400/15 bg-[#082120]/80 px-5 py-4">
            <div className="flex items-center gap-5 text-cyan-100/45">
              <Monitor className="h-5 w-5 text-cyan-300" />
              <Tablet className="h-4 w-4" />
              <Smartphone className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-1 min-h-0 items-center justify-center bg-[#06060a] p-8">
            <div className="text-center text-slate-500">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <Monitor className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-400">New chat ready</h2>
              <p className="mt-2 max-w-xs text-sm leading-6">
                Ask 786.Chat to create a new admin page or app. The preview will appear here.
              </p>
              <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100">
                <Globe2 className="h-4 w-4" />
                Preview 786.Chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
