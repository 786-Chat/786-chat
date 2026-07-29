"use client"

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Copy,
  Database,
  ExternalLink,
  FileCode2,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Loader2,
  Logs,
  Monitor,
  Network,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Rocket,
  RotateCw,
  Save,
  Send,
  Settings,
  Sparkles,
  TerminalSquare,
  WandSparkles,
  Waves,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/contexts/auth-context"
import {
  generateBuilderProject,
  createBuilderRevision,
  deployBuilderProject,
  loadBuilderBuild,
  loadBuilderProject,
  listBuilderProjects,
  listBuilderRevisions,
  queueBuilderBuild,
  restoreBuilderRevision,
  saveBuilderProject,
} from "./api"
import {
  BUILDER_DEVICES,
  type BuilderBuild,
  type BuilderDeploymentResult,
  type BuilderDevice,
  type BuilderMessage,
  type BuilderProject,
  type BuilderProjectSummary,
  type BuilderRevision,
} from "./contracts"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const OWNER_EMAIL = "mujeeb@job4u.com"

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Projects", icon: FolderOpen },
  { label: "Agent Flow", icon: Network, active: true },
  { label: "Tasks", icon: ListChecks },
  { label: "Knowledge", icon: BookOpen },
  { label: "Data Sources", icon: Database },
  { label: "Integrations", icon: Plug },
  { label: "Secrets", icon: KeyRound },
  { label: "Settings", icon: Settings },
]

const stages = [
  { label: "Analyse", detail: "Understand requirements and explore context", icon: Sparkles, tone: "cyan" },
  { label: "Plan", detail: "Create implementation plan and architecture", icon: Network, tone: "violet" },
  { label: "Build", detail: "Generate and implement code", icon: Waves, tone: "blue" },
  { label: "Verify", detail: "Run tests and validate quality", icon: WandSparkles, tone: "emerald" },
  { label: "Deploy", detail: "Ship to production environment", icon: Rocket, tone: "amber" },
] as const

const toneClasses = {
  cyan: "border-cyan-300 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,.28)]",
  violet: "border-violet-400 text-violet-300 shadow-[0_0_25px_rgba(139,92,246,.28)]",
  blue: "border-blue-400 text-blue-300 shadow-[0_0_25px_rgba(59,130,246,.28)]",
  emerald: "border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,.28)]",
  amber: "border-amber-300 text-amber-200 shadow-[0_0_25px_rgba(251,191,36,.28)]",
}

function planItems(project: BuilderProject | null) {
  if (!project) {
    return [
      ["Architecture & Data Model", "Waiting for project requirements"],
      ["Responsive Application Layout", "Waiting for design direction"],
      ["Routes & Core Components", "Waiting for requested pages"],
      ["Interactions & Validation", "Waiting for requested features"],
    ]
  }
  const routeCount = Object.keys(project.files).filter((path) => /(?:^|\/)page\.(tsx?|jsx?)$/.test(path)).length
  return [
    ["Architecture & Data Model", "Project specification and implementation plan created"],
    ["Responsive Application Layout", "Desktop, tablet and mobile structure generated"],
    ["Routes & Core Components", `${routeCount} application route${routeCount === 1 ? "" : "s"} available`],
    ["Interactions & Validation", "Requested controls and navigation checked"],
  ]
}

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
  const [agentWidth, setAgentWidth] = useState(730)
  const [bottomCollapsed, setBottomCollapsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [build, setBuild] = useState<BuilderBuild | null>(null)
  const [error, setError] = useState("")
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [projects, setProjects] = useState<BuilderProjectSummary[]>([])
  const [revisions, setRevisions] = useState<BuilderRevision[]>([])
  const [panelBusy, setPanelBusy] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployType, setDeployType] = useState<"path" | "subdomain" | "custom">("path")
  const [deployValue, setDeployValue] = useState("")
  const [deployResult, setDeployResult] = useState<BuilderDeploymentResult | null>(null)
  const drag = useRef<{ x: number; width: number } | null>(null)

  const isOwner = user?.email?.toLowerCase().trim() === OWNER_EMAIL
  const files = useMemo(() => Object.keys(project?.files || {}).sort(), [project])
  const deviceSpec = BUILDER_DEVICES[device]
  const currentStage = build?.status === "passed" ? 5 : build ? 4 : project ? 3 : busy ? 1 : 0

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
        setSelectedFile(
          String(saved.previewState.active_file || "") ||
            Object.keys(saved.files)[0] ||
            "app/page.tsx",
        )
        void loadBuilderBuild(saved.id).then(setBuild).catch(() => undefined)
        void listBuilderRevisions(saved.id).then(setRevisions).catch(() => undefined)
      })
      .catch(() => localStorage.removeItem(ACTIVE_PROJECT_KEY))
  }, [isOwner])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!drag.current) return
      const max = Math.max(520, window.innerWidth - 520)
      setAgentWidth(Math.max(520, Math.min(max, drag.current.width + event.clientX - drag.current.x)))
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
    setRevisions([])
  }

  async function openProjects() {
    setError("")
    setPanelBusy(true)
    setProjectsOpen(true)
    try {
      setProjects(await listBuilderProjects())
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Projects could not be loaded.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function openProject(projectId: string) {
    setPanelBusy(true)
    setError("")
    try {
      const loaded = await loadBuilderProject(projectId)
      localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
      setProject(loaded.project)
      setMessages(loaded.messages)
      setSelectedFile(
        String(loaded.project.previewState.active_file || "") ||
          Object.keys(loaded.project.files)[0] ||
          "app/page.tsx",
      )
      const [latestBuild, savedRevisions] = await Promise.all([
        loadBuilderBuild(projectId),
        listBuilderRevisions(projectId),
      ])
      setBuild(latestBuild)
      setRevisions(savedRevisions)
      setProjectsOpen(false)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Project could not be opened.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function saveCheckpoint() {
    if (!project || panelBusy) return
    setPanelBusy(true)
    setError("")
    try {
      await createBuilderRevision(project.id)
      setRevisions(await listBuilderRevisions(project.id))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Checkpoint could not be saved.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function restoreCheckpoint(revisionId: string) {
    if (!project || panelBusy) return
    setPanelBusy(true)
    setError("")
    try {
      const restored = await restoreBuilderRevision(project.id, revisionId)
      setProject(restored.project)
      setMessages(restored.messages)
      setSelectedFile(
        String(restored.project.previewState.active_file || "") ||
          Object.keys(restored.project.files)[0] ||
          "app/page.tsx",
      )
      setBuild(null)
      setRevisions(await listBuilderRevisions(project.id))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Revision could not be restored.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function deployVerifiedProject() {
    if (!project || build?.status !== "passed" || panelBusy) return
    setPanelBusy(true)
    setError("")
    setDeployResult(null)
    try {
      setDeployResult(await deployBuilderProject({
        projectId: project.id,
        addressType: deployType,
        addressValue: deployValue,
      }))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Deployment failed.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function retryBuild() {
    if (!project || panelBusy || busy) return
    setPanelBusy(true)
    setError("")
    try {
      setBuild(await queueBuilderBuild(project.id))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Build could not be retried.")
    } finally {
      setPanelBusy(false)
    }
  }

  async function send() {
    const text = prompt.trim()
    if (!text || busy) return
    setPrompt("")
    setError("")
    setBusy(true)
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ])
    try {
      const generated = await generateBuilderProject({
        message: text,
        projectId: project?.id,
        attachments: [],
        existing: project
          ? {
              title: project.title,
              description: project.description,
              fileTree: files,
              keyFiles: project.files,
            }
          : undefined,
      })
      const saved = await saveBuilderProject({
        currentProjectId: project?.id || null,
        userPrompt: text,
        generated,
      })
      localStorage.setItem(ACTIVE_PROJECT_KEY, saved.id)
      setProject(saved)
      setSelectedFile(
        String(saved.previewState.active_file || "") ||
          Object.keys(saved.files)[0] ||
          "app/page.tsx",
      )
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: generated.response,
          model: generated.model,
          reason: generated.reason,
        },
      ])
      try {
        setBuild(await queueBuilderBuild(saved.id))
      } catch (buildError) {
        setError(buildError instanceof Error ? buildError.message : "Build could not be queued.")
      }
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Generation failed."
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !isOwner) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050813] text-cyan-200">
        <Loader2 className="h-7 w-7 animate-spin" />
      </main>
    )
  }

  return (
    <main className="relative flex h-screen min-w-[1000px] overflow-hidden bg-[#050813] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_4%,rgba(124,58,237,.12),transparent_26%),radial-gradient(circle_at_75%_0%,rgba(14,165,233,.08),transparent_28%)]" />

      <aside className={`relative z-20 flex shrink-0 flex-col border-r border-[#1b2940] bg-[#070c18] transition-[width] ${sidebarCollapsed ? "w-[70px]" : "w-[176px]"}`}>
        <div className="flex h-[58px] items-center gap-3 border-b border-[#1b2940] px-4">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="text-violet-300"
            aria-label="Toggle navigation"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          {!sidebarCollapsed && (
            <span className="bg-gradient-to-r from-violet-400 to-white bg-clip-text text-[25px] font-black tracking-[-0.06em] text-transparent">
              786.Chat
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-3">
          {navigation.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.label}>
                {index === 2 && !sidebarCollapsed && (
                  <p className="mb-2 mt-5 px-2 text-[13px] font-bold uppercase tracking-[.16em] text-slate-600">Project</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (item.label === "Overview") router.push("/786.chat")
                    if (item.label === "Projects") void openProjects()
                  }}
                  className={`mb-1 flex h-10 w-full items-center rounded-lg py-2.5 text-[13px] transition ${
                    sidebarCollapsed ? "justify-center" : "gap-3 px-2"
                  } ${item.active ? "border-l-2 border-violet-400 bg-[#151b31] text-white" : "text-slate-400 hover:bg-white/[.04] hover:text-white"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {!sidebarCollapsed && item.label}
                  {!sidebarCollapsed && item.label === "Overview" && <ChevronRight className="ml-auto h-3 w-3 text-violet-400" />}
                </button>
              </div>
            )
          })}
          {!sidebarCollapsed && (
            <p className="mb-2 mt-7 px-2 text-[13px] font-bold uppercase tracking-[.16em] text-slate-600">Support</p>
          )}
          {[
            ["Logs", Logs],
            ["Help & Docs", LifeBuoy],
          ].map(([label, Icon]) => {
            const SupportIcon = Icon as typeof Logs
            return (
              <button key={String(label)} type="button" className={`flex w-full items-center rounded-lg py-2.5 text-[13px] text-slate-400 hover:bg-white/[.04] ${sidebarCollapsed ? "justify-center" : "gap-3 px-2"}`}>
                <SupportIcon className="h-3.5 w-3.5" />
                {!sidebarCollapsed && String(label)}
              </button>
            )
          })}
        </nav>

        <button type="button" onClick={startNewProject} className="m-2 flex items-center gap-3 rounded-xl border border-[#24324d] bg-[#10172a] p-2 text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/25 text-sm font-bold text-violet-200">78</span>
          {!sidebarCollapsed && <span><b className="block text-[14px]">New project</b><span className="text-[13px] text-slate-500">Start clean workspace</span></span>}
        </button>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-[58px] shrink-0 items-center border-b border-[#1b2940] bg-[#070c18]/95 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded border border-slate-600"><Circle className="h-2 w-2 fill-slate-300" /></span>
            <p className="truncate text-[13px] font-bold">{project?.title || "Untitled application"}</p>
            {project && <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[14px] uppercase text-violet-300">Live project</span>}
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </div>
          <div className="mx-auto flex items-center gap-2">
            <span className="rounded-lg border border-violet-400/15 bg-violet-500/10 px-3 py-1.5 text-[13px] font-semibold text-violet-200">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking &amp; analysing
                </span>
              ) : (
                <>✦ {project ? "Design generated" : "Ready to analyse"}</>
              )}
            </span>
            <span className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${build?.status === "failed" ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : "border-emerald-400/15 bg-emerald-500/10 text-emerald-200"}`}>
              {build?.status === "passed" ? "✓ Build passed" : build ? `○ Build ${build.status}` : "○ Build not queued"}
            </span>
          </div>
          <button type="button" onClick={() => setShowCode((value) => !value)} className={`mr-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[12px] font-bold ${showCode ? "border-violet-300/30 bg-violet-400/15" : "border-[#263550] bg-[#0d1526]"}`}>
            <Code2 className="h-3.5 w-3.5 text-cyan-300" /> Code
          </button>
          <button data-786-publish type="button" onClick={() => { setError(""); setDeployResult(null); setDeployOpen(true) }} disabled={!project || build?.status !== "passed"} className="inline-flex h-9 items-center gap-3 rounded-lg bg-gradient-to-r from-amber-200 to-amber-400 px-5 text-[13px] font-black text-slate-950 shadow-[0_0_22px_rgba(251,191,36,.16)] disabled:opacity-40">
            <Rocket className="h-3.5 w-3.5" /> Deploy <ChevronDown className="h-3 w-3" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <section style={{ width: agentWidth }} className="relative flex shrink-0 border-r border-[#1b2940] bg-[#080e1c]/90">
            <div className="flex w-[180px] shrink-0 flex-col border-r border-[#1b2940] px-4 py-5">
              <p className="mb-8 flex items-center gap-2 text-[14px] font-bold text-violet-200"><Sparkles className="h-3.5 w-3.5" /> AI Agent</p>
              <div className="relative">
                <div className="absolute bottom-6 left-[22px] top-6 w-[3px] overflow-hidden rounded-full bg-gradient-to-b from-cyan-400/35 via-violet-500/35 to-amber-300/35">
                  <span className="stage-flow absolute inset-x-0 h-20 rounded-full bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_14px_rgba(125,211,252,.9)]" />
                </div>
                {stages.map((stage, index) => {
                  const Icon = stage.icon
                  const active = index < currentStage || (busy && index === 0)
                  const isCurrent =
                    (busy && index === 0) ||
                    (!busy &&
                      currentStage > 0 &&
                      index === Math.min(currentStage - 1, stages.length - 1))
                  return (
                    <div key={stage.label} className="relative mb-8 flex gap-3 last:mb-0">
                      <span className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full ${toneClasses[stage.tone]} ${active ? "" : "opacity-45"}`}>
                        {isCurrent && (
                          <span className="absolute -inset-1 animate-spin rounded-full border border-transparent border-r-current border-t-current opacity-90" />
                        )}
                        <span className="absolute inset-0 rounded-full border border-current bg-[#0a1221] shadow-[inset_0_0_18px_rgba(255,255,255,.035)]" />
                        {busy && index === 0 ? <Loader2 className="relative h-4 w-4 animate-spin" /> : <Icon className="relative h-4 w-4" />}
                      </span>
                      <div className="pt-2">
                        <p className={`text-[14px] font-bold ${active ? "text-white" : "text-slate-500"}`}><span className="mr-2 text-slate-500">{index + 1}</span>{stage.label}</p>
                        <p className="mt-1 text-[14px] leading-3 text-slate-600">{stage.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-10 items-center border-b border-[#1b2940] px-3 text-[14px] font-bold"><Sparkles className="mr-2 h-3.5 w-3.5 text-violet-300" />Agent Flow</div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-[#24324d] bg-[#10182b] p-4">
                    <p className="text-[12px] font-bold text-violet-200">Start with a clear application brief</p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-400">Describe the application, pages, users, interactions, backend needs and visual direction. 786.Chat will analyse, plan, generate, validate and build it.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <article key={message.id} className={`mb-2 rounded-xl border p-3 ${message.role === "user" ? "border-[#2b3b5d] bg-[#111a2e]" : "border-violet-400/20 bg-violet-500/[.07]"}`}>
                      <p className="mb-2 text-[13px] font-bold text-slate-300">{message.role === "user" ? "● You" : "✦ AI Agent"}</p>
                      <p className="whitespace-pre-wrap text-[12px] leading-5 text-slate-400">{message.content}</p>
                    </article>
                  ))
                )}

                <div className="mt-2 overflow-hidden rounded-xl border border-[#263550] bg-[#0b1221]">
                  <div className="border-b border-[#263550] px-3 py-2 text-[13px] font-bold">Implementation plan</div>
                  {planItems(project).map(([title, detail], index) => (
                    <div key={title} className="flex items-center gap-2 border-b border-[#1d2a41] px-3 py-2.5 last:border-0">
                      <span className={`grid h-4 w-4 place-items-center rounded-full border ${project ? "border-emerald-400 text-emerald-300" : "border-slate-600 text-slate-600"}`}>
                        {project ? <Check className="h-2.5 w-2.5" /> : <Circle className="h-2 w-2" />}
                      </span>
                      <span className="min-w-0 flex-1"><b className="block text-[13px]">{title}</b><span className="text-[12px] text-slate-600">{detail}</span></span>
                      <ChevronRight className="h-3 w-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1b2940] p-2">
                {error && <p className="mb-1 rounded-lg bg-rose-500/10 px-2 py-1 text-[13px] text-rose-200">{error}</p>}
                <div className="flex items-center rounded-lg border border-[#263550] bg-[#0c1424] px-2">
                  <button type="button" className="text-slate-500"><Paperclip className="h-3.5 w-3.5" /></button>
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send() } }} rows={1} placeholder="Ask the agent anything…" className="min-h-10 flex-1 resize-none bg-transparent px-2 py-3 text-[12px] outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={() => void send()} disabled={busy || !prompt.trim()} className="grid h-7 w-7 place-items-center rounded-full bg-violet-500 text-white disabled:opacity-40"><Send className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[14px] text-slate-500">
                  <span className="rounded bg-violet-500/25 py-1 text-violet-200">Auto</span><span className="py-1">Plan</span><span className="py-1">Build</span><span className="py-1">Refactor</span>
                </div>
              </div>
            </div>

            <button type="button" aria-label="Resize AI panel" onPointerDown={(event) => { drag.current = { x: event.clientX, width: agentWidth }; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none" }} className="absolute -right-1 top-0 z-30 h-full w-2 cursor-col-resize hover:bg-cyan-300/25" />
          </section>

          <section className="flex min-w-0 flex-1 flex-col bg-[#060b16]">
            <div className="flex h-10 items-center border-b border-[#1b2940] px-3">
              <span className="text-[14px] font-bold">{showCode ? "Project code" : "Live preview"}</span>
              <div className="relative ml-auto">
                {!showCode && (
                  <button type="button" onClick={() => setDeviceOpen((value) => !value)} className="inline-flex h-7 items-center gap-2 rounded-md border border-[#263550] bg-[#0c1424] px-3 text-[14px] font-bold text-slate-300">
                    <Monitor className="h-3 w-3" />{deviceSpec.label}<ChevronDown className="h-3 w-3" />
                  </button>
                )}
                {deviceOpen && (
                  <div className="absolute right-0 top-9 z-40 w-52 rounded-xl border border-[#263550] bg-[#0b1020] p-2 shadow-2xl">
                    {(Object.keys(BUILDER_DEVICES) as BuilderDevice[]).map((key) => (
                      <button key={key} type="button" onClick={() => { setDevice(key); setDeviceOpen(false) }} className="block w-full rounded-lg px-3 py-2 text-left text-[12px] text-slate-300 hover:bg-white/10">{BUILDER_DEVICES[key].label}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="ml-2 text-slate-500"><RotateCw className="h-3 w-3" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-2">
              {showCode ? (
                <div className="grid h-full grid-cols-[220px_1fr] overflow-hidden rounded-lg border border-[#263550] bg-[#07101d]">
                  <div className="overflow-auto border-r border-[#263550] p-2">
                    {files.length === 0 && <p className="p-2 text-[13px] text-slate-600">No project files yet.</p>}
                    {files.map((file) => (
                      <button key={file} type="button" onClick={() => setSelectedFile(file)} className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[13px] ${selectedFile === file ? "bg-violet-400/15 text-violet-100" : "text-slate-500"}`}>
                        <FileCode2 className="h-3 w-3" /><span className="truncate">{file}</span>
                      </button>
                    ))}
                  </div>
                  <pre className="overflow-auto p-4 text-[12px] leading-5 text-cyan-50"><code>{project?.files[selectedFile] || "No project files yet."}</code></pre>
                </div>
              ) : (
                <div className="flex h-full items-start justify-center overflow-auto rounded-lg border border-[#263550] bg-[#07101d] p-2">
                  {build?.status === "passed" && build.deployment_url ? (
                    <iframe src={build.deployment_url} title={`${project?.title || "Project"} compiled preview`} sandbox="allow-scripts allow-forms allow-popups allow-same-origin" style={{ width: deviceSpec.width || "100%", height: deviceSpec.height || "100%", maxWidth: "100%" }} className="min-h-full rounded-md border-0 bg-white" />
                  ) : (
                    <div style={{ width: deviceSpec.width || "100%", height: deviceSpec.height || "100%", maxWidth: "100%" }} className="grid min-h-full place-items-center rounded-md border border-[#1f2d45] bg-[radial-gradient(circle_at_50%_30%,rgba(30,64,175,.10),transparent_38%),#08111f] px-6 text-center">
                      <div>
                        {build && ["queued", "running"].includes(build.status) ? <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-300" /> : <Monitor className="mx-auto h-9 w-9 text-cyan-300" />}
                        <h2 className="mt-4 text-[14px] font-black">{build?.status === "failed" ? "Build failed" : build ? "Building verified preview" : "Your application will appear here"}</h2>
                        <p className="mt-2 max-w-sm text-[12px] leading-5 text-slate-500">{build?.error_message || (build ? "Preview becomes available only after the isolated Next.js build passes." : "Describe the production application you want to create.")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`relative shrink-0 border-t border-[#1b2940] bg-[#070c18] transition-[height] ${bottomCollapsed ? "h-0 overflow-visible" : "h-[184px]"}`}>
          {!bottomCollapsed && (
            <div className="grid h-full grid-cols-[.86fr_1.14fr] gap-2 p-2">
              <article className="rounded-lg border border-[#263550] bg-[#0a1120] p-3">
                <div className="flex items-center">
                  <b className="text-[12px]">Build sandbox</b>
                  {project && build && !["queued", "running"].includes(build.status) ? (
                    <button type="button" onClick={() => void retryBuild()} disabled={panelBusy || busy} className="ml-auto inline-flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-400/10 px-2.5 py-1 text-[12px] font-bold text-cyan-100 disabled:opacity-40">
                      {panelBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                      {build.status === "passed" ? "Rebuild" : "Retry build"}
                    </button>
                  ) : (
                    <span className="ml-auto rounded border border-[#263550] px-2 py-1 text-[12px] text-slate-500">Isolated environment</span>
                  )}
                </div>
                <div className="mt-3 flex h-[112px] items-center rounded-lg border border-dashed border-[#263550] px-4">
                  <span className="mr-4 grid h-10 w-10 place-items-center rounded-full border border-[#345078] text-cyan-300"><TerminalSquare className="h-4 w-4" /></span>
                  <div>
                    <b className="text-[13px]">{build ? `Build ${build.status}` : "No build has run"}</b>
                    <p className="mt-1 text-[12px] text-slate-600">
                      {build?.status === "failed"
                        ? build.error_message || "The isolated build failed. Review the captured logs and retry."
                        : build?.status === "passed"
                          ? "Install, type-check and Next.js build completed successfully."
                          : "The isolated build sandbox starts after validated files are saved."}
                    </p>
                  </div>
                </div>
              </article>
              <article className="min-w-0 rounded-lg border border-[#263550] bg-[#0a1120] p-3">
                <div className="flex items-center gap-2">
                  <b className="text-[12px]">Revisions</b>
                  <span className="rounded bg-white/[.04] px-2 py-1 text-[12px] text-slate-500">
                    {project ? `${revisions.length} saved` : "No project"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void saveCheckpoint()}
                    disabled={!project || panelBusy}
                    className="ml-auto inline-flex items-center gap-2 rounded-md border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-[12px] font-bold text-violet-100 disabled:opacity-40"
                  >
                    {panelBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save checkpoint
                  </button>
                </div>
                <div className="mt-3 h-[112px] overflow-y-auto rounded-lg border border-[#263550]">
                  {!project || revisions.length === 0 ? (
                    <div className="flex h-full items-center px-4">
                      <span className="mr-4 grid h-10 w-10 place-items-center rounded-full border border-[#345078] text-violet-300"><History className="h-4 w-4" /></span>
                      <div><b className="text-[13px]">{project ? "No saved revisions" : "Create a project first"}</b><p className="mt-1 text-[12px] text-slate-600">Manual checkpoints and automatic repair snapshots appear here.</p></div>
                    </div>
                  ) : (
                    revisions.map((revision) => (
                      <div key={revision.id} className="flex items-center gap-3 border-b border-[#1d2a41] px-3 py-2 last:border-0">
                        <History className="h-3.5 w-3.5 text-violet-300" />
                        <span className="min-w-0 flex-1">
                          <b className="block truncate text-[12px]">{revision.label}</b>
                          <span className="text-[12px] text-slate-600">{new Date(revision.created_at).toLocaleString()} · {revision.source}</span>
                        </span>
                        <button type="button" onClick={() => void restoreCheckpoint(revision.id)} disabled={panelBusy} className="rounded border border-[#345078] px-2 py-1 text-[12px] font-bold text-cyan-200 disabled:opacity-40">Restore</button>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
          )}
          <button type="button" onClick={() => setBottomCollapsed((value) => !value)} className="absolute bottom-1 left-1/2 z-40 -translate-x-1/2 rounded-full border border-blue-300/30 bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-1.5 text-[12px] font-bold shadow-[0_0_24px_rgba(59,130,246,.32)]">
            {bottomCollapsed ? "Show bottom panel" : "Hide bottom panel"}
          </button>
        </section>
      </div>
      {projectsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5 backdrop-blur-md">
          <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-violet-300/25 bg-[#09101f] shadow-[0_40px_120px_rgba(0,0,0,.75)]">
            <header className="flex items-center border-b border-[#263550] p-5">
              <div>
                <h2 className="text-xl font-black">Projects</h2>
                <p className="mt-1 text-[13px] text-slate-400">Open a saved application with its files, messages, revisions and latest build.</p>
              </div>
              <button type="button" onClick={() => setProjectsOpen(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/10" aria-label="Close projects"><X className="h-4 w-4" /></button>
            </header>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {panelBusy && projects.length === 0 ? (
                <div className="grid h-40 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-300" /></div>
              ) : projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#345078] p-8 text-center text-[13px] text-slate-400">No saved projects yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.map((saved) => (
                    <button key={saved.id} type="button" onClick={() => void openProject(saved.id)} disabled={panelBusy} className="rounded-2xl border border-[#263550] bg-[#10182b] p-4 text-left transition hover:border-cyan-300/40 hover:bg-[#131e35] disabled:opacity-40">
                      <span className="block truncate text-[14px] font-black">{saved.title}</span>
                      <span className="mt-2 line-clamp-2 block min-h-10 text-[12px] leading-5 text-slate-400">{saved.description || "No description"}</span>
                      <span className="mt-3 flex gap-3 text-[12px] text-slate-500"><span>{saved.file_count} files</span><span>{saved.message_count} messages</span><span className="ml-auto">{new Date(saved.updated_at).toLocaleDateString()}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {deployOpen && project && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/85 p-5 backdrop-blur-md">
          <section className="my-5 w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-300/25 bg-gradient-to-br from-[#09101f] via-[#11102b] to-[#21103b] shadow-[0_40px_120px_rgba(0,0,0,.8)]">
            <header className="flex items-start border-b border-white/10 p-6">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[.18em] text-emerald-300">Verified build ready</p>
                <h2 className="mt-2 text-2xl font-black">Deploy {project.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-slate-400">Every address below points to the exact compiled build that passed validation.</p>
              </div>
              <button type="button" onClick={() => setDeployOpen(false)} disabled={panelBusy} className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/10 disabled:opacity-40" aria-label="Close deployment"><X className="h-4 w-4" /></button>
            </header>
            <div className="p-6">
              {!deployResult ? (
                <>
                  <div className="grid gap-3">
                    {([
                      ["path", "786.Chat project link", `786.chat/p/${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, "Immediate · no DNS"],
                      ["subdomain", "786.Chat subdomain", `${deployValue || "customer-app"}.786.chat`, "Free SSL"],
                      ["custom", "Customer-owned domain", deployValue || "app.customer.com", "DNS verification"],
                    ] as const).map(([value, title, example, detail]) => (
                      <button key={value} type="button" onClick={() => { setDeployType(value); setDeployValue("") }} className={`rounded-2xl border p-4 text-left transition ${deployType === value ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-white/[.035] hover:border-white/20"}`}>
                        <span className="flex items-center"><b className="text-[14px]">{title}</b><span className="ml-auto text-[12px] text-slate-500">{detail}</span></span>
                        <span className="mt-2 block text-[13px] font-bold text-cyan-200">{example}</span>
                      </button>
                    ))}
                  </div>
                  {deployType !== "path" && (
                    <label className="mt-4 block">
                      <span className="mb-2 block text-[12px] font-bold text-slate-300">{deployType === "subdomain" ? "Subdomain name" : "Complete customer domain"}</span>
                      <div className="flex rounded-xl border border-white/10 bg-slate-950/50 focus-within:border-cyan-300/50">
                        <input value={deployValue} onChange={(event) => setDeployValue(event.target.value)} placeholder={deployType === "subdomain" ? "customer-app" : "app.customer.com"} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[13px] outline-none" />
                        {deployType === "subdomain" && <span className="self-center pr-4 text-[13px] text-slate-400">.786.chat</span>}
                      </div>
                    </label>
                  )}
                  {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 p-3 text-[13px] text-rose-100">{error}</p>}
                  <button type="button" onClick={() => void deployVerifiedProject()} disabled={panelBusy || (deployType !== "path" && !deployValue.trim())} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 to-amber-400 px-5 py-3 text-[14px] font-black text-slate-950 disabled:opacity-40">
                    {panelBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                    Deploy verified build
                  </button>
                </>
              ) : (
                <div>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-200"><Check className="h-7 w-7" /></div>
                  <h3 className="mt-4 text-xl font-black">Deployment recorded</h3>
                  <p className="mt-2 break-all text-[13px] font-bold text-cyan-200">{deployResult.requestedUrl}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]">
                    <span className="rounded-lg bg-white/5 p-2">DNS: {deployResult.domain.dns_status}</span>
                    <span className="rounded-lg bg-white/5 p-2">SSL: {deployResult.domain.ssl_status}</span>
                    <span className="rounded-lg bg-white/5 p-2">App: {deployResult.domain.status}</span>
                  </div>
                  {deployResult.domain.dns_records?.map((record, index) => (
                    <div key={`${record.type}-${index}`} className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 p-3 text-[12px]">
                      <b className="text-violet-200">{record.type}</b>
                      <span className="min-w-0 flex-1 break-all">{record.name} → {record.value}</span>
                      <button type="button" onClick={() => void navigator.clipboard.writeText(record.value)} aria-label="Copy DNS value"><Copy className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDeployOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-[13px] font-bold">Close</button>
                    <a href={deployResult.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-violet-300 px-4 py-3 text-[13px] font-black text-slate-950">Open deployment <ExternalLink className="h-4 w-4" /></a>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      <style jsx>{`
        @keyframes stage-flow {
          0% {
            top: -5rem;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        .stage-flow {
          animation: stage-flow 2.8s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
