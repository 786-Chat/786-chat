"use client"

import Link from "next/link"
import { useEffect, type ReactNode } from "react"
import {
  Check,
  Code2,
  FolderKanban,
  Monitor,
  Palette,
  Plus,
  Power,
  RefreshCw,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react"

import { PremiumAdminBackground } from "@/components/786-admin/premium-background"
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

function CustomerWorkspaceCopyCleanup() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('main[data-workspace-role="customer"]')
    if (!root) return

    const replaceLegacyCopy = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []

      while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text)
      }

      for (const node of nodes) {
        const value = node.nodeValue || ""
        const next = value
          .replace(/Mujeeb\s*Pro\s*AI/gi, "786.Chat")
          .replace(/MujeebProAI/gi, "786.Chat")

        if (next !== value) node.nodeValue = next
      }
    }

    replaceLegacyCopy()
    const observer = new MutationObserver(replaceLegacyCopy)
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
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
    <main
      className="relative h-screen overflow-hidden bg-gradient-to-br from-[#050010] via-[#12002d] to-[#02040d] text-white"
      data-workspace-role={capabilities.role}
      style={{ ["--accent" as string]: "124,58,237" }}
    >
      <PremiumAdminBackground theme="cosmic" />
      <CustomerWorkspaceCopyCleanup />

      <div className="relative z-10 flex h-full p-2 text-[12px] lg:p-3">
        <aside className="flex w-[68px] shrink-0 flex-col items-center justify-between rounded-[24px] border border-white/10 bg-black/25 py-4 shadow-2xl backdrop-blur-2xl">
          <div className="space-y-10">
            <button
              type="button"
              onClick={onNewChat}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--accent))] shadow-[0_0_28px_rgba(var(--accent),.55)]"
              title="Chat"
            >
              <Sparkles className="h-5 w-5" />
            </button>

            <Link
              href={capabilities.projectsRoute}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Projects"
            >
              <FolderKanban className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-5">
            <Link
              href={capabilities.settingsRoute}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[rgb(var(--accent))] text-xs font-black">C</div>
          </div>
        </aside>

        <div className="ml-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl">
          <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 backdrop-blur-2xl">
            <button
              type="button"
              onClick={onNewChat}
              className="ml-2 inline-flex h-10 items-center gap-2 rounded-2xl bg-[rgb(var(--accent))] px-5 text-xs font-black shadow-[0_0_28px_rgba(var(--accent),.4)] transition hover:-translate-y-0.5"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </button>

            <div className="mx-auto hidden h-10 w-[280px] min-w-0 items-center justify-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 text-xs text-slate-300 md:flex">
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="truncate">{projectLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => onViewModeChange("preview")}
              className={`grid h-10 w-12 place-items-center rounded-xl border text-xs font-black ${
                viewMode === "preview"
                  ? "border-white/20 bg-[rgba(var(--accent),.35)] text-white"
                  : "border-white/10 bg-black/25 text-slate-300 hover:bg-white/10"
              }`}
              title="Preview"
            >
              <Monitor className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("code")}
              className={`grid h-10 w-12 place-items-center rounded-xl border text-xs font-black ${
                viewMode === "code"
                  ? "border-white/20 bg-[rgba(var(--accent),.35)] text-white"
                  : "border-white/10 bg-black/25 text-slate-300 hover:bg-white/10"
              }`}
              title="Code"
            >
              <Code2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 transition hover:bg-white/10"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {onPublish && (
              <button
                type="button"
                onClick={onPublish}
                disabled={publishBusy}
                className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                title={capabilities.canPublishMainSite ? "Publish platform" : "Publish project"}
              >
                <Rocket className="h-4 w-4" />
              </button>
            )}

            {onTheme && (
              <button
                type="button"
                onClick={onTheme}
                className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 transition hover:bg-white/10"
                title="Theme"
              >
                <Palette className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="grid h-10 w-12 place-items-center rounded-xl border border-white/10 bg-black/25 text-slate-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200"
              title="Power"
            >
              <Power className="h-4 w-4" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="relative flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-black/20 backdrop-blur-2xl">
              <div className="shrink-0 p-5 pb-3">
                <div className="rounded-[22px] border border-white/10 bg-black/30 p-5 shadow-[0_0_60px_rgba(var(--accent),.18)]">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[rgb(var(--accent))]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black">AI Assistant</p>
                      <p className="text-xs text-violet-200">786 Chat AI</p>
                    </div>
                  </div>
                  <p className="mt-5 inline-flex items-center gap-2 text-xs font-black text-emerald-300">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                    Agent ready
                  </p>
                </div>
              </div>

              <div className="customer-approved-chat min-h-0 flex-1">{chat}</div>
            </section>

            <section className="customer-approved-preview flex min-w-0 flex-1 flex-col bg-black/15">
              {preview}
            </section>
          </div>
        </div>
      </div>

      <style>{`
        .customer-approved-chat > div {
          background: transparent !important;
        }
        .customer-approved-chat [class*="min-h-[60vh]"] {
          display: none !important;
        }
        .customer-approved-preview > div {
          border-left: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      `}</style>
    </main>
  )
}
