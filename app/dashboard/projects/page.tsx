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
}

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects", {
          credentials: "include",
          cache: "no-store",
        })

        if (!response.ok) {
          if (!cancelled) setProjects([])
          return
        }

        const data = await response.json()

        if (!cancelled) {
          setProjects(Array.isArray(data.projects) ? data.projects : [])
        }
      } catch {
        if (!cancelled) setProjects([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

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
              My Projects
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">
              All projects created by your MujeebProAI chat are saved here. Each login can only see its own projects.
            </p>
          </div>

          <Link href="/dashboard/chat">
            <Button className="bg-cyan-500 text-black hover:bg-cyan-400">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects..."
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-500/40"
            />
          </div>

          <div className="text-xs text-white/35">
            {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/45">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
              <FolderKanban className="h-8 w-8 text-cyan-300" />
            </div>
            <h2 className="text-xl font-bold">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              Start a new chat and ask MujeebProAI to create a website, SaaS app, school system, restaurant system, or custom software.
            </p>
            <Link href="/dashboard/chat">
              <Button className="mt-6 bg-cyan-500 text-black hover:bg-cyan-400">
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 transition hover:border-cyan-500/35 hover:bg-white/[0.055]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
                    <FolderKanban className="h-6 w-6 text-cyan-300" />
                  </div>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] capitalize text-white/50">
                    {project.status || "active"}
                  </span>
                </div>

                <h3 className="mt-5 line-clamp-2 text-lg font-bold">
                  {project.name || "AI Project"}
                </h3>

                <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-white/42">
                  {project.description ||
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
                      Updated
                    </div>
                    <div className="font-semibold text-white/70">
                      {project.updated_at
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

                  <Link
                    href="/dashboard/chat"
                    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    Open Chat
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
