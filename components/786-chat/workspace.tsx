"use client"

import {
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  FolderTree,
  Globe2,
  Loader2,
  Monitor,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Rocket,
  RotateCw,
  Send,
  Settings,
  Sparkles,
  TerminalSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/contexts/auth-context"
import { generateBuilderProject, loadBuilderBuild, loadBuilderProject, queueBuilderBuild, saveBuilderProject } from "./api"
import { BUILDER_DEVICES, type BuilderBuild, type BuilderDevice, type BuilderMessage, type BuilderProject } from "./contracts"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const OWNER_EMAIL = "mujeeb@job4u.com"

export function SevenEightSixWorkspace() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [project, setProject] = useState<BuilderProject | null>(null)
  const [messages, setMessages] = useState<BuilderMessage[]>([])
  const [prompt, setPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [showCode, setShowCode] = useState(false)
  const [device, setDevice] = useState<BuilderDevice>("desktop")
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [agentWidth, setAgentWidth] = useState(410)
  const [activityCollapsed, setActivityCollapsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [build, setBuild] = useState<BuilderBuild | null>(null)
  const [error, setError] = useState("")
  const drag = useRef<{ x: number; width: number } | null>(null)

  const isOwner = user?.email?.toLowerCase().trim() === OWNER_EMAIL
  const files = useMemo(() => Object.keys(project?.files || {}).sort(), [project])
  const deviceSpec = BUILDER_DEVICES[device]

  useEffect(() => {
    if (!isLoading && !isOwner) router.replace("/786-admin/login")
  }, [isLoading, isOwner, router])

  useEffect(() => {
    if (!isOwner) return
    const id = localStorage.getItem(ACTIVE_PROJECT_KEY)
    if (!id) return
    void loadBuilderProject(id)
      .then(({ project: saved, messages: history }) => {
        setProject(saved)
        setMessages(history)
        setSelectedFile(String(saved.previewState.active_file || "") || Object.keys(saved.files)[0] || "app/page.tsx")
      })
      .catch(() => localStorage.removeItem(ACTIVE_PROJECT_KEY))
  }, [isOwner])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!drag.current) return
      setAgentWidth(Math.max(320, Math.min(720, drag.current.width + event.clientX - drag.current.x)))
    }
    const stop = () => {
      drag.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
    }
  }, [])

  useEffect(() => {
    if (!project?.id || !build || !["queued", "running"].includes(build.status)) return
    const timer = window.setInterval(() => {
      void loadBuilderBuild(project.id).then(setBuild).catch(() => undefined)
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [project?.id, build])

  function startNewProject() {
    localStorage.removeItem(ACTIVE_PROJECT_KEY)
    setProject(null)
    setMessages([])
    setPrompt("")
    setError("")
    setShowCode(false)
    setBuild(null)
  }

  async function send() {
    const text = prompt.trim()
    if (!text || busy) return
    setPrompt("")
    setError("")
    setBusy(true)
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", content: text }])
    try {
      const generated = await generateBuilderProject({
        message: text,
        projectId: project?.id,
        attachments: [],
        existing: project ? {
          title: project.title,
          description: project.description,
          fileTree: files,
          keyFiles: project.files,
        } : undefined,
      })
      const saved = await saveBuilderProject({
        currentProjectId: project?.id || null,
        userPrompt: text,
        generated,
      })
      localStorage.setItem(ACTIVE_PROJECT_KEY, saved.id)
      setProject(saved)
      setSelectedFile(String(saved.previewState.active_file || "") || Object.keys(saved.files)[0] || "app/page.tsx")
      setMessages((current) => [...current, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: generated.response,
        model: generated.model,
        reason: generated.reason,
      }])
      try {
        setBuild(await queueBuilderBuild(saved.id))
      } catch (buildError) {
        setError(buildError instanceof Error ? buildError.message : "Build could not be queued.")
      }
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Generation failed."
      setError(message)
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", content: message }])
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !isOwner) {
    return <main className="grid min-h-screen place-items-center bg-[#050813] text-cyan-200"><Loader2 className="h-7 w-7 animate-spin" /></main>
  }

  return (
    <main className="relative flex h-screen overflow-hidden bg-[#050813] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.20),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,.14),transparent_34%)]" />

      <aside className={`relative z-10 flex shrink-0 flex-col border-r border-white/10 bg-[#080c18]/95 transition-[width] ${sidebarCollapsed ? "w-[72px]" : "w-[210px]"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400">
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          {!sidebarCollapsed && <span className="font-black">786.Chat</span>}
        </div>
        <div className="p-3">
          <button type="button" onClick={startNewProject} className={`flex h-11 w-full items-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 font-bold ${sidebarCollapsed ? "justify-center" : "gap-3 px-3"}`}>
            <Plus className="h-4 w-4" />{!sidebarCollapsed && "New project"}
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {[
            ["Build", Sparkles, "/786.chat"],
            ["Projects", FolderTree, "/786-admin/projects"],
            ["Domains", Globe2, "/786-admin/domains"],
            ["Settings", Settings, "/dashboard/settings"],
          ].map(([label, Icon, path], index) => {
            const ItemIcon = Icon as typeof Sparkles
            return <button key={String(label)} type="button" onClick={() => router.push(String(path))} className={`flex h-11 w-full items-center rounded-xl text-sm font-semibold ${sidebarCollapsed ? "justify-center" : "gap-3 px-3"} ${index === 0 ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/[0.06]"}`}><ItemIcon className="h-4 w-4" />{!sidebarCollapsed && String(label)}</button>
          })}
        </nav>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[#080c18]/85 px-4">
          <div className="min-w-0"><p className="truncate text-sm font-bold">{project?.title || "Untitled application"}</p><p className="text-[10px] text-slate-500">786.Chat workspace</p></div>
          <span className="mx-auto hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200 md:inline-flex"><CheckCircle2 className="h-3.5 w-3.5" />{build?.status === "passed" ? "Build verified" : build?.status === "failed" ? "Build failed" : build ? "Build running" : "Environment ready"}</span>
          <button type="button" onClick={() => setShowCode((value) => !value)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${showCode ? "border-violet-300/30 bg-violet-400/15" : "border-white/10 bg-white/[0.04] text-slate-300"}`}><Code2 className="h-4 w-4" />Code</button>
          <button data-786-publish type="button" disabled={!project} className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 to-amber-400 px-4 text-xs font-black text-slate-950 disabled:opacity-40"><Rocket className="h-4 w-4" />Deploy<ChevronDown className="h-3 w-3" /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          <section style={{ width: agentWidth }} className="relative flex shrink-0 flex-col border-r border-white/10 bg-[#080c18]/70">
            <div className="flex h-12 items-center gap-2 border-b border-white/10 px-4"><Sparkles className="h-4 w-4 text-violet-300" /><span className="text-xs font-black">AI Agent</span></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {messages.length === 0 && <div className="mt-16 text-center"><Sparkles className="mx-auto h-8 w-8 text-violet-300" /><h1 className="mt-5 text-lg font-black">What should we build?</h1><p className="mt-2 text-sm leading-6 text-slate-400">Describe the pages, features, interactions and visual direction.</p></div>}
              {messages.map((message) => <article key={message.id} className={`mb-4 rounded-2xl border p-4 text-sm leading-6 ${message.role === "user" ? "ml-6 border-violet-300/20 bg-violet-400/10" : "mr-6 border-white/10 bg-white/[0.04]"}`}><p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{message.role === "user" ? "You" : "786.Chat"}</p><p className="whitespace-pre-wrap text-slate-200">{message.content}</p></article>)}
              {busy && <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Analysing and building…</div>}
            </div>
            <div className="border-t border-white/10 bg-[#080c18] p-3">
              {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send() } }} rows={3} placeholder="Ask 786.Chat to build or change something…" className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-600" />
                <div className="flex justify-between"><button type="button" className="grid h-9 w-9 place-items-center text-slate-500"><Paperclip className="h-4 w-4" /></button><button type="button" onClick={() => void send()} disabled={busy || !prompt.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
              </div>
            </div>
            <button type="button" aria-label="Resize AI panel" onPointerDown={(event) => { drag.current = { x: event.clientX, width: agentWidth }; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none" }} className="absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize hover:bg-cyan-300/30" />
          </section>

          <section className="flex min-w-0 flex-1 flex-col bg-[#060a14]">
            <div className="flex h-12 items-center border-b border-white/10 px-4"><span className="text-xs font-black">{showCode ? "Project code" : "Live preview"}</span><div className="relative ml-auto">{!showCode && <button type="button" onClick={() => setDeviceOpen((value) => !value)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 px-3 text-[10px] font-bold text-slate-300"><Monitor className="h-3.5 w-3.5" />{deviceSpec.label}<ChevronDown className="h-3 w-3" /></button>}{deviceOpen && <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-white/10 bg-[#0b1020] p-2">{(Object.keys(BUILDER_DEVICES) as BuilderDevice[]).map((key) => <button key={key} type="button" onClick={() => { setDevice(key); setDeviceOpen(false) }} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10">{BUILDER_DEVICES[key].label}</button>)}</div>}</div><button type="button" className="ml-2 grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400"><RotateCw className="h-3.5 w-3.5" /></button></div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {showCode ? <div className="grid h-full grid-cols-[230px_1fr] overflow-hidden rounded-2xl border border-white/10"><div className="overflow-auto border-r border-white/10 p-3">{files.map((file) => <button key={file} type="button" onClick={() => setSelectedFile(file)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${selectedFile === file ? "bg-violet-400/15 text-violet-100" : "text-slate-400"}`}><FileCode2 className="h-3.5 w-3.5" /><span className="truncate">{file}</span></button>)}</div><pre className="overflow-auto p-5 text-xs leading-6 text-cyan-50"><code>{project?.files[selectedFile] || "No project files yet."}</code></pre></div> : <div className="flex h-full items-start justify-center overflow-auto rounded-2xl border border-white/10 bg-[#03060c] p-3">{build?.status === "passed" && build.deployment_url ? <iframe src={build.deployment_url} title={`${project?.title || "Project"} compiled preview`} sandbox="allow-scripts allow-forms allow-popups allow-same-origin" style={{ width: deviceSpec.width || "100%", height: deviceSpec.height || "100%", maxWidth: "100%" }} className="min-h-full rounded-xl border-0 bg-white" /> : <div style={{ width: deviceSpec.width || "100%", height: deviceSpec.height || "100%", maxWidth: "100%" }} className="grid min-h-full place-items-center rounded-xl border border-white/10 bg-[#07101d] px-6 text-center"><div>{build && ["queued", "running"].includes(build.status) ? <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" /> : <Monitor className="mx-auto h-10 w-10 text-cyan-300" />}<h2 className="mt-4 text-lg font-black">{build?.status === "failed" ? "Build failed" : build ? "Building verified preview" : "Your application will appear here"}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{build?.error_message || (build ? "Preview becomes available only after the isolated Next.js build passes." : "Describe the application you want to create.")}</p></div></div>}</div>}
            </div>
          </section>
        </div>

        <section className={`shrink-0 border-t border-white/10 bg-[#080c18] ${activityCollapsed ? "h-10" : "h-28"}`}><button type="button" onClick={() => setActivityCollapsed((value) => !value)} className="flex h-10 w-full items-center gap-2 px-4"><TerminalSquare className="h-4 w-4 text-cyan-300" /><span className="text-xs font-black">Build activity</span><ChevronDown className={`ml-auto h-4 w-4 ${activityCollapsed ? "-rotate-90" : ""}`} /></button>{!activityCollapsed && <div className="grid grid-cols-3 gap-3 px-4"><div className="rounded-xl border border-white/10 p-3 text-xs">Generation: {busy ? "Running" : project ? "Complete" : "Waiting"}</div><div className="rounded-xl border border-white/10 p-3 text-xs">Files: {files.length}</div><div className="rounded-xl border border-white/10 p-3 text-xs text-amber-200">Build: {build?.status || "Not queued"}</div></div>}</section>
      </div>
    </main>
  )
}
