"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Copy,
  FolderKanban,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { AdminProjectListItem, AdminProjectWithData } from "@/lib/786-admin/types"
import { PremiumAdminBackground } from "@/components/786-admin/premium-background"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function previewUrl(project: AdminProjectListItem) {
  const value = project.preview_state?.preview_url
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : ""
}

function relativeDate(value: string) {
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return "Recently"
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? "" : "s"} ago`
}

export default function SevenEightSixProjectsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [projects, setProjects] = useState<AdminProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState("")
  const [duplicating, setDuplicating] = useState("")
  const [renaming, setRenaming] = useState("")
  const [renameValue, setRenameValue] = useState("")
  const [savingRename, setSavingRename] = useState(false)
  const [openMenu, setOpenMenu] = useState("")

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
    ;(async () => {
      try {
        const response = await fetch("/api/786-admin/projects", { cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data?.error || "Could not load projects")
        if (!cancelled) setProjects(Array.isArray(data.projects) ? data.projects : [])
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load projects")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isAdmin])

  function openProject(id: string) {
    try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id) } catch {}
    router.push("/786-admin/chat")
  }

  function startNewProject() {
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
    router.push("/786-admin/chat")
  }

  function beginRename(project: AdminProjectListItem) {
    setRenaming(project.id)
    setRenameValue(project.title)
    setOpenMenu("")
    setError("")
  }

  async function saveRename(project: AdminProjectListItem) {
    const title = renameValue.trim()
    if (!title || savingRename) return
    setSavingRename(true)
    setError("")
    try {
      const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(project.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, revision_label: `Before renaming ${project.title}`, revision_source: "rename" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Rename failed")
      setProjects((current) => current.map((item) => item.id === project.id ? { ...item, title, updated_at: new Date().toISOString() } : item))
      setRenaming("")
      setRenameValue("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Rename failed")
    } finally {
      setSavingRename(false)
    }
  }

  async function duplicateProject(project: AdminProjectListItem) {
    if (duplicating) return
    setOpenMenu("")
    setDuplicating(project.id)
    setError("")
    try {
      const detailResponse = await fetch(`/api/786-admin/projects/${encodeURIComponent(project.id)}`, { cache: "no-store" })
      const detailData = await detailResponse.json().catch(() => ({})) as { project?: AdminProjectWithData; error?: string }
      if (!detailResponse.ok || !detailData.project) throw new Error(detailData.error || "Could not read project")
      const source = detailData.project
      const createResponse = await fetch("/api/786-admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${source.title} Copy`,
          description: source.description,
          prompt: source.prompt,
          kind: source.kind,
          preview_state: { ...source.preview_state, preview_url: undefined },
          metadata: { ...source.metadata, duplicated_from: source.id },
          files: source.files,
          messages: source.messages.map(({ role, content, model, reason }) => ({ role, content, model, reason })),
        }),
      })
      const createData = await createResponse.json().catch(() => ({})) as { project?: AdminProjectWithData; error?: string }
      if (!createResponse.ok || !createData.project) throw new Error(createData.error || "Duplicate failed")
      const created = createData.project
      setProjects((current) => [{ ...created, file_count: Object.keys(created.files || {}).length, message_count: created.messages?.length || 0 }, ...current])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Duplicate failed")
    } finally {
      setDuplicating("")
    }
  }

  async function deleteProject(id: string) {
    if (deleting) return
    setOpenMenu("")
    setDeleting(id)
    setError("")
    try {
      const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(id)}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Delete failed")
      setProjects((current) => current.filter((project) => project.id !== id))
      try {
        if (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) === id) localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
      } catch {}
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Delete failed")
    } finally {
      setDeleting("")
    }
  }

  if (isLoading || !isAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white"><Loader2 className="h-7 w-7 animate-spin text-cyan-300" /></main>
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050713] text-white" onClick={() => openMenu && setOpenMenu("")}>
      <PremiumAdminBackground />
      <div className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-[.28em] text-cyan-300/80">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-300 text-slate-950">786</span>
              Project workspace
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Your projects</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Open a saved project to continue the chat, preview and code. Use the menu to rename, duplicate or delete.</p>
          </div>
          <button onClick={startNewProject} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-black shadow-[0_0_28px_rgba(139,92,246,.35)] transition hover:-translate-y-0.5"><Plus className="h-4 w-4" /> New project</button>
        </header>

        {error && <div className="mb-6 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center text-slate-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…</div>
        ) : projects.length ? (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => {
              const livePreview = previewUrl(project)
              const isRenaming = renaming === project.id
              const hue = (index * 67 + 205) % 360
              return (
                <article key={project.id} onClick={() => openProject(project.id)} className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-[#10131d] shadow-[0_24px_70px_rgba(0,0,0,.32)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35">
                  <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-[#080b14]">
                    {livePreview ? (
                      <iframe src={livePreview} title={`${project.title} preview`} className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white" sandbox="allow-scripts" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 72% 22%,hsla(${hue},90%,65%,.48),transparent 34%),linear-gradient(135deg,#070914,#15233c)` }}>
                        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:22px_22px]" />
                        <Sparkles className="absolute right-6 top-6 h-7 w-7 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
                      <h2 className="truncate text-lg font-black text-white">{project.title}</h2>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-300">{project.description || project.prompt || "Saved 786.Chat project"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveRename(project); if (event.key === "Escape") setRenaming("") }} maxLength={160} className="min-w-0 flex-1 rounded-xl border border-cyan-300/25 bg-black/35 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300" />
                          <button onClick={() => void saveRename(project)} disabled={!renameValue.trim() || savingRename} className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-200 disabled:opacity-40">{savingRename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                          <button onClick={() => setRenaming("")} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-slate-300"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <>
                          <h3 className="truncate text-lg font-black">{project.title}</h3>
                          <p className="mt-1 text-xs text-slate-400">{relativeDate(project.updated_at)} · {project.file_count || 0} files</p>
                        </>
                      )}
                    </div>

                    {!isRenaming && (
                      <div className="relative" onClick={(event) => event.stopPropagation()}>
                        <button onClick={() => setOpenMenu((current) => current === project.id ? "" : project.id)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label={`Project menu for ${project.title}`}><MoreVertical className="h-5 w-5" /></button>
                        {openMenu === project.id && (
                          <div className="absolute bottom-12 right-0 z-30 w-40 rounded-2xl border border-white/10 bg-[#090b12] p-2 shadow-2xl">
                            <button onClick={() => beginRename(project)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/10"><Pencil className="h-4 w-4" /> Rename</button>
                            <button onClick={() => void duplicateProject(project)} disabled={duplicating === project.id} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50">{duplicating === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />} Duplicate</button>
                            <button onClick={() => void deleteProject(project.id)} disabled={deleting === project.id} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-300 hover:bg-rose-500/15 disabled:opacity-50">{deleting === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <div className="flex min-h-[460px] items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/[.03] p-8 text-center backdrop-blur-xl">
            <div><FolderKanban className="mx-auto h-12 w-12 text-cyan-300/60" /><h2 className="mt-5 text-2xl font-black">No projects yet</h2><p className="mt-2 text-sm text-slate-400">Create your first project from the admin chat.</p><button onClick={startNewProject} className="mt-5 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950">Open chat</button></div>
          </div>
        )}
      </div>
    </main>
  )
}
