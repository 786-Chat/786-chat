"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, FolderKanban, RadioTower, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { AdminProjectListItem } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"

type ProjectMetadata = {
  published?: boolean
  published_url?: string
  published_slug?: string
}

type LiveProject = AdminProjectListItem & {
  metadata?: ProjectMetadata
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

function liveUrl(project: LiveProject): string {
  const metadata = project.metadata || {}
  return metadata.published_url || (metadata.published_slug ? `/p/${metadata.published_slug}` : "")
}

export default function SevenEightSixLiveProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [projects, setProjects] = useState<LiveProject[]>([])
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
    let cancelled = false
    async function fetchProjects() {
      setLoadingProjects(true)
      setError(null)
      try {
        const res = await fetch("/api/786-admin/projects", { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load live projects (${res.status})`)
        const json = await res.json()
        const list = Array.isArray(json.projects) ? (json.projects as LiveProject[]) : []
        const live = list.filter((project) => project.metadata?.published && liveUrl(project))
        if (!cancelled) setProjects(live)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load live projects")
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    }
    fetchProjects()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        Loading live projects...
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
            <button
              onClick={() => router.push("/786-admin/marketplace")}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <Store className="h-5 w-5" />
              Marketplace
            </button>
            <button className="flex w-full items-center gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-300/12 px-4 py-3 text-left text-sm font-bold text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.14)]">
              <RadioTower className="h-5 w-5" />
              Live Projects
            </button>
          </nav>
        </aside>

        <section className="px-6 py-10 lg:px-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">Live Projects</h1>
              <p className="mt-2 text-sm text-slate-400">
                Published projects appear here after you click Publish in chat.
              </p>
            </div>
            <button
              onClick={() => router.push("/786-admin/projects")}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-5 py-3 text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]"
            >
              Back to Projects
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">
              {error}
            </div>
          )}

          {loadingProjects ? (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
              Loading live projects from Neon…
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {projects.map((project) => {
                const url = liveUrl(project)
                const updated = formatRelative(project.updated_at)
                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-[#071b16] via-[#0c1624] to-[#101827] p-4 shadow-[0_0_45px_rgba(0,0,0,0.22)]"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,.25)]">
                        <RadioTower className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                        Live
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white">{project.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                      {project.description || project.prompt || "Published project."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        {project.file_count} {project.file_count === 1 ? "file" : "files"}
                      </span>
                      {updated && <span>Updated {updated}</span>}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push("/786-admin/projects")}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.1]"
                      >
                        Manage
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-300 px-3 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-200"
                      >
                        Open <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-[520px] items-center justify-center rounded-[2rem] border border-white/10 bg-[#101827]/70 p-8 text-center shadow-[0_0_55px_rgba(0,0,0,0.2)]">
              <div className="max-w-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  <RadioTower className="h-9 w-9" />
                </div>
                <h2 className="text-2xl font-black text-white">No live projects yet</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Open a project in chat and click Publish. Once published, it will appear here automatically.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
