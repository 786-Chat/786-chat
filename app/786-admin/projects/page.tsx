"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { FolderKanban, Plus, ShieldCheck, Store } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { AdminProjectListItem } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

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
          setProjects(Array.isArray(json.projects) ? json.projects : [])
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
    setProjects((current) => current.filter((project) => project.id !== projectId))
    setError(null)

    try {
      const res = await fetch(`/api/786-admin/projects/${projectId}`, { method: "DELETE" })
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
              Loading projects from Neon...
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-[2rem] border border-cyan-300/20 bg-[#101827] p-6 shadow-[0_0_55px_rgba(0,0,0,0.22)]"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                    <FolderKanban className="h-7 w-7" />
                  </div>

                  <h2 className="text-2xl font-black text-white">{project.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {project.description || "No description."}
                  </p>

                  <div className="mt-5 space-y-1 text-xs font-bold text-cyan-200">
                    <p>{project.file_count} real files saved</p>
                    <p>{project.message_count} chat messages saved</p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => openProject(project.id)}
                      className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950"
                    >
                      Open in chat
                    </button>

                    <button
                      onClick={() => deleteProject(project.id)}
                      className="rounded-xl border border-red-300/25 bg-red-500/10 px-5 py-2.5 text-sm font-black text-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
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
