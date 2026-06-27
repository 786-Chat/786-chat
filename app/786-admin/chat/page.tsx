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
import type {
  AdminMessage,
  AdminProjectPreviewState,
  AdminProjectWithData,
} from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_WIDTH_KEY = "786chat_admin_chat_width_v1"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"

type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string | null
  reason?: string | null
}

type ActiveProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: SevenEightSixProjectFileMap
  preview_state: AdminProjectPreviewState
}

function uiFromAdminMessage(message: AdminMessage): UiMessage {
  return {
    id: message.id,
    role: message.role === "system" ? "assistant" : message.role,
    content: message.content,
    model: message.model,
    reason: message.reason,
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function filesToHtml(files: SevenEightSixProjectFileMap) {
  const generatedPreview = files["preview/index.html"]
  if (generatedPreview && generatedPreview.trim().startsWith("<!doctype html")) {
    return generatedPreview
  }

  const page = files["app/page.tsx"] || ""
  const css = files["app/globals.css"] || ""
  const titleMatch = page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const paragraphMatch = page.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  const title = titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "786.Chat Generated Website"
  const description = paragraphMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "A premium generated website preview."

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><script src="https://cdn.tailwindcss.com"></script><style>${css}body{margin:0;background:#020617;color:white;font-family:Inter,system-ui,sans-serif}</style></head><body><main class="min-h-screen bg-slate-950 text-white"><section class="min-h-screen px-8 py-10 bg-[radial-gradient(circle_at_top_left,#22d3ee55,transparent_35%),radial-gradient(circle_at_top_right,#a855f755,transparent_35%),linear-gradient(135deg,#020617,#0f172a_75%)]"><div class="mx-auto max-w-6xl py-20"><p class="text-sm font-black uppercase tracking-[0.35em] text-cyan-200">Fallback Preview</p><h1 class="mt-6 text-6xl font-black">${escapeHtml(title)}</h1><p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${escapeHtml(description)}</p></div></section></main></body></html>`
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [project, setProject] = useState<ActiveProject | null>(null)
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<Mode>("auto")
  const [panel, setPanel] = useState<Panel>("preview")
  const [sending, setSending] = useState(false)
  const [sound, setSound] = useState(true)
  const [chatWidth, setChatWidth] = useState(430)
  const [isResizing, setIsResizing] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const previewHtml = useMemo(() => (project ? filesToHtml(project.files) : ""), [project])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    try {
      localStorage.removeItem(OLD_PROJECT_KEY)
      localStorage.removeItem(LEGACY_PROJECTS_KEY)
    } catch {}

    try {
      const savedWidth = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (Number.isFinite(savedWidth) && savedWidth >= 360 && savedWidth <= 620) {
        setChatWidth(savedWidth)
      }
    } catch {}

    let cancelled = false

    async function hydrate() {
      let activeId: string | null = null
      try {
        activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY)
      } catch {}

      if (!activeId) return

      try {
        const res = await fetch(`/api/786-admin/projects/${activeId}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 404) {
            try {
              localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
            } catch {}
          }
          return
        }

        const json = (await res.json()) as { project: AdminProjectWithData }
        if (cancelled || !json.project) return

        const saved = json.project
        setProject({
          id: saved.id,
          title: saved.title,
          description: saved.description,
          prompt: saved.prompt,
          files: saved.files || {},
          preview_state: saved.preview_state || {},
        })
        setMessages((saved.messages || []).map(uiFromAdminMessage))

        const initialFile =
          (saved.preview_state?.active_file as string | undefined) ||
          (saved.files?.["app/page.tsx"] ? "app/page.tsx" : Object.keys(saved.files || {})[0]) ||
          "app/page.tsx"
        setSelectedFile(initialFile)
      } catch {
        // Leave workspace empty if Neon is not reachable.
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth)))
    } catch {}
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
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
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
    try {
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
    } catch {}
    tone(true)
  }

  async function persistAfterGeneration(
    generated: SevenEightSixProject,
    userText: string,
    assistantText: string,
    assistantModel: string | null,
    assistantReason: string | null
  ): Promise<ActiveProject | null> {
    const activeFile =
      (generated.files?.["preview/index.html"]
        ? "preview/index.html"
        : generated.files?.["app/page.tsx"]
          ? "app/page.tsx"
          : Object.keys(generated.files || {})[0]) || "app/page.tsx"

    const previewStatePatch: AdminProjectPreviewState = {
      active_file: activeFile,
      entry_path: "app/page.tsx",
    }

    const metadataPatch = assistantModel ? { model: assistantModel } : undefined
    const messagesPayload = [
      { role: "user" as const, content: userText },
      {
        role: "assistant" as const,
        content: assistantText,
        model: assistantModel,
        reason: assistantReason,
      },
    ]

    const projectId = project?.id || null
    const url = projectId ? `/api/786-admin/projects/${projectId}` : "/api/786-admin/projects"
    const method = projectId ? "PATCH" : "POST"

    const body: Record<string, unknown> = {
      prompt: userText,
      preview_state: previewStatePatch,
      files: generated.files,
      messages: messagesPayload,
    }

    if (metadataPatch) body.metadata = metadataPatch
    if (!projectId) {
      body.title = generated.title
      body.description = generated.description
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`)

      const json = (await res.json()) as { project: AdminProjectWithData }
      const saved = json.project

      try {
        localStorage.setItem(ACTIVE_PROJECT_ID_KEY, saved.id)
      } catch {}

      return {
        id: saved.id,
        title: saved.title,
        description: saved.description,
        prompt: saved.prompt,
        files: saved.files || {},
        preview_state: saved.preview_state || {},
      }
    } catch (error) {
      console.error("[786.Chat] persistence failed", error)
      return null
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    const optimisticUser: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    }

    setMessages((old) => [...old, optimisticUser])
    setInput("")
    setSending(true)
    setPanel("preview")
    tone(false)

    try {
      const res = await fetch("/api/786-admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode,
          currentProject: project
            ? {
                id: project.id,
                title: project.title,
                description: project.description,
                prompt: project.prompt,
                files: project.files,
              }
            : null,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success || !json.project) {
        throw new Error(json.error || "Project generation failed.")
      }

      const generated: SevenEightSixProject = json.project
      const assistantText =
        json.response ||
        `Created real project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}\nPreview and Code are ready.`
      const assistantModel: string | null = json.model ?? null
      const assistantReason: string | null = json.reason ?? null

      const persisted = await persistAfterGeneration(
        generated,
        text,
        assistantText,
        assistantModel,
        assistantReason
      )

      if (persisted) {
        setProject(persisted)
        setMessages((current) => [
          ...current,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: assistantText,
            model: assistantModel,
            reason: assistantReason,
          },
        ])
        const initialFile =
          (persisted.preview_state.active_file as string | undefined) ||
          (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) ||
          "app/page.tsx"
        setSelectedFile(initialFile)
        tone(true)
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content:
              "Project was generated but could not be saved to Neon. Check DATABASE_URL and the admin persistence schema.",
          },
        ])
        tone(false)
      }
    } catch (error) {
      const errorMessage: UiMessage = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: error instanceof Error ? error.message : "Request failed.",
      }

      setMessages((old) => [...old, errorMessage])
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
              {project
                ? `Editing project "${project.title}" - changes save to Neon.`
                : "New Chat is empty. Build prompt creates real files saved to Neon."}
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
              <Monitor className="mr-2 inline h-4 w-4" />
              Preview
            </button>

            <button
              onClick={() => setPanel("code")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
              }`}
            >
              <Code2 className="mr-2 inline h-4 w-4" />
              Code
            </button>

            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.22)] transition hover:scale-105">
              <Rocket className="mr-2 inline h-4 w-4" />
              Publish
            </button>
          </header>

          {panel === "preview" ? (
            project && previewHtml ? (
              <div className="flex min-h-0 flex-1 p-6">
                <iframe
                  key={`${project.id}-${previewHtml.length}`}
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
