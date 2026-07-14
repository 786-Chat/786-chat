"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Code2, FolderKanban, LogOut, Monitor, Plus, Sparkles } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { WorkspaceChatPanel } from "@/components/workspace/chat-panel"
import { WorkspacePreviewPanel } from "@/components/workspace/preview-panel"

export default function CustomerWorkspacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [device, setDevice] = useState("full")
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")

  const projectId = searchParams.get("projectId") || undefined
  const displayName = useMemo(() => user?.name?.split(" ")[0] || "Builder", [user?.name])

  function startNewChat() {
    const nextUrl = `/dashboard/chat?newProject=1&fresh=${Date.now()}`
    window.history.replaceState({}, "", nextUrl)
    window.dispatchEvent(new PopStateEvent("popstate"))
    window.dispatchEvent(new CustomEvent("new-chat", { detail: { fresh: true } }))
    window.dispatchEvent(new CustomEvent("preview-cleared", { detail: { fresh: true } }))
    setPreviewHtml("")
    setPreviewUrl("")
    setViewMode("preview")
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
              <h1 className="mt-1 text-base font-bold text-white">Welcome, {displayName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("preview")} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${viewMode === "preview" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-400"}`}>
                <Monitor className="h-4 w-4" /> Preview
              </button>
              <button onClick={() => setViewMode("code")} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${viewMode === "code" ? "border-violet-300/30 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/5 text-slate-400"}`}>
                <Code2 className="h-4 w-4" /> Code
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(420px,.92fr)_minmax(520px,1.35fr)]">
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
                <WorkspaceChatPanel projectId={projectId} onPreviewUpdate={setPreviewHtml} viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>

            <div className="min-h-0 bg-[#07101e]/80">
              <WorkspacePreviewPanel
                project={null}
                device={device}
                setDevice={setDevice}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                onClose={() => undefined}
                expanded={expanded}
                setExpanded={setExpanded}
                previewHtml={previewHtml}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
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
