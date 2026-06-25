"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, Globe2, Plus, Search, Sparkles, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

export default function SevenEightSixMarketplacePage() {
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
        Loading 786 marketplace...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050713] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-cyan-300/15 bg-[#06101c] p-4 lg:flex lg:flex-col">
          <button
            onClick={() => router.push("/786-admin/chat")}
            className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.25)]"
          >
            786
          </button>

          <nav className="space-y-2">
            <button
              onClick={() => router.push("/786-admin/projects")}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <FolderKanban className="h-5 w-5" />
              Projects
            </button>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-left text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]">
              <Store className="h-5 w-5" />
              Marketplace
            </button>
          </nav>
        </aside>

        <section className="overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050713]/90 px-6 py-5 backdrop-blur-2xl lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  786.Chat Marketplace
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">Marketplace</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Real public projects created through 786.Chat will appear here later.
                </p>
              </div>

              <div className="flex h-12 w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-slate-400 shadow-[0_0_28px_rgba(0,0,0,0.16)] lg:w-[440px]">
                <Search className="h-4 w-4" />
                Search will work after real marketplace data is connected
              </div>
            </div>
          </header>

          <div className="px-6 py-8 lg:px-10">
            <div className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 p-8 text-slate-950 shadow-[0_0_50px_rgba(34,211,238,0.18)]">
              <div className="max-w-3xl">
                <p className="mb-3 inline-flex rounded-full bg-slate-950/12 px-3 py-1 text-xs font-black">
                  Real marketplace rule
                </p>
                <h2 className="text-4xl font-black tracking-tight">
                  Projects created through 786.Chat will become marketplace cards.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold text-slate-800/80">
                  After the database and publishing system is connected, customer and admin projects can be saved,
                  reviewed, categorized by location or type, and shown here as real marketplace listings.
                </p>
              </div>
            </div>

            <div className="flex min-h-[440px] items-center justify-center rounded-[2rem] border border-white/10 bg-[#101827]/70 p-8 text-center shadow-[0_0_55px_rgba(0,0,0,0.2)]">
              <div className="max-w-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_46px_rgba(34,211,238,0.12)]">
                  <Globe2 className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-black text-white">No real marketplace projects yet</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Fake templates and demo cards have been removed. The next step is to connect Neon so real
                  786.Chat projects can be published into this marketplace automatically.
                </p>
                <button
                  onClick={() => router.push("/786-admin/chat")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)] transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  Create in chat
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
