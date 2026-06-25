"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Box, FolderKanban, Search, ShieldCheck } from "lucide-react"
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

          <button className="flex w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-left text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]">
            <FolderKanban className="h-5 w-5" />
            Projects
          </button>
        </aside>

        <section className="px-6 py-10 lg:px-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">Projects</h1>
              <p className="mt-2 text-sm text-slate-400">Open your 786.Chat admin workspace projects.</p>
            </div>

            <div className="flex h-11 min-w-[260px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-400">
              <Search className="h-4 w-4" />
              Search projects...
            </div>
          </div>

          <button
            onClick={() => router.push("/786-admin/chat")}
            className="w-full max-w-[380px] overflow-hidden rounded-3xl border border-white/10 bg-[#101827] text-left transition hover:-translate-y-0.5 hover:border-cyan-300/25"
          >
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(34,211,238,0.35),transparent_30%),radial-gradient(circle_at_85%_40%,rgba(59,130,246,0.24),transparent_28%)]" />
              <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/90 text-cyan-100 shadow-sm">
                <Box className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5">
              <h2 className="truncate text-xl font-black text-white">786 Admin Chat Workspace</h2>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Owner workspace • ready
              </p>
            </div>
          </button>
        </section>
      </div>
    </main>
  )
}
