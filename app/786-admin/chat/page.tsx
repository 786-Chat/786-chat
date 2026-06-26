"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Code2,
  FolderKanban,
  GripVertical,
  Loader2,
  Monitor,
  Paperclip,
  Plus,
  Rocket,
  Send,
  Wand2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type {
  SevenEightSixProject,
  SevenEightSixProjectFileMap,
} from "@/lib/786-admin/local-project-generator"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_WIDTH_KEY = "786chat_admin_chat_width_v1"

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Message = { id: string; role: "user" | "assistant"; content: string; model?: string; reason?: string }



function filesToHtml(files: SevenEightSixProjectFileMap) {
  const page = files["app/page.tsx"] || ""
  const css = files["app/globals.css"] || ""

  const titleMatch = page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const paragraphMatch = page.match(/<p[^>]*>([\s\S]*?)<\/p>/)

  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "786.Chat Generated Website"
  const description =
    paragraphMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ||
    "A premium generated website preview."

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
${css}
body{margin:0;background:#020617;color:white;font-family:Inter,system-ui,sans-serif}
</style>
</head>
<body>
<main class="min-h-screen bg-slate-950 text-white">
<section class="min-h-screen px-8 py-10 bg-[radial-gradient(circle_at_top_left,#f59e0b55,transparent_35%),radial-gradient(circle_at_top_right,#ef444455,transparent_35%),linear-gradient(135deg,#020617,#0f172a_75%)]">
<nav class="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/10 px-6 py-4">
<div class="text-xl font-black tracking-[0.28em] text-cyan-200">786.CHAT</div>
<div class="hidden gap-6 text-sm font-bold text-slate-300 md:flex">
<span>Home</span><span>Menu</span><span>Booking</span><span>Contact</span>
</div>
</nav>

<div class="mx-auto grid max-w-7xl items-center gap-12 py-20 lg:grid-cols-2">
<div>
<p class="text-sm font-black uppercase tracking-[0.35em] text-cyan-200">AI Generated Project</p>
<h1 class="mt-6 text-5xl font-black tracking-tight md:text-7xl">${title}</h1>
<p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${description}</p>
<div class="mt-10 flex gap-4">
<button class="rounded-full bg-cyan-300 px-7 py-4 font-black text-slate-950">Launch Project</button>
<button class="rounded-full border border-white/15 bg-white/10 px-7 py-4 font-black text-white">View Menu</button>
</div>
</div>

<div class="rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl">
<div class="rounded-[2rem] bg-black/30 p-6">
<h2 class="text-3xl font-black">Live Website Preview</h2>
<p class="mt-4 text-slate-300">This side is preview mode. Code stays inside the Code tab.</p>
<div class="mt-8 grid gap-4">
<div class="rounded-2xl border border-white/10 bg-white/10 p-5">Hero Section</div>
<div class="rounded-2xl border border-white/10 bg-white/10 p-5">Menu Section</div>
<div class="rounded-2xl border border-white/10 bg-white/10 p-5">Booking Section</div>
</div>
</div>
</div>
</div>
</section>
</main>
</body>
</html>`
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [project, setProject] = useState<SevenEightSixProject | null>(null)
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("auto")
  const [panel, setPanel] = useState<Panel>("preview")
  const [sending, setSending] = useState(false)
  const [sound, setSound] = useState(true)
  const [chatWidth, setChatWidth] = useState(430)
  const [isResizing, setIsResizing] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const previewHtml = useMemo(() => (project ? filesToHtml(project.files) : ""), [project])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    const savedWidth = Number(localStorage.getItem(CHAT_WIDTH_KEY))
    if (Number.isFinite(savedWidth) && savedWidth >= 360 && savedWidth <= 620) {
      setChatWidth(savedWidth)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth)))
  }, [chatWidth])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, sending])

  useEffect(() => {
    if (!isResizing) return

    const handleMove = (event: MouseEvent) => {
      const nextWidth = Math.min(Math.max(event.clientX - 92, 360), 620)
      setChatWidth(nextWidth)
    }

    const handleUp = () => setIsResizing(false)

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isResizing])

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
    setSelectedFile("app/page.tsx")
    setInput("")
    setPanel("preview")
    tone(true)
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return

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

      if (!res.ok || !json.success || !json.project) {
        throw new Error(json.error || "Project generation failed.")
      }

      setProject(json.project)
      setSelectedFile(json.project.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(json.project.files)[0])

      setMessages((old) => [
        ...old,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Created real project: ${json.project.title}\nFiles: ${Object.keys(json.project.files).length}\nPreview and Code are ready.`,
          model: json.model,
          reason: json.reason,
        },
      ])

      tone(true)
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Request failed.",
        },
      ])
      tone(false)
    } finally {
      setSending(false)
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
      <div className="flex h-full">
        <aside className="hidden w-[92px] shrink-0 border-r border-cyan-300/20 bg-[#06101c] pt-24 lg:block">
          <button
            onClick={() => router.push("/786-admin/projects")}
            className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.16)] transition hover:scale-105 hover:bg-cyan-300/25"
            title="Projects"
          >
            <FolderKanban className="h-5 w-5" />
          </button>
        </aside>

        <section
          className="relative flex h-full min-w-[360px] shrink-0 flex-col border-r border-cyan-300/30 bg-[#081322]"
          style={{ width: chatWidth }}
        >
          <header className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <button
              onClick={newChat}
              className="group relative inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50 shadow-[0_0_28px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:border-emerald-200/60 hover:bg-emerald-400/25"
            >
              <Plus className="relative h-4 w-4 animate-pulse" />
              <span className="relative">New Chat</span>
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setSound((v) => !v)}
                className="shrink-0 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/18"
              >
                Sound {sound ? "On" : "Off"}
              </button>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-[108px] rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100 outline-none transition hover:border-cyan-300/35"
              >
                <option value="auto">Auto</option>
                <option value="deepseek-flash">Flash</option>
                <option value="deepseek-pro">Pro</option>
                <option value="gemini-flash">Gemini Flash</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-40">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-500">
                <div className="mx-auto max-w-[300px]">
                  <p className="text-xl font-semibold text-cyan-100/90">Welcome back to 786.Chat</p>
                  <p className="mt-3 text-sm leading-6">New chat is empty. Send a build prompt to create real project files.</p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-4 rounded-3xl border p-4 text-sm leading-6 ${
                    m.role === "user"
                      ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                      : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"
                  }`}
                >
                  <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                    <span>{m.role === "user" ? "You" : "786.Chat"}</span>
                    {m.model && <span className="text-cyan-200">{m.model}</span>}
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.reason && <p className="mt-3 text-xs text-purple-200/80">{m.reason}</p>}
                </div>
              ))
            )}

            {sending && (
              <div className="mr-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <div className="flex items-center gap-3">
                  <Wand2 className="h-5 w-5 animate-pulse text-cyan-200" />
                  <span>786.Chat is creating real project files...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/95 p-4 backdrop-blur-xl">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.24)]">
              <Paperclip className="mt-2 h-5 w-5 shrink-0 text-slate-500" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Ask 786.Chat to build a real project..."
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 shadow-[0_0_24px_rgba(124,58,237,0.35)] transition hover:scale-105 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">
              New Chat is empty. Build prompt creates real files returned by the API.
            </div>
          </div>
        </section>

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            setIsResizing(true)
          }}
          className="group hidden h-full w-4 shrink-0 cursor-col-resize items-center justify-center border-r border-cyan-300/20 bg-[#050713] transition hover:bg-cyan-300/10 lg:flex"
          title="Drag to resize chat and preview"
        >
          <span className="flex h-24 w-2 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 opacity-70 transition group-hover:opacity-100">
            <GripVertical className="h-5 w-5" />
          </span>
        </button>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-400">
              <span className="block truncate">{project ? project.title : "No project yet"}</span>
            </div>
            <button
              onClick={() => setPanel("preview")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                panel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
              }`}
            >
              <Monitor className="mr-2 inline h-4 w-4" />Preview
            </button>
            <button
              onClick={() => setPanel("code")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
              }`}
            >
              <Code2 className="mr-2 inline h-4 w-4" />Code
            </button>
            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.22)] transition hover:scale-105">
              <Rocket className="mr-2 inline h-4 w-4" />Publish
            </button>
          </header>

          {panel === "preview" ? (
            project && previewHtml ? (
              <div className="flex min-h-0 flex-1 p-6">
                <iframe
                  key={project.id}
                  srcDoc={previewHtml}
                  title={`${project.title} preview`}
                  sandbox="allow-scripts allow-forms allow-popups"
                  className="min-h-0 flex-1 rounded-[2rem] border border-cyan-300/20 bg-white shadow-[0_0_70px_rgba(0,0,0,0.24)]"
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
                <div className="flex min-h-full w-full items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b111d]">
                  <div>
                    <Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" />
                    <h2 className="text-xl font-black text-slate-300">No Preview Yet</h2>
                    <p className="mt-2">New chat starts with empty preview and empty code.</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-4 p-6">
              <div className="min-h-0 overflow-auto rounded-3xl border border-white/10 bg-[#0d1320] p-3">
                {fileNames.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">No files yet.</p>
                ) : (
                  fileNames.map((file) => (
                    <button
                      key={file}
                      onClick={() => setSelectedFile(file)}
                      className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-bold transition ${
                        selectedFile === file ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {file}
                    </button>
                  ))
                )}
              </div>

              <pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50 shadow-[0_0_55px_rgba(0,0,0,0.22)]">
                <code>{project?.files?.[selectedFile] || "Select a file."}</code>
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
