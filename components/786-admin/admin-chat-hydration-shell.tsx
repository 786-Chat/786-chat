"use client"

import { usePathname } from "next/navigation"
import { Loader2, Monitor, Plus, Smartphone, Tablet } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function AdminChatHydrationShell() {
  const pathname = usePathname()
  const { isLoading } = useAuth()

  if (pathname !== "/786-admin/chat" || !isLoading) return null

  return (
    <div className="fixed inset-0 z-[2147483000] bg-[#050713] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[92px] shrink-0 border-r border-cyan-300/15 bg-[#06101c] pt-24 lg:block">
          <div className="mx-auto h-12 w-12 rounded-2xl border border-cyan-300/25 bg-cyan-300/10" />
        </aside>

        <section className="flex h-full w-[430px] min-w-[360px] shrink-0 flex-col border-r border-cyan-300/15 bg-[#081322]">
          <header className="flex h-[70px] shrink-0 items-center border-b border-white/10 px-4">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-300/35 bg-violet-500/20 px-4 py-2.5 text-sm font-black">
              <Plus className="h-4 w-4" />
              New Chat
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-violet-300/30 bg-violet-500/15 shadow-[0_0_35px_rgba(139,92,246,.25)]">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
              </div>
              <p className="text-lg font-black text-cyan-100">Restoring 786.Chat workspace</p>
              <p className="mt-2 text-sm text-slate-400">Checking your secure session and active project…</p>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#101827]/95 p-4">
            <div className="h-14 rounded-3xl border border-white/10 bg-[#162033]" />
            <div className="mt-3 h-9 rounded-2xl border border-cyan-400/20 bg-cyan-500/10" />
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
            <div className="font-black text-white">✦ 786.Chat</div>
            <div className="min-w-[180px] flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-500">
              Restoring active project…
            </div>
            <div className="hidden shrink-0 items-center rounded-full border border-white/10 bg-white/[0.035] p-1 md:flex">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-slate-400"><Monitor className="h-4 w-4" />Desktop</div>
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-slate-400"><Tablet className="h-4 w-4" />Tablet</div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-bold text-white"><Smartphone className="h-4 w-4" />Mobile</div>
            </div>
          </header>

          <div className="flex h-[58px] shrink-0 items-center border-b border-white/10 px-5">
            <div className="w-full rounded-full border border-violet-300/20 bg-white/[0.035] px-4 py-2 text-sm text-slate-500">
              🔒 https://preview.786.chat
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center bg-[#070b12]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-slate-300">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.7)]" />
              Loading saved preview…
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
