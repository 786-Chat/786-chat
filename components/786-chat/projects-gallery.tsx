"use client"

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Copy,
  FileCode2,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { deleteBuilderProject, listBuilderProjects, loadBuilderBuild, queueBuilderBuild } from "./api"
import { duplicateBuilderProject } from "./duplicate-project"
import type { BuilderBuild, BuilderProjectSummary } from "./contracts"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"

type BuildMap = Record<string, BuilderBuild | null>

function formatDateTime(value?: string) {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function buildLabel(build: BuilderBuild | null | undefined) {
  if (!build) return { label: "Not built", classes: "border-slate-600/60 bg-slate-900/60 text-slate-300" }
  if (build.status === "passed") return { label: "Preview ready", classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" }
  if (build.status === "failed") return { label: "Build failed", classes: "border-rose-400/30 bg-rose-400/10 text-rose-200" }
  if (build.status === "running") return { label: "Building", classes: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" }
  if (build.status === "queued") return { label: "Queued", classes: "border-amber-400/30 bg-amber-400/10 text-amber-200" }
  return { label: "Cancelled", classes: "border-slate-600/60 bg-slate-900/60 text-slate-300" }
}

function ProjectVisual({ project, build, index }: { project: BuilderProjectSummary; build?: BuilderBuild | null; index: number }) {
  if (build?.status === "passed" && build.deployment_url) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white">
        <iframe
          src={build.deployment_url}
          title={`${project.title} project preview`}
          loading="lazy"
          sandbox="allow-scripts allow-forms allow-same-origin"
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
          style={{ width: "400%", height: "400%", transform: "scale(.25)", transformOrigin: "top left" }}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      </div>
    )
  }

  const visual = [
    "from-violet-700/90 via-indigo-800/90 to-slate-950",
    "from-cyan-700/80 via-blue-900/90 to-slate-950",
    "from-fuchsia-700/75 via-violet-900/90 to-slate-950",
    "from-emerald-700/70 via-cyan-900/90 to-slate-950",
  ][index % 4]

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${visual}`}>
      <div className="absolute -left-10 top-3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-6 bottom-0 h-36 w-36 rounded-full bg-cyan-300/10 blur-2xl" />
      <div className="relative w-[82%] rounded-xl border border-white/15 bg-slate-950/35 p-4 shadow-2xl backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
        </div>
        <div className="h-2.5 w-2/3 rounded-full bg-white/35" />
        <div className="mt-2 h-2 w-5/6 rounded-full bg-white/15" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <span className="h-12 rounded-lg bg-white/10" />
          <span className="h-12 rounded-lg bg-white/10" />
          <span className="h-12 rounded-lg bg-white/10" />
        </div>
        <p className="mt-4 truncate text-center text-xs font-black tracking-wide text-white/90">{project.title}</p>
      </div>
    </div>
  )
}

export function ProjectsGallery() {
  const router = useRouter()
  const [projects, setProjects] = useState<BuilderProjectSummary[]>([])
  const [builds, setBuilds] = useState<BuildMap>({})
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [duplicatingProjectId, setDuplicatingProjectId] = useState<string | null>(null)
  const [projectToDuplicate, setProjectToDuplicate] = useState<BuilderProjectSummary | null>(null)
  const [duplicateName, setDuplicateName] = useState("")
  const [projectToDelete, setProjectToDelete] = useState<BuilderProjectSummary | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const saved = await listBuilderProjects()
        if (cancelled) return
        setProjects(saved)

        const entries = await Promise.all(saved.map(async (project) => {
          try {
            return [project.id, await loadBuilderBuild(project.id)] as const
          } catch {
            return [project.id, null] as const
          }
        }))
        if (!cancelled) setBuilds(Object.fromEntries(entries))
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Projects could not be loaded.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return projects
    return projects.filter((project) =>
      project.title.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term),
    )
  }, [projects, query])

  function openProject(projectId: string) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
    router.push("/786.chat")
  }

  function startNewProject() {
    localStorage.removeItem(ACTIVE_PROJECT_KEY)
    router.push("/786.chat")
  }

  function prepareDuplicate(project: BuilderProjectSummary) {
    if (duplicatingProjectId) return
    setProjectToDuplicate(project)
    setDuplicateName(`${project.title} Copy`)
    setError("")
    setNotice("")
  }

  async function watchDuplicatedBuild(projectId: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 2000))
      try {
        const latest = await loadBuilderBuild(projectId)
        setBuilds((current) => ({ ...current, [projectId]: latest }))
        if (!latest || !["queued", "running"].includes(latest.status)) return
      } catch {
        return
      }
    }
  }

  async function duplicateProject(project: BuilderProjectSummary, title: string) {
    if (duplicatingProjectId) return
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError("Enter a name for the duplicated project.")
      return
    }

    setDuplicatingProjectId(project.id)
    setError("")
    setNotice("")

    try {
      const duplicated = await duplicateBuilderProject(project.id, cleanTitle)
      const saved = await listBuilderProjects()
      setProjects(saved)
      setBuilds((current) => ({ ...current, [duplicated.projectId]: null }))
      setNotice(`${duplicated.title} created as a separate project.`)
      setProjectToDuplicate(null)
      setDuplicateName("")

      try {
        const build = await queueBuilderBuild(duplicated.projectId)
        setBuilds((current) => ({ ...current, [duplicated.projectId]: build }))
        if (["queued", "running"].includes(build.status)) {
          void watchDuplicatedBuild(duplicated.projectId)
        }
      } catch (buildError) {
        setError(`Duplicate created, but its first build could not start: ${buildError instanceof Error ? buildError.message : "Build failed to start."}`)
      }
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : "Project could not be duplicated.")
    } finally {
      setDuplicatingProjectId(null)
    }
  }

  async function confirmDelete() {
    if (!projectToDelete || deleting) return
    setDeleting(true)
    setError("")
    try {
      await deleteBuilderProject(projectToDelete.id)
      setProjects((current) => current.filter((item) => item.id !== projectToDelete.id))
      setBuilds((current) => {
        const next = { ...current }
        delete next[projectToDelete.id]
        return next
      })
      if (localStorage.getItem(ACTIVE_PROJECT_KEY) === projectToDelete.id) {
        localStorage.removeItem(ACTIVE_PROJECT_KEY)
      }
      setProjectToDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Project could not be deleted.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.22),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(6,182,212,.12),transparent_28%),linear-gradient(180deg,#060914_0%,#090d19_45%,#050812_100%)]" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1680px] px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        <header className="sticky top-0 z-30 -mx-2 mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#070b16]/85 px-4 py-3 shadow-2xl backdrop-blur-xl sm:flex-nowrap">
          <button
            type="button"
            onClick={() => router.push("/786.chat")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-sm font-bold text-slate-200 transition hover:bg-white/[.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>

          <div className="min-w-0 flex-1 sm:ml-2">
            <p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">786.Chat</p>
            <h1 className="truncate text-xl font-black sm:text-2xl">Projects</h1>
          </div>

          <button
            type="button"
            onClick={startNewProject}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-black shadow-[0_0_30px_rgba(124,58,237,.28)] transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        </header>

        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">All projects</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Open any project to continue in the 786.Chat workspace. Cards show the latest verified preview when one is available.
            </p>
          </div>

          <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-slate-300 md:w-[320px]">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">{notice}</div>
        )}

        {loading ? (
          <div className="grid min-h-[46vh] place-items-center rounded-3xl border border-white/10 bg-white/[.025]">
            <span className="inline-flex items-center gap-3 text-sm font-bold text-slate-300"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" />Loading projects…</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="grid min-h-[44vh] place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[.02] p-8 text-center">
            <div>
              <FolderOpen className="mx-auto h-10 w-10 text-violet-300" />
              <h3 className="mt-4 text-lg font-black">{projects.length ? "No matching projects" : "No saved projects yet"}</h3>
              <p className="mt-2 text-sm text-slate-400">{projects.length ? "Try a different project name." : "Create a new project and it will appear here."}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProjects.map((saved, index) => {
              const build = builds[saved.id]
              const status = buildLabel(build)
              const duplicating = duplicatingProjectId === saved.id
              return (
                <article key={saved.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220] shadow-[0_20px_55px_rgba(0,0,0,.28)] transition hover:-translate-y-1 hover:border-violet-300/35 hover:shadow-[0_28px_75px_rgba(37,20,80,.34)]">
                  <button
                    type="button"
                    onClick={() => openProject(saved.id)}
                    className="block w-full text-left"
                    aria-label={`Open ${saved.title}`}
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden border-b border-white/10 bg-[#080d18]">
                      <ProjectVisual project={saved} build={build} index={index} />
                    </div>
                  </button>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => openProject(saved.id)} className="min-w-0 flex-1 text-left">
                        <h3 className="truncate text-base font-black text-white">{saved.title}</h3>
                        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">{saved.description || "No description"}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(saved)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-400/15 bg-rose-400/[.06] text-slate-400 transition hover:border-rose-300/35 hover:bg-rose-400/15 hover:text-rose-200"
                        aria-label={`Delete ${saved.title}`}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${status.classes}`}>{status.label}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[11px] font-bold text-slate-300"><FileCode2 className="h-3 w-3" />{saved.file_count} files</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1 text-[11px] font-bold text-slate-300"><MessageSquare className="h-3 w-3" />{saved.message_count}</span>
                      <button
                        type="button"
                        onClick={() => prepareDuplicate(saved)}
                        disabled={Boolean(duplicatingProjectId)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-[11px] font-black text-violet-100 transition hover:border-violet-200/45 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Duplicate ${saved.title}`}
                        title="Duplicate project"
                      >
                        {duplicating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
                        {duplicating ? "Duplicating…" : "Duplicate"}
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-[12px] text-slate-500">
                      <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-cyan-300" /><span className="font-semibold text-slate-400">Updated</span><span className="ml-auto text-right">{formatDateTime(saved.updated_at)}</span></p>
                      <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-violet-300" /><span className="font-semibold text-slate-400">Created</span><span className="ml-auto text-right">{formatDateTime(saved.created_at)}</span></p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {projectToDuplicate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4 backdrop-blur-md">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="projects-duplicate-title"
            className="w-full max-w-md rounded-3xl border border-violet-300/25 bg-[#0b1020] p-6 shadow-[0_35px_110px_rgba(0,0,0,.75)]"
            onSubmit={(event) => {
              event.preventDefault()
              void duplicateProject(projectToDuplicate, duplicateName)
            }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-100"><Copy className="h-5 w-5" /></span>
            <h2 id="projects-duplicate-title" className="mt-5 text-xl font-black">Duplicate project</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Create a separate copy of <strong className="text-slate-200">{projectToDuplicate.title}</strong>. You can choose the new business/project name now.</p>
            <label className="mt-5 block text-sm font-bold text-slate-300">
              New project name
              <input
                autoFocus
                value={duplicateName}
                onChange={(event) => setDuplicateName(event.target.value)}
                maxLength={120}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-violet-300/50 focus:ring-2 focus:ring-violet-400/15"
                placeholder="e.g. Super Business Mujeeb"
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">The original project is not changed. This step copies the project source only; customer database isolation is handled separately.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setProjectToDuplicate(null); setDuplicateName("") }} disabled={Boolean(duplicatingProjectId)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={Boolean(duplicatingProjectId) || !duplicateName.trim()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50">
                {duplicatingProjectId && <Loader2 className="h-4 w-4 animate-spin" />}
                {duplicatingProjectId ? "Creating…" : "Create duplicate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4 backdrop-blur-md">
          <section role="dialog" aria-modal="true" aria-labelledby="projects-delete-title" className="w-full max-w-md rounded-3xl border border-rose-400/25 bg-[#0b1020] p-6 shadow-[0_35px_110px_rgba(0,0,0,.75)]">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-200"><Trash2 className="h-5 w-5" /></span>
            <h2 id="projects-delete-title" className="mt-5 text-xl font-black">Delete {projectToDelete.title}?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">This permanently deletes this project and its saved project data. Other projects are not affected.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setProjectToDelete(null)} disabled={deleting} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void confirmDelete()} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-500 disabled:opacity-50">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Deleting…" : "Delete project"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
