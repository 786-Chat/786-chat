"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  ChevronDown,
  Grid3X3,
  Home,
  Layers,
  Link2,
  List,
  MoreVertical,
  Search,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const sidebarItems = [
  { label: "Home", icon: Home, href: "/786-admin/dashboard" },
  { label: "Projects", icon: Grid3X3, href: "/786-admin/projects", active: true },
  { label: "Published Projects", icon: Layers, href: "/786-admin/projects" },
  { label: "Integrations", icon: Zap, href: "/786-admin/vip" },
  { label: "Security", icon: ShieldCheck, href: "/786-admin/vip" },
  { label: "Settings", icon: Settings, href: "/786-admin/vip" },
]

export default function SevenEightSixProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [search, setSearch] = useState("")

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
      <main className="flex min-h-screen items-center justify-center bg-[#1f1f1f] text-white">
        Loading
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#1f1f1f] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[270px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#202020] p-4 lg:flex lg:flex-col">
          <div className="mb-10 flex items-center justify-between">
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#292929] text-lg font-bold text-cyan-200"
            >
              786
            </button>
            <Search className="h-5 w-5 text-slate-400" />
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base transition ${
                    item.active
                      ? "bg-white/12 text-white"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="overflow-y-auto px-6 py-12 lg:px-20">
          <div className="mb-8 flex items-center gap-4">
            <Grid3X3 className="h-8 w-8" />
            <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative w-72 max-w-full">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="h-12 rounded-2xl border-white/15 bg-[#232323] pr-11 text-white placeholder:text-slate-400 focus:border-white/30"
                />
                <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base text-slate-100 hover:bg-white/10">
                Any status
                <ChevronDown className="h-5 w-5" />
              </button>

              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base text-slate-100 hover:bg-white/10">
                Any artifact type
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-[#232323] px-4 py-3 text-base text-white hover:bg-white/10">
                <Box className="h-5 w-5" />
                All projects
                <ChevronDown className="h-5 w-5" />
              </button>
              <button className="rounded-2xl border border-white/15 bg-[#232323] p-3 text-white hover:bg-white/10">
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button className="rounded-2xl border border-white/15 bg-[#232323] p-3 text-white hover:bg-white/10">
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex min-h-[610px] flex-col justify-between">
            <button
              onClick={() => router.push("/786-admin/chat")}
              className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#242424] text-left transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-blue-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(34,211,238,0.35),transparent_30%),radial-gradient(circle_at_85%_40%,rgba(59,130,246,0.24),transparent_28%)]" />
                <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/90 text-slate-200 shadow-sm">
                  <Box className="h-5 w-5" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-xl font-bold text-white">786 Admin Portal</h2>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Link2 className="h-5 w-5" />
                    <MoreVertical className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-2 text-base text-slate-400">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Design draft • today
                </p>
              </div>
            </button>

            <div className="flex justify-end">
              <button className="rounded-2xl border border-white/15 bg-[#232323] px-7 py-4 text-lg font-semibold text-white hover:bg-white/10">
                View All
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
