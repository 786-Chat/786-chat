"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Code2, FolderKanban, LogOut, Monitor, Palette, Plus, Power, RefreshCw, Rocket, Settings, Sparkles } from "lucide-react"

import type { WorkspaceCapabilities } from "@/lib/workspace/roles"

type SharedWorkspaceShellProps = {
  capabilities: WorkspaceCapabilities
  chat: ReactNode
  preview: ReactNode
  viewMode: "preview" | "code"
  onViewModeChange: (mode: "preview" | "code") => void
  onNewChat: () => void
  onRefresh: () => void
  onPublish?: () => void
  onTheme?: () => void
  onSignOut: () => void
  publishBusy?: boolean
  projectLabel?: string
}

export function SharedWorkspaceShell({
  capabilities,
  chat,
  preview,
  viewMode,
  onViewModeChange,
  onNewChat,
  onRefresh,
  onPublish,
  onTheme,
  onSignOut,
  publishBusy = false,
  projectLabel = "/",
}: SharedWorkspaceShellProps) {
  return (
    <main className="relative h-screen overflow-hidden bg-[#050713] text-white" data-workspace-role={capabilities.role}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(124,58,237,.24),transparent_35%),radial-gradient(circle_at_84%_18%,rgba(14,165,233,.18),transparent_34%),linear-gradient(135deg,#050713_0%,#0b1020_55%,#061722_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 flex h-full gap-2 p-2 lg:gap-3 lg:p-3">
        <aside className="flex w-[74px] shrink-0 flex-col items-center justify-between rounded-[24px] border border-violet-400/20 bg-violet-950/45 py-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-7">
            <Link href="/" aria-label="786 Chat AI home" className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-amber-300/20 bg-black/25">
              <Image src="/786-chat-ai-logo.svg" alt="786 Chat AI" width={48} height={48} className="h-11 w-11 object-contain" />
            </Link>
            <button type="button" onClick={onNewChat} title="New chat" className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500">
              <Sparkles className="h-5 w-5" />
            </button>
            <Link href={capabilities.projectsRoute} title="Projects" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
              <FolderKanban className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Link href={capabilities.settingsRoute} title="Settings" className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white">
              <Settings className="h-5 w-5" />
            </Link>
            <button type="button" onClick={onSignOut} title="Sign out" className="grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white transition hover:bg-red-500">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-2xl">
          <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/10 px-6">
            <button type="button" onClick={onNewChat} className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500">
              <Plus className="h-4 w-4" /> New Chat
            </button>

            <div className="hidden min-w-[280px] items-center justify-center rounded-full border border-white/10 bg-black/25 px-5 py-3 text-sm text-slate-300 md:flex">
              <Monitor className="mr-3 h-4 w-4 text-slate-400" /> {projectLabel}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onViewModeChange("preview")} className={`grid h-11 w-11 place-items-center rounded-full border transition ${viewMode === "preview" ? "border-violet-300/40 bg-violet-600/45 text-white" : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/5"}`} title="Preview">
                <Monitor className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => onViewModeChange("code")} className={`grid h-11 w-11 place-items-center rounded-full border transition ${viewMode === "code" ? "border-violet-300/40 bg-violet-600/45 text-white" : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/5"}`} title="Code">
                <Code2 className="h-5 w-5" />
              </button>
              <button type="button" onClick={onRefresh} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 text-slate-300 hover:bg-white/5" title="Refresh preview">
                <RefreshCw className="h-5 w-5" />
              </button>
              {onPublish && (
                <button type="button" onClick={onPublish} disabled={publishBusy} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50" title={capabilities.canPublishMainSite ? "Publish platform" : "Publish project"}>
                  <Rocket className="h-5 w-5" />
                </button>
              )}
              {onTheme && (
                <button type="button" onClick={onTheme} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 text-slate-300 hover:bg-white/5" title="Theme">
                  <Palette className="h-5 w-5" />
                </button>
              )}
              <button type="button" onClick={onSignOut} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 text-slate-300 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200" title="Sign out">
                <Power className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[380px_minmax(0,1fr)]">
            <section className="flex min-h-0 flex-col border-r border-white/10 bg-[#090b18]/72">
              <div className="border-b border-white/10 px-6 py-7">
                <div className="rounded-[24px] border border-white/10 bg-black/35 p-5 shadow-xl">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-white"><Sparkles className="h-6 w-6" /></span>
                    <div><p className="font-bold text-white">AI Assistant</p><p className="text-sm text-slate-400">786 Chat AI</p></div>
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-300"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white">✓</span> Agent ready</p>
                </div>
              </div>
              <div className="min-h-0 flex-1">{chat}</div>
            </section>

            <section className="min-h-0 bg-[#07101e]/82">{preview}</section>
          </div>
        </section>
      </div>
    </main>
  )
}
