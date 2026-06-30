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

const PREVIEW_READY_TIMEOUT_MS = 4500

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "desktop" | "tablet" | "mobile"
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

function uiFromAdminMessage(m: AdminMessage): UiMessage {
  return {
    id: m.id,
    role: m.role === "system" ? "assistant" : m.role,
    content: m.content,
    model: m.model,
    reason: m.reason,
  }
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapePreviewScript(value: string): string {
  return String(value || "").replace(/<\/script>/gi, "<\\/script>")
}

function stripImportsAndExports(src: string): string {
  let code = src
    .replace(/^["']use (client|server)["']\s*;?\s*\n?/m, "")
    .replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^\s*import\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^\s*export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^\s*export\s+\*\s+as\s+[\w$]+\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
    .replace(/^\s*export\s*\{[^}]*\}\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")

  const namedDefault = code.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (namedDefault) {
    code = code.replace(/export\s+default\s+function\s+/, "function ")
  } else if (/export\s+default\s+function\s*\(/.test(code)) {
    code = code.replace(/export\s+default\s+function\s*\(/, "function Page(")
  } else if (/export\s+default\s+/.test(code)) {
    code = code.replace(/export\s+default\s+/, "const Page = ")
  }

  return code
    .replace(/\bexport\s+(const|let|var|function|class|type|interface|enum)\b/g, "$1")
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
    .replace(/^\s*export\s+type\s+[\s\S]*?(?=\n|$)/gm, "")
}

function getDefaultComponentName(src: string): string {
  const namedDefault = src.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (namedDefault?.[1]) return namedDefault[1]

  const identifierDefault = src.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)
  if (identifierDefault?.[1]) return identifierDefault[1]

  return "Page"
}

function collectLucideShim(src: string): string {
  const names = new Set<string>()
  const re = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/g
  let match: RegExpExecArray | null

  while ((match = re.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(name)) names.add(name)
    }
  }

  return Array.from(names)
    .map(
      (name) =>
        `if (typeof globalThis.${name} === 'undefined') { globalThis.${name} = __makeIcon('${name}'); } var ${name} = globalThis.${name};`
    )
    .join("\n")
}

function extractUsefulText(src: string, projectTitle = "Project Preview") {
  const texts = Array.from(src.matchAll(/>([^<>{}\n]{3,140})</g))
    .map((m) => m[1].replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((text) => !/^(home|about|contact|menu|features)$/i.test(text))

  const title =
    texts.find((t) => /restaurant|dashboard|quiz|login|calculator|website|app|fork|golden/i.test(t)) ||
    projectTitle ||
    "Project Preview"

  const subtitle =
    texts.find((t) => t !== title && t.length > 24) ||
    "Your saved project files are loaded from Neon and ready to preview."

  const cards = texts.filter((t) => t !== title && t !== subtitle).slice(0, 6)

  return { title, subtitle, cards }
}

function buildStaticFallbackHtml(files: SevenEightSixProjectFileMap, projectTitle: string): string {
  const page = String(files["app/page.tsx"] || files["app/page.jsx"] || files["src/app/page.tsx"] || files["src/app/page.jsx"] || "")
  const { title, subtitle, cards } = extractUsefulText(page, projectTitle)

  return `
<main class="min-h-screen bg-slate-950 text-white">
  <section class="relative min-h-screen overflow-hidden px-6 py-12">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,.22),transparent_36%),linear-gradient(135deg,#020617,#0f172a_70%)]"></div>
    <div class="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-center">
      <p class="mb-5 inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.28em] text-cyan-200">786.Chat Live Preview</p>
      <h1 class="max-w-5xl text-5xl font-black leading-tight tracking-tight md:text-7xl">${escapeHtml(title)}</h1>
      <p class="mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">${escapeHtml(subtitle)}</p>
      <div class="mt-10 flex flex-wrap gap-4">
        <a class="rounded-full bg-cyan-300 px-7 py-4 font-black text-slate-950 shadow-[0_0_40px_rgba(34,211,238,.28)]" href="#sections">Explore Project</a>
        <a class="rounded-full border border-white/15 bg-white/10 px-7 py-4 font-black text-white" href="#files">View Details</a>
      </div>
    </div>
  </section>
  <section id="sections" class="px-6 py-20">
    <div class="mx-auto max-w-7xl">
      <h2 class="text-4xl font-black">Generated Sections</h2>
      <div class="mt-8 grid gap-5 md:grid-cols-3">
        ${(cards.length ? cards : ["Hero Section", "Features", "Contact"])
          .map(
            (card) =>
              `<article class="rounded-[2rem] border border-white/10 bg-white/[.06] p-6"><h3 class="text-xl font-black">${escapeHtml(card)}</h3><p class="mt-3 leading-7 text-slate-300">Generated from the saved project source files.</p></article>`
          )
          .join("")}
      </div>
    </div>
  </section>
  <section id="files" class="border-t border-white/10 px-6 py-10 text-sm text-slate-400">
    <div class="mx-auto max-w-7xl">Preview fallback rendered safely from saved Neon files. Open Code mode to inspect all source files.</div>
  </section>
</main>`
}

function buildEmptyPreview(css: string, message: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewScript(css)}</style><style>html,body{margin:0;background:#050713;color:#e2e8f0;font-family:system-ui,sans-serif}</style></head><body><div style="margin:64px auto;padding:32px;max-width:720px;border:1px solid #1e293b;border-radius:16px;background:#0b111d;color:#94a3b8">${escapeHtml(message)}</div><script>try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}</script></body></html>`
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined, projectTitle = "Project Preview") {
  if (!files || Object.keys(files).length === 0) {
    return buildEmptyPreview("", "Preview will appear here once a project is generated.")
  }

  const pagePath = ["app/page.tsx", "app/page.jsx", "src/app/page.tsx", "src/app/page.jsx"].find(
    (path) => typeof files[path] === "string" && String(files[path]).trim().length > 0
  )
  const rawCss = String(files["app/globals.css"] || files["src/app/globals.css"] || "")
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()

  if (!pagePath) {
    return buildEmptyPreview(css, "No app/page.tsx found in this project, so preview cannot start.")
  }

  const isSourceFile = (path: string) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path)
  const isLayoutFile = (path: string) => /^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(path)
  const dependencyOrder = (path: string) => {
    if (/^(src\/)?lib\//.test(path)) return 0
    if (/^(src\/)?(utils|util|helpers|data|constants|types)\//.test(path)) return 1
    if (/^(src\/)?hooks\//.test(path)) return 2
    if (/^(src\/)?components\//.test(path)) return 3
    return 4
  }

  const pageSource = String(files[pagePath])
  const rootName = getDefaultComponentName(pageSource)
  const sourceText = Object.entries(files)
    .filter(([path]) => path !== pagePath && !isLayoutFile(path) && isSourceFile(path))
    .sort(([a], [b]) => dependencyOrder(a) - dependencyOrder(b) || a.localeCompare(b))
    .map(([, source]) => String(source))
    .join("\n\n")
  const lucideShim = collectLucideShim(`${sourceText}\n\n${pageSource}`)
  const userScript = escapePreviewScript([lucideShim, stripImportsAndExports(sourceText), stripImportsAndExports(pageSource)].filter(Boolean).join("\n\n"))
  const staticFallbackHtml = escapePreviewScript(buildStaticFallbackHtml(files, projectTitle))

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<style>${escapePreviewScript(css)}</style>
<style>
html,body{margin:0;padding:0;background:#050713;color:#0f172a;font-family:Inter,system-ui,-apple-system,sans-serif}
#__preview_loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#050713;color:#67e8f9;font-size:13px;letter-spacing:.18em;text-transform:uppercase;z-index:9999}
#__preview_loading span{display:inline-block;width:8px;height:8px;margin:0 3px;background:#22d3ee;border-radius:99px;animation:__pl 1s infinite ease-in-out both}
#__preview_loading span:nth-child(2){animation-delay:.12s}#__preview_loading span:nth-child(3){animation-delay:.24s}
@keyframes __pl{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-4px)}}
#__preview_error{padding:24px;margin:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#fca5a5;background:#1f0a0a;border:1px solid #7f1d1d;border-radius:12px;white-space:pre-wrap;font-size:12px;line-height:1.6}
</style>
</head>
<body>
<div id="__preview_loading"><span></span><span></span><span></span></div>
<div id="root"></div>
<script>
var __786_STATIC_FALLBACK__ = `${staticFallbackHtml}`;
function __786_mount_static(){
  var loader=document.getElementById('__preview_loading');
  var root=document.getElementById('root');
  if(loader) loader.remove();
  if(root && !root.childElementCount) root.innerHTML=__786_STATIC_FALLBACK__;
  try{parent.postMessage({type:'786-preview-ready'},'*')}catch(e){}
}
setTimeout(__786_mount_static, ${PREVIEW_READY_TIMEOUT_MS});
</script>
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
  if (typeof globalThis.cn === 'undefined') globalThis.cn = (...args) => args.flat(Infinity).filter(Boolean).map((a) => typeof a === 'string' ? a : Object.entries(a || {}).filter(([,v]) => v).map(([k]) => k).join(' ')).join(' ')
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
    __786_mount_static()
  } else {
    ReactDOM.createRoot(__mount__).render(React.createElement(__Root__))
    requestAnimationFrame(() => { if (__loader__) __loader__.remove(); __786_signal_ready() })
  }
} catch (err) {
  console.error('[786.Chat preview]', err)
  __786_mount_static()
}
</script>
</body>
</html>`
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
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const previewHtml = useMemo(() => (project ? filesToHtml(project.files, project.title) : ""), [project])
  const previewKey = useMemo(
    () =>
      project
        ? `${project.id}-${project.preview_state?.active_file || "preview"}-${fileNames.length}-${previewHtml.length}`
        : "empty",
    [fileNames.length, previewHtml.length, project]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (saved >= 360 && saved <= 620) setChatWidth(saved)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth)))
    } catch {}
  }, [chatWidth])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, sending])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function hydrate() {
      let activeId: string | null = null
      try {
        activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY)
      } catch {}
      if (!activeId) return

      try {
        setPreviewLoaded(false)
        setPreviewError(null)
        const res = await fetch(`/api/786-admin/projects/${activeId}`, { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json()) as { project: AdminProjectWithData }
        if (cancelled || !json.project) return
        const p = json.project
        const files = p.files || {}
        setProject({
          id: p.id,
          title: p.title,
          description: p.description,
          prompt: p.prompt,
          files,
          preview_state: p.preview_state || {},
        })
        setMessages((p.messages || []).map(uiFromAdminMessage))
        setSelectedFile(
          (p.preview_state?.active_file as string | undefined) ||
            (files["app/page.tsx"] ? "app/page.tsx" : Object.keys(files)[0]) ||
            "app/page.tsx"
        )
      } catch {}
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isResizing) return
    const move = (e: MouseEvent) => setChatWidth(Math.min(Math.max(e.clientX - 92, 360), 620))
    const up = () => setIsResizing(false)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
  }, [isResizing])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPreviewLoaded(false)
    setPreviewError(null)
    if (!project || !previewHtml || panel !== "preview") return
    timerRef.current = setTimeout(() => {
      setPreviewLoaded(true)
      setPreviewError(null)
    }, PREVIEW_READY_TIMEOUT_MS + 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [panel, previewHtml, previewKey, project])

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
    setPreviewLoaded(false)
    setPreviewError(null)
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
  ) {
    const activeFile =
      (generated.files?.["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) ||
      "app/page.tsx"
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
    if (!projectId) {
      body.title = generated.title
      body.description = generated.description
    }
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
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
      const generated = json.project as SevenEightSixProject
      const assistantText =
        json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const persisted = await persistAfterGeneration(
        generated,
        text,
        assistantText,
        json.model ?? null,
        json.reason ?? null
      )
      if (!persisted) throw new Error("Project was generated but could not be saved to Neon.")
      setProject(persisted)
      setMessages((old) => [
        ...old,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: assistantText,
          model: json.model ?? null,
          reason: json.reason ?? null,
        },
      ])
      setSelectedFile(
        (persisted.preview_state.active_file as string | undefined) ||
          (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) ||
          "app/page.tsx"
      )
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

  const selectedSource = project?.files?.[selectedFile] || ""

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[92px] shrink-0 border-r border-cyan-300/20 bg-[#06101c] pt-24 lg:block">
          <button
            onClick={() => router.push("/786-admin/projects")}
            className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
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
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setSound((v) => !v)}
                className="shrink-0 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100"
              >
                Sound {sound ? "On" : "Off"}
              </button>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-[108px] rounded-xl border border-cyan-300/20 bg-[#101827] px-3 py-2 text-xs font-bold text-cyan-100"
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
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3">
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
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">
              {project ? `Editing project "${project.title}" — changes save to Neon.` : "New Chat is empty. Build prompt creates real files saved to Neon."}
            </div>
          </div>
        </section>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizing(true)
          }}
          className="hidden h-full w-4 shrink-0 cursor-col-resize items-center justify-center border-r border-cyan-300/20 bg-[#050713] lg:flex"
        >
          <span className="flex h-24 w-2 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <GripVertical className="h-5 w-5" />
          </span>
        </button>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-400">
              <span className="block truncate">{sending && !project ? "Generating new preview..." : project ? project.title : "No project yet"}</span>
            </div>
            {panel === "preview" && (
              <div className="hidden items-center rounded-full border border-white/10 bg-white/[0.045] p-1 lg:flex">
                {(["desktop", "tablet", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                      device === d ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-cyan-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setPanel("preview")}
              className={`rounded-full border px-4 py-2 text-sm ${
                panel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"
              }`}
            >
              <Monitor className="mr-2 inline h-4 w-4" />Preview
            </button>
            <button
              onClick={() => setPanel("code")}
              className={`rounded-full border px-4 py-2 text-sm ${
                panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"
              }`}
            >
              <Code2 className="mr-2 inline h-4 w-4" />Code
            </button>
            <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950">
              <Rocket className="mr-2 inline h-4 w-4" />Publish
            </button>
          </header>

          {panel === "preview" ? (
            project && previewHtml ? (
              <div className={`relative min-h-0 flex-1 overflow-auto bg-[#030408] ${device === "desktop" ? "p-0" : "flex items-center justify-center p-6"}`}>
                {!previewLoaded && !previewError && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#030408]/70 text-sm font-semibold text-cyan-100 backdrop-blur-sm">
                    Preparing preview...
                  </div>
                )}
                {previewError && (
                  <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl border border-amber-300/35 bg-amber-300/15 px-4 py-3 text-sm font-semibold text-amber-100">
                    {previewError}
                  </div>
                )}
                <iframe
                  key={previewKey}
                  srcDoc={previewHtml}
                  title={`${project.title} preview`}
                  sandbox="allow-scripts allow-forms allow-popups"
                  onLoad={() => {
                    if (timerRef.current) clearTimeout(timerRef.current)
                    setPreviewLoaded(true)
                    setPreviewError(null)
                  }}
                  onError={() => {
                    setPreviewLoaded(true)
                    setPreviewError(null)
                  }}
                  className={
                    device === "desktop"
                      ? "h-full w-full border-0 bg-white"
                      : device === "tablet"
                        ? "h-[900px] w-[820px] max-h-full max-w-full rounded-[2rem] border border-cyan-300/25 bg-white shadow-2xl shadow-cyan-950/40"
                        : "h-[844px] w-[390px] max-h-full max-w-full rounded-[2.5rem] border-[10px] border-slate-900 bg-white shadow-2xl shadow-cyan-950/40"
                  }
                />
              </div>
            ) : sending ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-400">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-5 text-sm font-semibold text-cyan-100">
                  786.Chat is generating project files. Preview will render as soon as the project is saved.
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-slate-500">
                <div className="flex min-h-full w-full items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b111d]">
                  <div>
                    <Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" />
                    <h2 className="text-xl font-black text-slate-300">No Preview Yet</h2>
                    <p className="mt-2">Open a saved project or create a new one.</p>
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
                      className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-bold ${
                        selectedFile === file ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      {file}
                    </button>
                  ))
                )}
              </div>
              <pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50">
                <code>{selectedSource || "Select a file."}</code>
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
