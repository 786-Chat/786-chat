"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
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
    if (isLoading) return

    if (!isAdmin) {
      router.replace("/786-admin/login")
      return
    }

    router.replace("/dashboard/chat?newProject=1&source=786-admin")
  }, [isAdmin, isLoading, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
      <div className="rounded-3xl border border-cyan-300/20 bg-white/[0.05] p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.18)] backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.38)]">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
        </div>
        <h1 className="text-xl font-bold">Opening 786-Chat Workspace</h1>
        <p className="mt-2 text-sm text-slate-300">Owner-only AI workspace is loading safely.</p>
      </div>
    </main>
  )
}
