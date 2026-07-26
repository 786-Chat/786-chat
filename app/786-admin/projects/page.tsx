"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Copy,
  ExternalLink,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Store,
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
  if (!Number.isFinite(time)) return ""
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
  if (days === 0) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
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

  function beginRename(project: AdminProjectListItem) {
    setRenaming(project.id)
    setRenameValue(project.title)
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
    if (!window.confirm("Delete this project?")) return
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
    <main className="relative min-h-screen overflow-hidden bg-[#050713] text-white">
      <PremiumAdminBackground />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/25 p-5 backdrop-blur-2xl lg:flex lg:flex-col">
          <button onClick={() => router.push("/786-admin/chat")} className="mb-8 grid h-14 w-14 place-items-center rounded-[20px] bg-gradient-to-br from-cyan-200 via-violet-300 to-fuchsia-300 text-lg font-black text-slate-950 shadow-[0_0_36px_rgba(139,92,246,.35)]">786</button>
          <nav className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-sm font-bold text-cyan-100"><FolderKanban className="h-5 w-5" /> Projects</button>
            <button onClick={() => router.push("/786-admin/marketplace")} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[.08]"><Store className="h-5 w-5" /> Marketplace</button>
          </nav>
        </aside>

        <section className="px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[.28em] text-cyan-300/80">786 Chat AI</p>
              <h1 className="text-4xl font-black tracking-tight">Projects</h1>
              <p className="mt-2 text-sm text-slate-400">Open, rename, duplicate or remove your saved projects.</p>
            </div>
            <button onClick={() => { try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}; router.push("/786-admin/chat") }} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-black shadow-[0_0_28px_rgba(139,92,246,.35)]"><Plus className="h-4 w-4" /> New project</button>
          </div>

          {error && <div className="mb-5 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center text-slate-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…</div>
          ) : projects.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const livePreview = previewUrl(project)
                const isRenaming = renaming === project.id
                return (
                  <article key={project.id} className="group overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#11182b]/95 via-[#0d1424]/95 to-[#15102a]/95 shadow-[0_24px_70px_rgba(0,0,0,.32)] transition hover:-translate-y-1 hover:border-cyan-300/35">
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#080b14]">
                      {livePreview ? (
                        <iframe src={livePreview} title={`${project.title} preview`} className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white" sandbox="allow-scripts allow-same-origin" />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,.35),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,.35),transparent_30%),linear-gradient(135deg,#0b1220,#17102d)]">
                          <div className="absolute left-6 top-6 flex items-center gap-2 text-xs font-black tracking-[.2em] text-cyan-200/80"><Sparkles className="h-4 w-4" /> 786 CHAT AI</div>
                          <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl"><div className="mb-3 h-2 w-2/3 rounded-full bg-cyan-300/70" /><div className="mb-2 h-2 w-full rounded-full bg-white/20" /><div className="h-2 w-4/5 rounded-full bg-white/10" /></div>
                          <ImageIcon className="absolute right-7 top-7 h-8 w-8 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-transparent to-transparent" />
                      <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/80 backdrop-blur-md">{project.kind || "Project"}</span>
                    </div>

                    <div className="p-5">
                      {isRenaming ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveRename(project); if (event.key === "Escape") setRenaming("") }} maxLength={160} className="min-w-0 flex-1 rounded-xl border border-cyan-300/25 bg-black/35 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300" />
                          <button onClick={() => void saveRename(project)} disabled={!renameValue.trim() || savingRename} className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-200 disabled:opacity-40" title="Save name">{savingRename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                          <button onClick={() => setRenaming("")} className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300" title="Cancel"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2"><h2 className="line-clamp-1 min-w-0 flex-1 text-xl font-black">{project.title}</h2><button onClick={() => beginRename(project)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" title="Rename project"><Pencil className="h-4 w-4" /></button></div>
                      )}
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">{project.description || project.prompt || "786 Chat AI project"}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300"><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1">{project.file_count} files</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1">{project.message_count} messages</span><span className="px-1 py-1 text-slate-500">Updated {relativeDate(project.updated_at)}</span></div>

                      <div className="mt-5 flex items-center gap-2">
                        <button onClick={() => openProject(project.id)} className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-100" title="Open project"><ExternalLink className="h-4 w-4" /> Open</button>
                        <button onClick={() => void duplicateProject(project)} disabled={duplicating === project.id} className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50" title="Duplicate project">{duplicating === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}</button>
                        <button onClick={() => void deleteProject(project.id)} disabled={deleting === project.id} className="grid h-11 w-11 place-items-center rounded-xl border border-red-300/25 bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:opacity-50" title="Delete project" aria-label={`Delete ${project.title}`}>{deleting === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-[440px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[.03] p-8 text-center backdrop-blur-xl"><div><FolderKanban className="mx-auto h-12 w-12 text-cyan-300/60" /><h2 className="mt-5 text-2xl font-black">No projects yet</h2><p className="mt-2 text-sm text-slate-400">Create your first project from the admin chat.</p><button onClick={() => router.push("/786-admin/chat")} className="mt-5 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950">Open chat</button></div></div>
          )}
        </section>
      </div>
    </main>
  )
}
