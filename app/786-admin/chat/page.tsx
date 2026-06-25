"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  Code2,
  FileText,
  Globe2,
  Grid3X3,
  Layers3,
  Loader2,
  Monitor,
  Paperclip,
  Play,
  Rocket,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  TerminalSquare,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const starterCards = [
  "Create admin login design",
  "Build dashboard page layout",
  "Design API control screen",
  "Create deployment panel",
]

const projectFiles = [
  "app/786-admin/chat/page.tsx",
  "app/786-admin/dashboard/page.tsx",
  "app/786-admin/projects/page.tsx",
  "app/786-admin/vip/page.tsx",
]

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/[0.05] p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.18)] backdrop-blur-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.38)]">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
          </div>
          <h1 className="text-xl font-bold">Loading 786.Chat Admin Workspace</h1>
          <p className="mt-2 text-sm text-slate-300">Owner-only design workspace is opening safely.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030711] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.24),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.10),transparent_36%)]" />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[72px_430px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#060b18]/90 py-4 backdrop-blur-2xl lg:flex lg:flex-col lg:items-center lg:justify-between">
          <div className="space-y-4">
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.35)]"
              aria-label="Back to dashboard"
            >
              786
            </button>
            <div className="space-y-2">
              {[Grid3X3, Bot, FileText, Settings].map((Icon, index) => (
                <button
                  key={index}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                    index === 1
                      ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100"
                  }`}
                  aria-label="786 admin tool"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200 to-violet-300 text-sm font-bold text-slate-950">
            M
          </div>
        </aside>

        <section className="border-r border-cyan-300/15 bg-[#07101f]/78 backdrop-blur-2xl">
          <header className="flex h-[70px] items-center gap-3 border-b border-white/10 px-5">
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-cyan-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-bold">786 Admin Portal</p>
              <p className="text-xs text-cyan-100/65">Design workspace only</p>
            </div>
          </header>

          <div className="flex min-h-[calc(100vh-70px)] flex-col justify-between p-5">
            <div>
              <div className="mb-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 shadow-[0_0_45px_rgba(34,211,238,0.10)]">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                  <ShieldCheck className="h-4 w-4" />
                  Owner logged in as {user.email}
                </div>
                <h1 className="text-3xl font-black tracking-tight">786.Chat</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Admin-only AI builder design area. Backend, database and customer tools will be connected later.
                </p>
              </div>

              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Start design</p>
                <div className="grid gap-3">
                  {starterCards.map((card) => (
                    <button
                      key={card}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                    >
                      {card}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin files</p>
                <div className="space-y-2">
                  {projectFiles.map((file) => (
                    <div key={file} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                      <Code2 className="h-3.5 w-3.5 text-cyan-200" />
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 min-h-20 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
                Ask 786.Chat to design admin login, dashboard, API page, homepage or deploy panel...
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-cyan-300/30 hover:text-cyan-100">
                  <Paperclip className="h-4 w-4" /> Add file
                </button>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)] hover:bg-cyan-200">
                  <Send className="h-4 w-4" /> Send
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col bg-[#050713]/92">
          <header className="flex h-[70px] items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400 md:block">
                786.chat/admin/workspace/design-preview
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100">Preview</button>
              <button className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300">Code</button>
              <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950">
                <Rocket className="h-3.5 w-3.5" /> Publish
              </button>
            </div>
          </header>

          <div className="border-b border-cyan-300/15 bg-cyan-300/10 px-5 py-3">
            <div className="flex items-center gap-4 text-cyan-100">
              <Monitor className="h-4 w-4" />
              <Tablet className="h-4 w-4 text-cyan-100/50" />
              <Smartphone className="h-4 w-4 text-cyan-100/50" />
              <span className="ml-auto text-xs text-cyan-100/70">Preview Ready — 786.Chat Admin</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#090d18] shadow-[0_0_80px_rgba(34,211,238,0.12)]">
              <div className="border-b border-white/10 bg-white/[0.035] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">786.Chat Admin Preview</p>
                    <p className="text-xs text-slate-400">Design-only workspace screen</p>
                  </div>
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">Safe mode</div>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="border-r border-white/10 p-8">
                  <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100">
                    <Sparkles className="h-4 w-4" /> New 786.Chat brand
                  </div>
                  <h2 className="text-5xl font-black tracking-tight text-white">
                    Build admin systems with <span className="text-cyan-200">786.Chat</span>
                  </h2>
                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                    Create login pages, dashboards, APIs, code views, deployment panels and design previews from one owner-only workspace.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    {["Admin Login", "Dashboard", "API", "Deploy"].map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { title: "Design Builder", icon: Layers3, text: "Create premium admin pages" },
                      { title: "Code Workspace", icon: TerminalSquare, text: "Show real files later" },
                      { title: "Live Preview", icon: Globe2, text: "Preview 786 pages" },
                      { title: "Deploy Center", icon: Rocket, text: "Vercel flow later" },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="font-bold text-white">{item.title}</p>
                          <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100">
                      <Play className="h-4 w-4" /> Ready for next design step
                    </div>
                    <p className="text-sm leading-6 text-slate-300">
                      This page no longer opens the old MujeebProAI chat screen. It is now an isolated 786.Chat admin design workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
