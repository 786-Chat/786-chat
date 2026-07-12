"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronDown,
  Code2,
  FileText,
  FolderKanban,
  Laptop,
  Loader2,
  Monitor,
  Palette,
  Paperclip,
  Plus,
  Power,
  Rocket,
  RotateCw,
  Send,
  Settings,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"
import type { AdminMessage, AdminProjectPreviewState, AdminProjectWithData } from "@/lib/786-admin/types"
import { ADMIN_THEME_STORAGE_KEY, PremiumAdminBackground, type AdminVisualTheme } from "@/components/786-admin/premium-background"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"
const EDIT_CONTEXT_MAX_EXTRA_FILES = 8
const EDIT_CONTEXT_PRIMARY_FILES = ["app/page.tsx", "app/layout.tsx", "app/globals.css", "components/header.tsx", "components/hero.tsx", "components/footer.tsx", "lib/utils.ts"]

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "full" | "desktop" | "laptop" | "tablet" | "ipadMini" | "ipadPro" | "surfacePro" | "galaxyTab" | "galaxyFold" | "iphone7Plus" | "iphone13" | "iphone15" | "iphone16" | "iphone16ProMax" | "pixel9" | "galaxyS25" | "custom"
type ThemeName = "purple" | "green" | "blue" | "navy" | "white"
type UiMessage = { id: string; role: "user" | "assistant"; content: string; model?: string | null; reason?: string | null }
type ExistingProjectContext = { title: string; description: string; fileTree: string[]; keyFiles: Record<string, string> }
type PreviewPayload = { html: string; key: string }
type ActiveProject = { id: string; title: string; description: string; prompt: string; files: SevenEightSixProjectFileMap; preview_state: AdminProjectPreviewState }
type PendingAttachment = { id: string; name: string; mediaType: string; url: string; size: number }

const MAX_ATTACHMENTS = 4
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"])

const visualThemes: Record<ThemeName, AdminVisualTheme> = {
  purple: "cosmic",
  green: "emerald",
  blue: "ocean",
  navy: "midnight",
  white: "pearl",
}

const themeNamesByVisual: Record<AdminVisualTheme, ThemeName> = {
  cosmic: "purple",
  emerald: "green",
  ocean: "blue",
  midnight: "navy",
  pearl: "white",
}

const themes: Record<ThemeName, { name: string; sub: string; swatch: string; shell: string; accent: string }> = {
  purple: { name: "Purple Galaxy", sub: "Default", swatch: "from-violet-950 via-violet-600 to-cyan-300", shell: "from-[#050010] via-[#12002d] to-[#02040d]", accent: "124,58,237" },
  green: { name: "Green Aurora", sub: "Fresh & Modern", swatch: "from-emerald-900 via-emerald-500 to-cyan-300", shell: "from-[#00110d] via-[#05251f] to-[#02040d]", accent: "16,185,129" },
  blue: { name: "Blue Ocean", sub: "Calm & Professional", swatch: "from-blue-950 via-blue-500 to-cyan-300", shell: "from-[#020617] via-[#071d3f] to-[#02040d]", accent: "14,165,233" },
  navy: { name: "Dark Navy", sub: "Deep & Focused", swatch: "from-black via-slate-900 to-blue-950", shell: "from-[#000] via-[#07101f] to-[#02040d]", accent: "30,64,175" },
  white: { name: "White Mode", sub: "Clean & Minimal", swatch: "from-white via-slate-100 to-slate-300", shell: "from-[#f8fafc] via-white to-[#eef2ff]", accent: "148,163,184" },
}

const devices: Record<Device, { label: string; icon: typeof Monitor; frame: string; iframe: string }> = {
  full: { label: "Full Preview", icon: Monitor, frame: "h-full w-full", iframe: "h-full w-full" },
  desktop: { label: "Desktop", icon: Monitor, frame: "h-full w-full", iframe: "h-full w-full" },
  laptop: { label: "Laptop", icon: Laptop, frame: "h-[82vh] w-[1366px] max-w-full", iframe: "h-full w-full" },
  tablet: { label: "Tablet", icon: Tablet, frame: "h-[82vh] w-[768px] max-w-full", iframe: "h-full w-full" },
  ipadMini: { label: "iPad Mini", icon: Tablet, frame: "h-[82vh] w-[744px] max-w-full", iframe: "h-full w-full" },
  ipadPro: { label: "iPad Pro", icon: Tablet, frame: "h-[82vh] w-[1024px] max-w-full", iframe: "h-full w-full" },
  surfacePro: { label: "Surface Pro", icon: Tablet, frame: "h-[82vh] w-[912px] max-w-full", iframe: "h-full w-full" },
  galaxyTab: { label: "Galaxy Tab", icon: Tablet, frame: "h-[82vh] w-[800px] max-w-full", iframe: "h-full w-full" },
  galaxyFold: { label: "Galaxy Fold", icon: Smartphone, frame: "h-[82vh] w-[344px] max-w-full", iframe: "h-full w-full" },
  iphone7Plus: { label: "iPhone 7 Plus", icon: Smartphone, frame: "h-[82vh] w-[414px] max-w-full", iframe: "h-full w-full" },
  iphone13: { label: "iPhone 13", icon: Smartphone, frame: "h-[82vh] w-[390px] max-w-full", iframe: "h-full w-full" },
  iphone15: { label: "iPhone 15", icon: Smartphone, frame: "h-[82vh] w-[393px] max-w-full", iframe: "h-full w-full" },
  iphone16: { label: "iPhone 16", icon: Smartphone, frame: "h-[82vh] w-[393px] max-w-full", iframe: "h-full w-full" },
  iphone16ProMax: { label: "iPhone 16 Pro Max", icon: Smartphone, frame: "h-[82vh] w-[440px] max-w-full", iframe: "h-full w-full" },
  pixel9: { label: "Pixel 9", icon: Smartphone, frame: "h-[82vh] w-[412px] max-w-full", iframe: "h-full w-full" },
  galaxyS25: { label: "Galaxy S25", icon: Smartphone, frame: "h-[82vh] w-[412px] max-w-full", iframe: "h-full w-full" },
  custom: { label: "Custom Width", icon: Monitor, frame: "h-[82vh] w-[960px] max-w-full", iframe: "h-full w-full" },
}

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

function transformPreviewSource(src: string): { defaultName: string | null; body: string; iconNames: string[] } {
  const icons = new Set<string>()
  const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let match: RegExpExecArray | null
  while ((match = lucideRe.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(name)) icons.add(name)
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
  return { defaultName, body: source.trim(), iconNames: Array.from(icons) }
}

function filesToPreviewPayload(files: SevenEightSixProjectFileMap | undefined, theme: ThemeName): PreviewPayload {
  const html = filesToHtml(files, theme)
  return { html, key: stablePreviewKey(files, html) }
}

function previewThemeCss(theme: ThemeName) {
  const hue = theme === "green" ? "110deg" : theme === "blue" ? "35deg" : theme === "navy" ? "210deg" : theme === "white" ? "0deg" : "0deg"
  const brightness = theme === "white" ? "1.08" : "1"
  return `#root>*{border-radius:0!important;border:0!important;outline:0!important;box-shadow:none!important;min-height:100vh!important}body{overflow:auto!important}${theme === "purple" ? "" : `#root{filter:hue-rotate(${hue}) saturate(1.12) brightness(${brightness});}`}`
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined, theme: ThemeName) {
  if (!files || Object.keys(files).length === 0) return buildEmptyPreview("Preview will appear here once a project is generated.")

  const rawCss = files["app/globals.css"] || files["src/app/globals.css"] || ""
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()
  const sourceFiles = Object.entries(files)
    .filter(([path, src]) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path) && typeof src === "string" && src.trim())
    .sort(([a], [b]) => {
      const rank = (p: string) => (routeFromPagePath(p) === "/" ? 99 : p.startsWith("lib/") ? 0 : p.startsWith("components/") ? 1 : 2)
      return rank(a) - rank(b) || a.localeCompare(b)
    })

  const pageEntry = sourceFiles.find(([path]) => routeFromPagePath(path) === "/")
  if (!pageEntry) return buildEmptyPreview("No app/page.tsx file was found in this project, so preview is unavailable.")

  const icons = new Set<string>()
  const pieces: string[] = []
  for (const [path, src] of sourceFiles) {
    const transformed = transformPreviewSource(src)
    transformed.iconNames.forEach((name) => icons.add(name))
    const localDefault = transformed.defaultName || `__Component_${pieces.length}`
    const exportName = path === pageEntry[0] ? "__Page" : localDefault
    pieces.push(`// ${path}\n${transformed.body}\ntry { if (typeof ${localDefault} !== 'undefined') globalThis.${exportName} = ${localDefault}; } catch (_) {}`)
  }

  const iconShim = Array.from(icons).map((name) => `globalThis.${name} = (props) => React.createElement('span', Object.assign({}, props, { className: 'inline-flex items-center justify-center ' + ((props && props.className) || ''), 'data-icon': '${name}' }), '✦')`).join("\n")
  const source = `
const { useState, useEffect, useMemo, useCallback, useRef, Fragment } = React;
const Link = ({ href, children, ...props }) => React.createElement('a', { href: href || '#', ...props }, children);
const Image = ({ src, alt, width, height, ...props }) => React.createElement('img', { src, alt: alt || '', width, height, ...props });
if (typeof globalThis.cn === 'undefined') globalThis.cn = (...items) => items.flat(Infinity).filter(Boolean).join(' ');
${iconShim}
${pieces.join("\n\n")}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(globalThis.__Page || (() => React.createElement('div', { className: 'p-8 text-slate-200' }, 'Preview component not found'))));
`

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewStyle(css)}${previewThemeCss(theme)}</style><style>html,body,#root{margin:0;min-height:100%;background:#020617;color:#e2e8f0;font-family:Inter,system-ui,-apple-system,sans-serif}#__preview_error{margin:24px;padding:18px;border:1px solid rgba(248,113,113,.5);border-radius:16px;background:#190b12;color:#fecaca;font-size:13px;white-space:pre-wrap}</style></head><body><div id="root"></div><script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script><script>function showError(e){document.getElementById('root').innerHTML='<div id="__preview_error">Preview error: '+String(e&&e.message?e.message:e).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</div>'}try{var compiled=Babel.transform(${safeScriptJson(source)},{filename:'preview.tsx',presets:['env','react','typescript']}).code;new Function(compiled)()}catch(e){showError(e);console.error(e)}</script></body></html>`
}

function buildEmptyPreview(message: string) {
  return `<!doctype html><html><body style="margin:0;background:#020617;color:#94a3b8;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh"><div style="padding:28px;border:1px solid rgba(148,163,184,.18);border-radius:18px;background:rgba(255,255,255,.04);font-size:13px">${message}</div></body></html>`
}

function escapePreviewStyle(value: string) { return value.replace(/<\/style>/gi, "<\\/style>") }
function safeScriptJson(value: string) { return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }
function stablePreviewKey(files: SevenEightSixProjectFileMap | undefined, html: string): string {
  const source = files ? Object.keys(files).sort().map((path) => `${path}:${files[path]}`).join("\n---786-file---\n") : html
  let hash = 2166136261
  for (let i = 0; i < source.length; i++) { hash ^= source.charCodeAt(i); hash = Math.imul(hash, 16777619) }
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
  const [device, setDevice] = useState<Device>("full")
  const [theme, setTheme] = useState<ThemeName>("purple")
  const [themeOpen, setThemeOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const endRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}).sort(), [project])
  const previewPayload = useMemo(() => (project ? filesToPreviewPayload(project.files, theme) : { html: "", key: "empty" }), [project, theme])
  const activeTheme = themes[theme]
  const ActiveDeviceIcon = devices[device].icon

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
        if (!res.ok) { if (res.status === 404) localStorage.removeItem(ACTIVE_PROJECT_ID_KEY); return }
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
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_THEME_STORAGE_KEY) as AdminVisualTheme | null
      if (saved && themeNamesByVisual[saved]) setTheme(themeNamesByVisual[saved])
    } catch {}
  }, [])

  function newChat() {
    setMessages([]); setProject(null); setSelectedFile("app/page.tsx"); setInput(""); setAttachments([]); setAttachmentError(null); setPanel("preview"); setRefreshKey((v) => v + 1)
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
  }

  async function persistAfterGeneration(generated: SevenEightSixProject, userText: string, assistantText: string, assistantModel: string | null, assistantReason: string | null): Promise<ActiveProject | null> {
    const activeFile = (generated.files && generated.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) || "app/page.tsx"
    const previewStatePatch: AdminProjectPreviewState = { active_file: activeFile, entry_path: "app/page.tsx" }
    const messagesPayload = [{ role: "user" as const, content: userText }, { role: "assistant" as const, content: assistantText, model: assistantModel, reason: assistantReason }]
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
    } catch (error) { console.error("[786.Chat] persistence failed", error); return null }
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read attachment."))
      reader.onerror = () => reject(new Error("Could not read attachment."))
      reader.readAsDataURL(file)
    })
  }

  async function addAttachments(files: FileList | null) {
    if (!files?.length) return
    setAttachmentError(null)
    const available = MAX_ATTACHMENTS - attachments.length
    if (available <= 0) { setAttachmentError(`Maximum ${MAX_ATTACHMENTS} attachments.`); return }
    const selected = Array.from(files).slice(0, available)
    const next: PendingAttachment[] = []
    for (const file of selected) {
      if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) { setAttachmentError(`${file.name}: unsupported type.`); continue }
      if (file.size > MAX_ATTACHMENT_BYTES) { setAttachmentError(`${file.name}: maximum size is 10 MB.`); continue }
      try {
        next.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, mediaType: file.type, url: await fileToDataUrl(file), size: file.size })
      } catch { setAttachmentError(`${file.name}: could not be read.`) }
    }
    if (next.length) setAttachments((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function send() {
    const text = input.trim()
    if ((!text && attachments.length === 0) || sending) return
    const userText = text || "Inspect the attached file and update this project."
    const attachmentLabel = attachments.length ? `\nAttached: ${attachments.map((item) => item.name).join(", ")}` : ""
    setMessages((old) => [...old, { id: `u-${Date.now()}`, role: "user", content: `${userText}${attachmentLabel}` }])
    setInput(""); setSending(true); setPanel("preview")
    try {
      const existing = buildExistingProjectContext(project, selectedFile)
      const requestBody: Record<string, unknown> = { message: userText, mode, attachments: attachments.map(({ name, mediaType, url }) => ({ name, mediaType, url })) }
      if (project?.id) requestBody.projectId = project.id
      if (existing) requestBody.existing = existing
      const res = await fetch("/api/786-admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) })
      const json = await res.json()
      if (!res.ok || !json.success || !json.project) throw new Error(json.error || "Project generation failed.")
      const generated: SevenEightSixProject = json.project
      const assistantText = json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const assistantModel: string | null = json.model ?? null
      const assistantReason: string | null = json.reason ?? null
      const persisted = await persistAfterGeneration(generated, userText, assistantText, assistantModel, assistantReason)
      if (!persisted) throw new Error("Project generated but could not be saved to Neon. Run setup once, then retry.")
      setProject(persisted)
      setAttachments([])
      setAttachmentError(null)
      setRefreshKey((v) => v + 1)
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: assistantText, model: assistantModel, reason: assistantReason }])
      setSelectedFile((persisted.preview_state.active_file as string | undefined) || (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) || "app/page.tsx")
    } catch (error) {
      setMessages((old) => [...old, { id: `e-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Request failed." }])
    } finally { setSending(false) }
  }

  async function publish() {
    if (!project || publishing) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/786-admin/projects/${project.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: previewPayload.html }) })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Publish failed")
      setMessages((old) => [...old, { id: `p-${Date.now()}`, role: "assistant", content: `Published successfully: ${json.url}` }])
      if (json.url) window.open(json.url, "_blank", "noopener,noreferrer")
    } catch (error) { setMessages((old) => [...old, { id: `pe-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Publish failed." }]) }
    finally { setPublishing(false) }
  }

  if (isLoading || !isAdmin) return <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></main>

  return (
    <main className={`relative h-screen overflow-hidden bg-gradient-to-br ${activeTheme.shell} text-white`} style={{ ["--accent" as string]: activeTheme.accent }}>
      <PremiumAdminBackground theme={visualThemes[theme]} />

      <div className="relative z-10 flex h-full p-2 text-[12px] lg:p-3">
        <aside className="flex w-[68px] shrink-0 flex-col items-center justify-between rounded-[24px] border border-white/10 bg-black/25 py-4 shadow-2xl backdrop-blur-2xl">
          <div className="space-y-10">
            <button onClick={() => router.push('/chat')} className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--accent))] shadow-[0_0_28px_rgba(var(--accent),.55)]" title="Chat"><Sparkles className="h-5 w-5" /></button>
            <div className="space-y-5">
              <button onClick={() => router.push('/chat')} className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--accent))] text-white" title="Chat"><FolderKanban className="h-4 w-4" /></button>
              <button onClick={() => router.push('/786-admin/projects')} className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 hover:bg-white/10" title="Projects"><FolderKanban className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="space-y-5"><button className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 hover:bg-white/10" title="Settings"><Settings className="h-4 w-4" /></button><div className="grid h-9 w-9 place-items-center rounded-full bg-[rgb(var(--accent))] text-xs font-black">M</div></div>
        </aside>

        <div className="ml-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl">
          <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 backdrop-blur-2xl">
            <button onClick={newChat} className="ml-2 inline-flex h-10 items-center gap-2 rounded-2xl bg-[rgb(var(--accent))] px-5 text-xs font-black shadow-[0_0_28px_rgba(var(--accent),.4)] transition hover:-translate-y-0.5" title="New Chat"><Plus className="h-4 w-4" /><span>New Chat</span></button>
            <div className="mx-auto hidden h-10 w-[280px] items-center justify-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 text-xs text-slate-300 md:flex"><Monitor className="h-4 w-4" /><span>/</span></div>
            <button onClick={() => setPanel('preview')} className={`grid h-10 w-12 place-items-center rounded-xl border text-xs font-black ${panel === 'preview' ? 'border-white/20 bg-[rgba(var(--accent),.35)] text-white' : 'border-white/10 bg-black/25 text-slate-300'}`} title="Preview"><Monitor className="h-4 w-4" /></button>
            <button onClick={() => setPanel('code')} className={`grid h-10 w-12 place-items-center rounded-xl border text-xs font-black ${panel === 'code' ? 'border-white/20 bg-[rgba(var(--accent),.35)] text-white' : 'border-white/10 bg-black/25 text-slate-300'}`} title="Code"><Code2 className="h-4 w-4" /></button>
            <div className="relative">
              <button onClick={() => setDeviceOpen((v) => !v)} className="inline-flex h-10 w-12 items-center justify-center gap-1 rounded-xl border border-white/10 bg-black/25 text-slate-200 hover:bg-white/10" title={devices[device].label}><ActiveDeviceIcon className="h-4 w-4" /><ChevronDown className="h-3 w-3" /></button>
              {deviceOpen && <div className="absolute right-0 top-12 z-50 max-h-[430px] w-52 overflow-y-auto rounded-xl border border-white/10 bg-[#100821]/95 p-2 shadow-2xl backdrop-blur-2xl">
                {(Object.keys(devices) as Device[]).map((key) => { const Icon = devices[key].icon; return <button key={key} onClick={() => { setDevice(key); setDeviceOpen(false); setPanel('preview') }} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold ${device === key ? 'bg-[rgba(var(--accent),.35)] text-white' : 'text-slate-300 hover:bg-white/10'}`}><Icon className="h-4 w-4" />{devices[key].label}</button> })}
              </div>}
            </div>
            <button onClick={() => setRefreshKey((v) => v + 1)} className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 hover:bg-white/10" title="Refresh"><RotateCw className="h-4 w-4" /></button>
            <button onClick={publish} disabled={!project || publishing} className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 hover:bg-white/10 disabled:opacity-40" title="Publish"><Rocket className="h-4 w-4" /></button>
            <div className="relative">
              <button onClick={() => setThemeOpen((v) => !v)} className="inline-flex h-10 w-12 items-center justify-center gap-1 rounded-xl border border-white/10 bg-black/25 text-slate-200 hover:bg-white/10" title="Theme"><Palette className="h-4 w-4" /><ChevronDown className="h-3 w-3" /></button>
              {themeOpen && <div className="absolute right-0 top-12 z-50 w-[222px] rounded-xl border border-white/10 bg-[#100821]/95 p-3 shadow-2xl backdrop-blur-2xl">
                <p className="mb-3 text-center text-xs text-slate-400">Choose Theme</p>
                {(Object.keys(themes) as ThemeName[]).map((key) => <button key={key} onClick={() => { setTheme(key); setThemeOpen(false); setRefreshKey((v) => v + 1) }} className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-2 text-left ${theme === key ? 'border-white/20 bg-[rgba(var(--accent),.35)]' : 'border-transparent hover:bg-white/5'}`}><span className={`h-8 w-8 rounded-full bg-gradient-to-br ${themes[key].swatch}`} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{themes[key].name}</span><span className="text-[11px] text-slate-400">{themes[key].sub}</span></span>{theme === key && <Check className="h-4 w-4 text-white" />}</button>)}
              </div>}
            </div>
            <button onClick={() => router.push('/786-admin/login')} className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 hover:bg-white/10" title="Power"><Power className="h-4 w-4" /></button>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="relative flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-black/20 backdrop-blur-2xl">
              <div className="flex-1 overflow-y-auto p-5 pb-36">
                {messages.length === 0 ? <div className="flex h-full flex-col justify-center text-center">
                  <div className="mb-28 rounded-[22px] border border-white/10 bg-black/30 p-5 text-left shadow-[0_0_60px_rgba(var(--accent),.18)]"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(var(--accent))]"><Sparkles className="h-5 w-5" /></div><div><p className="font-black">AI Assistant</p><p className="text-xs text-violet-200">Galaxy Model v2.5</p></div></div><p className="mt-5 inline-flex items-center gap-2 text-xs font-black text-emerald-300"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500"><Check className="h-4 w-4 text-white" /></span>Agent ready</p></div>
                  <h1 className="text-xl font-black text-slate-200">Welcome back to 786.Chat</h1><p className="mx-auto mt-4 max-w-[260px] text-sm leading-6 text-slate-400">New chat is empty. Send a build prompt to create real project files.</p>
                </div> : messages.map((m) => <div key={m.id} className={`mb-4 rounded-3xl border p-4 text-sm leading-6 ${m.role === 'user' ? 'ml-5 border-white/10 bg-[rgba(var(--accent),.25)] text-white' : 'mr-5 border-white/10 bg-white/[0.045] text-slate-200'}`}><div className="mb-2 text-xs font-black text-slate-400">{m.role === 'user' ? 'You' : '786.Chat'}</div><p className="whitespace-pre-wrap">{m.content}</p></div>)}
                {sending && <div className="rounded-3xl border border-white/10 bg-[rgba(var(--accent),.18)] p-4 text-sm"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Creating real project files...</div>}
                <div ref={endRef} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#09051a]/95 p-4 backdrop-blur-xl">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple className="hidden" onChange={(event) => void addAttachments(event.target.files)} />
                {attachments.length > 0 && <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {attachments.map((item) => <div key={item.id} className="flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[10px] text-slate-200">
                    {item.mediaType === "application/pdf" ? <FileText className="h-4 w-4 shrink-0 text-rose-300" /> : <img src={item.url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />}
                    <span className="max-w-36 truncate">{item.name}</span>
                    <button type="button" onClick={() => setAttachments((current) => current.filter((attachment) => attachment.id !== item.id))} className="rounded-full p-1 hover:bg-white/10" aria-label={`Remove ${item.name}`}><X className="h-3 w-3" /></button>
                  </div>)}
                </div>}
                {attachmentError && <p className="mb-2 text-[11px] font-semibold text-rose-300">{attachmentError}</p>}
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending || attachments.length >= MAX_ATTACHMENTS} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40" title="Attach image or PDF"><Paperclip className="h-5 w-5" /></button>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }} rows={1} className="min-h-8 flex-1 resize-none bg-transparent py-1 text-xs text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build from text, screenshots, or PDFs..." />
                  <button onClick={() => void send()} disabled={sending || (!input.trim() && attachments.length === 0)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))] disabled:opacity-40"><Send className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100">{attachments.length ? `${attachments.length} attachment${attachments.length === 1 ? '' : 's'} — Gemini multimodal` : project ? `Editing ${project.title} — auto-save on` : 'Text uses DeepSeek. Attachments use Gemini. Projects save to Neon.'}</p>
              </div>
            </section>

            <section className="flex min-w-0 flex-1 flex-col bg-black/15">
              {panel === 'preview' ? <div className={`min-h-0 flex-1 ${device === 'full' || device === 'desktop' ? 'p-0' : 'flex items-center justify-center overflow-auto p-5'}`}>
                {sending ? <div className="grid h-full place-items-center"><div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-slate-300"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading generated preview...</div></div> : project && previewPayload.html ? <div className={`${devices[device].frame} overflow-hidden bg-white`}><iframe key={`${project.id}-${previewPayload.key}-${device}-${refreshKey}`} srcDoc={previewPayload.html} title={`${project.title} preview`} sandbox="allow-scripts allow-forms allow-popups" className={`${devices[device].iframe} block border-0 bg-white`} /></div> : <div className="grid h-full place-items-center text-center"><div><Monitor className="mx-auto mb-5 h-16 w-16 text-cyan-300" /><h2 className="text-2xl font-black">No Preview Yet</h2><p className="mt-4 text-sm text-slate-400">New chat starts with empty preview and empty code.</p></div></div>}
              </div> : <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-4 p-6"><div className="overflow-auto rounded-3xl border border-white/10 bg-black/30 p-3">{fileNames.length === 0 ? <p className="p-3 text-sm text-slate-500">No files yet.</p> : fileNames.map((file) => <button key={file} onClick={() => setSelectedFile(file)} className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-black ${selectedFile === file ? 'bg-[rgb(var(--accent))] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{file}</button>)}</div><pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-black/30 p-5 text-xs leading-6 text-cyan-50"><code>{project?.files?.[selectedFile] || 'Select a file.'}</code></pre></div>}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
