"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  Boxes,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  FolderKanban,
  Gauge,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Trash2,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"
import type { AdminMessage, AdminProjectPreviewState, AdminProjectWithData } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

const EDIT_CONTEXT_PRIMARY_FILES = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "components/footer.tsx",
  "components/header.tsx",
  "components/hero.tsx",
  "components/navbar.tsx",
  "components/nav.tsx",
  "lib/utils.ts",
  "README.md",
]

const EDIT_CONTEXT_MAX_EXTRA_FILES = 8

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "desktop" | "tablet" | "mobile"
type ThemeName = "purple" | "green" | "blue" | "navy" | "white"
type UiMessage = { id: string; role: "user" | "assistant"; content: string; model?: string | null; reason?: string | null }

type ExistingProjectContext = {
  title: string
  description: string
  fileTree: string[]
  keyFiles: Record<string, string>
}

type PreviewPayload = { html: string; key: string }

type ActiveProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: SevenEightSixProjectFileMap
  preview_state: AdminProjectPreviewState
}

const themes: Record<ThemeName, { name: string; sub: string; swatch: string; accent: string; bg: string }> = {
  purple: { name: "Purple Galaxy", sub: "Default", swatch: "from-violet-700 via-fuchsia-600 to-cyan-400", accent: "violet", bg: "from-[#030712] via-[#09031d] to-[#020617]" },
  green: { name: "Green Aurora", sub: "Fresh & modern", swatch: "from-emerald-500 via-teal-500 to-lime-300", accent: "emerald", bg: "from-[#03120f] via-[#051b18] to-[#020617]" },
  blue: { name: "Blue Ocean", sub: "Calm & professional", swatch: "from-blue-600 via-sky-500 to-cyan-300", accent: "cyan", bg: "from-[#020617] via-[#071a33] to-[#030712]" },
  navy: { name: "Dark Navy", sub: "Deep & focused", swatch: "from-slate-950 via-blue-950 to-slate-800", accent: "blue", bg: "from-[#020617] via-[#050b18] to-[#000]" },
  white: { name: "White Mode", sub: "Clean & minimal", swatch: "from-white via-slate-100 to-slate-300", accent: "slate", bg: "from-[#eef2ff] via-white to-[#e0f2fe]" },
}

const navItems = [
  { label: "Chat", icon: Bot, href: "/chat" },
  { label: "Projects", icon: FolderKanban, href: "/786-admin/projects" },
  { label: "Templates", icon: LayoutGrid, href: "/786-admin/marketplace" },
  { label: "Marketplace", icon: Boxes, href: "/786-admin/marketplace" },
  { label: "Settings", icon: Settings, href: "/786-admin/setup" },
  { label: "Usage", icon: Gauge, href: "/786-admin/live" },
]

function uiFromAdminMessage(m: AdminMessage): UiMessage {
  return { id: m.id, role: m.role === "system" ? "assistant" : m.role, content: m.content, model: m.model, reason: m.reason }
}

function routeFromPagePath(path: string): string | null {
  const normalized = path.replace(/^src\//, "")
  const match = normalized.match(/^app\/(.*\/)?page\.(?:tsx?|jsx?)$/)
  if (!match) return null
  const segments = (match[1] || "").split("/").filter(Boolean).filter((segment) => !/^\(.*\)$/.test(segment))
  return segments.length === 0 ? "/" : `/${segments.join("/")}`
}

function transformPreviewSource(src: string): { body: string; defaultName: string | null; iconNames: string[] } {
  const iconNames = new Set<string>()
  const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let match: RegExpExecArray | null
  while ((match = lucideRe.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(name)) iconNames.add(name)
    }
  }

  let source = src
  source = source.replace(/^["']use (client|server)["']\s*;?\s*/m, "")
  source = source.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*import\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+\*\s+[\s\S]*?$/gm, "")

  let defaultName: string | null = null
  const namedDefault = source.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (namedDefault) {
    defaultName = namedDefault[1]
    source = source.replace(/export\s+default\s+function\s+/, "function ")
  } else if (/export\s+default\s+function\s*\(/.test(source)) {
    defaultName = "__DefaultExport__"
    source = source.replace(/export\s+default\s+function\s*\(/, "function __DefaultExport__(")
  } else {
    const assignedDefault = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)
    if (assignedDefault) {
      defaultName = assignedDefault[1]
      source = source.replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/, "")
    } else if (/export\s+default\s+/.test(source)) {
      defaultName = "__DefaultExport__"
      source = source.replace(/export\s+default\s+/, "const __DefaultExport__ = ")
    }
  }
  source = source.replace(/\bexport\s+(const|let|var|function|class|type|interface|enum)\b/g, "$1")
  source = source.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
  return { body: source.trim(), defaultName, iconNames: Array.from(iconNames) }
}

function filesToPreviewPayload(files: SevenEightSixProjectFileMap | undefined): PreviewPayload {
  const html = filesToHtml(files)
  return { html, key: stablePreviewKey(files, html) }
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined) {
  if (!files || Object.keys(files).length === 0) return buildEmptyPreview("Preview will appear here once a project is generated.")

  const rawCss = files["app/globals.css"] || files["src/app/globals.css"] || ""
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()
  const sourceFiles = Object.entries(files)
    .filter(([path, src]) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path) && typeof src === "string" && src.trim())
    .sort(([a], [b]) => {
      const rank = (p: string) => (routeFromPagePath(p) === "/" ? 99 : p.startsWith("components/") ? 1 : p.startsWith("lib/") ? 0 : 2)
      return rank(a) - rank(b) || a.localeCompare(b)
    })

  const pageEntry = sourceFiles.find(([path]) => routeFromPagePath(path) === "/")
  if (!pageEntry) return buildEmptyPreview("No app/page.tsx file was found in this project, so preview is unavailable.")

  const pieces: string[] = []
  const icons = new Set<string>()
  let pageComponent = "__DefaultExport__"

  for (const [path, src] of sourceFiles) {
    const transformed = transformPreviewSource(src)
    transformed.iconNames.forEach((name) => icons.add(name))
    const localDefault = transformed.defaultName || `__Component_${pieces.length}`
    pieces.push(`// ${path}\n${transformed.body}\ntry { if (typeof ${localDefault} !== 'undefined') globalThis.${path === pageEntry[0] ? "__Page" : localDefault} = ${localDefault}; } catch (_) {}`)
    if (path === pageEntry[0]) pageComponent = "__Page"
  }

  const iconShim = Array.from(icons)
    .map((name) => `globalThis.${name} = (props) => React.createElement('span', Object.assign({}, props, { className: 'inline-flex items-center justify-center ' + (props && props.className || ''), 'data-icon': '${name}' }), '✦')`)
    .join("\n")

  const source = `
const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
const Link = ({ href, children, ...props }) => React.createElement('a', { href: href || '#', ...props }, children);
const Image = ({ src, alt, width, height, ...props }) => React.createElement('img', { src, alt: alt || '', width, height, ...props });
const cn = (...items) => items.flat(Infinity).filter(Boolean).join(' ');
${iconShim}
${pieces.join("\n\n")}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(globalThis.${pageComponent} || (() => React.createElement('div', { className: 'p-8 text-slate-200' }, 'Preview component not found'))));
`

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewStyle(css)}</style><style>html,body,#root{margin:0;min-height:100%;background:#020617;color:#e2e8f0;font-family:Inter,system-ui,-apple-system,sans-serif}#__preview_error{margin:24px;padding:18px;border:1px solid rgba(248,113,113,.5);border-radius:16px;background:#190b12;color:#fecaca;font-size:13px;white-space:pre-wrap}</style></head><body><div id="root"></div><script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script><script>function showError(e){document.getElementById('root').innerHTML='<div id="__preview_error">Preview error: '+String(e&&e.message?e.message:e).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</div>'}try{var compiled=Babel.transform(${safeScriptJson(source)},{presets:['env','react','typescript']}).code;new Function(compiled)()}catch(e){showError(e);console.error(e)}</script></body></html>`
}

function buildEmptyPreview(message: string): string {
  return `<!doctype html><html><body style="margin:0;background:#020617;color:#94a3b8;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh"><div style="padding:28px;border:1px solid rgba(148,163,184,.18);border-radius:18px;background:rgba(255,255,255,.04);font-size:13px">${message}</div></body></html>`
}

function escapePreviewStyle(value: string): string {
  return value.replace(/<\/style>/gi, "<\\/style>")
}

function safeScriptJson(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

function stablePreviewKey(files: SevenEightSixProjectFileMap | undefined, html: string): string {
  const source = files ? Object.keys(files).sort().map((path) => `${path}:${files[path]}`).join("\n---786-file---\n") : html
  let hash = 2166136261
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

function buildExistingProjectContext(activeProject: ActiveProject | null, selectedFile: string): ExistingProjectContext | undefined {
  if (!activeProject) return undefined
  const fileTree = Object.keys(activeProject.files || {}).sort()
  if (fileTree.length === 0) return undefined
  const orderedCandidates = [selectedFile, ...EDIT_CONTEXT_PRIMARY_FILES, ...fileTree.filter((path) => path.startsWith("app/") || path.startsWith("components/")), ...fileTree]
  const keyFiles: Record<string, string> = {}
  for (const path of orderedCandidates) {
    if (Object.keys(keyFiles).length >= EDIT_CONTEXT_MAX_EXTRA_FILES) break
    if (!path || keyFiles[path] !== undefined) continue
    const content = activeProject.files[path]
    if (typeof content === "string") keyFiles[path] = content
  }
  return { title: activeProject.title, description: activeProject.description, fileTree, keyFiles }
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [project, setProject] = useState<ActiveProject | null>(null)
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [input, setInput] = useState("")
  const [mode] = useState<Mode>("auto")
  const [panel, setPanel] = useState<Panel>("preview")
  const [device, setDevice] = useState<Device>("desktop")
  const [sending, setSending] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [sound, setSound] = useState(true)
  const [theme, setTheme] = useState<ThemeName>("purple")
  const [themeOpen, setThemeOpen] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}).sort(), [project])
  const previewPayload = useMemo(() => (project ? filesToPreviewPayload(project.files) : { html: "", key: "empty" }), [project])
  const activeTheme = themes[theme]

  useEffect(() => { if (!isLoading && !isAdmin) router.replace("/786-admin/login") }, [isLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    try { localStorage.removeItem(OLD_PROJECT_KEY); localStorage.removeItem(LEGACY_PROJECTS_KEY) } catch {}
    let cancelled = false
    async function hydrate() {
      let activeId: string | null = null
      try { activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY) } catch {}
      if (!activeId) return
      try {
        const res = await fetch(`/api/786-admin/projects/${activeId}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 404) { try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {} }
          return
        }
        const json = (await res.json()) as { project: AdminProjectWithData }
        if (cancelled || !json.project) return
        const p = json.project
        setProject({ id: p.id, title: p.title, description: p.description, prompt: p.prompt, files: p.files || {}, preview_state: p.preview_state || {} })
        setMessages((p.messages || []).map(uiFromAdminMessage))
        setSelectedFile((p.preview_state?.active_file as string | undefined) || (p.files && p.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(p.files || {})[0]) || "app/page.tsx")
      } catch {}
    }
    hydrate()
    return () => { cancelled = true }
  }, [isAdmin])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length, sending])

  function tone(done = false) {
    if (!sound) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.value = 0.035
      ;(done ? [523, 659, 784] : [392, 523]).forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.frequency.value = freq
        osc.connect(gain)
        osc.start(ctx.currentTime + i * 0.07)
        osc.stop(ctx.currentTime + i * 0.07 + 0.1)
      })
      setTimeout(() => ctx.close().catch(() => undefined), 500)
    } catch {}
  }

  function newChat() {
    setMessages([])
    setProject(null)
    setSelectedFile("app/page.tsx")
    setInput("")
    setPanel("preview")
    setDevice("desktop")
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
    tone(true)
  }

  async function persistAfterGeneration(generated: SevenEightSixProject, userText: string, assistantText: string, assistantModel: string | null, assistantReason: string | null): Promise<ActiveProject | null> {
    const activeFile = (generated.files && generated.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) || "app/page.tsx"
    const previewStatePatch: AdminProjectPreviewState = { active_file: activeFile, entry_path: "app/page.tsx" }
    const messagesPayload = [
      { role: "user" as const, content: userText },
      { role: "assistant" as const, content: assistantText, model: assistantModel, reason: assistantReason },
    ]
    const projectId = project?.id || null
    try {
      const url = projectId ? `/api/786-admin/projects/${projectId}` : "/api/786-admin/projects"
      const method = projectId ? "PATCH" : "POST"
      const body: Record<string, unknown> = { prompt: userText, preview_state: previewStatePatch, files: generated.files, messages: messagesPayload }
      if (assistantModel) body.metadata = { model: assistantModel }
      if (!projectId) { body.title = generated.title; body.description = generated.description }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`)
      const json = (await res.json()) as { project: AdminProjectWithData }
      const saved = json.project
      try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, saved.id) } catch {}
      return { id: saved.id, title: saved.title, description: saved.description, prompt: saved.prompt, files: saved.files || {}, preview_state: saved.preview_state || {} }
    } catch (error) {
      console.error("[786.Chat] persistence failed", error)
      return null
    }
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
      const existing = buildExistingProjectContext(project, selectedFile)
      const requestBody: Record<string, unknown> = { message: text, mode }
      if (project?.id) requestBody.projectId = project.id
      if (existing) requestBody.existing = existing
      const res = await fetch("/api/786-admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) })
      const json = await res.json()
      if (!res.ok || !json.success || !json.project) throw new Error(json.error || "Project generation failed.")
      const generated: SevenEightSixProject = json.project
      const assistantText = json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const assistantModel: string | null = json.model ?? null
      const assistantReason: string | null = json.reason ?? null
      const persisted = await persistAfterGeneration(generated, text, assistantText, assistantModel, assistantReason)
      if (!persisted) throw new Error("Project was generated but could not be saved to Neon. Run setup once, then retry.")
      setProject(persisted)
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: assistantText, model: assistantModel, reason: assistantReason }])
      setSelectedFile((persisted.preview_state.active_file as string | undefined) || (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) || "app/page.tsx")
      tone(true)
    } catch (error) {
      setMessages((old) => [...old, { id: `e-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Request failed." }])
      tone(false)
    } finally {
      setSending(false)
    }
  }

  async function publish() {
    if (!project || publishing) return
    setPublishing(true)
    tone(false)
    try {
      const res = await fetch(`/api/786-admin/projects/${project.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: previewPayload.html }) })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Publish failed")
      setMessages((old) => [...old, { id: `p-${Date.now()}`, role: "assistant", content: `Published successfully: ${json.url}` }])
      tone(true)
      if (json.url) window.open(json.url, "_blank", "noopener,noreferrer")
    } catch (error) {
      setMessages((old) => [...old, { id: `pe-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Publish failed." }])
    } finally {
      setPublishing(false)
    }
  }

  function copyCode() {
    const content = project?.files?.[selectedFile]
    if (!content) return
    navigator.clipboard?.writeText(content).catch(() => undefined)
    tone(true)
  }

  function exportProject() {
    if (!project) return
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-786chat.json`
    a.click()
    URL.revokeObjectURL(url)
    tone(true)
  }

  if (isLoading || !isAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></main>
  }

  const deviceFrameClass = device === "desktop" ? "h-full w-full overflow-hidden rounded-[22px] bg-white" : `relative shrink-0 overflow-hidden bg-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${device === "mobile" ? "h-[720px] w-[390px] rounded-[36px] border-[9px] border-[#111827]" : "h-[760px] w-[768px] rounded-[28px] border-[8px] border-[#111827]"}`
  const emptyPrompts = ["Create New Project", "Improve Existing Code", "Fix Bugs", "Add Features"]

  return (
    <main className={`h-screen overflow-hidden bg-gradient-to-br ${activeTheme.bg} text-white ${theme === "white" ? "text-slate-950" : "text-white"}`} style={{ ["--speed" as string]: `${animationSpeed}s` }}>
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,.35),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,.18),transparent_26%),radial-gradient(circle_at_45%_90%,rgba(168,85,247,.22),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      </div>

      <div className="relative flex h-full flex-col text-[13px]">
        <header className="flex h-[76px] shrink-0 items-center gap-4 border-b border-white/10 bg-black/20 px-5 backdrop-blur-2xl">
          <button onClick={() => router.push("/chat")} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 shadow-[0_0_30px_rgba(124,58,237,.45)]"><Sparkles className="h-5 w-5" /></button>
          <div className="hidden text-lg font-black tracking-tight lg:block">786.Chat</div>
          <button onClick={newChat} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-[13px] font-bold shadow-[0_14px_40px_rgba(124,58,237,.35)] transition hover:-translate-y-0.5"><Plus className="h-4 w-4" />New Chat</button>

          <div className="mx-auto hidden h-11 min-w-[300px] max-w-[430px] flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[13px] text-slate-300 lg:flex">
            <Monitor className="h-4 w-4 text-cyan-200" /> <span>/</span> <span className="font-semibold text-white">786-admin</span> <span>/</span> <span className="font-semibold text-white">chat</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <button onClick={() => setPanel("preview")} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 font-bold transition ${panel === "preview" ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"}`}><Play className="h-4 w-4" />Preview</button>
            <button onClick={() => setPanel("code")} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 font-bold transition ${panel === "code" ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10"}`}><Code2 className="h-4 w-4" />Code</button>
            <button onClick={publish} disabled={!project || publishing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"><Rocket className="h-4 w-4 text-fuchsia-300" />{publishing ? "Publishing" : "Publish"}</button>
            <div className="relative">
              <button onClick={() => setThemeOpen((v) => !v)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-bold text-slate-200 transition hover:bg-white/10"><Sparkles className="h-4 w-4 text-violet-300" />Theme<ChevronDown className="h-4 w-4" /></button>
              {themeOpen && <div className="absolute right-0 top-14 z-40 w-72 rounded-3xl border border-white/10 bg-[#0b1020]/95 p-3 shadow-2xl backdrop-blur-2xl">
                <p className="px-3 py-2 text-xs text-slate-400">Choose Theme</p>
                {(Object.keys(themes) as ThemeName[]).map((key) => <button key={key} onClick={() => { setTheme(key); setThemeOpen(false); tone(true) }} className={`mb-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${theme === key ? "border-violet-400/60 bg-violet-500/20" : "border-transparent hover:bg-white/5"}`}>
                  <span className={`h-9 w-9 rounded-full bg-gradient-to-br ${themes[key].swatch}`} />
                  <span className="flex-1"><span className="block font-bold text-white">{themes[key].name}</span><span className="text-xs text-slate-400">{themes[key].sub}</span></span>
                  {theme === key && <Check className="h-4 w-4 text-violet-200" />}
                </button>)}
              </div>}
            </div>
            <button onClick={() => setSound((v) => !v)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200">{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[92px] shrink-0 flex-col justify-between border-r border-white/10 bg-black/20 p-3 backdrop-blur-2xl lg:flex">
            <div className="space-y-2 pt-3">
              {navItems.map(({ label, icon: Icon, href }) => <button key={label} onClick={() => router.push(href)} className={`group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] transition ${label === "Chat" ? "bg-violet-600/60 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" /><span>{label}</span></button>)}
            </div>
            <div className="space-y-2"><button className="group flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] text-slate-300 hover:bg-white/10"><HelpCircle className="h-5 w-5" />Help</button><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-center"><div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-violet-600 font-black">M</div><p className="mt-2 text-[11px] font-bold">Mujeeb</p><p className="text-[10px] text-emerald-300">Owner</p></div></div>
          </aside>

          <aside className="hidden w-[300px] shrink-0 border-r border-white/10 bg-black/15 p-4 backdrop-blur-xl xl:block">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Chats</h2><div className="flex gap-2"><button className="grid h-8 w-8 place-items-center rounded-xl bg-white/5"><MoreHorizontal className="h-4 w-4" /></button><button className="grid h-8 w-8 place-items-center rounded-xl bg-white/5"><Search className="h-4 w-4" /></button></div></div>
            <div className="space-y-2">
              {(messages.length ? messages.filter((m) => m.role === "user").slice(-8).reverse() : [
                { id: "sample-1", role: "user", content: "AI SaaS Dashboard" },
                { id: "sample-2", role: "user", content: "Restaurant Website" },
                { id: "sample-3", role: "user", content: "E-commerce Store" },
                { id: "sample-4", role: "user", content: "Quiz Application" },
                { id: "sample-5", role: "user", content: "Login Page" },
              ] as UiMessage[]).map((chat, index) => <button key={chat.id} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:bg-white/10 ${index === 0 ? "border-violet-400/40 bg-violet-500/20" : "border-transparent bg-white/[0.03]"}`}>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600/50"><Bot className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-bold">{chat.content.split("\n")[0]}</span><span className="block truncate text-xs text-slate-400">{index === 0 ? "10:24 AM" : "Saved project chat"}</span></span>
              </button>)}
            </div>
            <button onClick={() => router.push("/786-admin/projects")} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] font-bold hover:bg-white/10">View all projects</button>
          </aside>

          <section className="flex min-w-[360px] shrink-0 flex-col border-r border-white/10 bg-black/10 backdrop-blur-xl lg:w-[360px] 2xl:w-[390px]">
            <div className="flex-1 overflow-y-auto p-5 pb-36">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="rounded-[28px] border border-violet-400/25 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(124,58,237,.16)]">
                    <div className="mb-5 flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 shadow-lg"><Sparkles className="h-5 w-5" /></div><div><p className="text-base font-black">AI Assistant</p><p className="text-xs text-violet-200">Galaxy Model v2.5</p></div></div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-300"><Check className="h-4 w-4" />Agent ready</p>
                  </div>
                  <div className="mt-24 text-center"><h1 className="text-2xl font-black tracking-tight">Welcome to <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">786.Chat</span></h1><p className="mt-3 text-sm leading-6 text-slate-400">How can I help you build today?</p></div>
                </div>
              ) : messages.map((m) => (
                <div key={m.id} className={`mb-4 rounded-3xl border p-4 text-[13px] leading-6 ${m.role === "user" ? "ml-7 border-violet-300/25 bg-violet-500/15 text-violet-50" : "mr-7 border-white/10 bg-white/[0.045] text-slate-200"}`}>
                  <div className="mb-2 text-xs font-bold text-slate-400">{m.role === "user" ? "You" : "786.Chat"}</div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {sending && <div className="mr-7 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4"><div className="flex items-center gap-3"><Wand2 className="h-5 w-5 animate-pulse text-cyan-200" /><span>Creating real project files...</span></div></div>}
              <div ref={endRef} />
            </div>

            <div className="absolute bottom-0 w-full border-t border-white/10 bg-[#07101f]/90 p-4 backdrop-blur-2xl">
              <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-3 shadow-2xl">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} rows={2} className="max-h-28 min-h-14 w-full resize-none bg-transparent px-2 py-2 text-[13px] text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build anything..." />
                <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-slate-400"><Paperclip className="h-4 w-4" /><ImageIcon className="h-4 w-4" /><Code2 className="h-4 w-4" /><Sparkles className="h-4 w-4" /></div><button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
              </div>
              <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100">{project ? `Editing ${project.title} — auto-save on` : "New Chat is empty. Build prompt creates real files saved to Neon."}</p>
            </div>
          </section>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 items-center justify-center p-5">
              <div className="h-full w-full rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl">
                {panel === "preview" ? (
                  sending ? <div className="grid h-full place-items-center text-slate-300"><div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4"><span className="mr-3 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300" />Loading generated preview...</div></div>
                  : project && previewPayload.html ? <div className="flex h-full items-center justify-center overflow-auto"><div className={deviceFrameClass}>{device !== "desktop" && <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-[#111827]" />}<iframe key={`${project.id}-${previewPayload.key}-${device}`} srcDoc={previewPayload.html} title={`${project.title} preview`} sandbox="allow-scripts allow-forms allow-popups" className="h-full w-full rounded-[18px] bg-white" /></div></div>
                  : <div className="grid h-full place-items-center text-center"><div><div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[30px] border border-violet-400/30 bg-violet-500/10"><Bot className="h-10 w-10 text-violet-300" /></div><h2 className="text-3xl font-black">Welcome to <span className="text-violet-300">786.Chat</span></h2><p className="mt-3 text-slate-400">Start building to see preview and code.</p><div className="mt-8 grid grid-cols-2 gap-3">{emptyPrompts.map((p) => <button key={p} onClick={() => setInput(p)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-left font-bold hover:bg-white/10"><Plus className="mb-2 h-4 w-4 text-violet-300" />{p}</button>)}</div></div></div>
                ) : (
                  <div className="grid h-full grid-cols-[240px_1fr] gap-4">
                    <div className="overflow-auto rounded-3xl border border-white/10 bg-white/[0.035] p-3">{fileNames.length === 0 ? <p className="p-3 text-sm text-slate-500">No files yet.</p> : fileNames.map((file) => <button key={file} onClick={() => setSelectedFile(file)} className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-bold ${selectedFile === file ? "bg-violet-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>{file}</button>)}</div>
                    <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070b14]"><div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4"><span className="truncate text-xs font-bold text-slate-300">{selectedFile}</span><button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10"><Copy className="h-3.5 w-3.5" />Copy</button></div><pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-5 text-xs leading-6 text-cyan-50"><code>{project?.files?.[selectedFile] || "Select a file."}</code></pre></div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="hidden w-[300px] shrink-0 border-l border-white/10 bg-black/15 p-4 backdrop-blur-xl 2xl:block">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">Preview</h3><MoreHorizontal className="h-4 w-4 text-slate-400" /></div><div className="grid grid-cols-3 gap-2">{(["desktop", "tablet", "mobile"] as Device[]).map((d) => <button key={d} onClick={() => { setDevice(d); setPanel("preview") }} className={`grid h-10 place-items-center rounded-xl border ${device === d ? "border-violet-400/50 bg-violet-600" : "border-white/10 bg-white/5"}`}>{d === "desktop" ? <Monitor className="h-4 w-4" /> : d === "tablet" ? <Tablet className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}</button>)}</div><div className="mt-4 grid h-44 place-items-center rounded-2xl border border-white/10 bg-black/20 text-center text-slate-400"><div><Monitor className="mx-auto mb-3 h-9 w-9" /><p className="font-bold text-slate-200">{project ? project.title : "No preview yet"}</p><p className="mt-1 text-xs">{project ? `${fileNames.length} files ready` : "Start building to see preview"}</p></div></div></div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"><h3 className="mb-4 font-bold">Project Info</h3><div className="space-y-3 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-400">Project Name</span><span className="truncate font-bold text-violet-200">{project?.title || "No project"}</span></div><div className="flex justify-between"><span className="text-slate-400">Files</span><span>{fileNames.length}</span></div><div className="flex justify-between"><span className="text-slate-400">Status</span><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-300">{project ? "Active" : "Empty"}</span></div></div></div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"><h3 className="mb-4 font-bold">Quick Actions</h3><div className="space-y-2"><button onClick={exportProject} disabled={!project} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-xs font-bold hover:bg-white/10 disabled:opacity-40"><Download className="h-4 w-4" />Export Project</button><button onClick={newChat} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-xs font-bold hover:bg-white/10"><Trash2 className="h-4 w-4" />Clear Chat</button><button onClick={() => router.push("/786-admin/login")} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-xs font-bold hover:bg-white/10"><LogOut className="h-4 w-4" />Login Page</button></div></div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="mb-2 flex items-center justify-between text-xs"><span>Animation Speed</span><span>{animationSpeed.toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={animationSpeed} onChange={(e) => setAnimationSpeed(Number(e.target.value))} className="w-full accent-violet-500" /></div>
          </aside>
        </div>

        <footer className="hidden h-10 shrink-0 items-center justify-between border-t border-white/10 bg-black/20 px-6 text-xs text-slate-400 backdrop-blur-xl lg:flex"><div className="flex gap-6"><span className="text-emerald-300">● Neon DB</span><span className="text-blue-300">● DeepSeek</span><span>✦ All Systems Operational</span></div><div className="flex items-center gap-6"><span className="text-emerald-300">● Auto-save: On</span><button onClick={() => setTheme(theme === "white" ? "purple" : "white")}>{theme === "white" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button></div></footer>
      </div>
    </main>
  )
}
