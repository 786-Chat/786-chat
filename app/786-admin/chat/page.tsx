"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Code2,
  FolderKanban,
  GripVertical,
  Loader2,
  Monitor,
  Paperclip,
  Plus,
  Rocket,
  Send,
  Smartphone,
  Tablet,
  Volume2,
  VolumeX,
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
const ACTIVE_FILE_KEY = "786chat_admin_active_file_v1"
const SOUND_KEY = "786chat_admin_sound_v1"
const MODE_KEY = "786chat_admin_mode_v1"
const DEVICE_KEY = "786chat_admin_device_v1"
const PREVIEW_TIMEOUT_MS = 10000

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "desktop" | "tablet" | "mobile"
type PreviewState = "idle" | "loading" | "ready" | "failed"
type UiMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  model?: string | null
  reason?: string | null
  ts?: number
}
type ActiveProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: SevenEightSixProjectFileMap
  preview_state: AdminProjectPreviewState
}

type ImportAlias = {
  local: string
  target: string
}

const MODE_LABEL: Record<Mode, string> = {
  auto: "Auto",
  "deepseek-flash": "DeepSeek Flash",
  "deepseek-pro": "DeepSeek Pro",
  "gemini-flash": "Gemini Flash",
  "gemini-pro": "Gemini Pro",
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

function escapePreview(value: string): string {
  return String(value || "")
    .replace(/<\/script>/gi, "<\\/script>")
    .replace(/<\/style>/gi, "<\\/style>")
}

function safeJsString(value: string): string {
  return JSON.stringify(String(value || ""))
}
function formatTime(ts?: number): string {
  if (!ts) return ""
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}
function toIdentifier(value: string): string {
  const base = value
    .split("/")
    .pop()
    ?.replace(/\.(tsx?|jsx?)$/, "")
    .replace(/[^A-Za-z0-9_$]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") || "Component"
  const id = /^[A-Za-z_$]/.test(base) ? base : `Component${base}`
  return id || "Component"
}

function normalizeModulePath(importerPath: string, specifier: string, files: SevenEightSixProjectFileMap): string | null {
  if (!specifier || specifier.startsWith("http")) return null

  const candidates: string[] = []
  const clean = specifier.replace(/^@\//, "")
  if (specifier.startsWith("@/")) {
    candidates.push(clean)
    candidates.push(`src/${clean}`)
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const baseParts = importerPath.split("/")
    baseParts.pop()
    const stack = [...baseParts]
    for (const part of specifier.split("/")) {
      if (!part || part === ".") continue
      if (part === "..") stack.pop()
      else stack.push(part)
    }
    candidates.push(stack.join("/"))
  } else {
    return null
  }

  const expanded: string[] = []
  for (const c of candidates) {
    expanded.push(c)
    expanded.push(`${c}.tsx`, `${c}.ts`, `${c}.jsx`, `${c}.js`)
    expanded.push(`${c}/index.tsx`, `${c}/index.ts`, `${c}/index.jsx`, `${c}/index.js`)
  }

  return expanded.find((p) => typeof files[p] === "string") || null
}

function defaultExportNameForPath(path: string, source: string): string {
  const named = source.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (named?.[1]) return named[1]
  const classNamed = source.match(/export\s+default\s+class\s+([A-Za-z_$][\w$]*)/)
  if (classNamed?.[1]) return classNamed[1]
  const id = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)?.[1]
  if (id && !["function", "class"].includes(id)) return id
  return toIdentifier(path)
}

function collectLucideImports(source: string): string[] {
  const names = new Set<string>()
  const re = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g
  let match: RegExpExecArray | null
  while ((match = re.exec(source)) !== null) {
    for (const raw of match[1].split(",")) {
      const local = raw.trim().split(/\s+as\s+/i).pop()?.trim()
      if (local && /^[A-Za-z_$][\w$]*$/.test(local)) names.add(local)
    }
  }
  return Array.from(names)
}

function parseImportAliases(path: string, source: string, files: SevenEightSixProjectFileMap): ImportAlias[] {
  const aliases: ImportAlias[] = []
  const re = /import\s+([\s\S]*?)\s+from\s*["']([^"']+)["']\s*;?/g
  let match: RegExpExecArray | null

  while ((match = re.exec(source)) !== null) {
    const clause = match[1].trim()
    const specifier = match[2]

    if (specifier === "next/link") {
      const local = clause.match(/^([A-Za-z_$][\w$]*)/)?.[1]
      if (local && local !== "Link") aliases.push({ local, target: "Link" })
      continue
    }

    if (specifier === "next/image") {
      const local = clause.match(/^([A-Za-z_$][\w$]*)/)?.[1]
      if (local && local !== "Image") aliases.push({ local, target: "Image" })
      continue
    }

    if (specifier.startsWith("next/font")) {
      const named = clause.match(/\{([^}]+)\}/)?.[1]
      if (named) {
        for (const raw of named.split(",")) {
          const parts = raw.trim().split(/\s+as\s+/i)
          const imported = parts[0]?.trim()
          const local = (parts[1] || parts[0])?.trim()
          if (imported && local) aliases.push({ local, target: "__fontShim" })
        }
      }
      continue
    }

    const resolved = normalizeModulePath(path, specifier, files)
    if (!resolved) continue

    const targetSource = String(files[resolved] || "")
    const defaultName = defaultExportNameForPath(resolved, targetSource)
    const defaultLocal = clause.match(/^([A-Za-z_$][\w$]*)(?:\s*,|$)/)?.[1]
    if (defaultLocal && defaultLocal !== defaultName) aliases.push({ local: defaultLocal, target: defaultName })

    const named = clause.match(/\{([^}]+)\}/)?.[1]
    if (named) {
      for (const raw of named.split(",")) {
        const parts = raw.trim().split(/\s+as\s+/i)
        const imported = parts[0]?.trim()
        const local = (parts[1] || parts[0])?.trim()
        if (imported && local && imported !== local) aliases.push({ local, target: imported })
      }
    }
  }

  return aliases
}

function transformSource(path: string, source: string): string {
  const defaultName = defaultExportNameForPath(path, source)
  let code = String(source || "")

  code = code.replace(/^["']use (client|server)["']\s*;?\s*\n?/m, "")
  code = code.replace(/^\s*import\s+[\s\S]*?from\s*["'][^"']+["']\s*;?\s*$/gm, "")
  code = code.replace(/^\s*import\s*["'][^"']+["']\s*;?\s*$/gm, "")
  code = code.replace(/^\s*export\s+\*\s+from\s*["'][^"']+["']\s*;?\s*$/gm, "")
  code = code.replace(/^\s*export\s+\*\s+as\s+[\w$]+\s+from\s*["'][^"']+["']\s*;?\s*$/gm, "")
  code = code.replace(/^\s*export\s*\{[^}]*\}\s+from\s*["'][^"']+["']\s*;?\s*$/gm, "")

  code = code.replace(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/g, "function $1")
  code = code.replace(/export\s+default\s+class\s+([A-Za-z_$][\w$]*)/g, "class $1")
  code = code.replace(/export\s+default\s+function\s*\(/g, `const ${defaultName} = function (`)
  code = code.replace(/export\s+default\s+class\s*\{/g, `const ${defaultName} = class {`)
  code = code.replace(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/g, (_m, name) => {
    if (name === defaultName) return ""
    return `const ${defaultName} = ${name}`
  })
  code = code.replace(/export\s+default\s+/g, `const ${defaultName} = `)
  code = code.replace(/\bexport\s+(const|let|var|function|class|enum)\b/g, "$1")
  code = code.replace(/^\s*export\s+type\s+[\s\S]*?(?=\n|$)/gm, "")
  code = code.replace(/^\s*export\s+interface\s+[\s\S]*?\}\s*$/gm, "")
  code = code.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")

  return code.trim()
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined): string {
  if (!files || Object.keys(files).length === 0) {
    return `<!doctype html><html><body style="margin:0;background:#050713;color:#e2e8f0;font-family:system-ui"><div style="padding:32px">No project files found.</div><script>try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}</script></body></html>`
  }

  const pagePath = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"].find(
    (p) => typeof files[p] === "string" && String(files[p]).trim().length > 0
  )

  const rawCss = String(files["app/globals.css"] || files["src/app/globals.css"] || "")
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()

  if (!pagePath) {
    return `<!doctype html><html><head><script src="https://cdn.tailwindcss.com"></script><style>${escapePreview(css)}</style></head><body style="margin:0;background:#050713;color:#e2e8f0;font-family:system-ui"><div style="padding:32px">No app/page.tsx found in this project.</div><script>try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}</script></body></html>`
  }

  const sourcePaths = Object.keys(files)
    .filter((path) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path) && !/^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(path))
    .sort((a, b) => {
      const rank = (p: string) => {
        if (/^(src\/)?(lib|utils|helpers|data|constants|types)\//.test(p)) return 0
        if (/^(src\/)?hooks\//.test(p)) return 1
        if (/^(src\/)?components\//.test(p)) return 2
        if (p === pagePath) return 99
        return 3
      }
      return rank(a) - rank(b) || a.localeCompare(b)
    })

  const allSource = sourcePaths.map((p) => String(files[p] || "")).join("\n\n")
  const lucideNames = Array.from(new Set(sourcePaths.flatMap((p) => collectLucideImports(String(files[p] || "")))))
  const aliases = sourcePaths.flatMap((p) => parseImportAliases(p, String(files[p] || ""), files))
  const aliasCode = aliases
    .filter((a) => a.local !== a.target)
    .map((a) => `try { if (typeof ${a.local} === 'undefined' && typeof ${a.target} !== 'undefined') var ${a.local} = ${a.target}; } catch(e) {}`)
    .join("\n")

  const iconCode = lucideNames
    .map((name) => `var ${name} = globalThis.${name} || __makeIcon(${safeJsString(name)}); globalThis.${name} = ${name};`)
    .join("\n")

  const transformed = sourcePaths
    .map((p) => `// FILE: ${p}\n${transformSource(p, String(files[p] || ""))}`)
    .join("\n\n")

  const rootName = defaultExportNameForPath(pagePath, String(files[pagePath] || ""))
  const runtime = escapePreview([iconCode, aliasCode, transformed].filter(Boolean).join("\n\n"))

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<style>${escapePreview(css)}</style>
<style>
html,body{margin:0;padding:0;min-height:100%;background:#fff;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#__preview_loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#050713;color:#67e8f9;font-size:13px;letter-spacing:.18em;text-transform:uppercase;z-index:9999}
#__preview_loading span{display:inline-block;width:8px;height:8px;margin:0 3px;background:#22d3ee;border-radius:99px;animation:__pl 1s infinite ease-in-out both}
#__preview_loading span:nth-child(2){animation-delay:.12s}#__preview_loading span:nth-child(3){animation-delay:.24s}
@keyframes __pl{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
#__preview_error{margin:24px;padding:24px;border:1px solid #7f1d1d;border-radius:16px;background:#1f0a0a;color:#fecaca;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div id="__preview_loading"><span></span><span></span><span></span></div>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<script type="text/babel" data-presets="env,react,typescript">
let __786_ready = false
function __786_signal_ready(){__786_ready=true;try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}}
function __786_signal_error(msg){try{parent.postMessage({type:'786-preview-error',error:String(msg)},'*')}catch(e){}}
function __786_show_error(err){
  const loader=document.getElementById('__preview_loading'); if(loader) loader.remove();
  const el=document.getElementById('root');
  const msg=err && err.message ? String(err.message) : String(err || 'Unknown preview error');
  if(el) el.innerHTML='<div id="__preview_error">Preview failed to start:\n\n'+msg.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</div>';
  __786_signal_error(msg);
}
setTimeout(function(){ if(!__786_ready){ __786_show_error('Preview runtime timeout. Check imports or generated app/page.tsx.'); } }, ${PREVIEW_TIMEOUT_MS});
try {
  const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, createContext, Fragment, forwardRef, memo, Children, cloneElement, isValidElement } = React
  const Link = ({ children, href, ...rest }) => React.createElement('a', Object.assign({ href: href || '#'}, rest), children)
  const Image = ({ src, alt, width, height, fill, className, style, ...rest }) => React.createElement('img', Object.assign({}, rest, { src, alt: alt || '', width: fill ? undefined : width, height: fill ? undefined : height, className, style: Object.assign({}, fill ? { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' } : {}, style || {}) }))
  const __fontShim = function(){ return { className:'', style:{}, variable:'' } }
  function __makeIcon(name){ return function Icon(props){ return React.createElement('span', Object.assign({}, props, { 'data-icon': name, 'aria-hidden': true, className: 'inline-flex h-4 w-4 items-center justify-center align-middle ' + (props && props.className ? props.className : '') }), React.createElement('span', { style:{fontSize:10,lineHeight:1} }, '◆')) } }
  const cn = (...args) => args.flat(Infinity).filter(Boolean).map((a) => typeof a === 'string' ? a : Object.entries(a || {}).filter(([,v]) => v).map(([k]) => k).join(' ')).join(' ')
  const clsx = cn
  const twMerge = cn
  const cva = (base) => (...inputs) => cn(base, ...inputs)

  ${runtime}

  const __Root__ = typeof ${rootName} !== 'undefined' ? ${rootName} : null
  const __mount__ = document.getElementById('root')
  const __loader__ = document.getElementById('__preview_loading')
  if (!__Root__) throw new Error('Could not find default export component from ${pagePath}')
  ReactDOM.createRoot(__mount__).render(React.createElement(__Root__))
  requestAnimationFrame(function(){ if(__loader__) __loader__.remove(); __786_signal_ready(); })
} catch (err) {
  console.error('[786.Chat preview]', err)
  __786_show_error(err)
}
</script>
</body>
</html>`
}

function groupFiles(paths: string[]) {
  const groups = new Map<string, string[]>()
  for (const p of [...paths].sort()) {
    const folder = p.includes("/") ? p.split("/")[0] : "/"
    groups.set(folder, [...(groups.get(folder) || []), p])
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
  const [previewState, setPreviewState] = useState<PreviewState>("idle")
  const [previewError, setPreviewError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const fileGroups = useMemo(() => groupFiles(fileNames), [fileNames])
  const previewHtml = useMemo(() => (project ? filesToHtml(project.files) : ""), [project])
  const selectedSource = project?.files?.[selectedFile] || ""
  const projectSlug = useMemo(() => (project?.title || "preview").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "preview", [project])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (saved >= 360 && saved <= 620) setChatWidth(saved)
      const savedSound = localStorage.getItem(SOUND_KEY)
      if (savedSound === "off") setSound(false)
      const savedMode = localStorage.getItem(MODE_KEY) as Mode | null
      if (savedMode && savedMode in MODE_LABEL) setMode(savedMode)
      const savedDevice = localStorage.getItem(DEVICE_KEY) as Device | null
      if (savedDevice === "desktop" || savedDevice === "tablet" || savedDevice === "mobile") setDevice(savedDevice)
    } catch {}
  }, [])

  useEffect(() => { try { localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth))) } catch {} }, [chatWidth])
  useEffect(() => { try { localStorage.setItem(SOUND_KEY, sound ? "on" : "off") } catch {} }, [sound])
  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode) } catch {} }, [mode])
  useEffect(() => { try { localStorage.setItem(DEVICE_KEY, device) } catch {} }, [device])
  useEffect(() => { try { localStorage.setItem(ACTIVE_FILE_KEY, selectedFile) } catch {} }, [selectedFile])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length, sending])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    async function hydrate() {
      let activeId: string | null = null
      try { activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY) } catch {}
      if (!activeId) return
      try {
        const res = await fetch(`/api/786-admin/projects/${activeId}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 404) localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
          return
        }
        const json = (await res.json()) as { project: AdminProjectWithData }
        if (cancelled || !json.project) return
        const p = json.project
        const files = p.files || {}
        setProject({ id: p.id, title: p.title, description: p.description, prompt: p.prompt, files, preview_state: p.preview_state || {} })
        setMessages((p.messages || []).map(uiFromAdminMessage))
        setSelectedFile((p.preview_state?.active_file as string | undefined) || (files["app/page.tsx"] ? "app/page.tsx" : Object.keys(files)[0]) || "app/page.tsx")
      } catch {}
    }
    hydrate()
    return () => { cancelled = true }
  }, [isAdmin])

  useEffect(() => {
    if (!isResizing) return
    const move = (e: MouseEvent) => setChatWidth(Math.min(Math.max(e.clientX - 92, 360), 620))
    const up = () => setIsResizing(false)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => { document.body.style.cursor = ""; document.body.style.userSelect = ""; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
  }, [isResizing])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event?.data?.type === "786-preview-ready") {
        if (timerRef.current) clearTimeout(timerRef.current)
        setPreviewState("ready")
        setPreviewError(null)
      }
      if (event?.data?.type === "786-preview-error") {
        if (timerRef.current) clearTimeout(timerRef.current)
        setPreviewState("failed")
        setPreviewError(String(event.data.error || "Preview failed."))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPreviewError(null)
    if (!project || !previewHtml || panel !== "preview") {
      setPreviewState("idle")
      return
    }
    setPreviewState("loading")
    timerRef.current = setTimeout(() => {
      setPreviewState("failed")
      setPreviewError("Preview timed out. The iframe did not report ready.")
    }, PREVIEW_TIMEOUT_MS + 1500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [project?.id, previewHtml, panel])

  const tone = useCallback((done = false) => {
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
  }, [sound])

  function newChat() {
    setMessages([])
    setProject(null)
    setSelectedFile("app/page.tsx")
    setInput("")
    setPanel("preview")
    setPreviewState("idle")
    setPreviewError(null)
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY); localStorage.removeItem(ACTIVE_FILE_KEY) } catch {}
    tone(true)
  }

  async function persistAfterGeneration(generated: SevenEightSixProject, userText: string, assistantText: string, assistantModel: string | null, assistantReason: string | null) {
    const activeFile = (generated.files?.["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) || "app/page.tsx"
    const projectId = project?.id || null
    const url = projectId ? `/api/786-admin/projects/${projectId}` : "/api/786-admin/projects"
    const method = projectId ? "PATCH" : "POST"
    const body: Record<string, unknown> = {
      prompt: userText,
      preview_state: { active_file: activeFile, entry_path: "app/page.tsx" },
      files: generated.files,
      messages: [
        { role: "user", content: userText },
        { role: "assistant", content: assistantText, model: assistantModel, reason: assistantReason },
      ],
    }
    if (!projectId) { body.title = generated.title; body.description = generated.description }
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) return null
    const json = (await res.json()) as { project: AdminProjectWithData }
    const saved = json.project
    try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, saved.id) } catch {}
    return { id: saved.id, title: saved.title, description: saved.description, prompt: saved.prompt, files: saved.files || {}, preview_state: saved.preview_state || {} }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setMessages((old) => [...old, { id: `u-${Date.now()}`, role: "user", content: text, ts: Date.now() }])
    setInput("")
    setSending(true)
    setPanel("preview")
    tone(false)
    try {
      const existingPayload = project ? {
        title: project.title,
        description: project.description,
        fileTree: Object.keys(project.files || {}),
        keyFiles: Object.fromEntries((["app/page.tsx", "app/layout.tsx", "app/globals.css", "README.md"] as const).filter((p) => typeof project.files?.[p] === "string").map((p) => [p, project.files[p]])),
      } : undefined
      const res = await fetch("/api/786-admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, mode, projectId: project?.id ?? null, existing: existingPayload }) })
      const json = await res.json()
      if (!res.ok || !json.success || !json.project) throw new Error(json.error || "Project generation failed.")
      const generated = json.project as SevenEightSixProject
      const assistantText = json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const persisted = await persistAfterGeneration(generated, text, assistantText, json.model ?? null, json.reason ?? null)
      if (!persisted) throw new Error("Project was generated but could not be saved to Neon.")
      setProject(persisted)
      setMessages((old) => [...old, { id: `a-${Date.now()}`, role: "assistant", content: assistantText, model: json.model ?? null, reason: json.reason ?? null, ts: Date.now() }])
      setSelectedFile((persisted.preview_state.active_file as string | undefined) || (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) || "app/page.tsx")
      tone(true)
    } catch (error) {
      setMessages((old) => [...old, { id: `e-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Request failed.", ts: Date.now() }])
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
        <aside className="hidden w-[92px] shrink-0 flex-col items-center gap-3 border-r border-cyan-300/15 bg-[#06101c] pt-24 lg:flex">
          <button onClick={() => router.push("/786-admin/projects")} className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-100" title="Projects"><FolderKanban className="h-5 w-5" /></button>
        </aside>

        <section className="relative flex h-full min-w-[360px] shrink-0 flex-col border-r border-cyan-300/20 bg-[#081322]" style={{ width: chatWidth }}>
          <header className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <button onClick={newChat} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50 transition hover:bg-emerald-400/25"><Plus className="h-4 w-4" />New Chat</button>
            <div className="flex items-center gap-2">
              <button onClick={() => setSound((v) => !v)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200">{sound ? <Volume2 className="h-3.5 w-3.5 text-emerald-300" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}Sound</button>
              <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="w-[120px] rounded-xl border border-cyan-300/15 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100">{Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-44">
            {messages.length === 0 ? <div className="flex h-full items-center justify-center text-center text-slate-500"><div className="mx-auto max-w-[300px]"><p className="text-xl font-semibold text-cyan-100/90">Welcome back to 786.Chat</p><p className="mt-3 text-sm leading-6 text-slate-400">Start a new chat or open a saved project.</p></div></div> : messages.map((m) => {
              const isUser = m.role === "user"
              return <div key={m.id} className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-3xl border p-4 text-sm leading-6 ${isUser ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "border-white/10 bg-white/[0.045] text-slate-200"}`}><div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"><span>{isUser ? "You" : "786.Chat"}</span><span>{m.model || formatTime(m.ts)}</span></div><p className="whitespace-pre-wrap">{m.content}</p>{m.reason && <p className="mt-3 rounded-xl border border-purple-300/15 bg-purple-400/5 p-3 text-xs leading-6 text-purple-200/80">{m.reason}</p>}</div></div>
            })}
            {sending && <div className="mr-8 flex items-center gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4"><Wand2 className="h-5 w-5 animate-pulse text-cyan-200" /><span className="text-sm text-cyan-100">786.Chat is creating real project files…</span></div>}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a1322]/95 p-4 backdrop-blur-xl">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3"><Paperclip className="mt-2 h-5 w-5 shrink-0 text-slate-500" /><textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder={project ? `Update "${project.title}"…` : "Ask 786.Chat to build a real project…"} /><button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button></div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">{project ? `Editing project "${project.title}" — changes save to Neon.` : "New chat is empty. Your first prompt creates real files in Neon."}</div>
          </div>
        </section>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }} className="hidden h-full w-4 shrink-0 cursor-col-resize items-center justify-center border-r border-cyan-300/15 bg-[#050713] lg:flex"><span className="flex h-24 w-2 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><GripVertical className="h-5 w-5" /></span></button>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-300"><span className="block truncate font-semibold">{project ? project.title : "New Chat"}</span></div>
            <button onClick={() => setPanel("preview")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${panel === "preview" ? "bg-cyan-300 text-slate-950" : "border border-white/10 text-slate-400"}`}><Monitor className="h-4 w-4" />Preview</button>
            <button onClick={() => setPanel("code")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${panel === "code" ? "bg-cyan-300 text-slate-950" : "border border-white/10 text-slate-400"}`}><Code2 className="h-4 w-4" />Code</button>
            {panel === "preview" && <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1"><button onClick={() => setDevice("desktop")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${device === "desktop" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}><Monitor className="h-3.5 w-3.5" /></button><button onClick={() => setDevice("tablet")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${device === "tablet" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}><Tablet className="h-3.5 w-3.5" /></button><button onClick={() => setDevice("mobile")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${device === "mobile" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}><Smartphone className="h-3.5 w-3.5" /></button></div>}
            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950"><Rocket className="mr-2 inline h-4 w-4" />Publish</button>
          </header>

          {panel === "preview" ? (
            project && previewHtml ? <PreviewStage project={project} projectSlug={projectSlug} previewHtml={previewHtml} device={device} state={previewState} error={previewError} /> : sending ? <div className="flex flex-1 items-center justify-center p-6 text-center text-cyan-100"><div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-5 text-sm font-semibold">786.Chat is generating project files. Preview will render as soon as the project is saved.</div></div> : <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500"><div className="flex min-h-full w-full items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b111d]"><div><Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" /><h2 className="text-xl font-black text-slate-300">No Preview Yet</h2><p className="mt-2 text-sm">Open a saved project or create a new one.</p></div></div></div>
          ) : <CodeView fileGroups={fileGroups} fileNames={fileNames} selectedFile={selectedFile} setSelectedFile={setSelectedFile} selectedSource={selectedSource} />}
        </section>
      </div>
    </main>
  )
}

function PreviewStage({ project, projectSlug, previewHtml, device, state, error }: { project: ActiveProject; projectSlug: string; previewHtml: string; device: Device; state: PreviewState; error: string | null }) {
  if (device === "desktop") {
    return <div className="flex min-h-0 flex-1 flex-col bg-[#0a0f1a]"><BrowserChrome slug={projectSlug} title={project.title} state={state} /><div className="relative flex min-h-0 flex-1 bg-white"><iframe key={`${project.id}-${previewHtml.length}`} srcDoc={previewHtml} title={`${project.title} preview`} sandbox="allow-scripts allow-forms allow-popups" className="absolute inset-0 h-full w-full border-0 bg-white" data-testid="preview-iframe" />{state === "failed" && <PreviewError error={error} />}</div></div>
  }

  const frame = device === "tablet" ? "h-[900px] w-[820px] rounded-[2rem] border border-cyan-300/25" : "h-[844px] w-[390px] rounded-[2.5rem] border-[10px] border-slate-900"
  return <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#030408] p-6"><div className={`relative max-h-full max-w-full overflow-hidden bg-white shadow-2xl shadow-cyan-950/40 ${frame}`}><iframe key={`${project.id}-${previewHtml.length}-${device}`} srcDoc={previewHtml} title={`${project.title} preview`} sandbox="allow-scripts allow-forms allow-popups" className="h-full w-full border-0 bg-white" data-testid="preview-iframe" />{state === "failed" && <PreviewError error={error} />}</div></div>
}

function BrowserChrome({ slug, title, state }: { slug: string; title: string; state: PreviewState }) {
  return <div className="flex items-center gap-3 border-b border-white/5 bg-[#0d1320] px-4 py-2.5"><div className="flex gap-1.5"><span className="block h-3 w-3 rounded-full bg-red-500/80" /><span className="block h-3 w-3 rounded-full bg-yellow-500/80" /><span className="block h-3 w-3 rounded-full bg-emerald-500/80" /></div><div className="flex flex-1 items-center gap-2 rounded-md border border-white/5 bg-[#050713] px-3 py-1 font-mono text-[11px] text-slate-400"><span className="text-emerald-400">●</span><span className="truncate">https://786chat.app/{slug || "preview"}</span></div><span className={`hidden rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider md:inline ${state === "ready" ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : state === "failed" ? "border-red-300/30 bg-red-400/10 text-red-200" : "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"}`}>{state === "ready" ? "Live" : state === "failed" ? "Error" : "Loading"}</span><span className="hidden truncate text-[11px] text-slate-500 lg:inline">{title}</span></div>
}

function PreviewError({ error }: { error: string | null }) {
  return <div className="absolute inset-0 flex items-center justify-center bg-[#050713]/92 p-6 backdrop-blur-sm"><div className="max-w-lg rounded-2xl border border-red-300/30 bg-[#1a0a0a] p-6 text-center shadow-2xl"><div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/30 bg-red-400/10 text-red-300"><AlertTriangle className="h-5 w-5" /></div><h3 className="text-base font-black text-red-100">Preview failed to start</h3><p className="mt-2 whitespace-pre-wrap text-left font-mono text-xs leading-6 text-red-200/80">{error || "Unknown preview error."}</p></div></div>
}

function CodeView({ fileGroups, fileNames, selectedFile, setSelectedFile, selectedSource }: { fileGroups: { folder: string; files: string[] }[]; fileNames: string[]; selectedFile: string; setSelectedFile: (s: string) => void; selectedSource: string }) {
  return <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] bg-[#1e1e1e]"><div className="min-h-0 overflow-auto border-r border-black/40 bg-[#181818] p-2"><div className="mb-2 px-3 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Explorer</div>{fileNames.length === 0 ? <p className="p-3 text-sm text-slate-500">No files yet.</p> : fileGroups.map(({ folder, files }) => <div key={folder} className="mb-3"><div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{folder}</div>{files.map((file) => <button key={file} onClick={() => setSelectedFile(file)} className={`mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[12px] ${selectedFile === file ? "bg-[#37373d] text-white" : "text-slate-300 hover:bg-white/[0.04]"}`}><span className="truncate font-mono">{file}</span></button>)}</div>)}</div><div className="min-h-0 overflow-hidden bg-[#1e1e1e]"><div className="flex h-9 items-center justify-between border-b border-black/40 bg-[#252526] px-4"><span className="font-mono text-[11px] text-slate-300">{selectedFile}</span><span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{selectedSource ? selectedSource.split("\n").length : 0} lines</span></div><pre className="h-[calc(100%-2.25rem)] overflow-auto whitespace-pre px-4 py-3 font-mono text-[12.5px] leading-[1.55] text-[#d4d4d4]"><code>{selectedSource || "Select a file."}</code></pre></div></div>
}
