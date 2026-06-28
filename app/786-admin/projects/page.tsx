"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Coffee,
  Dumbbell,
  FolderKanban,
  GraduationCap,
  LineChart,
  MessageCircle,
  Music,
  Plane,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { AdminProjectListItem } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

// Deterministic per-project theme.
// Inputs: only fields already in the list response (no extra fetch, no schema change).
// Strategy: keyword-match title+prompt+description against curated themes; fallback to
// a deterministic HSL hash derived from project.id so unmatched projects still differ.
type ProjectTheme = {
  Icon: LucideIcon
  kindLabel: string
  iconWrap: string
  iconColor: string
  ring: string
  cardTint: string
  chip: string
  heroGradient: string
  rowAccent: string
  decorGradient: string
}

type ProjectThemeRecipe = {
  match: RegExp
  kindLabel: string
  theme: Omit<ProjectTheme, "kindLabel">
}

const THEME_RECIPES: ProjectThemeRecipe[] = [
  {
    match: /\b(restaurant|menu|food|dining|eatery|kitchen|chef|recipe)\b/i,
    kindLabel: "Restaurant",
    theme: {
      Icon: Utensils,
      iconWrap: "bg-gradient-to-br from-orange-400 to-amber-500",
      iconColor: "text-slate-950",
      ring: "border-amber-300/30 hover:border-amber-300/60",
      cardTint: "bg-gradient-to-br from-[#1a1410] via-[#161018] to-[#101827]",
      chip: "border-amber-300/30 bg-amber-300/15 text-amber-100",
      heroGradient: "bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-rose-500/20",
      rowAccent: "bg-amber-300/40",
      decorGradient: "from-amber-400/0 via-amber-400/40 to-transparent",
    },
  },
  {
    match: /\b(coffee|cafe|café|espresso|barista|brew|latte)\b/i,
    kindLabel: "Coffee shop",
    theme: {
      Icon: Coffee,
      iconWrap: "bg-gradient-to-br from-amber-700 to-stone-900",
      iconColor: "text-amber-100",
      ring: "border-amber-700/40 hover:border-amber-500/70",
      cardTint: "bg-gradient-to-br from-[#1a120c] via-[#14110f] to-[#0e0a08]",
      chip: "border-amber-500/30 bg-amber-700/20 text-amber-100",
      heroGradient: "bg-gradient-to-br from-amber-600/40 via-stone-700/30 to-amber-900/40",
      rowAccent: "bg-amber-200/40",
      decorGradient: "from-amber-500/0 via-amber-500/35 to-transparent",
    },
  },
  {
    match: /\b(fitness|gym|workout|health|wellness|yoga|training|exercise)\b/i,
    kindLabel: "Fitness",
    theme: {
      Icon: Dumbbell,
      iconWrap: "bg-gradient-to-br from-lime-400 to-teal-400",
      iconColor: "text-slate-950",
      ring: "border-lime-300/30 hover:border-lime-300/70",
      cardTint: "bg-gradient-to-br from-[#0e1810] via-[#0e1718] to-[#101827]",
      chip: "border-lime-300/30 bg-lime-300/15 text-lime-100",
      heroGradient: "bg-gradient-to-br from-lime-400/30 via-teal-400/25 to-emerald-400/20",
      rowAccent: "bg-lime-300/40",
      decorGradient: "from-lime-300/0 via-lime-300/40 to-transparent",
    },
  },
  {
    match: /\b(crypto|wallet|finance|trading|defi|nft|web3|investment|stock)\b/i,
    kindLabel: "Finance",
    theme: {
      Icon: LineChart,
      iconWrap: "bg-gradient-to-br from-emerald-400 to-yellow-300",
      iconColor: "text-slate-950",
      ring: "border-emerald-300/30 hover:border-yellow-300/60",
      cardTint: "bg-gradient-to-br from-[#0d1812] via-[#10170d] to-[#101827]",
      chip: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
      heroGradient: "bg-gradient-to-br from-emerald-400/30 via-yellow-300/25 to-amber-300/20",
      rowAccent: "bg-emerald-300/40",
      decorGradient: "from-emerald-300/0 via-emerald-300/40 to-transparent",
    },
  },
  {
    match: /\b(saas|dashboard|analytics|admin|metrics|kpi|report)\b/i,
    kindLabel: "SaaS dashboard",
    theme: {
      Icon: BarChart3,
      iconWrap: "bg-gradient-to-br from-indigo-500 to-cyan-400",
      iconColor: "text-slate-950",
      ring: "border-cyan-300/30 hover:border-cyan-300/70",
      cardTint: "bg-gradient-to-br from-[#0a1424] via-[#0d1626] to-[#101827]",
      chip: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
      heroGradient: "bg-gradient-to-br from-cyan-400/30 via-indigo-500/25 to-violet-500/20",
      rowAccent: "bg-cyan-300/40",
      decorGradient: "from-cyan-300/0 via-cyan-300/40 to-transparent",
    },
  },
  {
    match: /\b(shop|store|ecommerce|e-commerce|products|cart|checkout|merch|catalog)\b/i,
    kindLabel: "E-commerce",
    theme: {
      Icon: ShoppingBag,
      iconWrap: "bg-gradient-to-br from-emerald-400 to-teal-500",
      iconColor: "text-slate-950",
      ring: "border-emerald-300/30 hover:border-emerald-300/70",
      cardTint: "bg-gradient-to-br from-[#0a1a14] via-[#0d1820] to-[#101827]",
      chip: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
      heroGradient: "bg-gradient-to-br from-emerald-400/30 via-teal-500/25 to-lime-400/20",
      rowAccent: "bg-emerald-300/40",
      decorGradient: "from-emerald-300/0 via-emerald-300/40 to-transparent",
    },
  },
  {
    match: /\b(blog|article|news|magazine|cms|editorial|journal)\b/i,
    kindLabel: "Blog",
    theme: {
      Icon: BookOpen,
      iconWrap: "bg-gradient-to-br from-rose-400 to-fuchsia-500",
      iconColor: "text-slate-950",
      ring: "border-rose-300/30 hover:border-rose-300/70",
      cardTint: "bg-gradient-to-br from-[#1a0e18] via-[#15101a] to-[#101827]",
      chip: "border-rose-300/30 bg-rose-300/15 text-rose-100",
      heroGradient: "bg-gradient-to-br from-rose-400/30 via-fuchsia-500/25 to-violet-500/20",
      rowAccent: "bg-rose-300/40",
      decorGradient: "from-rose-300/0 via-rose-300/40 to-transparent",
    },
  },
  {
    match: /\b(portfolio|agency|studio|freelance|designer|creative)\b/i,
    kindLabel: "Portfolio",
    theme: {
      Icon: Briefcase,
      iconWrap: "bg-gradient-to-br from-slate-300 to-cyan-200",
      iconColor: "text-slate-950",
      ring: "border-slate-300/25 hover:border-cyan-200/60",
      cardTint: "bg-gradient-to-br from-[#0c1320] via-[#0e1622] to-[#101827]",
      chip: "border-slate-200/25 bg-slate-200/10 text-slate-100",
      heroGradient: "bg-gradient-to-br from-slate-300/30 via-cyan-200/25 to-sky-300/20",
      rowAccent: "bg-slate-200/40",
      decorGradient: "from-slate-200/0 via-slate-200/35 to-transparent",
    },
  },
  {
    match: /\b(real ?estate|property|properties|listing|housing|apartment|realtor)\b/i,
    kindLabel: "Real estate",
    theme: {
      Icon: Building2,
      iconWrap: "bg-gradient-to-br from-stone-300 to-amber-300",
      iconColor: "text-stone-900",
      ring: "border-stone-300/25 hover:border-amber-300/60",
      cardTint: "bg-gradient-to-br from-[#161410] via-[#13130f] to-[#101827]",
      chip: "border-stone-200/25 bg-stone-200/10 text-stone-100",
      heroGradient: "bg-gradient-to-br from-stone-300/30 via-amber-200/25 to-orange-200/20",
      rowAccent: "bg-stone-200/40",
      decorGradient: "from-stone-200/0 via-stone-200/35 to-transparent",
    },
  },
  {
    match: /\b(travel|booking|hotel|flight|tourism|trip|vacation|holiday)\b/i,
    kindLabel: "Travel",
    theme: {
      Icon: Plane,
      iconWrap: "bg-gradient-to-br from-sky-400 to-cyan-300",
      iconColor: "text-slate-950",
      ring: "border-sky-300/30 hover:border-sky-300/70",
      cardTint: "bg-gradient-to-br from-[#0a1622] via-[#0c1826] to-[#101827]",
      chip: "border-sky-300/30 bg-sky-300/15 text-sky-100",
      heroGradient: "bg-gradient-to-br from-sky-400/30 via-cyan-300/25 to-indigo-400/20",
      rowAccent: "bg-sky-300/40",
      decorGradient: "from-sky-300/0 via-sky-300/40 to-transparent",
    },
  },
  {
    match: /\b(chat|messaging|messenger|social|community|forum)\b/i,
    kindLabel: "Social",
    theme: {
      Icon: MessageCircle,
      iconWrap: "bg-gradient-to-br from-violet-500 to-fuchsia-400",
      iconColor: "text-white",
      ring: "border-violet-300/30 hover:border-violet-300/70",
      cardTint: "bg-gradient-to-br from-[#150f24] via-[#121224] to-[#101827]",
      chip: "border-violet-300/30 bg-violet-300/15 text-violet-100",
      heroGradient: "bg-gradient-to-br from-violet-500/30 via-fuchsia-400/25 to-purple-500/20",
      rowAccent: "bg-violet-300/40",
      decorGradient: "from-violet-300/0 via-violet-300/40 to-transparent",
    },
  },
  {
    match: /\b(education|learn|course|tutor|school|academy|class|lesson|student)\b/i,
    kindLabel: "Education",
    theme: {
      Icon: GraduationCap,
      iconWrap: "bg-gradient-to-br from-blue-400 to-indigo-500",
      iconColor: "text-white",
      ring: "border-blue-300/30 hover:border-blue-300/70",
      cardTint: "bg-gradient-to-br from-[#0c1024] via-[#0d1226] to-[#101827]",
      chip: "border-blue-300/30 bg-blue-300/15 text-blue-100",
      heroGradient: "bg-gradient-to-br from-blue-400/30 via-indigo-500/25 to-purple-500/20",
      rowAccent: "bg-blue-300/40",
      decorGradient: "from-blue-300/0 via-blue-300/40 to-transparent",
    },
  },
  {
    match: /\b(music|podcast|audio|streaming|playlist|album|track)\b/i,
    kindLabel: "Music",
    theme: {
      Icon: Music,
      iconWrap: "bg-gradient-to-br from-fuchsia-500 to-pink-400",
      iconColor: "text-white",
      ring: "border-fuchsia-300/30 hover:border-fuchsia-300/70",
      cardTint: "bg-gradient-to-br from-[#1a0a22] via-[#150d20] to-[#101827]",
      chip: "border-fuchsia-300/30 bg-fuchsia-300/15 text-fuchsia-100",
      heroGradient: "bg-gradient-to-br from-fuchsia-500/30 via-pink-400/25 to-rose-400/20",
      rowAccent: "bg-fuchsia-300/40",
      decorGradient: "from-fuchsia-300/0 via-fuchsia-300/40 to-transparent",
    },
  },
]

// Fallback themes for projects that match no recipe. Indexed by deterministic hash
// of project.id so the same project always gets the same fallback theme.
const FALLBACK_THEMES: Array<{ kindLabel: string; theme: Omit<ProjectTheme, "kindLabel"> }> = [
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-cyan-300 to-violet-400",
      iconColor: "text-slate-950",
      ring: "border-cyan-300/25 hover:border-violet-300/60",
      cardTint: "bg-gradient-to-br from-[#0c1224] via-[#0e1424] to-[#101827]",
      chip: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
      heroGradient: "bg-gradient-to-br from-cyan-300/30 via-violet-400/25 to-fuchsia-400/20",
      rowAccent: "bg-cyan-300/40",
      decorGradient: "from-cyan-300/0 via-cyan-300/35 to-transparent",
    },
  },
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-pink-400 to-orange-300",
      iconColor: "text-slate-950",
      ring: "border-pink-300/25 hover:border-orange-300/60",
      cardTint: "bg-gradient-to-br from-[#1a0e16] via-[#19120d] to-[#101827]",
      chip: "border-pink-300/30 bg-pink-300/15 text-pink-100",
      heroGradient: "bg-gradient-to-br from-pink-400/30 via-orange-300/25 to-rose-300/20",
      rowAccent: "bg-pink-300/40",
      decorGradient: "from-pink-300/0 via-pink-300/35 to-transparent",
    },
  },
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-teal-300 to-sky-400",
      iconColor: "text-slate-950",
      ring: "border-teal-300/25 hover:border-sky-300/60",
      cardTint: "bg-gradient-to-br from-[#08171a] via-[#0a1820] to-[#101827]",
      chip: "border-teal-300/30 bg-teal-300/15 text-teal-100",
      heroGradient: "bg-gradient-to-br from-teal-300/30 via-sky-400/25 to-cyan-300/20",
      rowAccent: "bg-teal-300/40",
      decorGradient: "from-teal-300/0 via-teal-300/35 to-transparent",
    },
  },
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-yellow-300 to-rose-400",
      iconColor: "text-slate-950",
      ring: "border-yellow-300/25 hover:border-rose-300/60",
      cardTint: "bg-gradient-to-br from-[#1a1408] via-[#181010] to-[#101827]",
      chip: "border-yellow-300/30 bg-yellow-300/15 text-yellow-100",
      heroGradient: "bg-gradient-to-br from-yellow-300/30 via-rose-400/25 to-pink-300/20",
      rowAccent: "bg-yellow-300/40",
      decorGradient: "from-yellow-300/0 via-yellow-300/35 to-transparent",
    },
  },
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-emerald-300 to-cyan-300",
      iconColor: "text-slate-950",
      ring: "border-emerald-300/25 hover:border-cyan-300/60",
      cardTint: "bg-gradient-to-br from-[#0a1816] via-[#0c1820] to-[#101827]",
      chip: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
      heroGradient: "bg-gradient-to-br from-emerald-300/30 via-cyan-300/25 to-teal-300/20",
      rowAccent: "bg-emerald-300/40",
      decorGradient: "from-emerald-300/0 via-emerald-300/35 to-transparent",
    },
  },
  {
    kindLabel: "Web app",
    theme: {
      Icon: Sparkles,
      iconWrap: "bg-gradient-to-br from-violet-400 to-indigo-500",
      iconColor: "text-white",
      ring: "border-violet-300/25 hover:border-indigo-300/60",
      cardTint: "bg-gradient-to-br from-[#100a1f] via-[#0e0d22] to-[#101827]",
      chip: "border-violet-300/30 bg-violet-300/15 text-violet-100",
      heroGradient: "bg-gradient-to-br from-violet-400/30 via-indigo-500/25 to-blue-400/20",
      rowAccent: "bg-violet-300/40",
      decorGradient: "from-violet-300/0 via-violet-300/35 to-transparent",
    },
  },
]

function deterministicHash(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function deriveProjectTheme(project: AdminProjectListItem): ProjectTheme {
  const corpus = `${project.title || ""} ${project.prompt || ""} ${project.description || ""}`
  for (const recipe of THEME_RECIPES) {
    if (recipe.match.test(corpus)) {
      return { ...recipe.theme, kindLabel: recipe.kindLabel }
    }
  }
  const fallback = FALLBACK_THEMES[deterministicHash(project.id) % FALLBACK_THEMES.length]
  return { ...fallback.theme, kindLabel: fallback.kindLabel }
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ""
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ""
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (diffSec < 60) return "just now"
  const mins = Math.round(diffSec / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

function ProjectCardPreview({ theme, title }: { theme: ProjectTheme; title: string }) {
  // Mini simulated "page" preview that uses the theme palette. Pure JSX, no iframe.
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-white/5 bg-[#070b15]">
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-black/40 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-amber-300/70" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        <span className="ml-2 truncate text-[10px] font-semibold uppercase tracking-wider text-white/30">
          {title}
        </span>
      </div>
      <div className={`relative h-24 ${theme.heroGradient}`}>
        <div className="absolute inset-0 flex flex-col items-start justify-end gap-1.5 p-3">
          <div className={`h-1.5 w-24 rounded-full ${theme.rowAccent}`} />
          <div className="h-1 w-16 rounded-full bg-white/20" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
      <div className="space-y-1.5 p-3">
        <div className="h-1 w-3/4 rounded-full bg-white/15" />
        <div className="h-1 w-2/3 rounded-full bg-white/10" />
        <div className="h-1 w-1/2 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

export default function SevenEightSixProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [projects, setProjects] = useState<AdminProjectListItem[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isAdmin, isLoading, router])

  useEffect(() => {
    if (!isAdmin) return
    try {
      localStorage.removeItem(OLD_PROJECT_KEY)
      localStorage.removeItem(LEGACY_PROJECTS_KEY)
    } catch {}

    let cancelled = false
    async function fetchProjects() {
      setLoadingProjects(true)
      setError(null)
      try {
        const res = await fetch("/api/786-admin/projects", { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load projects (${res.status})`)
        const json = await res.json()
        if (!cancelled) {
          const list = Array.isArray(json.projects)
            ? (json.projects as AdminProjectListItem[])
            : []
          setProjects(list)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load projects")
        }
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    }
    fetchProjects()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  function openProject(projectId: string) {
    try {
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId)
    } catch {}
    router.push("/786-admin/chat")
  }

  async function deleteProject(projectId: string) {
    const previous = projects
    setProjects((current) => current.filter((p) => p.id !== projectId))
    try {
      const res = await fetch(`/api/786-admin/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
      try {
        if (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) === projectId) {
          localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
        }
      } catch {}
    } catch (err) {
      setProjects(previous)
      setError(err instanceof Error ? err.message : "Failed to delete project")
    }
  }

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
                Saved 786.Chat projects appear here. Stored in Neon, not in your browser.
              </p>
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
                } catch {}
                router.push("/786-admin/chat")
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-5 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]"
            >
              <Plus className="h-4 w-4" />
              Create project in chat
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          {loadingProjects ? (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
              Loading projects from Neon…
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const theme = deriveProjectTheme(project)
                const Icon = theme.Icon
                const updated = formatRelative(project.updated_at)
                return (
                  <article
                    key={project.id}
                    className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_0_55px_rgba(0,0,0,0.22)] transition ${theme.ring} ${theme.cardTint}`}
                  >
                    <div
                      className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-60 blur-3xl ${theme.decorGradient}`}
                    />
                    <div className="relative">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${theme.iconWrap}`}
                        >
                          <Icon className={`h-7 w-7 ${theme.iconColor}`} />
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.chip}`}
                        >
                          {theme.kindLabel}
                        </span>
                      </div>

                      <ProjectCardPreview theme={theme} title={project.title} />

                      <h2 className="text-2xl font-black text-white">{project.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {project.description || project.prompt || "No description."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">
                          {project.file_count} {project.file_count === 1 ? "file" : "files"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">
                          {project.message_count} {project.message_count === 1 ? "message" : "messages"}
                        </span>
                        {updated && (
                          <span className="text-slate-500">Updated {updated}</span>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => openProject(project.id)}
                          className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                        >
                          Open in chat
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="rounded-xl border border-red-300/25 bg-red-500/10 px-5 py-2.5 text-sm font-black text-red-100 transition hover:border-red-300/50 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-white/10 bg-[#101827]/70 p-8 text-center shadow-[0_0_55px_rgba(0,0,0,0.2)]">
              <div className="max-w-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-black text-white">No projects yet</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Create a project in chat first. It will be saved to Neon and can be reopened with preview, code and chat history.
                </p>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
                    } catch {}
                    router.push("/786-admin/chat")
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                  Start in chat
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
