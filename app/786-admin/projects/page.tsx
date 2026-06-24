"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Box,
  ChevronDown,
  Gift,
  Grid3X3,
  HelpCircle,
  Home,
  Import,
  Layers,
  Link2,
  List,
  Lock,
  LogOut,
  MoreVertical,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const projects = [
  {
    name: "Food Data Miner",
    age: "3 minutes ago",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "Food Safety Hub",
    age: "4 days ago",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "AttachmentAnalyzer",
    age: "last week",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "FoodSafetyMenu",
    age: "last month",
    image:
      "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "Language Tutor",
    age: "last month",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
    locked: true,
  },
  {
    name: "Roblox Builder",
    age: "2 months ago",
    image:
      "https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
  {
    name: "RestaurantContractPortal",
    age: "2 months ago",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    locked: false,
  },
]

const sidebarItems = [
  { label: "Home", icon: Home },
  { label: "Projects", icon: Grid3X3, active: true },
  { label: "Published Projects", icon: Layers },
  { label: "Integrations", icon: Zap },
  { label: "Security", icon: ShieldCheck },
  { label: "Promotions", icon: Gift },
  { label: "Settings", icon: Settings },
]

export default function SevenEightSixProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [search, setSearch] = useState("")
  const [themeOpen, setThemeOpen] = useState(true)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1f1f1f] text-white">
        Loading Projects
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#1f1f1f] text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#202020] p-3 lg:block">
          <div className="mb-4 flex items-center justify-between px-1 py-2">
            <button
              onClick={() => router.push("/786-admin/dashboard")}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-cyan-200 hover:bg-white/10"
            >
              786
            </button>
            <Search className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-sm shadow-xl">
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10">
              <Settings className="h-4 w-4" />
              Settings
              <ChevronDown className="ml-auto h-4 w-4 -rotate-90" />
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10">
              <Bell className="h-4 w-4" />
              Notifications
            </button>
            <div className="my-1 h-px bg-white/10" />
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10">
              <span className="text-lg leading-none">›_</span>
              CLUI
            </button>
            <div className="my-1 h-px bg-white/10" />
            <button
              onClick={() => setThemeOpen((current) => !current)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10"
            >
              <Palette className="h-4 w-4" />
              Theme
              <span className="ml-auto text-slate-300">Dark</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
            {themeOpen && (
              <div className="ml-6 rounded-xl bg-black/25 p-1">
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/10">
                  Light
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg bg-white/10 px-2 py-2 text-left text-sm text-white">
                  Dark
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/10">
                  System
                </button>
              </div>
            )}
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10">
              <HelpCircle className="h-4 w-4" />
              Help
              <ChevronDown className="ml-auto h-4 w-4 -rotate-90" />
            </button>
            <div className="my-1 h-px bg-white/10" />
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-100 hover:bg-white/10">
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => item.label === "Home" && router.push("/786-admin/dashboard")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    item.active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-4 left-3 right-3 hidden lg:block">
            <div className="mb-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Learn
              </div>
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4" /> Documentation
              </div>
            </div>
            <div className="rounded-xl bg-blue-950/70 p-3 text-xs text-blue-100">
              <p className="mb-2 font-medium">Invite a friend, earn $20</p>
              <button className="mb-2 w-full rounded-lg bg-blue-500 px-3 py-2 text-white">Refer & Earn</button>
              <p>You&apos;ll both get credits when they upgrade to Replit Core.</p>
            </div>
          </div>
        </aside>

        <section className="overflow-y-auto px-5 py-10 lg:px-24">
          <div className="mb-6 flex items-center gap-3">
            <Grid3X3 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-56 max-w-full">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="h-9 rounded-md border-white/15 bg-[#2a2a2a] pr-9 text-white placeholder:text-slate-400 focus:border-white/30"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              </div>

              <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-100 hover:bg-white/10">
                Any status
                <ChevronDown className="h-4 w-4" />
              </button>

              <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-100 hover:bg-white/10">
                Any artifact type
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#2a2a2a] px-3 py-2 text-sm text-white hover:bg-white/10">
                <Box className="h-4 w-4" />
                All projects
                <ChevronDown className="h-4 w-4" />
              </button>
              <button className="rounded-md border border-white/15 bg-[#2a2a2a] p-2 text-white hover:bg-white/10">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="rounded-md border border-white/15 bg-[#2a2a2a] p-2 text-white hover:bg-white/10">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {filteredProjects.map((project) => (
              <article
                key={project.name}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#242424] transition hover:-translate-y-0.5 hover:border-white/20"
              >
                <div className="relative h-40 overflow-hidden bg-slate-950">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${project.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/90 text-slate-200 shadow-sm">
                    <Box className="h-4 w-4" />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate text-sm font-medium text-white">{project.name}</h2>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Link2 className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                    {project.locked ? (
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {project.locked ? "Locked" : ""} {project.locked ? "·" : ""} {project.age}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
