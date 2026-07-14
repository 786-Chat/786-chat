"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Clock3,
  Code2,
  FileCode2,
  Files,
  Folder,
  FolderKanban,
  GitBranch,
  History,
  LogOut,
  Monitor,
  Play,
  Plus,
  Rocket,
  Sparkles,
  SquareTerminal,
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"

type WorkspaceTab = "preview" | "code" | "files" | "terminal" | "history"

const projectFiles = [
  { path: "app/page.tsx", language: "tsx" },
  { path: "app/layout.tsx", language: "tsx" },
  { path: "app/globals.css", language: "css" },
  { path: "components/header.tsx", language: "tsx" },
  { path: "components/hero.tsx", language: "tsx" },
  { path: "components/footer.tsx", language: "tsx" },
  { path: "lib/utils.ts", language: "ts" },
]

const codeSamples: Record<string, string> = {
  "app/page.tsx": `export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-cyan-300">Built with 786 Chat AI</p>
        <h1 className="mt-4 text-6xl font-bold">Your new project</h1>
      </section>
    </main>
  )
}`,
  "app/layout.tsx": `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
  "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #050713;
  color: white;
}`,
}

export default function CustomerWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [device, setDevice] = useState("full")
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("preview")
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [terminalRuns, setTerminalRuns] = useState(0)

  const projectId = searchParams.get("projectId") || undefined
  const displayName = useMemo(() => user?.name?.split(" ")[0] || "Builder", [user?.name])
  const selectedCode = codeSamples[selectedFile] || `// ${selectedFile}\n// This file will appear here after the AI generates or edits your project.`

  function openTab(tab: WorkspaceTab) {
    setWorkspaceTab(tab)
    if (tab === "preview") setViewMode("preview")
    if (tab === "code") setViewMode("code")
  }

  function startNewChat() {
    const nextUrl = `/dashboard/chat?newProject=1&fresh=${Date.now()}`
    window.history.replaceState({}, "", nextUrl)
    window.dispatchEvent(new PopStateEvent("popstate"))
    window.dispatchEvent(new CustomEvent("new-chat", { detail: { fresh: true } }))
    window.dispatchEvent(new CustomEvent("preview-cleared", { detail: { fresh: true } }))
    setPreviewHtml("")
    setPreviewUrl("")
    setViewMode("preview")
    setWorkspaceTab("preview")
  }

  async function signOut() {
    await logout()
    router.replace("/")
  }

  return (
    <main className="customer-new-shell relative h-screen overflow-hidden bg-[#050713] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(124,58,237,.22),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(14,165,233,.18),transparent_32%),linear-gradient(135deg,#050713_0%,#0a1020_55%,#061722_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 flex h-full gap-2 p-2 lg:gap-3 lg:p-3">
        <aside className="flex w-[72px] shrink-0 flex-col items-center justify-between rounded-[24px] border border-violet-400/20 bg-violet-950/35 py-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-7">
            <Link href="/" aria-label="786 Chat AI home" className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-amber-300/20 bg-black/30">
              <Image src="/786-chat-ai-logo.svg" alt="786 Chat AI" width={48} height={48} className="h-11 w-11 object-contain" />
            </Link>
            <button onClick={startNewChat} title="New chat" className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500">
              <Sparkles className="h-5 w-5" />
            </button>
            <Link href="/dashboard/projects" title="My projects" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
              <FolderKanban className="h-5 w-5" />
            </Link>
          </div>
          <button onClick={signOut} title="Sign out" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200">
            <LogOut className="h-5 w-5" />
          </button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-2xl">
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300/70">786 Chat AI</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-base font-bold text-white">Welcome, {displayName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Workspace ready
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10 lg:inline-flex">
                <GitBranch className="h-4 w-4" /> main
              </button>
              <button onClick={() => openTab("preview")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
                <Monitor className="h-4 w-4" /> Preview
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110">
                <Rocket className="h-4 w-4" /> Deploy
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(390px,.82fr)_minmax(600px,1.45fr)]">
            <div className="min-h-0 border-r border-white/10 bg-[#080b18]/70">
              <div className="flex h-14 items-center justify-between border-b border-white/8 px-5">
                <div>
                  <p className="text-sm font-bold text-white">AI Builder</p>
                  <p className="text-xs text-emerald-300">Agent ready</p>
                </div>
                <button onClick={startNewChat} className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold shadow-lg shadow-violet-600/25 transition hover:bg-violet-500">
                  <Plus className="h-4 w-4" /> New Chat
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">
                <WorkspaceChatPanel projectId={projectId} onPreviewUpdate={setPreviewHtml} viewMode={viewMode} onViewModeChange={(mode) => { setViewMode(mode); setWorkspaceTab(mode) }} />
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-[#07101e]/80">
              <nav className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 px-3">
                {([
                  ["preview", Monitor, "Preview"],
                  ["code", Code2, "Code"],
                  ["files", Files, "Files"],
                  ["terminal", SquareTerminal, "Terminal"],
                  ["history", History, "History"],
                ] as const).map(([tab, Icon, label]) => (
                  <button key={tab} onClick={() => openTab(tab)} className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${workspaceTab === tab ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </nav>

              <div className="min-h-0 flex-1">
                {workspaceTab === "preview" && (
                  <WorkspacePreviewPanel project={null} device={device} setDevice={setDevice} previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} onClose={() => undefined} expanded={expanded} setExpanded={setExpanded} previewHtml={previewHtml} viewMode="preview" onViewModeChange={(mode) => openTab(mode)} />
                )}

                {workspaceTab === "code" && (
                  <div className="grid h-full min-h-0 grid-cols-[220px_1fr]">
                    <FileExplorer selectedFile={selectedFile} onSelect={setSelectedFile} />
                    <div className="min-w-0 overflow-hidden">
                      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-black/20 px-4">
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-300"><FileCode2 className="h-4 w-4 text-cyan-300" /> {selectedFile}</span>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-300">Saved</span>
                      </div>
                      <pre className="h-[calc(100%-2.75rem)] overflow-auto p-5 font-mono text-[13px] leading-6 text-slate-300"><code>{selectedCode}</code></pre>
                    </div>
                  </div>
                )}

                {workspaceTab === "files" && (
                  <div className="h-full overflow-auto p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div><h2 className="font-bold">Project files</h2><p className="text-xs text-slate-400">Files created and maintained by the AI builder.</p></div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{projectFiles.length} files</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {projectFiles.map((file) => <button key={file.path} onClick={() => { setSelectedFile(file.path); openTab("code") }} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/5"><FileCode2 className="h-5 w-5 text-cyan-300" /><div><p className="text-sm font-semibold text-white">{file.path}</p><p className="mt-1 text-xs uppercase tracking-widest text-slate-500">{file.language}</p></div></button>)}
                    </div>
                  </div>
                )}

                {workspaceTab === "terminal" && (
                  <div className="flex h-full flex-col bg-[#020409] font-mono">
                    <div className="flex h-11 items-center justify-between border-b border-white/10 px-4"><span className="text-xs text-slate-400">786.chat terminal</span><button onClick={() => setTerminalRuns((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"><Play className="h-3.5 w-3.5" /> Run checks</button></div>
                    <div className="flex-1 overflow-auto p-5 text-[13px] leading-6 text-slate-300">
                      <p><span className="text-emerald-300">$</span> pnpm install</p><p className="text-slate-500">Dependencies are ready.</p>
                      <p className="mt-3"><span className="text-emerald-300">$</span> pnpm lint && pnpm typecheck && pnpm build</p>
                      <p className="text-cyan-300">✓ Lint passed</p><p className="text-cyan-300">✓ TypeScript passed</p><p className="text-cyan-300">✓ Production build ready</p>
                      {terminalRuns > 0 && <p className="mt-3 text-violet-300">Checks completed again ({terminalRuns}).</p>}
                    </div>
                  </div>
                )}

                {workspaceTab === "history" && (
                  <div className="h-full overflow-auto p-6">
                    <h2 className="text-lg font-bold">Version history</h2><p className="mt-1 text-sm text-slate-400">Review recent AI changes and restore earlier checkpoints.</p>
                    <div className="mt-6 space-y-3">
                      {["Workspace created", "Hero section generated", "Responsive navigation added", "Preview build completed"].map((item, index) => (
                        <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-200"><Clock3 className="h-4 w-4" /></span><div><p className="text-sm font-semibold">{item}</p><p className="text-xs text-slate-500">Checkpoint {4 - index} · saved automatically</p></div></div><button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5">Restore</button></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .customer-new-shell .workspace-legacy-only { display: none !important; }
        .customer-new-shell [class*="from-gray-950"] { background: transparent !important; }
        .customer-new-shell h1.text-3xl { font-size: 0 !important; }
        .customer-new-shell h1.text-3xl::after { content: "Welcome to 786 Chat AI"; font-size: 1.875rem; line-height: 2.25rem; }
      `}</style>
    </main>
  )
}

function FileExplorer({ selectedFile, onSelect }: { selectedFile: string; onSelect: (file: string) => void }) {
  return (
    <aside className="min-h-0 overflow-auto border-r border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500"><Folder className="h-3.5 w-3.5" /> Explorer</div>
      <div className="space-y-1">
        {projectFiles.map((file) => <button key={file.path} onClick={() => onSelect(file.path)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${selectedFile === file.path ? "bg-cyan-300/10 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}><FileCode2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.path}</span></button>)}
      </div>
    </aside>
  )
}
