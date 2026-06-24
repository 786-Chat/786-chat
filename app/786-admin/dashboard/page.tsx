"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bot,
  Box,
  ChevronRight,
  Code2,
  FileCode2,
  FileText,
  Globe2,
  Home,
  Import,
  LayoutDashboard,
  LockKeyhole,
  Monitor,
  PanelTop,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Wand2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Projects", icon: Box },
  { label: "Published Projects", icon: Globe2 },
  { label: "Admin Security", icon: ShieldCheck },
  { label: "Integrations", icon: Zap },
  { label: "Settings", icon: Settings },
]

const quickTypes = [
  { label: "Website", icon: LayoutDashboard },
  { label: "AI App", icon: Bot },
  { label: "Design", icon: Wand2 },
  { label: "API", icon: Code2 },
  { label: "Deploy", icon: Rocket },
]

const deviceLinks = [
  { label: "Desktop", icon: Monitor },
  { label: "Tablet", icon: Tablet },
  { label: "Mobile", icon: Smartphone },
]

const desktopWorkModes = [
  { label: "Actual Page", icon: Globe2 },
  { label: "Layout", icon: PanelTop },
  { label: "White Page", icon: FileText },
]

const recentProjects = [
  {
    name: "786 Admin Portal",
    status: "Design draft",
    age: "today",
    icon: LayoutDashboard,
    glow: "from-cyan-400/30 to-blue-600/20",
  },
  {
    name: "MujeebProAI Safe Copy",
    status: "Protected",
    age: "old project safe",
    icon: LockKeyhole,
    glow: "from-emerald-400/30 to-cyan-500/20",
  },
  {
    name: "Customer Builder System",
    status: "Phase later",
    age: "planned",
    icon: FileCode2,
    glow: "from-violet-400/30 to-fuchsia-600/20",
  },
]

export default function SevenEightSixAdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [prompt, setPrompt] = useState("")

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
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-white/[0.04] px-5 py-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(0,255,255,0.14)]">
          <Sparkles className="h-4 w-4 animate-pulse text-cyan-200" />
          Loading Admin 786 Dashboard
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050713] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(0,255,255,0.15),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(125,92,255,0.16),transparent_30%)]" />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl lg:block">
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 shadow-[0_0_28px_rgba(0,255,255,0.08)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-sm font-bold text-slate-950">
              786
            </div>
            <div>
              <p className="text-sm font-semibold">Admin 786 Dashboard</p>
              <p className="text-xs text-slate-400">mujeeb workspace</p>
            </div>
          </div>

          <div className="mb-4 grid gap-2">
            <Button className="h-9 justify-start gap-2 border border-cyan-300/20 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/20">
              <Plus className="h-4 w-4" />
              Create something new
            </Button>
            <Button variant="outline" className="h-9 justify-start gap-2 border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">
              <Import className="h-4 w-4" />
              Import code or design
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    item.active
                      ? "bg-cyan-300/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.12)]"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4 text-xs text-slate-300">
            <p className="font-medium text-cyan-100">Admin only</p>
            <p className="mt-1 text-slate-400">Full control will be added step by step safely.</p>
          </div>
        </aside>

        <section className="relative overflow-y-auto px-5 py-6 lg:px-10 lg:py-8">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 font-bold text-slate-950">786</div>
              <div>
                <p className="font-semibold">Admin 786</p>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </div>

            <div className="hidden max-w-sm flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-500 lg:flex">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search projects, files, APIs...</span>
            </div>

            <div className="flex flex-wrap items-start justify-start gap-2 sm:justify-end">
              <div className="relative">
                <button className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100 shadow-[0_0_20px_rgba(0,255,255,0.08)] transition hover:border-cyan-300/45 hover:bg-cyan-300/15">
                  <Monitor className="h-4 w-4" />
                  Desktop
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border border-white/10 bg-[#101421]/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                  {desktopWorkModes.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.label}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-cyan-300/10 hover:text-cyan-100"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {deviceLinks.slice(1).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 shadow-[0_0_20px_rgba(0,255,255,0.06)] transition hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className="mx-auto max-w-5xl"
          >
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-xs text-cyan-100 shadow-[0_0_30px_rgba(0,255,255,0.08)]">
                <ShieldCheck className="h-4 w-4" />
                Owner logged in as {user.email}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Hi Mujeeb, what do you want to make?
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Admin 786 Dashboard — build, edit, design, fix and deploy step by step.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-cyan-300/25 bg-white/[0.045] p-2 shadow-[0_0_55px_rgba(0,255,255,0.13)] backdrop-blur-2xl">
              <div className="rounded-[20px] border border-white/8 bg-black/25 p-4">
                <Input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Build an admin login, dashboard, API, homepage, animation..."
                  className="h-14 border-0 bg-transparent text-base text-white placeholder:text-slate-500 focus-visible:ring-0"
                />
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                  <button className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.07]">
                    + Add file
                  </button>
                  <Button className="h-9 gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                    Start
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
              {quickTypes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    className="group flex flex-col items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-100"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10 group-hover:shadow-[0_0_28px_rgba(0,255,255,0.12)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </div>

            <section className="mt-20">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-300">Your recent Projects</h2>
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 hover:border-cyan-300/25 hover:text-cyan-100">
                  View All
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {recentProjects.map((project) => {
                  const Icon = project.icon
                  return (
                    <div
                      key={project.name}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_0_45px_rgba(0,255,255,0.10)]"
                    >
                      <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${project.glow}`}>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/25 backdrop-blur-xl">
                          <Icon className="h-6 w-6 text-cyan-100" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-white">{project.name}</h3>
                        <p className="mt-2 text-xs text-slate-500">
                          {project.status} • {project.age}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
