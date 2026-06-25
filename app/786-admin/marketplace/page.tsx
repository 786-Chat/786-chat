"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  Box,
  Clock3,
  FolderKanban,
  Globe2,
  Search,
  Sparkles,
  Star,
  Store,
  Zap,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const categories = [
  "All",
  "SaaS",
  "Restaurant",
  "Ecommerce",
  "Booking",
  "School",
  "Dashboard",
  "AI Tools",
]

const featuredProjects = [
  {
    title: "Restaurant Ordering Platform",
    subtitle: "Menu, delivery, booking and offers",
    tag: "Restaurant",
    rating: "4.9",
    time: "Ready template",
    gradient: "from-orange-400 via-amber-300 to-yellow-300",
  },
  {
    title: "AI Business Dashboard",
    subtitle: "Analytics, users, billing and admin tools",
    tag: "SaaS",
    rating: "5.0",
    time: "Owner ready",
    gradient: "from-cyan-300 via-sky-400 to-blue-600",
  },
  {
    title: "Local Shop Marketplace",
    subtitle: "Products, carts, sellers and payments",
    tag: "Ecommerce",
    rating: "4.8",
    time: "Fast launch",
    gradient: "from-emerald-300 via-teal-400 to-cyan-600",
  },
]

const projectCards = [
  "Food Delivery Website",
  "Hotel Booking App",
  "School Learning Portal",
  "Garage Service System",
  "Inventory Manager",
  "Medical Clinic Website",
]

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
                <p className="mt-1 text-sm text-slate-400">Browse ready website and app project templates.</p>
              </div>

              <div className="flex h-12 w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-slate-400 shadow-[0_0_28px_rgba(0,0,0,0.16)] lg:w-[440px]">
                <Search className="h-4 w-4" />
                Search marketplace projects, websites, APIs...
              </div>
            </div>
          </header>

          <div className="px-6 py-8 lg:px-10">
            <div className="mb-7 grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
              <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 p-8 text-slate-950 shadow-[0_0_50px_rgba(34,211,238,0.18)]">
                <div className="max-w-2xl">
                  <p className="mb-3 inline-flex rounded-full bg-slate-950/12 px-3 py-1 text-xs font-black">Premium launch templates</p>
                  <h2 className="text-4xl font-black tracking-tight">Build client websites faster with ready-made project systems.</h2>
                  <p className="mt-4 max-w-xl text-sm font-semibold text-slate-800/80">
                    Choose a marketplace project, open it in chat, then edit design, code, pages, database and deployment from the 786.Chat workspace.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-black text-white">Instant project ideas</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Food delivery, booking, ecommerce, AI dashboards, school portals and admin systems.</p>
              </div>
            </div>

            <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">Featured projects</h2>
                <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-bold text-slate-300">
                  Show all <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {featuredProjects.map((project) => (
                  <button
                    key={project.title}
                    onClick={() => router.push("/786-admin/chat")}
                    className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#101827] text-left shadow-[0_0_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-cyan-300/30"
                  >
                    <div className={`h-36 bg-gradient-to-br ${project.gradient} p-5`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/18 text-slate-950 backdrop-blur-xl">
                        <Box className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-3 inline-flex rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{project.tag}</div>
                      <h3 className="text-lg font-black text-white">{project.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{project.subtitle}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-cyan-200 text-cyan-200" /> {project.rating}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {project.time}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-black text-white">All project websites</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projectCards.map((name) => (
                  <button
                    key={name}
                    onClick={() => router.push("/786-admin/chat")}
                    className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/10"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                      <Globe2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-black text-white">{name}</h3>
                      <p className="mt-1 text-xs text-slate-400">Website project • open in 786.Chat</p>
                    </div>
                    <BadgeCheck className="h-5 w-5 text-cyan-200" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
