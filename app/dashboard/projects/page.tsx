"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  FolderKanban,
  Plus,
  Search,
  Code,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const CARD_THEMES = [
  {
    shell: "from-cyan-500/20 via-blue-500/10 to-fuchsia-500/20",
    border: "border-cyan-300/25 hover:border-cyan-300/50",
    icon: "from-cyan-400 to-blue-500 text-white shadow-cyan-500/30",
    pill: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    button: "bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25",
  },
  {
    shell: "from-fuchsia-500/20 via-purple-500/10 to-pink-500/20",
    border: "border-fuchsia-300/25 hover:border-fuchsia-300/50",
    icon: "from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-500/30",
    pill: "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100",
    button: "bg-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-400/25",
  },
  {
    shell: "from-amber-500/20 via-orange-500/10 to-red-500/20",
    border: "border-amber-300/25 hover:border-amber-300/50",
    icon: "from-amber-300 to-orange-500 text-black shadow-amber-500/30",
    pill: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    button: "bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
  },
  {
    shell: "from-emerald-500/20 via-teal-500/10 to-cyan-500/20",
    border: "border-emerald-300/25 hover:border-emerald-300/50",
    icon: "from-emerald-300 to-teal-500 text-black shadow-emerald-500/30",
    pill: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    button: "bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
  },
]

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

export default function DashboardProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("active")
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const isRecoverMode = viewMode === "recover"
  const projectCacheKey = `mujeebproai_projects_cache_${isRecoverMode ? "recover" : "active"}`

  const getFriendlyProjectError = (data: any, response?: Response) => {
    const rawMessage = String(data?.message || data?.debug || data?.error || "")

    if (response?.status === 402 || rawMessage.toLowerCase().includes("data transfer quota")) {
      return "Database quota is temporarily exceeded in Neon. Your projects were not deleted. The app will show cached projects if available. Upgrade/reset Neon quota, then refresh."
    }

    return rawMessage || "Could not load projects."
  }

  const readCachedProjects = (): Project[] => {
    try {
      const raw = window.localStorage.getItem(projectCacheKey) || "[]"
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const writeCachedProjects = (nextProjects: Project[]) => {
    try {
      window.localStorage.setItem(projectCacheKey, JSON.stringify(nextProjects))
    } catch {
      // Browser storage may be unavailable. Keep UI working.
    }
  }

  const loadProjects = async () => {
    setLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/projects?includeDeleted=${isRecoverMode ? "true" : "false"}`, {
        credentials: "include",
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const cachedProjects = readCachedProjects()

        if (cachedProjects.length > 0) {
          setProjects(cachedProjects)
        }

        setErrorMessage(getFriendlyProjectError(data, response))
        return
      }

      const nextProjects = Array.isArray(data.projects) ? data.projects : []
      setProjects(nextProjects)
      writeCachedProjects(nextProjects)
    } catch {
      const cachedProjects = readCachedProjects()

      if (cachedProjects.length > 0) {
        setProjects(cachedProjects)
        setErrorMessage("Could not reach the database. Showing cached projects from this browser.")
      } else {
        setErrorMessage("Could not load projects. Your projects were not deleted; the database request failed.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  const filteredProjects = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return projects

    return projects.filter((project) =>
      [project.name, project.description, project.template, project.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery)
    )
  }, [projects, query])

  const totalFiles = projects.reduce((sum, project) => sum + (project.fileCount || 0), 0)

  const getRecoverDaysLeft = (project: Project) => {
    if (!project.delete_after) return 7

    const end = new Date(project.delete_after).getTime()
    const now = Date.now()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

    return Math.max(diff, 0)
  }

  const clearWorkspacePreviewState = () => {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (
          key.startsWith("mujeebproai_last_preview_html") ||
          key.includes("preview_history") ||
          key.includes("_history")
        ) {
          window.localStorage.removeItem(key)
        }
      }
    } catch {
      // keep navigation working
    }
  }

  const startNewProject = () => {
    clearWorkspacePreviewState()

    try {
      window.dispatchEvent(
        new CustomEvent("chat-selected", {
          detail: { chatId: null, projectId: null },
        })
      )
      window.dispatchEvent(
        new CustomEvent("new-chat", {
          detail: { fresh: true },
        })
      )
      window.dispatchEvent(
        new CustomEvent("preview-cleared", {
          detail: { fresh: true },
        })
      )
      window.dispatchEvent(new Event("preview-history-changed"))
    } catch {
      // keep navigation working
    }
  }

  const openProjectChat = (projectId: string) => {
    router.push(`/dashboard/chat?projectId=${encodeURIComponent(projectId)}`)
  }

  const softDeleteProject = async (projectId: string) => {
    setBusyProjectId(projectId)
    setErrorMessage("")

    const previousProjects = projects
    setProjects((current) => current.filter((project) => project.id !== projectId))

    try {
      let response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        response = await fetch(`/api/projects/${projectId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "delete" }),
        })
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setProjects(previousProjects)
        setErrorMessage(data?.debug || data?.error || "Delete failed. Please try again.")
        return
      }

      await loadProjects()
    } catch {
      setProjects(previousProjects)
      setErrorMessage("Delete failed. Please try again.")
    } finally {
      setBusyProjectId(null)
    }
  }

  const recoverProject = async (projectId: string) => {
    setBusyProjectId(projectId)
    setErrorMessage("")

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "restore" }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(data?.debug || data?.error || "Recover failed. Please try again.")
        return
      }

      setViewMode("active")
    } catch {
      setErrorMessage("Recover failed. Please try again.")
    } finally {
      setBusyProjectId(null)
    }
  }

  const deleteForeverProject = async (projectId: string, projectName: string) => {
    const confirmed = window.confirm(
      `Delete "${projectName || "AI Project"}" forever?\n\nThis will permanently remove it from Recover Projects and cannot be undone.`
    )

    if (!confirmed) return

    setBusyProjectId(projectId)
    setErrorMessage("")

    const previousProjects = projects
    setProjects((current) => current.filter((project) => project.id !== projectId))

    try {
      let response = await fetch(`/api/projects/${projectId}?permanent=true`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        response = await fetch(`/api/projects/${projectId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "deleteForever" }),
        })
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setProjects(previousProjects)
        setErrorMessage(data?.debug || data?.error || "Delete forever failed. Please try again.")
        return
      }

      await loadProjects()
    } catch {
      setProjects(previousProjects)
      setErrorMessage("Delete forever failed. Please try again.")
    } finally {
      setBusyProjectId(null)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050510] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(217,70,239,0.22),transparent_30%),linear-gradient(135deg,rgba(59,130,246,0.16),rgba(236,72,153,0.10),rgba(251,191,36,0.12))]" />
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 via-amber-300 to-emerald-300" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-semibold text-white/80 shadow-lg shadow-black/20 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-200" />
                Private AI software builder workspace
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                {isRecoverMode ? "Recover Projects" : "My Projects"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 md:text-base">
                {isRecoverMode
                  ? "Restore important work safely or permanently delete test projects you no longer need."
                  : "A premium command center for every website, app, backend, Python tool, dashboard and full software project created by your AI builder."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 backdrop-blur">
                <div className="text-2xl font-black text-cyan-100">{projects.length}</div>
                <div className="mt-1 text-xs text-cyan-100/65">Saved projects</div>
              </div>
              <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-4 backdrop-blur">
                <div className="text-2xl font-black text-fuchsia-100">{totalFiles}</div>
                <div className="mt-1 text-xs text-fuchsia-100/65">Real code files</div>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 backdrop-blur">
                <div className="text-2xl font-black text-amber-100">AI</div>
                <div className="mt-1 text-xs text-amber-100/65">Builder ready</div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isRecoverMode ? "Search deleted projects..." : "Search websites, apps, dashboards, Python, PHP..."}
                className="h-13 w-full rounded-2xl border border-white/10 bg-black/25 py-4 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 shadow-inner shadow-black/20 backdrop-blur focus:border-cyan-300/45 focus:bg-black/35"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-semibold text-white/55 backdrop-blur">
                {filteredProjects.length} {isRecoverMode ? "recoverable" : "project"}
                {filteredProjects.length === 1 ? "" : "s"}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery("")
                  setErrorMessage("")
                  setViewMode(isRecoverMode ? "active" : "recover")
                }}
                className={
                  isRecoverMode
                    ? "h-11 rounded-full border-cyan-300/25 bg-cyan-400/10 px-5 text-cyan-100 hover:bg-cyan-400/20"
                    : "h-11 rounded-full border-white/10 bg-white/[0.06] px-5 text-white/75 hover:bg-white/[0.12] hover:text-white"
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isRecoverMode ? "My Projects" : "Recover Projects"}
              </Button>

              <Link href="/dashboard/chat?newProject=1" onClick={startNewProject}>
                <Button className="h-11 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 px-6 font-black text-black shadow-lg shadow-fuchsia-500/20 hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100/85 shadow-lg shadow-red-950/20 backdrop-blur">
            {errorMessage}
          </div>
        )}

        {isRecoverMode && (
          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-50/80 backdrop-blur">
            Deleted projects stay here for 7 days. Use Recover for real projects or Delete Forever to clear test projects permanently.
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-white/55 shadow-2xl shadow-black/20 backdrop-blur">
            Loading premium project dashboard...
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-12 text-center shadow-2xl shadow-black/20 backdrop-blur"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 via-fuchsia-300 to-amber-200 shadow-2xl shadow-fuchsia-500/20">
              <FolderKanban className="h-9 w-9 text-black" />
            </div>

            <h2 className="text-2xl font-black">
              {isRecoverMode ? "No deleted projects" : "No projects yet"}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55">
              {isRecoverMode
                ? "Deleted projects will appear here for 7 days after deletion."
                : "Start a new project and ask the AI to create a website, SaaS app, school system, restaurant system, booking software, PHP backend or Python tool."}
            </p>

            {!isRecoverMode && (
              <Link href="/dashboard/chat?newProject=1" onClick={startNewProject}>
                <Button className="mt-7 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 px-7 font-black text-black hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const daysLeft = getRecoverDaysLeft(project)
              const projectName = project.name || "AI Project"
              const theme = CARD_THEMES[index % CARD_THEMES.length]

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 22, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -8, scale: 1.015 }}
                  transition={{ delay: index * 0.045, duration: 0.28 }}
                  className={`group relative overflow-hidden rounded-[2rem] border ${isRecoverMode ? "border-cyan-300/25" : theme.border} bg-gradient-to-br ${isRecoverMode ? "from-cyan-500/15 via-blue-500/10 to-slate-500/10" : theme.shell} p-[1px] shadow-2xl shadow-black/25`}
                >
                  <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute -bottom-20 left-6 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
                  </div>

                  <div className="relative h-full rounded-[calc(2rem-1px)] bg-[#080814]/88 p-5 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${isRecoverMode ? "from-cyan-300 to-blue-500 text-black shadow-cyan-500/25" : theme.icon} shadow-xl`}>
                        <FolderKanban className="h-7 w-7" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold capitalize ${isRecoverMode ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : theme.pill}`}>
                          {isRecoverMode ? "recoverable" : project.status || "active"}
                        </span>

                        {!isRecoverMode && (
                          <button
                            type="button"
                            disabled={busyProjectId === project.id}
                            onClick={() => softDeleteProject(project.id)}
                            className="rounded-full border border-red-400/25 bg-red-500/10 p-2 text-red-200 opacity-80 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
                            title="Move to Recover Projects"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {isRecoverMode && (
                          <button
                            type="button"
                            disabled={busyProjectId === project.id}
                            onClick={() => deleteForeverProject(project.id, projectName)}
                            className="rounded-full border border-red-400/25 bg-red-500/10 p-2 text-red-200 opacity-90 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
                            title="Delete Forever"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-6 line-clamp-2 text-xl font-black tracking-tight text-white">
                      {projectName}
                    </h3>

                    <p className="mt-3 line-clamp-2 min-h-[44px] text-sm leading-6 text-white/52">
                      {isRecoverMode
                        ? `Recover within ${daysLeft} day${daysLeft === 1 ? "" : "s"} before permanent cleanup, or delete forever now.`
                        : project.description ||
                          `Real file-based project with ${project.fileCount || 0} saved file${project.fileCount === 1 ? "" : "s"}.`}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/48">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition group-hover:bg-white/[0.07]">
                        <div className="mb-2 flex items-center gap-1.5">
                          <Code className="h-3.5 w-3.5" />
                          Files
                        </div>
                        <div className="text-lg font-black text-white">{project.fileCount || 0}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition group-hover:bg-white/[0.07]">
                        <div className="mb-2 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {isRecoverMode ? "Recover" : "Updated"}
                        </div>
                        <div className="text-lg font-black text-white">
                          {isRecoverMode
                            ? `${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                            : project.updated_at
                              ? new Date(project.updated_at).toLocaleDateString()
                              : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-white/35">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.created_at
                          ? new Date(project.created_at).toLocaleDateString()
                          : "Created"}
                      </span>

                      {isRecoverMode ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={busyProjectId === project.id}
                            onClick={() => deleteForeverProject(project.id, projectName)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
                          >
                            Delete Forever
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={busyProjectId === project.id}
                            onClick={() => recoverProject(project.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-40"
                          >
                            Recover
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openProjectChat(project.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition ${theme.button}`}
                        >
                          Open Chat
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
