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

  const isRecoverMode = viewMode === "recover"

  const loadProjects = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/projects?includeDeleted=${isRecoverMode ? "true" : "false"}`, {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        setProjects([])
        return
      }

      const data = await response.json()
      setProjects(Array.isArray(data.projects) ? data.projects : [])
    } catch {
      setProjects([])
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
      window.localStorage.removeItem("mujeebproai_last_preview_html")
      window.dispatchEvent(new CustomEvent("new-chat"))
    } catch {
      // Keep navigation working even if storage is unavailable.
    }
  }

  const softDeleteProject = async (projectId: string) => {
    setBusyProjectId(projectId)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        await loadProjects()
      }
    } finally {
      setBusyProjectId(null)
    }
  }

  const recoverProject = async (projectId: string) => {
    setBusyProjectId(projectId)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "restore" }),
      })

      if (response.ok) {
        setViewMode("active")
      }
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
                ? "Search deleted projects and recover them within 7 days."
                : "All projects created by your MujeebProAI chat are saved here. Each login can only see its own projects."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("")
                setViewMode(isRecoverMode ? "active" : "recover")
              }}
              className={
                isRecoverMode
                  ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Recover Projects
            </Button>

            <Link href="/dashboard/chat" onClick={startNewProject}>
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

        {isRecoverMode && (
          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100/75">
            Deleted projects stay here for 7 days. Select a project and click Recover to move it back to My Projects.
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
              <Link href="/dashboard/chat" onClick={startNewProject}>
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
                    </div>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-bold">
                    {project.name || "AI Project"}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-white/42">
                    {isRecoverMode
                      ? `Recover within ${daysLeft} day${daysLeft === 1 ? "" : "s"} before permanent cleanup.`
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
                      <button
                        type="button"
                        disabled={busyProjectId === project.id}
                        onClick={() => recoverProject(project.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-40"
                      >
                        Recover
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/chat"
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
