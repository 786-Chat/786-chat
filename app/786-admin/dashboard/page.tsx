"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  Box,
  Code2,
  FileCode2,
  Globe2,
  Grid3X3,
  Home,
  Import,
  Laptop,
  LayoutDashboard,
  LockKeyhole,
  Monitor,
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

type DeviceMode = "Desktop" | "Tablet" | "Mobile"

const navItems = [
  { label: "Home", icon: Home, active: true, href: "/786-admin/dashboard" },
  { label: "Projects", icon: Box, href: "/786-admin/projects" },
  { label: "Published Projects", icon: Globe2, href: "/786-admin/projects" },
  { label: "Admin Security", icon: ShieldCheck, href: "/786-admin/vip" },
  { label: "Integrations", icon: Zap, href: "/786-admin/vip" },
  { label: "Settings", icon: Settings, href: "/786-admin/vip" },
]

const quickTypes = [
  { label: "Website", icon: LayoutDashboard },
  { label: "AI App", icon: Bot },
  { label: "Design", icon: Wand2 },
  { label: "API", icon: Code2 },
  { label: "Deploy", icon: Rocket },
]

const deviceLinks: { label: DeviceMode; icon: typeof Monitor }[] = [
  { label: "Desktop", icon: Monitor },
  { label: "Tablet", icon: Tablet },
  { label: "Mobile", icon: Smartphone },
]

const recentProjects = [
  {
    name: "786 Admin Portal",
    status: "Design draft",
    age: "today",
    icon: LayoutDashboard,
    glow: "from-cyan-300/55 to-blue-500/25",
    href: "/786-admin/chat",
  },
  {
    name: "MujeebProAI Safe Copy",
    status: "Protected",
    age: "old project safe",
    icon: LockKeyhole,
    glow: "from-emerald-300/55 to-cyan-500/25",
    href: "/786-admin/chat",
  },
  {
    name: "Customer Builder System",
    status: "Phase later",
    age: "planned",
    icon: FileCode2,
    glow: "from-violet-300/55 to-fuchsia-500/25",
    href: "/786-admin/chat",
  },
]

export default function SevenEightSixAdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [activeDevice, setActiveDevice] = useState<DeviceMode>("Desktop")

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  const openWorkspace = () => {
    router.push("/786-admin/chat")
  }

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
    <main className="relative min-h-screen overflow-hidden bg-[#050713] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_0%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(125,92,255,0.18),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.09),transparent_36%)]" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#080e1c]/88 p-4 backdrop-blur-2xl lg:block">
          <div className="mb-5 flex flex-col items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-5 text-center text-cyan-100 shadow-[0_0_45px_rgba(34,211,238,0.14)]">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.45)]">
              786
            </div>
            <p className="text-lg font-bold leading-tight">Admin 786</p>
            <p className="mt-1 text-sm text-cyan-100/70">Dashboard</p>
          </div>

          <div className="mb-5 space-y-2">
            <button
              onClick={openWorkspace}
              className="flex w-full items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/13 px-4 py-3 text-left text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              <Plus className="h-4 w-4" />
              Create something new
            </button>
            <button
              onClick={openWorkspace}
              className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              <Import className="h-4 w-4" />
              Import code or design
            </button>
          </div>

          <nav className="space-y-2 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    item.active
                      ? "border border-cyan-300/20 bg-cyan-300/12 text-cyan-100"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button
            onClick={() => router.push("/786-admin/vip")}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-left text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <Sparkles className="h-4 w-4" />
            Go To 786 Admin VIP
          </button>

          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs text-cyan-100">
            <p className="font-semibold">Admin only</p>
            <p className="mt-1 text-cyan-100/70">Full control will be added step by step safely.</p>
          </div>
        </aside>

        <section className="overflow-y-auto px-5 py-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-[390px]">
              <Input
                placeholder="Search projects, files, APIs..."
                className="h-12 rounded-2xl border-cyan-200/15 bg-cyan-100/[0.08] pl-11 text-white placeholder:text-slate-400 focus:border-cyan-300/50"
              />
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200">
                <Laptop className="h-4 w-4" />
                {activeDevice}
              </button>
              <div className="mt-2 flex gap-2 md:absolute md:right-0 md:top-full">
                {deviceLinks.map((device) => {
                  const Icon = device.icon
                  return (
                    <button
                      key={device.label}
                      onClick={() => setActiveDevice(device.label)}
                      className={`hidden rounded-xl border px-3 py-2 text-xs md:flex ${
                        activeDevice === device.label
                          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <section className="mx-auto max-w-4xl text-center">
            <button
              onClick={openWorkspace}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2 text-xs font-semibold text-cyan-100"
            >
              <ShieldCheck className="h-4 w-4" />
              Owner logged in as {user.email}
            </button>

            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              Hi Mujeeb, what do you want to make?
            </h1>
            <p className="mt-4 text-sm text-slate-300 md:text-base">
              Admin 786 Dashboard — build, edit, design, fix and deploy step by step.
            </p>

            <button
              onClick={openWorkspace}
              className="mt-8 block w-full rounded-[28px] border border-white/10 bg-white/[0.055] p-3 text-left shadow-[0_0_65px_rgba(34,211,238,0.08)] backdrop-blur-2xl transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.07]"
            >
              <div className="rounded-[22px] border border-white/10 bg-[#0d111d]/80 p-5">
                <div className="min-h-[72px] text-sm text-slate-400">
                  {prompt || "Build an admin login, dashboard, API, homepage, animation..."}
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
                    <Plus className="h-4 w-4" /> Add file
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.28)]">
                    Start
                    <Rocket className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>

            <div className="mt-7 flex flex-wrap justify-center gap-4">
              {quickTypes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={openWorkspace}
                    className="group text-center"
                  >
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-slate-200 transition group-hover:border-cyan-300/35 group-hover:bg-cyan-300/12 group-hover:text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-slate-300">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mx-auto mt-20 max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Your recent Projects</h2>
              <button
                onClick={() => router.push("/786-admin/projects")}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-slate-300 hover:border-cyan-300/35 hover:text-cyan-100"
              >
                View All
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {recentProjects.map((project) => {
                const Icon = project.icon
                return (
                  <button
                    key={project.name}
                    onClick={() => router.push(project.href)}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] text-left transition hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_0_45px_rgba(34,211,238,0.12)]"
                  >
                    <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${project.glow}`}>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/25 text-white backdrop-blur-xl">
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-white">{project.name}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {project.status} • {project.age}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
