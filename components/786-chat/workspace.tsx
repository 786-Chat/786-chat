"use client"

import {
  ArrowDown,
  ArrowUp,
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
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Rocket,
  RotateCw,
  Redo2,
  Save,
  Send,
  Settings,
  Sparkles,
  TerminalSquare,
  Trash2,
  Undo2,
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
  deleteBuilderProject,
  deployBuilderProject,
  loadBuilderBuild,
  loadBuilderProject,
  listBuilderProjects,
  listBuilderRevisions,
  queueBuilderBuild,
  restoreBuilderRevision,
  saveBuilderProject,
  saveVisualEditorState,
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
import {
  EMPTY_VISUAL_EDITOR_STATE,
  normalizeVisualEditorState,
  type VisualEditorState,
  type VisualEditorStyle,
} from "@/lib/786-chat/visual-editor"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const OWNER_EMAIL = "mujeeb@job4u.com"

type EditorSection = { id: string; label: string; hidden: boolean }

function copyEditorState(state: VisualEditorState): VisualEditorState {
  return JSON.parse(JSON.stringify(state)) as VisualEditorState
}

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
  const [projectToDelete, setProjectToDelete] = useState<BuilderProjectSummary | null>(null)
  const [revisions, setRevisions] = useState<BuilderRevision[]>([])
  const [panelBusy, setPanelBusy] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployType, setDeployType] = useState<"path" | "subdomain" | "custom">("path")
  const [deployValue, setDeployValue] = useState("")
  const [deployResult, setDeployResult] = useState<BuilderDeploymentResult | null>(null)
  const [designOpen, setDesignOpen] = useState(false)
  const [editorSections, setEditorSections] = useState<EditorSection[]>([])
  const [selectedSection, setSelectedSection] = useState("")
  const [visualState, setVisualState] = useState<VisualEditorState>(EMPTY_VISUAL_EDITOR_STATE)
  const [undoStack, setUndoStack] = useState<VisualEditorState[]>([])
  const [redoStack, setRedoStack] = useState<VisualEditorState[]>([])
  const [visualDirty, setVisualDirty] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const drag = useRef<{ x: number; width: number } | null>(null)
  const sectionDrag = useRef<string | null>(null)
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null)

  const isOwner = user?.email?.toLowerCase().trim() === OWNER_EMAIL
  const files = useMemo(() => Object.keys(project?.files || {}).sort(), [project])
  const deviceSpec = BUILDER_DEVICES[device]
  const currentStage = build?.status === "passed" ? 5 : build ? 4 : project ? 3 : busy ? 1 : 0
  const selectedStyle: VisualEditorStyle = visualState.styles[selectedSection] || {}
  const orderedSections = useMemo(() => {
    const map = new Map(editorSections.map((section) => [section.id, section]))
    const ordered = visualState.order.flatMap((id) => {
      const section = map.get(id)
      return section ? [section] : []
    })
    for (const section of editorSections) {
      if (!visualState.order.includes(section.id)) ordered.push(section)
    }
    return ordered
  }, [editorSections, visualState.order])

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
        setVisualState(saved.visualEditor)
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
      void loadBuilderBuild(project.id).then((next) => {
        setBuild(next)
        if (next?.status === "passed") setVisualDirty(false)
      }).catch(() => undefined)
    }, 5_000)
    return () => window.clearInterval(timer)
  }, [project?.id, build])

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const frame = previewIframeRef.current
      if (!frame || event.source !== frame.contentWindow || !build?.deployment_url) return
      let expectedOrigin = ""
      try {
        expectedOrigin = new URL(build.deployment_url).origin
      } catch {
        return
      }
      if (event.origin !== expectedOrigin || !event.data || typeof event.data !== "object") return
      if (event.data.type === "786-editor:ready" || event.data.type === "786-editor:sections") {
        const sections = Array.isArray(event.data.sections)
          ? event.data.sections.filter((item: unknown): item is EditorSection => {
              if (!item || typeof item !== "object") return false
              const section = item as Record<string, unknown>
              return typeof section.id === "string" &&
                typeof section.label === "string" &&
                typeof section.hidden === "boolean"
            })
          : []
        setEditorSections(sections)
        setSelectedSection((current) => current || sections[0]?.id || "")
      }
      if (event.data.type === "786-editor:selected" && typeof event.data.id === "string") {
        setSelectedSection(event.data.id)
      }
    }
    window.addEventListener("message", receive)
    return () => window.removeEventListener("message", receive)
  }, [build?.deployment_url])

  useEffect(() => {
    if (!designOpen) return
    postVisualMessage({ type: "786-editor:enable", enabled: true })
    postVisualMessage({ type: "786-editor:apply", state: visualState })
    return () => postVisualMessage({ type: "786-editor:enable", enabled: false })
  }, [designOpen, build?.deployment_url])

  function postVisualMessage(message: Record<string, unknown>) {
    if (!previewIframeRef.current?.contentWindow || !build?.deployment_url) return
    try {
      previewIframeRef.current.contentWindow.postMessage(
        message,
        new URL(build.deployment_url).origin,
      )
    } catch {
      // The preview may be rebuilding; the iframe load handler will replay state.
    }
  }

  async function persistVisualState(next: VisualEditorState, label: string) {
    if (!project) return
    setEditorSaving(true)
    try {
      const saved = await saveVisualEditorState({
        projectId: project.id,
        state: next,
        label,
      })
      setProject(saved)
      setRevisions(await listBuilderRevisions(project.id))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Visual edit could not be saved.")
    } finally {
      setEditorSaving(false)
    }
  }

  function commitVisualState(nextValue: VisualEditorState, label: string) {
    const next = normalizeVisualEditorState(nextValue)
    setUndoStack((current) => [...current.slice(-49), copyEditorState(visualState)])
    setRedoStack([])
    setVisualState(next)
    setVisualDirty(true)
    postVisualMessage({ type: "786-editor:apply", state: next })
    void persistVisualState(next, label)
  }

  function undoVisualEdit() {
    const previous = undoStack.at(-1)
    if (!previous) return
    setUndoStack((current) => current.slice(0, -1))
    setRedoStack((current) => [...current.slice(-49), copyEditorState(visualState)])
    setVisualState(previous)
    setVisualDirty(true)
    postVisualMessage({ type: "786-editor:apply", state: previous })
    void persistVisualState(previous, "Undo visual edit")
  }

  function redoVisualEdit() {
    const next = redoStack.at(-1)
    if (!next) return
    setRedoStack((current) => current.slice(0, -1))
    setUndoStack((current) => [...current.slice(-49), copyEditorState(visualState)])
    setVisualState(next)
    setVisualDirty(true)
    postVisualMessage({ type: "786-editor:apply", state: next })
    void persistVisualState(next, "Redo visual edit")
  }

  function updateSelectedStyle(patch: Partial<VisualEditorStyle>, label: string) {
    if (!selectedSection) return
    commitVisualState({
      ...visualState,
      styles: {
        ...visualState.styles,
        [selectedSection]: { ...selectedStyle, ...patch },
      },
    }, label)
  }

  function moveSection(id: string, offset: number) {
    const order = orderedSections.map((section) => section.id)
    const index = order.indexOf(id)
    const target = index + offset
    if (index < 0 || target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    commitVisualState({ ...visualState, order }, "Move section")
  }

  function dropSection(targetId: string) {
    const sourceId = sectionDrag.current
    sectionDrag.current = null
    if (!sourceId || sourceId === targetId) return
    const order = orderedSections.map((section) => section.id)
    const sourceIndex = order.indexOf(sourceId)
    const targetIndex = order.indexOf(targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    order.splice(targetIndex, 0, order.splice(sourceIndex, 1)[0])
    commitVisualState({ ...visualState, order }, "Drag section")
  }

  function duplicateSection(id: string) {
    const duplicateId = `${id}-copy-${Date.now()}`
    const order = orderedSections.map((section) => section.id)
    order.splice(order.indexOf(id) + 1, 0, duplicateId)
    commitVisualState({
      ...visualState,
      order,
      duplicates: [...visualState.duplicates, { sourceId: id, id: duplicateId }],
    }, "Duplicate section")
    setSelectedSection(duplicateId)
  }

  function toggleSection(id: string) {
    const hidden = visualState.hidden.includes(id)
      ? visualState.hidden.filter((item) => item !== id)
      : [...visualState.hidden, id]
    commitVisualState({ ...visualState, hidden }, hidden.includes(id) ? "Delete section" : "Restore section")
  }

  async function openDesignEditor() {
    if (!project) return
    const nextOpen = !designOpen
    setDesignOpen(nextOpen)
    setShowCode(false)
    setDesignOpen(false)
    setVisualState(EMPTY_VISUAL_EDITOR_STATE)
    setUndoStack([])
    setRedoStack([])
    setVisualDirty(false)
    if (!nextOpen) return
    setVisualState(project.visualEditor)
    setUndoStack([])
    setRedoStack([])
    if (!project.files["public/786-visual-editor.js"]) {
      await persistVisualState(project.visualEditor, "Enable visual editor")
      setVisualDirty(true)
      try {
        setBuild(await queueBuilderBuild(project.id))
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Editor bridge build could not be queued.")
      }
    }
  }

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
      setVisualState(loaded.project.visualEditor)
      setUndoStack([])
      setRedoStack([])
      setVisualDirty(false)
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

  async function confirmProjectDelete() {
    if (!projectToDelete || panelBusy) return
    const deletedId = projectToDelete.id
    setPanelBusy(true)
    setError("")
    try {
      await deleteBuilderProject(deletedId)
      setProjects((current) => current.filter((saved) => saved.id !== deletedId))
      if (project?.id === deletedId) startNewProject()
      setProjectToDelete(null)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Project could not be deleted.")
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
      setVisualState(restored.project.visualEditor)
      setUndoStack([])
      setRedoStack([])
      setVisualDirty(true)
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
    if (!project || build?.status !== "passed" || panelBusy || visualDirty) return
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
      setVisualState(saved.visualEditor)
      setUndoStack([])
      setRedoStack([])
      setVisualDirty(false)
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
                    if (item.label === "Overview") router.push("/")
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
              {visualDirty ? "○ Rebuild required" : build?.status === "passed" ? "✓ Build passed" : build ? `○ Build ${build.status}` : "○ Build not queued"}
            </span>
          </div>
          <button type="button" onClick={() => void openDesignEditor()} disabled={!project || build?.status !== "passed"} className={`mr-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[12px] font-bold disabled:opacity-40 ${designOpen ? "border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-100" : "border-[#263550] bg-[#0d1526]"}`}>
            <Palette className="h-3.5 w-3.5 text-fuchsia-300" /> Design
          </button>
          <button type="button" onClick={() => setShowCode((value) => !value)} className={`mr-2 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[12px] font-bold ${showCode ? "border-violet-300/30 bg-violet-400/15" : "border-[#263550] bg-[#0d1526]"}`}>
            <Code2 className="h-3.5 w-3.5 text-cyan-300" /> Code
          </button>
          <button data-786-publish type="button" onClick={() => { setError(""); setDeployResult(null); setDeployOpen(true) }} disabled={!project || build?.status !== "passed" || visualDirty} className="inline-flex h-9 items-center gap-3 rounded-lg bg-gradient-to-r from-amber-200 to-amber-400 px-5 text-[13px] font-black text-slate-950 shadow-[0_0_22px_rgba(251,191,36,.16)] disabled:opacity-40">
            <Rocket className="h-3.5 w-3.5" /> Deploy <ChevronDown className="h-3 w-3" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <section style={{ width: agentWidth }} className="relative flex shrink-0 border-r border-[#1b2940] bg-[#080e1c]/90">
            <div className="flex min-h-0 w-[210px] shrink-0 flex-col overflow-hidden border-r border-[#1b2940] px-4 py-4">
              <p className="mb-4 flex shrink-0 items-center gap-2 text-[14px] font-bold text-violet-200"><Sparkles className="h-3.5 w-3.5" /> AI Agent</p>
              <div className="relative min-h-0 flex-1 overflow-y-auto pr-1 pb-3">
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
                    <div key={stage.label} className="relative mb-5 flex gap-3 last:mb-0">
                      <span className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full ${toneClasses[stage.tone]} ${active ? "" : "opacity-45"}`}>
                        {isCurrent && (
                          <span className="absolute -inset-1 animate-spin rounded-full border border-transparent border-r-current border-t-current opacity-90" />
                        )}
                        <span className="absolute inset-0 rounded-full border border-current bg-[#0a1221] shadow-[inset_0_0_18px_rgba(255,255,255,.035)]" />
                        {busy && index === 0 ? <Loader2 className="relative h-4 w-4 animate-spin" /> : <Icon className="relative h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <p className={`text-[14px] font-bold ${active ? "text-white" : "text-slate-500"}`}><span className="mr-2 text-slate-500">{index + 1}</span>{stage.label}</p>
                        <p className="mt-1 break-words text-[12px] leading-[14px] text-slate-600">{stage.detail}</p>
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
                    <iframe ref={previewIframeRef} src={build.deployment_url} title={`${project?.title || "Project"} compiled preview`} sandbox="allow-scripts allow-forms allow-popups allow-same-origin" onLoad={() => {
                      if (!designOpen) return
                      postVisualMessage({ type: "786-editor:enable", enabled: true })
                      postVisualMessage({ type: "786-editor:apply", state: visualState })
                    }} style={{ width: deviceSpec.width || "100%", height: deviceSpec.height || "100%", maxWidth: "100%" }} className="min-h-full rounded-md border-0 bg-white" />
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

        {designOpen && (
          <aside className="absolute bottom-[184px] right-0 top-[58px] z-50 flex w-[340px] flex-col border-l border-fuchsia-300/20 bg-[#080d19]/[.98] shadow-[-24px_0_60px_rgba(0,0,0,.45)]">
            <div className="flex h-12 shrink-0 items-center border-b border-[#263550] px-3">
              <Palette className="mr-2 h-4 w-4 text-fuchsia-300" />
              <b className="text-[13px]">VVIP Visual Editor</b>
              {editorSaving && <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin text-cyan-300" />}
              <button type="button" onClick={undoVisualEdit} disabled={!undoStack.length || editorSaving} aria-label="Undo visual edit" className="ml-auto rounded p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
              <button type="button" onClick={redoVisualEdit} disabled={!redoStack.length || editorSaving} aria-label="Redo visual edit" className="rounded p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setDesignOpen(false)} aria-label="Close visual editor" className="rounded p-2 text-slate-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-[13px] font-bold uppercase tracking-[.15em] text-slate-500">Page sections</p>
              {orderedSections.length ? (
                <div className="space-y-1">
                  {orderedSections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => { sectionDrag.current = section.id }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropSection(section.id)}
                      onClick={() => setSelectedSection(section.id)}
                      className={`flex cursor-grab items-center gap-1 rounded-lg border px-2 py-2 ${selectedSection === section.id ? "border-fuchsia-300/40 bg-fuchsia-400/10" : "border-[#263550] bg-[#0d1526]"}`}
                    >
                      <span className="mr-1 min-w-0 flex-1 truncate text-[12px] font-semibold">{section.label}</span>
                      <button type="button" aria-label="Move section up" onClick={(event) => { event.stopPropagation(); moveSection(section.id, -1) }} disabled={index === 0} className="p-1 text-slate-400 disabled:opacity-25"><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" aria-label="Move section down" onClick={(event) => { event.stopPropagation(); moveSection(section.id, 1) }} disabled={index === orderedSections.length - 1} className="p-1 text-slate-400 disabled:opacity-25"><ArrowDown className="h-3 w-3" /></button>
                      <button type="button" aria-label="Duplicate section" onClick={(event) => { event.stopPropagation(); duplicateSection(section.id) }} className="p-1 text-cyan-300"><Copy className="h-3 w-3" /></button>
                      <button type="button" aria-label={visualState.hidden.includes(section.id) ? "Restore section" : "Delete section"} onClick={(event) => { event.stopPropagation(); toggleSection(section.id) }} className={`p-1 ${visualState.hidden.includes(section.id) ? "text-emerald-300" : "text-rose-300"}`}><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[#263550] p-3 text-[12px] leading-5 text-slate-500">Click inside the preview or wait for its editable sections to load.</p>
              )}

              <div className="my-4 h-px bg-[#263550]" />
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[.15em] text-slate-500">Style selected section</p>
              {!selectedSection ? (
                <p className="text-[12px] text-slate-500">Select a section to edit its design.</p>
              ) : (
                <div className="space-y-3">
                  {([
                    ["Background", "backgroundColor", selectedStyle.backgroundColor || "#ffffff"],
                    ["Text", "color", selectedStyle.color || "#111827"],
                    ["Border", "borderColor", selectedStyle.borderColor || "#d1d5db"],
                  ] as const).map(([label, key, value]) => (
                    <label key={key} className="flex items-center justify-between text-[12px] text-slate-300">
                      {label} colour
                      <span className="flex items-center gap-2">
                        <code className="text-[13px] text-slate-500">{value}</code>
                        <input type="color" value={value.startsWith("#") ? value.slice(0, 7) : "#ffffff"} onChange={(event) => updateSelectedStyle({ [key]: event.target.value }, `Change ${label.toLowerCase()} colour`)} className="h-8 w-10 cursor-pointer rounded border border-[#263550] bg-transparent p-0.5" />
                      </span>
                    </label>
                  ))}
                  <label className="block text-[12px] text-slate-300">Typography
                    <select value={selectedStyle.fontFamily || ""} onChange={(event) => updateSelectedStyle({ fontFamily: event.target.value || undefined }, "Change typography")} className="mt-1 h-9 w-full rounded-md border border-[#263550] bg-[#0d1526] px-2 text-[12px]">
                      <option value="">Project default</option>
                      <option value="Inter, sans-serif">Inter modern</option>
                      <option value="Georgia, serif">Editorial serif</option>
                      <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                      <option value="'DM Sans', sans-serif">DM Sans</option>
                      <option value="'Playfair Display', serif">Luxury Playfair</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["Border width", "borderWidth", 0, 20],
                      ["Corner radius", "borderRadius", 0, 160],
                      ["Padding", "padding", 0, 240],
                      ["Margin", "margin", 0, 240],
                      ["Font size", "fontSize", 8, 160],
                    ] as const).map(([label, key, min, max]) => (
                      <label key={key} className="text-[13px] text-slate-400">{label}
                        <input type="number" min={min} max={max} value={selectedStyle[key] ?? ""} placeholder="Default" onChange={(event) => updateSelectedStyle({ [key]: event.target.value === "" ? undefined : Number(event.target.value) }, `Change ${label.toLowerCase()}`)} className="mt-1 h-9 w-full rounded-md border border-[#263550] bg-[#0d1526] px-2 text-[12px] text-white outline-none focus:border-fuchsia-300/50" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#263550] p-3">
              <p className="mb-2 text-[13px] text-slate-500">Changes save automatically and update the preview instantly. Rebuild before publishing.</p>
              <button type="button" onClick={() => void retryBuild()} disabled={!visualDirty || panelBusy || editorSaving} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 text-[12px] font-black text-white disabled:opacity-40">
                <RotateCw className="h-3.5 w-3.5" /> Save &amp; rebuild verified preview
              </button>
            </div>
          </aside>
        )}

        <section className={`relative shrink-0 border-t border-[#1b2940] bg-[#070c18] transition-[height] ${bottomCollapsed ? "h-0 overflow-visible" : "h-[184px]"}`}>
          {!bottomCollapsed && (
            <div className="grid h-full grid-cols-[.86fr_1.14fr] gap-2 p-2">
              <article className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#263550] bg-[#0a1120] p-3">
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
                <div className="mt-3 flex min-h-0 flex-1 items-center overflow-hidden rounded-lg border border-dashed border-[#263550] px-4">
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
              <article className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#263550] bg-[#0a1120] p-3">
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
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[#263550]">
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
                    <article key={saved.id} className="group relative overflow-hidden rounded-2xl border border-[#263550] bg-[#10182b] transition hover:border-cyan-300/40 hover:bg-[#131e35]">
                      <button type="button" onClick={() => void openProject(saved.id)} disabled={panelBusy} className="block w-full p-4 pr-12 text-left disabled:opacity-40">
                        <span className="block truncate text-[14px] font-black">{saved.title}</span>
                        <span className="mt-2 line-clamp-2 block min-h-10 text-[12px] leading-5 text-slate-400">{saved.description || "No description"}</span>
                        <span className="mt-3 flex gap-3 text-[12px] text-slate-500"><span>{saved.file_count} files</span><span>{saved.message_count} messages</span><span className="ml-auto">{new Date(saved.updated_at).toLocaleDateString()}</span></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(saved)}
                        disabled={panelBusy}
                        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-rose-300/15 bg-rose-500/5 text-slate-500 transition hover:border-rose-300/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-40"
                        aria-label={`Delete ${saved.title}`}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {projectToDelete && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/85 p-5 backdrop-blur-md">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-project-title" className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/25 bg-gradient-to-br from-[#0a1020] to-[#180d1c] shadow-[0_40px_120px_rgba(0,0,0,.8)]">
            <div className="p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-300/20 bg-rose-500/10 text-rose-200">
                <Trash2 className="h-5 w-5" />
              </span>
              <h2 id="delete-project-title" className="mt-5 text-xl font-black">Delete {projectToDelete.title}?</h2>
              <p className="mt-3 text-[14px] leading-6 text-slate-400">
                This permanently removes this project and its files, messages, builds, revisions, deployments and visual-editor data from Neon. Other projects are not affected.
              </p>
              {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 p-3 text-[13px] text-rose-100">{error}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => { setProjectToDelete(null); setError("") }} disabled={panelBusy} className="rounded-xl border border-white/10 px-4 py-2.5 text-[14px] font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-40">Cancel</button>
                <button type="button" onClick={() => void confirmProjectDelete()} disabled={panelBusy} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-[14px] font-black text-white transition hover:bg-rose-400 disabled:opacity-40">
                  {panelBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete permanently
                </button>
              </div>
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
