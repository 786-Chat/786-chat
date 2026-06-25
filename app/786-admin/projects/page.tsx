"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, Plus, ShieldCheck, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

export default function SevenEightSixProjectsPage() {
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
        Loading 786 projects...
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
            <button className="flex w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-left text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]">
              <FolderKanban className="h-5 w-5" />
              Projects
            </button>
            <button
              onClick={() => router.push("/786-admin/marketplace")}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <Store className="h-5 w-5" />
              Marketplace
            </button>
          </nav>
        </aside>

        <section className="px-6 py-10 lg:px-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">Projects</h1>
              <p className="mt-2 text-sm text-slate-400">
                Real 786.Chat projects created from the admin chat will appear here.
              </p>
            </div>

            <button
              onClick={() => router.push("/786-admin/chat")}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-5 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)] transition hover:bg-cyan-300/18"
            >
              <Plus className="h-4 w-4" />
              Create project in chat
            </button>
          </div>

          <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-white/10 bg-[#101827]/70 p-8 text-center shadow-[0_0_55px_rgba(0,0,0,0.2)]">
            <div className="max-w-lg">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-[0_0_46px_rgba(34,211,238,0.12)]">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <h2 className="text-2xl font-black text-white">No real projects yet</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Fake project cards have been removed. After the real Neon project system is connected,
                every project created through the 786.Chat dashboard will be saved and listed here.
              </p>
              <button
                onClick={() => router.push("/786-admin/chat")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)] transition hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                Start in chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
