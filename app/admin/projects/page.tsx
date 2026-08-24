"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  Clock3,
  Eye,
  FileCode2,
  FolderKanban,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Signal = { label: string; severity: "review" | "high" }

type ProjectItem = {
  id: string
  source: "builder" | "legacy"
  name: string
  description: string
  owner_email: string
  user_id: string | null
  customer_name: string | null
  account_status: string | null
  email_verified: boolean | null
  status: string
  template: string
  file_count: number
  message_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  signals: Signal[]
}

type ProjectStats = {
  total_projects: number
  customers: number
  review_suggested: number
  updated_24h: number
}

type DetailResponse = {
  source: "builder" | "legacy"
  project: Record<string, unknown>
  signals: Signal[]
  messages: Array<Record<string, unknown>>
  revisions: Array<Record<string, unknown>>
  generations: Array<Record<string, unknown>>
  builds: Array<Record<string, unknown>>
  activity?: Array<Record<string, unknown>>
}

function formatDate(value: unknown) {
  if (!value) return "—"
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
}

function accountBadge(status: string | null) {
  if (status === "active") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
  if (status === "pending") return "border-amber-400/20 bg-amber-400/10 text-amber-200"
  if (status === "suspended" || status === "rejected") return "border-rose-400/20 bg-rose-400/10 text-rose-200"
  return "border-white/10 bg-white/5 text-slate-300"
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [reviewOnly, setReviewOnly] = useState(false)
  const [selected, setSelected] = useState<DetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function loadProjects() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/projects", { credentials: "include", cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load projects")
      setProjects(data.projects || [])
      setStats(data.stats || null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return projects.filter((project) => {
      if (reviewOnly && project.signals.length === 0) return false
      if (!needle) return true
      return [project.name, project.description, project.owner_email, project.customer_name, project.template]
        .some((value) => String(value || "").toLowerCase().includes(needle))
    })
  }, [projects, query, reviewOnly])

  async function reviewProject(project: ProjectItem) {
    setDetailLoading(true)
    setSelected(null)
    try {
      const response = await fetch(`/api/admin/projects?id=${encodeURIComponent(project.id)}&source=${encodeURIComponent(project.source)}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load project review")
      setSelected(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load project review")
    } finally {
      setDetailLoading(false)
    }
  }

  async function suspendCustomer() {
    const userId = String(selected?.project.user_id || "")
    if (!userId) return
    if (!window.confirm("Suspend this customer account? They will be blocked from signing in until you reactivate them.")) return
    setActionLoading(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action: "suspend" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to suspend customer")
      setSelected((current) => current ? { ...current, project: { ...current.project, account_status: "suspended" } } : current)
      await loadProjects()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to suspend customer")
    } finally {
      setActionLoading(false)
    }
  }

  const metricCards = [
    { label: "All projects", value: stats?.total_projects || 0, icon: FolderKanban, tone: "text-cyan-200" },
    { label: "Customers", value: stats?.customers || 0, icon: UserRound, tone: "text-violet-200" },
    { label: "Review suggested", value: stats?.review_suggested || 0, icon: ShieldAlert, tone: "text-amber-200" },
    { label: "Updated in 24h", value: stats?.updated_24h || 0, icon: Clock3, tone: "text-emerald-200" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-xs font-semibold text-cyan-200">
            <ShieldAlert className="h-3.5 w-3.5" /> Owner review centre
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Customer Projects</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Review projects across 786.Chat, inspect recent prompts and project activity, and suspend an account when manual review confirms abuse.
          </p>
        </div>
        <Button onClick={loadProjects} disabled={loading} variant="outline" className="border-white/10 bg-white/[.03]">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, customer, email or type…" className="h-11 border-white/10 bg-black/20 pl-10" />
          </div>
          <button
            type="button"
            onClick={() => setReviewOnly((value) => !value)}
            className={`h-11 rounded-xl border px-4 text-sm font-semibold transition ${reviewOnly ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/[.03] text-slate-300 hover:bg-white/[.07]"}`}
          >
            <AlertTriangle className="mr-2 inline h-4 w-4" /> Review suggested only
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Review signals are only indicators based on recent customer text. They do not automatically label a customer as abusive or suspend anyone.
        </p>
      </div>

      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
        <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(210px,1.2fr)_120px_130px_150px_110px] gap-4 border-b border-white/10 bg-white/[.025] px-5 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-600 xl:grid">
          <span>Project</span><span>Customer</span><span>Activity</span><span>Account</span><span>Updated</span><span>Review</span>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /> Loading customer projects…</div>
        ) : filtered.length === 0 ? (
          <div className="min-h-48 p-10 text-center text-sm text-slate-500">No projects match this view.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((project) => (
              <div key={`${project.source}-${project.id}`} className="grid gap-4 px-5 py-5 transition hover:bg-white/[.025] xl:grid-cols-[minmax(220px,1.5fr)_minmax(210px,1.2fr)_120px_130px_150px_110px] xl:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-white">{project.name || "AI Project"}</p>
                    <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">{project.source === "builder" ? "786.Chat" : "Legacy"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{project.description || project.template || "No description"}</p>
                  {project.signals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.signals.map((signal) => <span key={signal.label} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100">{signal.label}</span>)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{project.customer_name || "Customer"}</p>
                  <p className="truncate text-xs text-slate-500">{project.owner_email}</p>
                </div>

                <div className="flex gap-3 text-xs text-slate-400 xl:block">
                  <span className="inline-flex items-center gap-1"><FileCode2 className="h-3.5 w-3.5" /> {project.file_count}</span>
                  <span className="inline-flex items-center gap-1 xl:ml-0 xl:mt-1"><MessageSquare className="h-3.5 w-3.5" /> {project.message_count}</span>
                </div>

                <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${accountBadge(project.account_status)}`}>{project.account_status || "unknown"}</span></div>
                <div className="text-xs text-slate-500">{formatDate(project.updated_at || project.created_at)}</div>
                <Button size="sm" onClick={() => reviewProject(project)} className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white xl:w-auto"><Eye className="mr-1.5 h-3.5 w-3.5" /> Review</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(detailLoading || selected) && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#070b18] shadow-2xl sm:rounded-[28px]">
            {detailLoading ? (
              <div className="flex min-h-72 items-center justify-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin text-cyan-300" /> Loading project activity…</div>
            ) : selected ? (
              <>
                <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-white/10 bg-[#070b18]/95 p-5 backdrop-blur-xl sm:p-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">Project review</p>
                    <h2 className="mt-1 truncate text-2xl font-black">{String(selected.project.name || selected.project.title || "AI Project")}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500">{String(selected.project.customer_name || "Customer")} · {String(selected.project.owner_email || "")}</p>
                  </div>
                  <button aria-label="Close project review" onClick={() => setSelected(null)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                  {selected.signals.length > 0 ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                      <div className="flex items-center gap-2 font-bold text-amber-100"><AlertTriangle className="h-4 w-4" /> Manual review suggested</div>
                      <div className="mt-3 flex flex-wrap gap-2">{selected.signals.map((signal) => <span key={signal.label} className="rounded-full border border-amber-300/20 bg-black/10 px-3 py-1 text-xs text-amber-100">{signal.label}</span>)}</div>
                      <p className="mt-3 text-xs leading-5 text-amber-100/70">Inspect the actual context below before taking action. A signal alone is not proof of abuse.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4 text-sm text-emerald-100">No automated review signal was found in the available project text.</div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Files", selected.project.file_count || 0],
                      ["Messages", selected.project.message_count || 0],
                      ["Revisions", selected.project.revision_count || selected.revisions.length || 0],
                      ["Builds", selected.builds.length || 0],
                    ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{String(value)}</p></div>)}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <h3 className="font-bold">Customer account</h3>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="truncate text-right text-slate-200">{String(selected.project.owner_email || "—")}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd className="capitalize text-slate-200">{String(selected.project.account_status || "unknown")}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Created</dt><dd className="text-right text-slate-200">{formatDate(selected.project.created_at)}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-slate-500">Last project update</dt><dd className="text-right text-slate-200">{formatDate(selected.project.updated_at)}</dd></div>
                      </dl>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="border-white/10 bg-white/[.03]"><Link href="/admin/users"><UserRound className="mr-2 h-4 w-4" /> Customer Approvals</Link></Button>
                        {String(selected.project.account_status || "") !== "suspended" && selected.project.user_id ? (
                          <Button onClick={suspendCustomer} disabled={actionLoading} className="bg-rose-600 text-white hover:bg-rose-500">{actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />} Suspend customer</Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <h3 className="font-bold">Project request</h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">{String(selected.project.prompt || selected.project.description || "No stored prompt is available for this project.").slice(0, 8000)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                    <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><h3 className="font-bold">Recent project activity</h3></div>
                    {selected.messages.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {selected.messages.slice(0, 20).map((message, index) => (
                          <div key={String(message.id || index)} className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-bold uppercase ${message.role === "user" ? "bg-cyan-400/10 text-cyan-200" : "bg-violet-400/10 text-violet-200"}`}>{String(message.role || "activity")}</span><span className="text-slate-600">{formatDate(message.created_at)}</span>{message.model ? <span className="text-slate-600">{String(message.model)}</span> : null}</div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">{String(message.content || "").slice(0, 4000)}</p>
                          </div>
                        ))}
                      </div>
                    ) : selected.activity && selected.activity.length > 0 ? (
                      <div className="mt-4 space-y-2">{selected.activity.map((item, index) => <div key={index} className="flex flex-wrap justify-between gap-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm"><span className="text-slate-300">{String(item.action || "Activity")}</span><span className="text-slate-600">{formatDate(item.created_at)}</span></div>)}</div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">No project-specific activity history is available for this record.</p>
                    )}
                  </div>

                  {(selected.generations.length > 0 || selected.builds.length > 0 || selected.revisions.length > 0) && (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <HistoryList title="Generations" items={selected.generations} primary="status" secondary="provider" />
                      <HistoryList title="Build / deploy" items={selected.builds} primary="status" secondary="deployment_url" />
                      <HistoryList title="Revisions" items={selected.revisions} primary="label" secondary="source" />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryList({ title, items, primary, secondary }: { title: string; items: Array<Record<string, unknown>>; primary: string; secondary: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? <p className="text-sm text-slate-600">No records</p> : items.slice(0, 8).map((item, index) => (
          <div key={String(item.id || index)} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="truncate text-sm font-semibold capitalize text-slate-200">{String(item[primary] || "Record")}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{String(item[secondary] || "")}</p>
            <p className="mt-1 text-[11px] text-slate-600">{formatDate(item.created_at || item.completed_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
