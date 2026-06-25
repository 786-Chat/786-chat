"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Globe2,
  Grid3X3,
  Loader2,
  Monitor,
  Paperclip,
  Rocket,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

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
          <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-cyan-200" />
          <h1 className="text-xl font-bold">Loading 786.Chat Admin Workspace</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_1.42fr]">
        <section className="relative flex h-full min-h-0 flex-col border-r border-cyan-400/35 bg-[#081322]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#07101d] px-4">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="ml-2 rounded-full p-1.5 text-slate-500 hover:bg-white/5 hover:text-cyan-100"
              aria-label="Back dashboard"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="rounded-full p-1.5 text-slate-500 hover:bg-white/5 hover:text-cyan-100" aria-label="Forward">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="ml-3 flex h-9 flex-1 max-w-[520px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-400">
              <Globe2 className="h-4 w-4" />
              Enter URL to preview or ask AI...
            </div>
          </header>

          <div className="flex flex-1 min-h-0 items-center justify-center px-6 pb-28 pt-10">
            <div className="w-full max-w-[560px] text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-300 text-2xl font-black text-slate-950 shadow-[0_0_46px_rgba(34,211,238,0.28)]">
                786
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Welcome to <span className="text-cyan-200">786.Chat</span>
              </h1>
              <p className="mt-4 text-xl text-cyan-100/70">How can I help you today?</p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/96 p-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3 text-slate-400 shadow-[0_0_35px_rgba(0,0,0,0.22)]">
              <button className="text-slate-500 hover:text-cyan-100" aria-label="Attachment">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 text-sm">Ask me anything...</div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_0_25px_rgba(124,58,237,0.34)]" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              Unlimited
            </div>
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center justify-end gap-3 border-b border-white/10 bg-[#0c0c12] px-5">
            <button className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2 text-sm font-semibold text-cyan-100">
              <Monitor className="h-4 w-4" />
              Preview
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400">
              <Code2 className="h-4 w-4" />
              Code
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)]">
              <Rocket className="h-4 w-4" />
              Publish
            </button>
            <button className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
              <Grid3X3 className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
              M
            </div>
          </header>

          <div className="shrink-0 border-b border-cyan-400/25 bg-[#082725]/88 px-4 py-3">
            <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
              ● Preview Ready - New Chat
            </div>
          </div>

          <div className="shrink-0 border-b border-cyan-400/15 bg-[#082120]/80 px-5 py-4">
            <div className="flex items-center gap-5 text-cyan-100/45">
              <Monitor className="h-5 w-5 text-cyan-300" />
              <Tablet className="h-4 w-4" />
              <Smartphone className="h-4 w-4" />
            </div>
          </div>

          <div className="flex flex-1 min-h-0 items-center justify-center bg-[#06060a] p-8">
            <div className="text-center text-slate-500">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <Monitor className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-400">New chat ready</h2>
              <p className="mt-2 max-w-xs text-sm leading-6">
                Ask 786.Chat to create a new admin page or app. The preview will appear here.
              </p>
              <button className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100">
                <Globe2 className="h-4 w-4" />
                Preview 786.Chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
