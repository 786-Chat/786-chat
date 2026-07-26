"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Calendar,
  Clock,
  Code,
  FolderKanban,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Project = {
  id: string
  name: string
  description?: string
  status?: string
  template?: string
  fileCount?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  delete_after?: string | null
}

type ViewMode = "active" | "recover"

function ProjectThumbnail({ project }: { project: Project }) {
  const projectText = `${project.name || ""} ${project.description || ""} ${project.template || ""}`.toLowerCase()
  const isLogin = projectText.includes("login") || projectText.includes("sign in") || projectText.includes("authentication")
  const isRestaurant = projectText.includes("restaurant") || projectText.includes("food") || projectText.includes("menu")

  return (
    <div className="relative h-48 overflow-hidden rounded-[22px] border border-white/10 bg-[#080b14] shadow-inner">
      <div className="flex h-8 items-center gap-1.5 border-b border-white/10 bg-black/40 px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
          {project.name || "786.Chat Project"}
        </span>
      </div>

      {isLogin ? (
        <div className="grid h-[calc(100%-2rem)] grid-cols-[1.05fr_.95fr]">
          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-5 text-slate-950">
            <div className="h-2 w-16 rounded-full bg-slate-950/35" />
            <div className="mt-5 h-5 w-28 rounded-md bg-slate-950/80" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-950/35" />
            <div className="mt-8 grid grid-cols-2 gap-2">
              <div className="h-10 rounded-xl bg-white/35" />
              <div className="h-10 rounded-xl bg-white/20" />
            </div>
          </div>
          <div className="bg-[#101522] p-5">
            <div className="h-4 w-24 rounded bg-white/80" />
            <div className="mt-2 h-2 w-20 rounded bg-white/20" />
            <div className="mt-6 h-8 rounded-xl border border-white/10 bg-black/30" />
            <div className="mt-3 h-8 rounded-xl border border-white/10 bg-black/30" />
            <div className="mt-4 h-8 rounded-xl bg-cyan-300" />
          </div>
        </div>
      ) : isRestaurant ? (
        <div className="relative h-[calc(100%-2rem)] bg-gradient-to-br from-orange-500/80 via-rose-700/75 to-purple-900 p-5">
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative">
            <div className="h-2 w-20 rounded-full bg-amber-200/70" />
            <div className="mt-5 h-6 w-48 rounded bg-white/90" />
            <div className="mt-3 h-2.5 w-36 rounded bg-white/45" />
            <div className="mt-7 flex gap-3">
              <div className="h-14 flex-1 rounded-2xl bg-black/30 ring-1 ring-white/15" />
              <div className="h-14 flex-1 rounded-2xl bg-black/30 ring-1 ring-white/15" />
              <div className="h-14 flex-1 rounded-2xl bg-black/30 ring-1 ring-white/15" />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(100%-2rem)] bg-gradient-to-br from-cyan-950 via-slate-900 to-purple-950 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-32 rounded bg-cyan-300/70" />
              <div className="mt-2 h-2 w-20 rounded bg-white/20" />
            </div>
            <div className="h-8 w-8 rounded-xl bg-cyan-400/20 ring-1 ring-cyan-300/30" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="h-16 rounded-2xl border border-cyan-300/20 bg-cyan-300/10" />
            <div className="h-16 rounded-2xl border border-purple-300/20 bg-purple-300/10" />
            <div className="h-16 rounded-2xl border border-emerald-300/20 bg-emerald-300/10" />
          </div>
          <div className="mt-3 h-10 rounded-2xl border border-white/10 bg-black/25" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}

export default function DashboardProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("active")
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const isRecoverMode = viewMode === "recover"

  async function loadProjects() {
    setLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/projects?includeDeleted=${isRecoverMode ? "true" : "false"}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Could not load projects")
      }

      setProjects(Array.isArray(data.projects) ? data.projects : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  const filteredProjects = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return projects
    return projects.filter((project) =>
      [project.name, project.description, project.template, project.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(clean)
    )
  }, [projects, query])

  function openProject(projectId: string) {
    router.push(`/dashboard/chat?projectId=${encodeURIComponent(projectId)}`)
  }

  function recoverDays(project: Project) {
    if (!project.delete_after) return 7
    return Math.max(Math.ceil((new Date(project.delete_after).getTime() - Date.now()) / 86_400_000), 0)
  }

  async function softDelete(projectId: string) {
    setBusyProjectId(projectId)
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Delete failed")
      await loadProjects()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setBusyProjectId(null)
    }
  }

  async function restoreProject(projectId: string) {
    setBusyProjectId(projectId)
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Recover failed")
      setViewMode("active")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Recover failed")
    } finally {
      setBusyProjectId(null)
    }
  }

  async function deleteForever(project: Project) {
    if (!window.confirm(`Delete "${project.name || "AI Project"}" forever?`)) return
    setBusyProjectId(project.id)
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}?permanent=true`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Delete forever failed")
      await loadProjects()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Delete forever failed")
    } finally {
      setBusyProjectId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#070711] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your private projects only
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              {isRecoverMode ? "Recover Projects" : "My Projects"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              {isRecoverMode
                ? "Recover an important project or permanently remove an old test project."
                : "All projects created by your 786.Chat workspace are saved here and remain private to your login."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(isRecoverMode ? "active" : "recover")}
              className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRecoverMode ? "My Projects" : "Recover Projects"}
            </Button>
            <Link href="/dashboard/chat?newProject=1">
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isRecoverMode ? "Search deleted projects..." : "Search projects..."}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-cyan-400/40"
            />
          </div>
          <span className="hidden text-xs text-white/35 sm:block">{filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}</span>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/45">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-cyan-300" />
            <h2 className="mt-4 text-xl font-bold">{isRecoverMode ? "No deleted projects" : "No projects yet"}</h2>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const projectName = project.name || "AI Project"
              const daysLeft = recoverDays(project)

              return (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-white/[0.055]"
                >
                  <button
                    type="button"
                    onClick={() => !isRecoverMode && openProject(project.id)}
                    className="block w-full text-left"
                    disabled={isRecoverMode}
                    title={isRecoverMode ? "Recover this project first" : "Open project"}
                  >
                    <ProjectThumbnail project={project} />
                  </button>

                  <div className="px-1 pb-1 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black">{projectName}</h3>
                        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-6 text-white/45">
                          {isRecoverMode
                            ? `Recover within ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
                            : project.description || `Real file-based project with ${project.fileCount || 0} saved files.`}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] capitalize text-white/45">
                        {isRecoverMode ? "recoverable" : project.status || "active"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/45">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="flex items-center gap-2"><Code className="h-3.5 w-3.5" /> Files</span>
                        <strong className="mt-2 block text-white/80">{project.fileCount || 0}</strong>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Updated</span>
                        <strong className="mt-2 block text-white/80">{project.updated_at ? new Date(project.updated_at).toLocaleDateString("en-GB") : "-"}</strong>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="flex items-center gap-2 text-[11px] text-white/30">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "Created"}
                      </span>

                      <div className="flex items-center gap-2">
                        {isRecoverMode ? (
                          <>
                            <button
                              type="button"
                              onClick={() => deleteForever(project)}
                              disabled={busyProjectId === project.id}
                              className="grid h-9 w-9 place-items-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                              title="Delete forever"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => restoreProject(project.id)}
                              disabled={busyProjectId === project.id}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-cyan-400 px-4 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-40"
                            >
                              Recover <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => softDelete(project.id)}
                              disabled={busyProjectId === project.id}
                              className="grid h-9 w-9 place-items-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openProject(project.id)}
                              className="inline-flex h-9 items-center gap-2 rounded-full bg-cyan-400 px-4 text-xs font-black text-slate-950 hover:bg-cyan-300"
                            >
                              Open Project <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
