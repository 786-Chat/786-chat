"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Code2, FolderKanban, Globe2, Loader2, Monitor, Paperclip, Rocket, Send, ShieldCheck, Smartphone, Sparkles, Tablet, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_STORAGE_KEY = "786chat_admin_messages_v2"

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

const modelOptions: { value: ModelMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "deepseek-flash", label: "Flash" },
  { value: "deepseek-pro", label: "Pro" },
  { value: "gemini-flash", label: "Gemini Flash" },
  { value: "gemini-pro", label: "Gemini Pro" },
]

function buildCodeFromMessages(messages: ChatMessage[]) {
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content || "Create a 786.Chat project"
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant" && !message.id.startsWith("welcome-") && !message.id.startsWith("fresh-"))
  const assistantText = latestAssistant?.content || "No generated code yet. Ask 786.Chat to create a project."

  return `// 786.Chat Temporary Generated Project
// This is a live workspace preview generated from the latest AI reply.
// Next phase will save these files into Neon and show real editable files.

// USER REQUEST
${latestUser
  .split("\n")
  .map((line) => `// ${line}`)
  .join("\n")}

// FILE: app/page.tsx
export default function GeneratedProjectPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">786.Chat Generated App</p>
        <h1 className="mt-6 text-5xl font-black">Premium AI-built project preview</h1>
        <p className="mt-6 max-w-2xl text-slate-300">Generated from your latest prompt and ready for the Real Project Engine.</p>
      </section>
    </main>
  )
}

// AI ARCHITECT OUTPUT
${assistantText
  .split("\n")
  .slice(0, 220)
  .map((line) => `// ${line}`)
  .join("\n")}
`
}

function getProjectTitle(messages: ChatMessage[]) {
  const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content.toLowerCase() || ""
  if (latestUser.includes("restaurant")) return "Premium Restaurant Website"
  if (latestUser.includes("pizza")) return "Premium Pizza Shop"
  if (latestUser.includes("dashboard")) return "Modern SaaS Dashboard"
  if (latestUser.includes("login")) return "Login Page Project"
  if (latestUser.includes("quiz")) return "Interactive Quiz Generator"
  return "786.Chat Generated Project"
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [modelMode, setModelMode] = useState<ModelMode>("auto")
  const [isSending, setIsSending] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const projectTitle = getProjectTitle(messages)
  const generatedCode = buildCodeFromMessages(messages)
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant" && !message.id.startsWith("welcome-") && !message.id.startsWith("fresh-"))

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
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
              content: "Welcome back. Your last 786.Chat admin conversation is restored. Click New Chat to start fresh.",
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
    const cleanMessages = messages.filter((message) => !message.id.startsWith("welcome-"))
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanMessages.slice(-30)))
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
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      const notes = type === "start" ? [392, 523] : [523, 659, 784]
      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator()
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.09)
        oscillator.connect(gain)
        oscillator.start(ctx.currentTime + index * 0.09)
        oscillator.stop(ctx.currentTime + index * 0.09 + 0.16)
      })
      window.setTimeout(() => ctx.close().catch(() => undefined), 800)
    } catch {}
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: `fresh-${Date.now()}`,
        role: "assistant",
        content: "New chat started. Ask me to create a website, app, dashboard, login page, quiz generator, or full platform.",
        model: "786.Chat workspace",
        reason: "Fresh chat created.",
      },
    ])
    setInput("")
    setRightPanel("preview")
    localStorage.removeItem(CHAT_STORAGE_KEY)
    playTone("done")
  }

  const handleSend = async () => {
    const cleanInput = input.trim()
    if (!cleanInput || isSending) return

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: cleanInput }])
    setInput("")
    setIsSending(true)
    setRightPanel("preview")
    playTone("start")

    try {
      const response = await fetch("/api/786-admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanInput, mode: modelMode }),
      })
      const result = await response.json()
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.success ? String(result.response || "786.Chat returned an empty response.") : String(result.error || "786.Chat AI request failed."),
          model: result.model,
          reason: result.reason,
          error: result.success ? undefined : result.error,
        },
      ])
      playTone(result.success ? "done" : "start")
    } catch (error) {
      setMessages((current) => [...current, { id: `assistant-error-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "786.Chat AI request failed.", error: "Request failed" }])
      playTone("start")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full min-w-0">
        <aside className="hidden h-full w-[118px] shrink-0 bg-[#06101c] pt-24 lg:flex lg:flex-col">
          <button onClick={() => router.push("/786-admin/projects")} className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/14 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
            <FolderKanban className="h-5 w-5" />
          </button>
        </aside>

        <section className="relative flex h-full min-h-0 w-[420px] shrink-0 flex-col border-x border-cyan-300/35 bg-[#081322]">
          <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/10 bg-[#07101d] px-5">
            <button onClick={handleNewChat} className="inline-flex items-center gap-2 text-base font-bold text-white">+ New Chat</button>
            <div className="flex items-center gap-2">
              <button onClick={() => setSoundEnabled((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${soundEnabled ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>Sound {soundEnabled ? "On" : "Off"}</button>
              <select value={modelMode} onChange={(event) => setModelMode(event.target.value as ModelMode)} className="rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100 outline-none">
                {modelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </header>

          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-40 pt-5">
            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <div>
                  <p className="text-xl text-cyan-100/70">Welcome back to 786.Chat</p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Ask for any project. Preview and Code update after the AI replies.</p>
                </div>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`rounded-3xl border p-4 text-sm leading-6 ${message.role === "user" ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"}`}>
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-400">
                  <span>{message.role === "user" ? "You" : "786.Chat"}</span>
                  {message.model && <span className="text-cyan-200">{message.model}</span>}
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.reason && <p className="mt-3 text-xs text-purple-200/80">{message.reason}</p>}
              </div>
            ))}
            {isSending && (
              <div className="mr-8 rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/10 via-purple-500/10 to-emerald-300/10 p-4 text-sm text-slate-200 shadow-[0_0_34px_rgba(34,211,238,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-9 w-9 place-items-center rounded-full bg-cyan-300/10"><span className="absolute h-full w-full animate-ping rounded-full bg-cyan-300/20" /><Wand2 className="relative h-4 w-4 text-cyan-100" /></div>
                  <div className="flex-1"><p className="font-bold text-cyan-50">786.Chat is working on your task...</p><div className="mt-2 flex gap-1"><span className="h-2 w-10 animate-pulse rounded-full bg-cyan-300" /><span className="h-2 w-8 animate-pulse rounded-full bg-purple-300" /><span className="h-2 w-12 animate-pulse rounded-full bg-emerald-300" /></div></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/96 p-4 backdrop-blur-2xl">
            <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 text-slate-400">
              <Paperclip className="mb-2 h-5 w-5 text-slate-500" />
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend() } }} rows={1} className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build, edit, preview, or deploy..." />
              <button onClick={handleSend} disabled={isSending || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.34)] transition hover:bg-violet-500 disabled:opacity-50">{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
            </div>
            <div className="mt-3 flex items-center gap-2 truncate rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-100"><Sparkles className="h-3.5 w-3.5 shrink-0" /><span className="truncate">AI Router Active • Preview and Code update from the latest AI response.</span></div>
          </div>
        </section>

        <section className="flex h-full min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c0c12] px-5">
            <div className="flex h-10 flex-1 max-w-[680px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-400"><Globe2 className="h-4 w-4" />{rightPanel === "preview" ? "Preview generated from latest AI response." : "Code generated from latest AI response."}</div>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setRightPanel("preview")} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${rightPanel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}><Monitor className="h-4 w-4" />Preview</button>
              <button onClick={() => setRightPanel("code")} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${rightPanel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-400"}`}><Code2 className="h-4 w-4" />Code</button>
              <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950"><Rocket className="h-4 w-4" />Publish</button>
            </div>
          </header>

          <div className="shrink-0 border-b border-cyan-400/15 bg-[#082120]/80 px-5 py-4"><div className="flex items-center gap-5 text-cyan-100/45"><Monitor className="h-5 w-5 text-cyan-300" /><Tablet className="h-4 w-4" /><Smartphone className="h-4 w-4" /></div></div>

          {rightPanel === "preview" ? (
            <div className="min-h-0 flex-1 overflow-auto bg-[#07080d] p-8">
              <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 shadow-[0_0_60px_rgba(34,211,238,0.10)]">
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950 to-purple-950 px-8 py-16">
                  <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
                  <div className="relative max-w-3xl">
                    <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-200">786.Chat Preview</p>
                    <h1 className="mt-5 text-5xl font-black tracking-tight text-white">{projectTitle}</h1>
                    <p className="mt-5 text-lg leading-8 text-cyan-50/75">This temporary preview is generated from your latest AI response. The next Real Project Engine phase will render saved files from Neon and GitHub.</p>
                    <div className="mt-8 flex flex-wrap gap-3"><span className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950">Live Preview Shell</span><span className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white">Code Ready</span></div>
                  </div>
                </section>
                <section className="grid gap-4 bg-slate-950 p-8 md:grid-cols-3">
                  {["Homepage", "Interactive Sections", "Deployment Ready"].map((item) => <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><Sparkles className="mb-4 h-6 w-6 text-cyan-200" /><h3 className="font-black text-white">{item}</h3><p className="mt-2 text-sm leading-6 text-slate-400">Generated plan from 786.Chat AI response.</p></div>)}
                </section>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-[#05070d] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100"><Code2 className="h-4 w-4" /> Full Temporary Code View</div>
              <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50 shadow-[inset_0_0_40px_rgba(34,211,238,0.04)]"><code>{generatedCode}</code></pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
