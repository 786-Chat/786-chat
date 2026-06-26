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
  Wand2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_STORAGE_KEY = "786chat_admin_messages_v1"

type ModelMode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type RightPanel = "preview" | "code"

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

const starterCode = `// 786.Chat project engine preview
// Next build phase will connect this panel to real saved files.

export const projectPlan = {
  files: [
    "app/page.tsx",
    "app/layout.tsx",
    "components/hero.tsx",
    "lib/project-engine.ts",
    "app/api/786-admin/projects/route.ts"
  ],
  status: "AI router ready",
  next: "Real Project Engine"
}
`

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
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview")
  const [soundEnabled, setSoundEnabled] = useState(true)
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
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages([
            {
              id: `welcome-${Date.now()}`,
              role: "assistant",
              content: "Welcome back. Your last 786.Chat admin conversation is restored. You can continue from here or click New Chat to start fresh.",
              model: "786.Chat workspace",
              reason: "Restored from this browser for the current admin session.",
            },
            ...parsed,
          ])
        }
      }
    } catch {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const messagesToSave = messages.filter((message) => !message.id.startsWith("welcome-"))
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToSave.slice(-30)))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isSending])

  const playTone = (type: "start" | "done") => {
    if (!soundEnabled || typeof window === "undefined") return

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42)

      const notes = type === "start" ? [392, 523] : [523, 659, 784]
      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator()
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.09)
        oscillator.connect(gain)
        oscillator.start(ctx.currentTime + index * 0.09)
        oscillator.stop(ctx.currentTime + index * 0.09 + 0.16)
      })

      window.setTimeout(() => ctx.close().catch(() => undefined), 700)
    } catch {
      // Browser blocked sound until user gesture. Safe to ignore.
    }
  }

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
    setMessages([
      {
        id: `fresh-${Date.now()}`,
        role: "assistant",
        content: "New chat started. Tell me what you want to build in 786.Chat and I will route the task to the right AI model.",
        model: "786.Chat workspace",
        reason: "Fresh chat created.",
      },
    ])
    setInput("")
    localStorage.removeItem(CHAT_STORAGE_KEY)
    playTone("done")
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
    playTone("start")

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
      playTone(result.success ? "done" : "start")
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
      playTone("start")
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
          <aside className="hidden h-full shrink-0 bg-[#06101c] pt-24 lg:flex lg:flex-col" style={{ width: `${sidebarWidth}px` }}>
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
                    {isSidebarExpanded ? <span className="truncate text-sm font-semibold">{item.label}</span> : null}
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <div className="relative hidden h-full shrink-0 lg:block">
          {!sidebarCollapsed && <div onMouseDown={startSidebarResize} className="h-full w-[3px] cursor-col-resize bg-cyan-300/60 shadow-[0_0_16px_rgba(34,211,238,0.50)] transition hover:bg-cyan-200" aria-label="Resize sidebar" role="separator" />}
          <button onClick={toggleSidebar} className="absolute left-1/2 top-4 z-30 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-cyan-300/35 bg-[#07101d] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.24)] transition hover:bg-cyan-300/15" aria-label={sidebarCollapsed ? "Restore sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <section className="relative flex h-full min-h-0 shrink-0 flex-col bg-[#081322]" style={{ width: `${chatWidth}px` }}>
          <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/10 bg-[#07101d] px-5">
            <button onClick={handleNewChat} className="inline-flex items-center gap-2 text-base font-bold text-white">
              + New Chat
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled((value) => !value)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${soundEnabled ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}
                title="Toggle task sounds"
              >
                Sound {soundEnabled ? "On" : "Off"}
              </button>
              <select value={modelMode} onChange={(event) => setModelMode(event.target.value as ModelMode)} className="rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100 outline-none" aria-label="AI model mode">
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </header>

          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-40 pt-5">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <p className="text-xl text-cyan-100/70">Welcome back to 786.Chat</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Auto uses DeepSeek for platform/code and Gemini only for direct image/PDF/screenshot analysis.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`rounded-3xl border p-4 text-sm leading-6 ${message.role === "user" ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"}`}>
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
              <div className="mr-8 overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/10 via-purple-500/10 to-emerald-300/10 p-4 text-sm text-slate-200 shadow-[0_0_34px_rgba(34,211,238,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-9 w-9 place-items-center rounded-full bg-cyan-300/10">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-300/20" />
                    <Wand2 className="relative h-4 w-4 text-cyan-100" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-50">786.Chat is working on your task...</p>
                    <div className="mt-2 flex gap-1">
                      <span className="h-2 w-10 animate-pulse rounded-full bg-cyan-300" />
                      <span className="h-2 w-8 animate-pulse rounded-full bg-purple-300 [animation-delay:120ms]" />
                      <span className="h-2 w-12 animate-pulse rounded-full bg-emerald-300 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
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
              <button onClick={handleSend} disabled={isSending || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.34)] transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send">
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 truncate rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-100">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">AI Router Active • Auto uses DeepSeek for platform/code and Gemini only for direct visual/PDF work.</span>
            </div>
          </div>
        </section>

        <div onMouseDown={startChatResize} className="h-full w-[3px] shrink-0 cursor-col-resize bg-cyan-300/60 shadow-[0_0_16px_rgba(34,211,238,0.50)] transition hover:bg-cyan-200" aria-label="Resize panels" role="separator" />

        <section className="flex h-full min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c0c12] px-5">
            <div className="flex h-10 flex-1 max-w-[620px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-400">
              <Globe2 className="h-4 w-4" />
              {rightPanel === "preview" ? "Preview panel ready. Real live rendering comes with the Project Engine." : "Code panel ready. Real files come with the Project Engine."}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setRightPanel("preview")} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${rightPanel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
                <Monitor className="h-4 w-4" />
                Preview
              </button>
              <button onClick={() => setRightPanel("code")} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${rightPanel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
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

          {rightPanel === "preview" ? (
            <div className="flex flex-1 min-h-0 items-center justify-center bg-[#06060a] p-8">
              <div className="max-w-md text-center text-slate-500">
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_46px_rgba(34,211,238,0.12)]">
                  <Bot className="h-9 w-9 text-cyan-200" />
                </div>
                <h2 className="text-xl font-black text-slate-300">Preview Ready</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">The workspace shell is ready. Next we connect real project files so this area renders the generated app.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs text-slate-400">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><ShieldCheck className="mb-2 h-4 w-4 text-cyan-200" />Owner-only admin workspace</div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><Sparkles className="mb-2 h-4 w-4 text-purple-200" />Auto model routing</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col bg-[#05070d] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100"><Code2 className="h-4 w-4" /> Code Preview</div>
              <pre className="min-h-0 flex-1 overflow-auto rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50 shadow-[inset_0_0_40px_rgba(34,211,238,0.04)]">
                <code>{starterCode}</code>
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
