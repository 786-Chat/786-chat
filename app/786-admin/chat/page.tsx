"use client"

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, Code2, FolderKanban, GripVertical, Loader2, Monitor, Paperclip,
  Plus, Rocket, Send, Settings, Smartphone, Sparkles, Tablet, Volume2, VolumeX,
  X, FileText, ChevronRight, ChevronDown, RefreshCw,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"
import type { AdminMessage, AdminProjectPreviewState, AdminProjectWithData } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_WIDTH_KEY = "786chat_admin_chat_width_v1"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const ACTIVE_FILE_KEY = "786chat_admin_active_file_v1"
const SOUND_KEY = "786chat_admin_sound_v1"
const MODE_KEY = "786chat_admin_mode_v1"
const DEVICE_KEY = "786chat_admin_device_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

const PREVIEW_TIMEOUT_MS = 10000

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "desktop" | "tablet" | "mobile"
type PreviewLifecycle = "idle" | "loading" | "ready" | "failed"
type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string | null
  reason?: string | null
  ts?: number
}

function uiFromAdminMessage(m: AdminMessage): UiMessage {
  return {
    id: m.id,
    role: m.role === "system" ? "assistant" : m.role,
    content: m.content,
    model: m.model,
    reason: m.reason,
    ts: m.created_at ? new Date(m.created_at).getTime() : undefined,
  }
}

function escapePreviewScript(value: string): string {
  return value.replace(/<\/script>/gi, "<\\/script>")
}

function transformPreviewSource(src: string): { defaultName: string | null; body: string } {
  const lucideNames = new Set<string>()
  const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let m: RegExpExecArray | null
  while ((m = lucideRe.exec(src)) !== null) {
    for (const raw of m[1].split(",")) {
      const cleaned = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(cleaned)) lucideNames.add(cleaned)
    }
  }

  let s = src
  s = s.replace(/^['"]use (client|server)['"]\s*;?\s*\n?/m, "")
  s = s.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, "")
  s = s.replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, "")
  s = s.replace(/^\s*export\s+\*\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, "")
  s = s.replace(/^\s*export\s+\*\s+as\s+[\w$]+\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, "")
  s = s.replace(/^\s*export\s*\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, "")

  let defaultName: string | null = null
  const m1 = s.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (m1) {
    defaultName = m1[1]
    s = s.replace(/export\s+default\s+function\s+/, "function ")
  } else {
    const m2 = s.match(/export\s+default\s+function\s*\(/)
    if (m2) {
      defaultName = "__DefaultExport__"
      s = s.replace(/export\s+default\s+function\s*\(/, "function __DefaultExport__(")
    } else {
      const m3 = s.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)
      if (m3) {
        defaultName = m3[1]
        s = s.replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/, "")
      } else {
        const m4 = s.match(/export\s+default\s+/)
        if (m4) {
          defaultName = "__DefaultExport__"
          s = s.replace(/export\s+default\s+/, "const __DefaultExport__ = ")
        }
      }
    }
  }

  s = s.replace(/\bexport\s+(const|let|var|function|class|type|interface|enum)\b/g, "$1")
  s = s.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
  s = s.replace(/^\s*export\s+type\s+[\s\S]*?(?=\n|$)/gm, "")

  const lucideShim = Array.from(lucideNames)
    .map((n) => `if (typeof globalThis.${n} === 'undefined') { globalThis.${n} = __makeIcon('${n}'); } var ${n} = globalThis.${n};`)
    .join("\n")
  const body = (lucideShim ? lucideShim + "\n" : "") + s.trim()
  return { defaultName, body }
}

function buildEmptyPreview(css: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewScript(css)}</style><style>html,body{margin:0;padding:0;font-family:system-ui,sans-serif;background:#050713;color:#e2e8f0}</style></head><body><div style="padding:32px;max-width:720px;margin:64px auto;border:1px solid #1e293b;background:#0b111d;border-radius:16px;color:#94a3b8">${message}</div><script>try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}</script></body></html>`
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined): string {
  if (!files || Object.keys(files).length === 0) {
    return buildEmptyPreview("", "Preview will appear here once a project is generated.")
  }

  const pagePath = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"].find(
    (p) => typeof files[p] === "string" && (files[p] as string).trim().length > 0
  )

  const rawCss = files["app/globals.css"] || files["src/app/globals.css"] || ""
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()

  if (!pagePath) {
    return buildEmptyPreview(css, "No app/page.tsx in this project — preview unavailable.")
  }

  const pageTransform = transformPreviewSource(files[pagePath] as string)
  const rootName = pageTransform.defaultName || "Page"

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

  const sourceBodies = sourceEntries
    .map(([, src]) => transformPreviewSource(src as string).body)
    .filter((b) => b.length > 0)
    .join("\n\n")

  const userScript = escapePreviewScript(
    [sourceBodies, pageTransform.body].filter(Boolean).join("\n\n")
  )

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
<style>${escapePreviewScript(css)}</style>
<style>
html,body{margin:0;padding:0;background:#ffffff;color:#0f172a;font-family:Inter,system-ui,-apple-system,sans-serif}
#__preview_loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#050713;color:#67e8f9;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;z-index:9999}
#__preview_loading span{display:inline-block;width:8px;height:8px;margin:0 3px;background:#22d3ee;border-radius:99px;animation:__pl 1s infinite ease-in-out both}
#__preview_loading span:nth-child(2){animation-delay:0.12s}
#__preview_loading span:nth-child(3){animation-delay:0.24s}
@keyframes __pl{0%,80%,100%{opacity:0.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
#__preview_error{padding:24px;margin:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#fca5a5;background:#1f0a0a;border:1px solid #7f1d1d;border-radius:12px;white-space:pre-wrap;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div id="__preview_loading"><span></span><span></span><span></span></div>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<script type="text/babel" data-presets="env,react,typescript">
function __786_signal_ready(){try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}}
function __786_signal_error(msg){try{parent.postMessage({type:'786-preview-error',error:String(msg)},'*')}catch(e){}}
try {
  const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext, Fragment, forwardRef, memo, Children, cloneElement, isValidElement } = React
  const Link = ({ children, href, ...rest }) => React.createElement('a', Object.assign({ href }, rest), children)
  const Image = ({ src, alt, width, height, fill, priority, ...rest }) => React.createElement('img', Object.assign({ src, alt, width, height }, rest))
  if (typeof globalThis.__makeIcon === 'undefined') {
    globalThis.__makeIcon = (name) => (props = {}) => React.createElement('span', Object.assign({}, props, { 'data-icon': name, 'aria-hidden': true, className: 'inline-block align-middle w-4 h-4 ' + (props.className || '') }))
  }
  const __makeIcon = globalThis.__makeIcon
  if (typeof globalThis.cn === 'undefined') {
    globalThis.cn = (...args) => args.flat(Infinity).filter(Boolean).map(a => typeof a === 'string' ? a : Object.entries(a || {}).filter(([,v]) => v).map(([k]) => k).join(' ')).join(' ')
  }
  var cn = globalThis.cn
  if (typeof globalThis.clsx === 'undefined') globalThis.clsx = globalThis.cn
  var clsx = globalThis.clsx
  if (typeof globalThis.twMerge === 'undefined') globalThis.twMerge = globalThis.cn
  var twMerge = globalThis.twMerge
  if (typeof globalThis.cva === 'undefined') globalThis.cva = (base) => (...inputs) => globalThis.cn(base, ...inputs)
  var cva = globalThis.cva

  ${userScript}

  const __Root__ = (typeof ${rootName} !== 'undefined') ? ${rootName} : null
  const __mount__ = document.getElementById('root')
  const __loader__ = document.getElementById('__preview_loading')
  if (!__Root__) {
    if (__loader__) __loader__.remove()
    __mount__.innerHTML = '<div id="__preview_error">Preview error: could not find default export in app/page.tsx</div>'
    __786_signal_error('No default export found in app/page.tsx')
  } else {
    ReactDOM.createRoot(__mount__).render(React.createElement(__Root__))
    requestAnimationFrame(() => {
      if (__loader__) __loader__.remove()
      __786_signal_ready()
    })
  }
} catch (err) {
  const __loader__ = document.getElementById('__preview_loading')
  if (__loader__) __loader__.remove()
  const el = document.getElementById('root')
  if (el) {
    el.innerHTML = '<div id="__preview_error">Preview error: ' + (err && err.message ? String(err.message) : String(err)) + '</div>'
  }
  __786_signal_error(err && err.message ? err.message : String(err))
  console.error('[786.Chat preview]', err)
}
</script>
</body>
</html>`
}

type ActiveProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: SevenEightSixProjectFileMap
  preview_state: AdminProjectPreviewState
}

const MODE_LABEL: Record<Mode, string> = {
  "auto": "Auto",
  "deepseek-flash": "DeepSeek Flash",
  "deepseek-pro": "DeepSeek Pro",
  "gemini-flash": "Gemini Flash",
  "gemini-pro": "Gemini Pro",
}

function formatTime(ts?: number): string {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function slugifyTitle(t: string): string {
  return (t || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled"
}

function classifyFile(path: string): "page" | "layout" | "component" | "lib" | "style" | "config" | "other" {
  if (/^(src\/)?app\/page\.(tsx?|jsx?)$/.test(path)) return "page"
  if (/^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(path)) return "layout"
  if (/^(src\/)?components\//.test(path)) return "component"
  if (/^(src\/)?(lib|utils|helpers|hooks|data|constants|types)\//.test(path)) return "lib"
  if (/\.css$/.test(path)) return "style"
  if (/\.(json|md|env)$/i.test(path) || /^(package|tsconfig|next\.config)/.test(path)) return "config"
  return "other"
}

function groupFiles(paths: string[]): { folder: string; files: string[] }[] {
  const groups = new Map<string, string[]>()
  for (const p of paths.sort()) {
    const parts = p.split("/")
    const folder = parts.length > 1 ? parts[0] : "/"
    if (!groups.has(folder)) groups.set(folder, [])
    groups.get(folder)!.push(p)
  }
  return Array.from(groups.entries()).map(([folder, files]) => ({ folder, files }))
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
  const [device, setDevice] = useState<Device>("desktop")
  const [sending, setSending] = useState(false)
  const [sound, setSound] = useState(true)
  const [chatWidth, setChatWidth] = useState(430)
  const [isResizing, setIsResizing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
  const [previewState, setPreviewState] = useState<PreviewLifecycle>("idle")
  const [previewError, setPreviewError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const fileGroups = useMemo(() => groupFiles(fileNames), [fileNames])
  const previewHtml = useMemo(() => (project ? filesToHtml(project.files) : ""), [project])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data as { type?: string; error?: string } | null
      if (!data || typeof data !== "object") return
      if (data.type === "786-preview-ready") {
        setPreviewState("ready")
        setPreviewError(null)
      } else if (data.type === "786-preview-error") {
        setPreviewState("failed")
        setPreviewError(data.error || "Preview reported an error.")
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  useEffect(() => {
    if (!project || !previewHtml) {
      setPreviewState("idle")
      setPreviewError(null)
      return
    }
    setPreviewState("loading")
    setPreviewError(null)
    const t = window.setTimeout(() => {
      setPreviewState((cur) => (cur === "loading" ? "failed" : cur))
      setPreviewError((cur) => cur || "Preview did not initialize within 10 seconds. The project source may have a runtime error.")
    }, PREVIEW_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [project?.id, previewHtml])

  useEffect(() => {
    if (!isAdmin) return
    try {
      localStorage.removeItem(OLD_PROJECT_KEY)
      localStorage.removeItem(LEGACY_PROJECTS_KEY)
    } catch {}
    try {
      const savedWidth = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (Number.isFinite(savedWidth) && savedWidth >= 360 && savedWidth <= 620) setChatWidth(savedWidth)
      const savedSound = localStorage.getItem(SOUND_KEY)
      if (savedSound === "off") setSound(false)
      const savedMode = localStorage.getItem(MODE_KEY) as Mode | null
      if (savedMode && savedMode in MODE_LABEL) setMode(savedMode)
      const savedDevice = localStorage.getItem(DEVICE_KEY) as Device | null
      if (savedDevice && (savedDevice === "desktop" || savedDevice === "tablet" || savedDevice === "mobile")) setDevice(savedDevice)
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
        let initialFile: string | null = null
        try { initialFile = localStorage.getItem(ACTIVE_FILE_KEY) } catch {}
        if (!initialFile || !(p.files && p.files[initialFile])) {
          initialFile =
            (p.preview_state?.active_file as string | undefined) ||
            (p.files && p.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(p.files || {})[0]) ||
            "app/page.tsx"
        }
        startTransition(() => {
          setProject({
            id: p.id,
            title: p.title,
            description: p.description,
            prompt: p.prompt,
            files: p.files || {},
            preview_state: p.preview_state || {},
          })
          setMessages((p.messages || []).map(uiFromAdminMessage))
          setSelectedFile(initialFile!)
        })
      } catch {}
    }
    hydrate()
    return () => { cancelled = true }
  }, [isAdmin])

  useEffect(() => { try { localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth))) } catch {} }, [chatWidth])
  useEffect(() => { try { localStorage.setItem(SOUND_KEY, sound ? "on" : "off") } catch {} }, [sound])
  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode) } catch {} }, [mode])
  useEffect(() => { try { localStorage.setItem(DEVICE_KEY, device) } catch {} }, [device])
  useEffect(() => { try { localStorage.setItem(ACTIVE_FILE_KEY, selectedFile) } catch {} }, [selectedFile])

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
    setMessages([])
    setProject(null)
    setSelectedFile("app/page.tsx")
    setInput("")
    setPanel("preview")
    try {
      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
      localStorage.removeItem(ACTIVE_FILE_KEY)
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
      (generated.files && generated.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) ||
      "app/page.tsx"
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
      const body: Record<string, unknown> = {
        prompt: userText,
        preview_state: previewStatePatch,
        files: generated.files,
        messages: messagesPayload,
      }
      if (metadataPatch) body.metadata = metadataPatch
      if (!projectId) { body.title = generated.title; body.description = generated.description }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`)
      const json = (await res.json()) as { project: AdminProjectWithData }
      const saved = json.project
      try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, saved.id) } catch {}
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

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || sending) return
    const optimisticUser: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      ts: Date.now(),
    }
    setMessages((old) => [...old, optimisticUser])
    if (overrideText == null) setInput("")
    setSending(true)
    setPanel("preview")
    tone(false)
    try {
      const existingPayload = project
        ? {
            title: project.title,
            description: project.description,
            fileTree: Object.keys(project.files || {}),
            keyFiles: Object.fromEntries(
              (["app/page.tsx", "app/layout.tsx", "app/globals.css", "README.md"] as const)
                .filter((p) => typeof project.files?.[p] === "string")
                .map((p) => [p, project.files[p]])
            ),
          }
        : undefined
      const res = await fetch("/api/786-admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode, projectId: project?.id ?? null, existing: existingPayload }),
      })
      const json = await res.json()
      if (!res.ok || !json.success || !json.project) throw new Error(json.error || "Project generation failed.")
      const generated: SevenEightSixProject = json.project
      const assistantText =
        json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const assistantModel: string | null = json.model ?? null
      const assistantReason: string | null = json.reason ?? null
      const persisted = await persistAfterGeneration(generated, text, assistantText, assistantModel, assistantReason)
      if (persisted) {
        startTransition(() => {
          setProject(persisted)
          setMessages((current) => [
            ...current,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: assistantText,
              model: assistantModel,
              reason: assistantReason,
              ts: Date.now(),
            },
          ])
          const initialFile =
            (persisted.preview_state.active_file as string | undefined) ||
            (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) ||
            "app/page.tsx"
          setSelectedFile(initialFile)
        })
        tone(true)
      } else {
        setMessages((current) => [
          ...current,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "Project was generated but could not be saved to Neon. Run POST /api/786-admin/setup once, then retry.",
            ts: Date.now(),
          },
        ])
        tone(false)
      }
    } catch (error) {
      setMessages((old) => [
        ...old,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Request failed.",
          ts: Date.now(),
        },
      ])
      tone(false)
    } finally {
      setSending(false)
    }
  }, [input, sending, project, mode])

  const regeneratePreview = useCallback(() => {
    if (!project || sending) return
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    const text = lastUser?.content || project.prompt || project.title
    if (!text) return
    send(text)
  }, [project, messages, sending, send])

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
      </main>
    )
  }

  const selectedSource = project?.files?.[selectedFile] || ""
  const selectedLines = selectedSource.length ? selectedSource.split("\n") : []
  const projectSlug = project ? slugifyTitle(project.title) : ""

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[92px] shrink-0 flex-col items-center gap-3 border-r border-cyan-300/15 bg-[#06101c] pt-24 lg:flex">
          <button
            data-testid="rail-projects-btn"
            onClick={() => router.push("/786-admin/projects")}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/20"
            title="Projects"
          >
            <FolderKanban className="h-5 w-5" />
          </button>
        </aside>

        <section
          className="relative flex h-full min-w-[360px] shrink-0 flex-col border-r border-cyan-300/20 bg-[#081322]"
          style={{ width: chatWidth }}
        >
          <header className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <button
              data-testid="new-chat-btn"
              onClick={newChat}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/25"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
            <div className="relative">
              <button
                data-testid="settings-toggle-btn"
                onClick={() => setSettingsOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              {settingsOpen && (
                <div
                  data-testid="settings-popover"
                  className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#0b111d] p-3 shadow-2xl backdrop-blur-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Workspace</p>
                    <button
                      onClick={() => setSettingsOpen(false)}
                      className="rounded-md p-1 text-slate-400 hover:bg-white/5"
                      data-testid="settings-close-btn"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Model</label>
                  <select
                    data-testid="settings-mode-select"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as Mode)}
                    className="mb-3 w-full rounded-xl border border-cyan-300/15 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100"
                  >
                    {(Object.keys(MODE_LABEL) as Mode[]).map((k) => (
                      <option key={k} value={k}>{MODE_LABEL[k]}</option>
                    ))}
                  </select>
                  <button
                    data-testid="settings-sound-toggle"
                    onClick={() => setSound((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      {sound ? <Volume2 className="h-3.5 w-3.5 text-emerald-300" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
                      Sound
                    </span>
                    <span className={sound ? "text-emerald-300" : "text-slate-500"}>{sound ? "On" : "Off"}</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-44" data-testid="chat-messages">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-500">
                <div className="mx-auto max-w-[300px]">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-xl font-semibold text-cyan-100/90">Welcome back to 786.Chat</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Start a new chat. Send a build prompt and 786.Chat will generate a real Next.js project — files saved to Neon, preview rendered live.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user"
                return (
                  <div
                    key={m.id}
                    data-testid={isUser ? "chat-message-user" : "chat-message-assistant"}
                    className={`mb-4 flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-black ${
                        isUser
                          ? "border border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                          : "border border-violet-300/25 bg-violet-400/15 text-violet-100"
                      }`}
                    >
                      {isUser ? "You" : "786"}
                    </div>
                    <div
                      className={`max-w-[88%] rounded-3xl border p-4 text-sm leading-6 ${
                        isUser
                          ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                          : "border-white/10 bg-white/[0.045] text-slate-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span>{isUser ? "You" : "786.Chat"}</span>
                        <div className="flex items-center gap-2">
                          {m.model && (
                            <span className="rounded-md border border-violet-300/20 bg-violet-400/10 px-1.5 py-0.5 text-[10px] text-violet-200">
                              {m.model}
                            </span>
                          )}
                          {m.ts && <span className="text-slate-500">{formatTime(m.ts)}</span>}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.reason && (
                        <p className="mt-3 rounded-xl border border-purple-300/15 bg-purple-400/5 p-3 text-xs leading-6 text-purple-200/80">
                          {m.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {sending && (
              <div className="mr-8 flex items-center gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4" data-testid="chat-sending">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                <span className="text-sm text-cyan-100">786.Chat is creating real project files…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a1322]/95 p-4 backdrop-blur-xl">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 transition focus-within:border-cyan-300/40">
              <Paperclip className="mt-2 h-5 w-5 shrink-0 text-slate-500" />
              <textarea
                data-testid="chat-input"
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
                placeholder={project ? `Update "${project.title}"…` : "Ask 786.Chat to build a real project…"}
              />
              <button
                data-testid="chat-send-btn"
                onClick={() => send()}
                disabled={sending || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">
              {project
                ? `Editing project "${project.title}" — changes save to Neon.`
                : "New chat is empty. Your first prompt creates real files in Neon."}
            </div>
          </div>
        </section>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }}
          className="hidden h-full w-4 shrink-0 cursor-col-resize items-center justify-center border-r border-cyan-300/15 bg-[#050713] lg:flex"
          title="Drag to resize chat and preview"
          data-testid="resize-handle"
        >
          <span className="flex h-24 w-2 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <GripVertical className="h-5 w-5" />
          </span>
        </button>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-300">
              <span className="block truncate font-semibold" data-testid="workspace-title">
                {project ? project.title : "New Chat"}
              </span>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                data-testid="panel-preview-btn"
                onClick={() => setPanel("preview")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  panel === "preview" ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-200"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Preview
              </button>
              <button
                data-testid="panel-code-btn"
                onClick={() => setPanel("code")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  panel === "code" ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-200"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Code
              </button>
            </div>

            {panel === "preview" && (
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1" data-testid="device-toggle">
                <button
                  data-testid="device-desktop-btn"
                  onClick={() => setDevice("desktop")}
                  title="Desktop"
                  className={`grid h-7 w-7 place-items-center rounded-full transition ${
                    device === "desktop" ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-200"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  data-testid="device-tablet-btn"
                  onClick={() => setDevice("tablet")}
                  title="Tablet"
                  className={`grid h-7 w-7 place-items-center rounded-full transition ${
                    device === "tablet" ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-200"
                  }`}
                >
                  <Tablet className="h-3.5 w-3.5" />
                </button>
                <button
                  data-testid="device-mobile-btn"
                  onClick={() => setDevice("mobile")}
                  title="Mobile"
                  className={`grid h-7 w-7 place-items-center rounded-full transition ${
                    device === "mobile" ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-200"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              data-testid="publish-btn"
              className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              <Rocket className="mr-2 inline h-4 w-4" />
              Publish
            </button>
          </header>

          {panel === "preview" ? (
            project && previewHtml ? (
              <PreviewStage
                projectId={project.id}
                projectTitle={project.title}
                projectSlug={projectSlug}
                previewHtml={previewHtml}
                device={device}
                previewState={previewState}
                previewError={previewError}
                onRetry={regeneratePreview}
                onLoad={() => {}}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500" data-testid="preview-empty">
                <div className="flex min-h-full w-full items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b111d]">
                  <div>
                    <Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" />
                    <h2 className="text-xl font-black text-slate-300">No Preview Yet</h2>
                    <p className="mt-2 text-sm">New chat starts with an empty preview. Send a prompt to generate one.</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <CodeView
              fileNames={fileNames}
              fileGroups={fileGroups}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              collapsedFolders={collapsedFolders}
              setCollapsedFolders={setCollapsedFolders}
              selectedSource={selectedSource}
              selectedLines={selectedLines}
            />
          )}
        </section>
      </div>
    </main>
  )
}

type PreviewStageProps = {
  projectId: string
  projectTitle: string
  projectSlug: string
  previewHtml: string
  device: Device
  previewState: PreviewLifecycle
  previewError: string | null
  onRetry: () => void
  onLoad: () => void
}

function PreviewStage(props: PreviewStageProps) {
  const { projectId, projectTitle, projectSlug, previewHtml, device, previewState, previewError, onRetry, onLoad } = props
  const failed = previewState === "failed"

  if (device === "desktop") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#0a0f1a]" data-testid="preview-stage">
        <BrowserChrome slug={projectSlug} title={projectTitle} state={previewState} />
        <div className="relative flex min-h-0 flex-1 bg-white">
          <iframe
            key={`iframe-${projectId}`}
            srcDoc={previewHtml}
            onLoad={onLoad}
            title={`${projectTitle} preview`}
            sandbox="allow-scripts allow-forms allow-popups"
            className="absolute inset-0 h-full w-full border-0 bg-white"
            data-testid="preview-iframe"
          />
          {failed && <PreviewErrorOverlay error={previewError} onRetry={onRetry} />}
        </div>
      </div>
    )
  }

  const frame =
    device === "tablet"
      ? { width: 820, height: 1100, radius: "rounded-[2.25rem]", border: "border-[14px] border-[#1a1f2e]" }
      : { width: 390, height: 844, radius: "rounded-[2.75rem]", border: "border-[10px] border-[#0d1320]" }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#030408] p-6" data-testid="preview-stage">
      <div
        className={`relative overflow-hidden bg-black shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-300 ${frame.radius} ${frame.border}`}
        style={{ width: frame.width, maxWidth: "100%", height: frame.height, maxHeight: "92%" }}
      >
        {device === "mobile" && (
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-black" />
        )}
        <iframe
          key={`iframe-${projectId}`}
          srcDoc={previewHtml}
          onLoad={onLoad}
          title={`${projectTitle} preview`}
          sandbox="allow-scripts allow-forms allow-popups"
          className="h-full w-full border-0 bg-white"
          data-testid="preview-iframe"
        />
        {failed && <PreviewErrorOverlay error={previewError} onRetry={onRetry} />}
      </div>
    </div>
  )
}

function BrowserChrome({ slug, title, state }: { slug: string; title: string; state: PreviewLifecycle }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-[#0d1320] px-4 py-2.5" data-testid="browser-chrome">
      <div className="flex gap-1.5">
        <span className="block h-3 w-3 rounded-full bg-red-500/80" />
        <span className="block h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="block h-3 w-3 rounded-full bg-emerald-500/80" />
      </div>
      <div className="flex flex-1 items-center gap-2 rounded-md border border-white/5 bg-[#050713] px-3 py-1 font-mono text-[11px] text-slate-400">
        <span className="text-emerald-400">●</span>
        <span className="truncate">https://786chat.app/{slug || "preview"}</span>
      </div>
      <span
        data-testid="preview-state"
        className={`hidden rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider md:inline ${
          state === "ready"
            ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
            : state === "failed"
            ? "border-red-300/30 bg-red-400/10 text-red-200"
            : "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
        }`}
      >
        {state === "ready" ? "Live" : state === "failed" ? "Error" : "Loading"}
      </span>
      <span className="hidden truncate text-[11px] text-slate-500 lg:inline">{title}</span>
    </div>
  )
}

function PreviewErrorOverlay({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#050713]/95 backdrop-blur-sm"
      data-testid="preview-error-overlay"
    >
      <div className="mx-6 max-w-md rounded-2xl border border-red-300/30 bg-[#1a0a0a] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/30 bg-red-400/10 text-red-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-base font-black text-red-100">Preview failed to start</h3>
        <p className="mt-2 text-sm leading-6 text-red-200/80">
          {error || "The preview did not initialize. Files are saved in Neon — you can regenerate or open the Code tab to inspect."}
        </p>
        <button
          data-testid="preview-regenerate-btn"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate preview
        </button>
      </div>
    </div>
  )
}

type CodeViewProps = {
  fileNames: string[]
  fileGroups: { folder: string; files: string[] }[]
  selectedFile: string
  setSelectedFile: (s: string) => void
  collapsedFolders: Record<string, boolean>
  setCollapsedFolders: (m: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
  selectedSource: string
  selectedLines: string[]
}

function CodeView(props: CodeViewProps) {
  const { fileNames, fileGroups, selectedFile, setSelectedFile, collapsedFolders, setCollapsedFolders, selectedSource, selectedLines } = props
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] bg-[#1e1e1e]" data-testid="code-panel">
      <div className="min-h-0 overflow-auto border-r border-black/40 bg-[#181818] p-2" data-testid="file-tree">
        <div className="mb-2 px-3 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Explorer</div>
        {fileNames.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">No files yet.</p>
        ) : (
          fileGroups.map(({ folder, files }) => {
            const collapsed = !!collapsedFolders[folder]
            return (
              <div key={folder} className="mb-1">
                <button
                  data-testid={`file-folder-${folder}`}
                  onClick={() => setCollapsedFolders((m) => ({ ...m, [folder]: !m[folder] }))}
                  className="mb-0.5 flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:bg-white/[0.04]"
                >
                  {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="truncate">{folder}</span>
                  <span className="ml-auto text-[9px] text-slate-600">{files.length}</span>
                </button>
                {!collapsed &&
                  files.map((file) => {
                    const kind = classifyFile(file)
                    const isActive = selectedFile === file
                    const dotColor =
                      kind === "page"
                        ? "bg-cyan-400"
                        : kind === "component"
                        ? "bg-violet-400"
                        : kind === "lib"
                        ? "bg-emerald-400"
                        : kind === "style"
                        ? "bg-pink-400"
                        : kind === "layout"
                        ? "bg-amber-400"
                        : "bg-slate-500"
                    return (
                      <button
                        key={file}
                        data-testid={`file-item-${file}`}
                        onClick={() => setSelectedFile(file)}
                        className={`group ml-2 mb-0.5 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded px-2 py-1 text-left text-[12px] transition ${
                          isActive ? "bg-[#37373d] text-white" : "text-slate-300 hover:bg-white/[0.04]"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className={`block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                        <span className="truncate font-mono">{file.split("/").pop()}</span>
                      </button>
                    )
                  })}
              </div>
            )
          })
        )}
      </div>

      <div className="min-h-0 overflow-hidden bg-[#1e1e1e]" data-testid="code-viewer">
        <div className="flex h-9 items-center justify-between border-b border-black/40 bg-[#252526] px-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <FileText className="h-3 w-3 text-slate-500" />
            <span className="font-mono">{selectedFile}</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {selectedLines.length} lines
          </span>
        </div>
        <div className="flex h-[calc(100%-2.25rem)] min-h-0 overflow-auto font-mono text-[12.5px] leading-[1.55]">
          {selectedLines.length === 0 ? (
            <div className="p-5 text-slate-500">Select a file.</div>
          ) : (
            <>
              <div className="select-none border-r border-black/30 bg-[#1e1e1e] px-3 py-3 text-right text-slate-600">
                {selectedLines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre px-4 py-3 text-[#d4d4d4]">
                <code>{selectedSource}</code>
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
