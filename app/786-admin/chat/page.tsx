"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Code2, FolderKanban, GripVertical, Loader2, Monitor, Paperclip, Plus, Rocket, Send, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"
import type { AdminMessage, AdminProjectPreviewState, AdminProjectWithData } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_WIDTH_KEY = "786chat_admin_chat_width_v1"
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

function uiFromAdminMessage(m: AdminMessage): UiMessage {
  return { id: m.id, role: m.role === "system" ? "assistant" : m.role, content: m.content, model: m.model, reason: m.reason }
}

function filesToPreviewPayload(files: SevenEightSixProjectFileMap | undefined): PreviewPayload {
  const html = filesToHtml(files)
  return { html, key: stablePreviewKey(files, html) }
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined) {
  if (!files || Object.keys(files).length === 0) {
    return buildEmptyPreview("", "Preview will appear here once a project is generated.")
  }

  const pagePath = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"].find(
    (p) => typeof files[p] === "string" && files[p].trim().length > 0
  )

  const rawCss = files["app/globals.css"] || files["src/app/globals.css"] || ""
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()

  if (!pagePath) {
    return buildEmptyPreview(css, "No app/page.tsx file was found in this project, so preview is unavailable.")
  }

  const pageTransform = transformPreviewSource(files[pagePath])
  const rootName = pageTransform.defaultName || "Page"

  // Subsystem #5 / B-03 v2 — generic dependency resolver.
  // Inline ALL source files (.ts/.tsx/.js/.jsx, excluding .d.ts and layout)
  // ordered lib → utils/data/constants/helpers/types → hooks → components
  // → page, so module-scope references resolve before the page evaluates.
  const isSourceFile = (path: string) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path)
  const isLayoutFile = (path: string) => /^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(path)
  const dependencyOrder = (path: string): number => {
    if (/^(src\/)?lib\//.test(path)) return 0
    if (/^(src\/)?(utils|util|helpers|data|constants|types)\//.test(path)) return 1
    if (/^(src\/)?hooks\//.test(path)) return 2
    if (/^(src\/)?components\//.test(path)) return 3
    return 4
  }

  const sourceEntries = Object.entries(files)
    .filter(([path]) => {
      if (path === pagePath) return false
      if (isLayoutFile(path)) return false
      return isSourceFile(path)
    })
    .sort(([a], [b]) => dependencyOrder(a) - dependencyOrder(b) || a.localeCompare(b))

  const componentBodies = sourceEntries
    .map(([, src]) => transformPreviewSource(src).body)
    .filter((body) => body.length > 0)
    .join("\n\n")

  const userScript = [componentBodies, pageTransform.body].filter(Boolean).join("\n\n")
  const runtimeSource = buildPreviewRuntimeSource(userScript, rootName)
  const runtimeSourceJson = safeScriptJson(runtimeSource)

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
<style>${escapePreviewStyle(css)}</style>
<style>html,body{margin:0;padding:0;background:white;color:#0f172a;font-family:Inter,system-ui,-apple-system,sans-serif}#__preview_loading{padding:32px;margin:24px;font-family:system-ui;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;font-size:13px;line-height:1.5}#__preview_error{padding:24px;margin:24px;font-family:system-ui;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:14px;white-space:pre-wrap;font-size:13px;line-height:1.5}</style>
</head>
<body>
<div id="root"><div id="__preview_loading">Loading generated preview...</div></div>
<script>
(function(){
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch})}
  window.__showPreviewError = function(message){
    var root = document.getElementById('root')
    if (root) root.innerHTML = '<div id="__preview_error">Preview error: ' + escapeHtml(message) + '</div>'
  }
  window.addEventListener('error', function(event){
    var msg = event && event.message ? event.message : 'Unknown preview runtime error'
    window.__showPreviewError(msg)
  })
  window.addEventListener('unhandledrejection', function(event){
    var reason = event && event.reason ? event.reason : 'Unknown preview promise rejection'
    window.__showPreviewError(reason && reason.message ? reason.message : String(reason))
  })
  window.__previewStarted = false
  setTimeout(function(){
    var loading = document.getElementById('__preview_loading')
    if (loading && !window.__previewStarted) {
      window.__showPreviewError('Preview runtime did not start. A CDN script may be blocked or Babel could not compile the generated files.')
    }
  }, 4500)
})();
</script>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin onerror="window.__showPreviewError('React CDN failed to load')"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin onerror="window.__showPreviewError('ReactDOM CDN failed to load')"></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js" onerror="window.__showPreviewError('Babel CDN failed to load')"></script>
<script>
(function(){
  try {
    window.__previewStarted = true
    if (!window.React) throw new Error('React runtime is unavailable')
    if (!window.ReactDOM) throw new Error('ReactDOM runtime is unavailable')
    if (!window.Babel) throw new Error('Babel runtime is unavailable')
    var source = ${runtimeSourceJson}
    var compiled = window.Babel.transform(source, { presets: ['env', 'react', 'typescript'], filename: 'preview.tsx' }).code
    new Function(compiled)()
  } catch (err) {
    window.__showPreviewError(err && err.message ? String(err.message) : String(err))
    console.error('[786.Chat preview]', err)
  }
})();
</script>
</body>
</html>`
}

function buildPreviewRuntimeSource(userScript: string, rootName: string): string {
  return `
try {
  const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext, Fragment, forwardRef, memo, Children, cloneElement, isValidElement } = React
  const Link = ({ children, href, ...rest }) => React.createElement('a', Object.assign({ href }, rest), children)
  const Image = ({ src, alt, width, height, fill, priority, ...rest }) => React.createElement('img', Object.assign({ src, alt, width, height }, rest))
  const __makeIcon = (name) => (props = {}) => React.createElement('span', Object.assign({}, props, { 'data-icon': name, 'aria-hidden': true, className: 'inline-block align-middle w-4 h-4 ' + (props.className || '') }))

  if (typeof globalThis.cn === 'undefined') {
    globalThis.cn = function () {
      var args = Array.prototype.slice.call(arguments)
      return args.flat(Infinity).filter(Boolean).map(function (a) {
        return typeof a === 'string'
          ? a
          : Object.entries(a || {}).filter(function (e) { return e[1] }).map(function (e) { return e[0] }).join(' ')
      }).join(' ')
    }
  }
  if (typeof globalThis.clsx === 'undefined') { globalThis.clsx = globalThis.cn }
  if (typeof globalThis.twMerge === 'undefined') { globalThis.twMerge = globalThis.cn }
  if (typeof globalThis.cva === 'undefined') {
    globalThis.cva = function (base, _config) {
      return function () {
        var inputs = Array.prototype.slice.call(arguments)
        return globalThis.cn.apply(null, [base].concat(inputs))
      }
    }
  }

  ${escapePreviewScript(userScript)}

  const __Root__ = (typeof ${rootName} !== 'undefined') ? ${rootName} : null
  const __mount__ = document.getElementById('root')
  if (!__Root__) {
    window.__showPreviewError('Could not find the default export in app/page.tsx')
  } else {
    ReactDOM.createRoot(__mount__).render(React.createElement(__Root__))
  }
} catch (err) {
  window.__showPreviewError(err && err.message ? String(err.message) : String(err))
  console.error('[786.Chat preview]', err)
}
`
}

function transformPreviewSource(src: string): { defaultName: string | null; body: string } {
  const lucideNames = new Set<string>()
  const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let match: RegExpExecArray | null
  while ((match = lucideRe.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const cleaned = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(cleaned)) lucideNames.add(cleaned)
    }
  }

  let source = src
  source = source.replace(/^["']use (client|server)["']\s*;?\s*\n?/m, "")
  source = source.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*import\s+["'][^"']+["']\s*;?\s*$/gm, "")
  // Strip re-export lines (the underlying source is already inlined separately).
  source = source.replace(/^\s*export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+\*\s+as\s+[\w$]+\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s*\{[^}]*\}\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")

  let defaultName: string | null = null
  const namedDefaultFunction = source.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (namedDefaultFunction) {
    defaultName = namedDefaultFunction[1]
    source = source.replace(/export\s+default\s+function\s+/, "function ")
  } else if (/export\s+default\s+function\s*\(/.test(source)) {
    defaultName = "__DefaultExport__"
    source = source.replace(/export\s+default\s+function\s*\(/, "function __DefaultExport__(")
  } else {
    const namedDefault = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)
    if (namedDefault) {
      defaultName = namedDefault[1]
      source = source.replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/, "")
    } else if (/export\s+default\s+/.test(source)) {
      defaultName = "__DefaultExport__"
      source = source.replace(/export\s+default\s+/, "const __DefaultExport__ = ")
    }
  }

  source = source.replace(/\bexport\s+(const|let|var|function|class|type|interface|enum)\b/g, "$1")
  source = source.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+type\s+[\s\S]*?(?=\n|$)/gm, "")

  const lucideShim = Array.from(lucideNames)
  .map((name) => `if (typeof globalThis.${name} === 'undefined') { globalThis.${name} = __makeIcon('${name}'); }`)
    .join("\n")
  const body = (lucideShim ? `${lucideShim}\n` : "") + source.trim()
  return { defaultName, body }
}

function escapePreviewScript(value: string): string {
  return value.replace(/<\/script>/gi, "<\\/script>")
}

function escapePreviewStyle(value: string): string {
  return value.replace(/<\/style>/gi, "<\\/style>")
}

function safeScriptJson(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

function stablePreviewKey(files: SevenEightSixProjectFileMap | undefined, html: string): string {
  const source = files
    ? Object.keys(files)
        .sort()
        .map((path) => `${path}:${files[path]}`)
        .join("\n---786-file---\n")
    : html

  let hash = 2166136261
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

function buildEmptyPreview(css: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewStyle(css)}</style><style>html,body{margin:0;padding:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a}</style></head><body><div style="padding:32px;max-width:720px;margin:64px auto;border:1px solid #cbd5e1;background:white;border-radius:12px;color:#475569">${message}</div></body></html>`
}

function buildExistingProjectContext(activeProject: ActiveProject | null, selectedFile: string): ExistingProjectContext | undefined {
  if (!activeProject) return undefined

  const fileTree = Object.keys(activeProject.files || {}).sort()
  if (fileTree.length === 0) return undefined

  const orderedCandidates = [
    selectedFile,
    ...EDIT_CONTEXT_PRIMARY_FILES,
    ...fileTree.filter((path) => path.startsWith("app/") || path.startsWith("components/")),
    ...fileTree,
  ]

  const keyFiles: Record<string, string> = {}
  for (const path of orderedCandidates) {
    if (Object.keys(keyFiles).length >= EDIT_CONTEXT_MAX_EXTRA_FILES) break
    if (!path || keyFiles[path] !== undefined) continue
    const content = activeProject.files[path]
    if (typeof content !== "string") continue
    keyFiles[path] = content
  }

  return {
    title: activeProject.title,
    description: activeProject.description,
    fileTree,
    keyFiles,
  }
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

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const previewPayload = useMemo(() => (project ? filesToPreviewPayload(project.files) : { html: "", key: "empty" }), [project])

  useEffect(() => { if (!isLoading && !isAdmin) router.replace("/786-admin/login") }, [isLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    try { localStorage.removeItem(OLD_PROJECT_KEY); localStorage.removeItem(LEGACY_PROJECTS_KEY) } catch {}
    try {
      const savedWidth = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (Number.isFinite(savedWidth) && savedWidth >= 360 && savedWidth <= 620) setChatWidth(savedWidth)
    } catch {}
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
        const initialFile = (p.preview_state?.active_file as string | undefined) || (p.files && p.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(p.files || {})[0]) || "app/page.tsx"
        setSelectedFile(initialFile)
      } catch {}
    }
    hydrate()
    return () => { cancelled = true }
  }, [isAdmin])

  useEffect(() => { try { localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth))) } catch {} }, [chatWidth])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length, sending])

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e: MouseEvent) => setChatWidth(Math.min(Math.max(e.clientX - 92, 360), 620))
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
    setMessages([]); setProject(null); setSelectedFile("app/page.tsx"); setInput(""); setPanel("preview")
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
    tone(true)
  }

  async function persistAfterGeneration(generated: SevenEightSixProject, userText: string, assistantText: string, assistantModel: string | null, assistantReason: string | null): Promise<ActiveProject | null> {
    const activeFile = (generated.files && generated.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) || "app/page.tsx"
    const previewStatePatch: AdminProjectPreviewState = { active_file: activeFile, entry_path: "app/page.tsx" }
    const metadataPatch = assistantModel ? { model: assistantModel } : undefined
    const messagesPayload = [
      { role: "user" as const, content: userText },
      { role: "assistant" as const, content: assistantText, model: assistantModel, reason: assistantReason },
    ]
    const projectId = project?.id || null
    try {
      const url = projectId ? `/api/786-admin/projects/${projectId}` : "/api/786-admin/projects"
      const method = projectId ? "PATCH" : "POST"
      const body: Record<string, unknown> = { prompt: userText, preview_state: previewStatePatch, files: generated.files, messages: messagesPayload }
      if (metadataPatch) body.metadata = metadataPatch
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
    const optimisticUser: UiMessage = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((old) => [...old, optimisticUser])
    setInput(""); setSending(true); setPanel("preview"); tone(false)
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
      if (persisted) {
        setProject(persisted)
        setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: assistantText, model: assistantModel, reason: assistantReason }])
        const initialFile = (persisted.preview_state.active_file as string | undefined) || (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) || "app/page.tsx"
        setSelectedFile(initialFile)
        tone(true)
      } else {
        setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", content: "Project was generated but could not be saved to Neon. Run POST /api/786-admin/setup once, then retry." }])
        tone(false)
      }
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
        <aside className="hidden w-[92px] shrink-0 border-r border-cyan-300/20 bg-[#06101c] pt-24 lg:block">
          <button onClick={() => router.push("/786-admin/projects")} className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-100" title="Projects">
            <FolderKanban className="h-5 w-5" />
          </button>
        </aside>

        <section className="relative flex h-full min-w-[360px] shrink-0 flex-col border-r border-cyan-300/30 bg-[#081322]" style={{ width: chatWidth }}>
          <header className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <button onClick={newChat} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50">
              <Plus className="h-4 w-4" /><span>New Chat</span>
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={() => setSound((v) => !v)} className="shrink-0 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">Sound {sound ? "On" : "Off"}</button>
              <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="w-[108px] rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100">
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
                <div key={m.id} className={`mb-4 rounded-3xl border p-4 text-sm leading-6 ${m.role === "user" ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"}`}>
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
                <div className="flex items-center gap-3"><Wand2 className="h-5 w-5 animate-pulse text-cyan-200" /><span>786.Chat is creating real project files...</span></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/95 p-4 backdrop-blur-xl">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3">
              <Paperclip className="mt-2 h-5 w-5 shrink-0 text-slate-500" />
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build a real project..." />
              <button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">
              {project ? `Editing project "${project.title}" — changes save to Neon.` : "New Chat is empty. Build prompt creates real files saved to Neon."}
            </div>
          </div>
        </section>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }} className="hidden h-full w-4 shrink-0 cursor-col-resize items-center justify-center border-r border-cyan-300/20 bg-[#050713] lg:flex" title="Drag to resize chat and preview">
          <span className="flex h-24 w-2 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><GripVertical className="h-5 w-5" /></span>
        </button>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-400">
              <span className="block truncate">{sending ? "Generating new preview..." : project ? project.title : "No project yet"}</span>
            </div>
            <button onClick={() => setPanel("preview")} className={`rounded-full border px-4 py-2 text-sm ${panel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}>
              <Monitor className="mr-2 inline h-4 w-4" />Preview
            </button>
            <button onClick={() => setPanel("code")} className={`rounded-full border px-4 py-2 text-sm ${panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}>
              <Code2 className="mr-2 inline h-4 w-4" />Code
            </button>
            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950">
              <Rocket className="mr-2 inline h-4 w-4" />Publish
            </button>
          </header>

          {panel === "preview" ? (
            sending ? (
              <div className="flex min-h-0 flex-1 p-6">
                <div className="flex min-h-0 flex-1 items-start rounded-[2rem] border border-cyan-300/20 bg-white p-6">
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm font-medium text-slate-500">
                    Loading generated preview...
                  </div>
                </div>
              </div>
            ) : project && previewPayload.html ? (
              <div className="flex min-h-0 flex-1 p-6">
                <iframe key={`${project.id}-${previewPayload.key}`} srcDoc={previewPayload.html} title={`${project.title} preview`} sandbox="allow-scripts allow-forms allow-popups" className="min-h-0 flex-1 rounded-[2rem] border border-cyan-300/20 bg-white" />
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
                    <button key={file} onClick={() => setSelectedFile(file)} className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-bold ${selectedFile === file ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-300"}`}>
                      {file}
                    </button>
                  ))
                )}
              </div>
              <pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50">
                <code>{project?.files?.[selectedFile] || "Select a file."}</code>
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
