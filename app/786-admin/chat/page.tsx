"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderKanban,
  Globe2,
  Loader2,
  Monitor,
  Paperclip,
  Rocket,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

type ModelMode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string
  reason?: string
  error?: string
}

const workspaceNav = [
  { label: "Projects", icon: FolderKanban, href: "/786-admin/projects", active: true },
]

const modelOptions: { value: ModelMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "deepseek-flash", label: "Flash" },
  { value: "deepseek-pro", label: "Pro" },
  { value: "gemini-flash", label: "Gemini Flash" },
  { value: "gemini-pro", label: "Gemini Pro" },
]

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [sidebarWidth, setSidebarWidth] = useState(118)
  const [savedSidebarWidth, setSavedSidebarWidth] = useState(118)
  const [chatWidth, setChatWidth] = useState(420)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [modelMode, setModelMode] = useState<ModelMode>("auto")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isSending])

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

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  const handleSend = async () => {
    const cleanInput = input.trim()
    if (!cleanInput || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanInput,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const response = await fetch("/api/786-admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanInput, mode: modelMode }),
      })

      const result = await response.json()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.success
          ? String(result.response || "786.Chat returned an empty response.")
          : String(result.error || "786.Chat AI request failed."),
        model: result.model,
        reason: result.reason,
        error: result.success ? undefined : result.error,
      }

      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "786.Chat AI request failed.",
          error: "Request failed",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const startSidebarResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()

    const handleMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(Math.max(moveEvent.clientX, 82), 220)
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
            className="hidden h-full shrink-0 bg-[#06101c] pt-24 lg:flex lg:flex-col"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="flex flex-col gap-3 px-3">
              {workspaceNav.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    title={item.label}
                    className={`group relative flex h-12 items-center rounded-2xl border transition ${
                      isSidebarExpanded ? "w-full justify-start gap-3 px-3" : "mx-auto w-12 justify-center"
                    } ${
                      item.active
                        ? "border-cyan-300/25 bg-cyan-300/14 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                        : "border-white/5 text-slate-300 hover:border-cyan-300/20 hover:bg-white/[0.06] hover:text-cyan-100"
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
            <button onClick={handleNewChat} className="inline-flex items-center gap-2 text-base font-bold text-white">
              + New Chat
            </button>
            <select
              value={modelMode}
              onChange={(event) => setModelMode(event.target.value as ModelMode)}
              className="rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100 outline-none"
              aria-label="AI model mode"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </header>

          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-36 pt-5">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <p className="text-xl text-cyan-100/70">How can I help you today?</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Auto mode uses DeepSeek for chat/code/platform work and Gemini only for direct image/PDF/screenshot analysis.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-3xl border p-4 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                      : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-400">
                    <span>{message.role === "user" ? "You" : "786.Chat"}</span>
                    {message.model && <span className="text-cyan-200">{message.model}</span>}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.reason && <p className="mt-3 text-xs text-purple-200/80">{message.reason}</p>}
                </div>
              ))
            )}
            {isSending && (
              <div className="mr-8 inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
                786.Chat is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/96 p-4 backdrop-blur-2xl">
            <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 text-slate-400 shadow-[0_0_35px_rgba(0,0,0,0.22)]">
              <button className="pb-2 text-slate-500 hover:text-cyan-100" aria-label="Attachment">
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Ask 786.Chat to build, edit, preview, or deploy..."
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.34)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 truncate rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-100">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">AI Router Active • Auto uses DeepSeek for platform/code and Gemini only for direct visual/PDF work.</span>
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
              Real preview, code saving, GitHub sync and deployment are the next build phase.
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
            <div className="max-w-md text-center text-slate-500">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_46px_rgba(34,211,238,0.12)]">
                <Bot className="h-9 w-9 text-cyan-200" />
              </div>
              <h2 className="text-xl font-black text-slate-300">AI Router is Ready</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use the chat panel to test DeepSeek Flash, DeepSeek Pro, Gemini Flash and Gemini Pro. Real project files, preview and deployment are next.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs text-slate-400">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <ShieldCheck className="mb-2 h-4 w-4 text-cyan-200" />
                  Owner-only admin workspace
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <Sparkles className="mb-2 h-4 w-4 text-purple-200" />
                  Auto model routing
                </div>
              </div>
              <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15">
                <Globe2 className="h-4 w-4" />
                Next: Real Project Engine
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
