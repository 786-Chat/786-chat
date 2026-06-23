"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

  const getRecoverDaysLeft = (project: Project) => {
    if (!project.delete_after) return 7

    const end = new Date(project.delete_after).getTime()
    const now = Date.now()
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

    return Math.max(diff, 0)
  }

 const startNewProject = () => {
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
    window.dispatchEvent(new Event("project-files-changed"))
    window.dispatchEvent(new Event("preview-history-changed"))
  } catch {
    // keep navigation working
  }
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
                ? "Search deleted projects, recover important work, or permanently delete test projects."
                : "All projects created by your MujeebProAI chat are saved here. Each login can only see its own projects."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                  ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRecoverMode ? "My Projects" : "Recover Projects"}
            </Button>

            <Link href="/dashboard/chat?newProject=1" onClick={startNewProject}>
              <Button className="bg-cyan-500 text-black hover:bg-cyan-400">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isRecoverMode ? "Search deleted projects..." : "Search projects..."}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-500/40"
            />
          </div>

          <div className="text-xs text-white/35">
            {filteredProjects.length} {isRecoverMode ? "recoverable" : "project"}
            {filteredProjects.length === 1 ? "" : "s"}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100/80">
            {errorMessage}
          </div>
        )}

        {isRecoverMode && (
          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100/75">
            Deleted projects stay here for 7 days. Use Recover for real projects or Delete Forever to clear test projects permanently.
          </div>
        )}

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/45">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
              <FolderKanban className="h-8 w-8 text-cyan-300" />
            </div>

            <h2 className="text-xl font-bold">
              {isRecoverMode ? "No deleted projects" : "No projects yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              {isRecoverMode
                ? "Deleted projects will appear here for 7 days after deletion."
                : "Start a new project and ask MujeebProAI to create a website, SaaS app, school system, restaurant system, or custom software."}
            </p>

            {!isRecoverMode && (
              <Link href="/dashboard/chat?newProject=1" onClick={startNewProject}>
                <Button className="mt-6 bg-cyan-500 text-black hover:bg-cyan-400">
                  New Project
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const daysLeft = getRecoverDaysLeft(project)
              const projectName = project.name || "AI Project"

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`group rounded-3xl border p-5 shadow-2xl shadow-black/20 transition ${
                    isRecoverMode
                      ? "border-cyan-500/20 bg-cyan-500/[0.045] hover:border-cyan-500/35"
                      : "border-white/10 bg-white/[0.035] hover:border-cyan-500/35 hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                      <FolderKanban className="h-6 w-6 text-cyan-300" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] capitalize ${
                        isRecoverMode
                          ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                          : "border-white/10 bg-black/20 text-white/50"
                      }`}>
                        {isRecoverMode ? "recoverable" : project.status || "active"}
                      </span>

                      {!isRecoverMode && (
                        <button
                          type="button"
                          disabled={busyProjectId === project.id}
                          onClick={() => softDeleteProject(project.id)}
                          className="rounded-full border border-red-500/20 bg-red-500/10 p-2 text-red-300 opacity-80 transition hover:bg-red-500/20 hover:text-red-200 disabled:opacity-40"
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
                          className="rounded-full border border-red-500/25 bg-red-500/10 p-2 text-red-300 opacity-90 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
                          title="Delete Forever"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-bold">
                    {projectName}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-white/42">
                    {isRecoverMode
                      ? `Recover within ${daysLeft} day${daysLeft === 1 ? "" : "s"} before permanent cleanup, or delete forever now.`
                      : project.description ||
                        `Real file-based project with ${project.fileCount || 0} saved file${project.fileCount === 1 ? "" : "s"}.`}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/40">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Code className="h-3.5 w-3.5" />
                        Files
                      </div>
                      <div className="font-semibold text-white/70">{project.fileCount || 0}</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {isRecoverMode ? "Recover" : "Updated"}
                      </div>
                      <div className="font-semibold text-white/70">
                        {isRecoverMode
                          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                          : project.updated_at
                            ? new Date(project.updated_at).toLocaleDateString()
                            : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/30">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString()
                        : "Created"}
                    </span>

                    {isRecoverMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyProjectId === project.id}
                          onClick={() => deleteForeverProject(project.id, projectName)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
                        >
                          Delete Forever
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={busyProjectId === project.id}
                          onClick={() => recoverProject(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-40"
                        >
                          Recover
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/chat?projectId=${encodeURIComponent(project.id)}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                      >
                        Open Chat
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
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
