"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Code2, FolderKanban, Loader2, Monitor, Paperclip, Rocket, Send, Sparkles, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createSevenEightSixLocalProject, type SevenEightSixLocalProject } from "@/lib/786-admin/local-project-generator"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_KEY = "786chat_admin_messages_v5"
const PROJECT_KEY = "786chat_admin_project_v5"

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Message = { id: string; role: "user" | "assistant"; content: string; model?: string; reason?: string }

function filesToCode(project: SevenEightSixLocalProject | null) {
  if (!project) return "No project yet. Ask 786.Chat to create a project first."
  return Object.entries(project.files).map(([path, content]) => `// FILE: ${path}\n${content}`).join("\n\n/* ---------------------------------------- */\n\n")
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [project, setProject] = useState<SevenEightSixLocalProject | null>(null)
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("auto")
  const [panel, setPanel] = useState<Panel>("preview")
  const [sending, setSending] = useState(false)
  const [sound, setSound] = useState(true)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_KEY)
      const savedProject = localStorage.getItem(PROJECT_KEY)
      if (savedMessages) setMessages(JSON.parse(savedMessages))
      if (savedProject) setProject(JSON.parse(savedProject))
    } catch {
      localStorage.removeItem(CHAT_KEY)
      localStorage.removeItem(PROJECT_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)))
  }, [messages])

  useEffect(() => {
    if (project) localStorage.setItem(PROJECT_KEY, JSON.stringify(project))
  }, [project])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, sending])

  function tone(done = false) {
    if (!sound) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.value = 0.05
      ;(done ? [523, 659, 784] : [392, 523]).forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.frequency.value = freq
        osc.connect(gain)
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.12)
      })
      setTimeout(() => ctx.close().catch(() => undefined), 600)
    } catch {}
  }

  function newChat() {
    setMessages([])
    setProject(null)
    setInput("")
    setPanel("preview")
    localStorage.removeItem(CHAT_KEY)
    localStorage.removeItem(PROJECT_KEY)
    tone(true)
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    const localProject = createSevenEightSixLocalProject(text)
    setProject(localProject)
    setMessages((old) => [...old, { id: `u-${Date.now()}`, role: "user", content: text }])
    setInput("")
    setSending(true)
    setPanel("preview")
    tone(false)

    try {
      const res = await fetch("/api/786-admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode }),
      })
      const json = await res.json()
      setMessages((old) => [
        ...old,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: json.success ? `Project created and saved in this browser. Preview, Code and Projects are updated.\n\n${json.response || ""}` : json.error || "AI request failed.",
          model: json.model,
          reason: json.reason,
        },
      ])
      tone(true)
    } catch (error) {
      setMessages((old) => [...old, { id: `e-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Request failed." }])
      tone(false)
    } finally {
      setSending(false)
    }
  }

  if (isLoading || !isAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></main>
  }

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[104px] shrink-0 border-r border-cyan-300/20 bg-[#06101c] pt-24 lg:block">
          <button onClick={() => router.push("/786-admin/projects")} className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-100"><FolderKanban className="h-5 w-5" /></button>
        </aside>

        <section className="relative flex h-full w-[430px] shrink-0 flex-col border-r border-cyan-300/30 bg-[#081322]">
          <header className="flex h-[70px] items-center justify-between border-b border-white/10 px-5">
            <button onClick={newChat} className="font-black">+ New Chat</button>
            <div className="flex gap-2">
              <button onClick={() => setSound((v) => !v)} className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">Sound {sound ? "On" : "Off"}</button>
              <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100 outline-none">
                <option value="auto">Auto</option><option value="deepseek-flash">Flash</option><option value="deepseek-pro">Pro</option><option value="gemini-flash">Gemini Flash</option><option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 pb-40">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-500"><div><p className="text-xl text-cyan-100/80">Welcome back to 786.Chat</p><p className="mt-3 text-sm">No conversation yet. Ask for a project and it will appear on the right.</p></div></div>
            ) : messages.map((m) => (
              <div key={m.id} className={`mb-4 rounded-3xl border p-4 text-sm leading-6 ${m.role === "user" ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"}`}>
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-400"><span>{m.role === "user" ? "You" : "786.Chat"}</span>{m.model && <span className="text-cyan-200">{m.model}</span>}</div>
                <p className="whitespace-pre-wrap">{m.content}</p>{m.reason && <p className="mt-3 text-xs text-purple-200/80">{m.reason}</p>}
              </div>
            ))}
            {sending && <div className="mr-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4"><div className="flex items-center gap-3"><Wand2 className="h-5 w-5 animate-pulse text-cyan-200" /><span>786.Chat is creating your project...</span></div></div>}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/95 p-4">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3"><Paperclip className="mt-2 h-5 w-5 text-slate-500" /><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none" placeholder="Ask 786.Chat to build, edit, preview, or deploy..." /><button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 disabled:opacity-50"><Send className="h-4 w-4" /></button></div>
            <div className="mt-3 truncate rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-100"><Sparkles className="mr-2 inline h-3.5 w-3.5" />Temporary Project Engine Active</div>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] items-center gap-3 border-b border-white/10 px-5"><div className="flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-400">{project ? project.title : "No project yet"}</div><button onClick={() => setPanel("preview")} className={`rounded-full border px-4 py-2 text-sm ${panel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}><Monitor className="mr-2 inline h-4 w-4" />Preview</button><button onClick={() => setPanel("code")} className={`rounded-full border px-4 py-2 text-sm ${panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}><Code2 className="mr-2 inline h-4 w-4" />Code</button><button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950"><Rocket className="mr-2 inline h-4 w-4" />Publish</button></header>
          {panel === "preview" ? (
            project ? <div className="flex-1 overflow-auto p-8"><div className="mx-auto max-w-6xl rounded-[2rem] border border-cyan-300/20 bg-slate-950"><div className="rounded-t-[2rem] bg-gradient-to-br from-slate-950 via-cyan-950 to-purple-950 p-10"><p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-200">786.Chat Live Preview</p><h1 className="mt-5 text-5xl font-black">{project.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-cyan-50/75">{project.description}</p><p className="mt-6 inline-block rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950">{Object.keys(project.files).length} files generated</p></div><div className="grid gap-4 p-8 md:grid-cols-3">{Object.keys(project.files).map((path) => <div key={path} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><Sparkles className="mb-4 h-6 w-6 text-cyan-200" /><h3 className="font-black">{path}</h3><p className="mt-2 text-sm text-slate-400">Generated file ready for Neon save.</p></div>)}</div></div></div> : <div className="flex flex-1 items-center justify-center text-center text-slate-500"><div><Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" /><h2 className="text-xl font-black text-slate-300">No Preview Yet</h2><p>Ask 786.Chat to create a project first.</p></div></div>
          ) : <pre className="m-5 flex-1 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50"><code>{filesToCode(project)}</code></pre>}
        </section>
      </div>
    </main>
  )
}
