"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Globe2, Loader2, RefreshCw, Rocket, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type ProjectPayload = {
  project?: {
    id: string
    title: string
    description?: string
  }
}

type DeploymentPayload = {
  deployment?: {
    slug: string
    status: "live" | "failed"
    version: number
    published_at: string
  } | null
}

export default function AdminPublishingOverviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [project, setProject] = useState<ProjectPayload["project"] | null>(null)
  const [deployment, setDeployment] = useState<DeploymentPayload["deployment"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const projectId = String(params?.id || "")
  const isAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL

  async function load() {
    if (!projectId) return
    setLoading(true)
    setError("")

    try {
      const [projectResponse, deploymentResponse] = await Promise.all([
        fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/publish`, { cache: "no-store" }),
      ])

      if (!projectResponse.ok) throw new Error("Project could not be loaded")
      if (!deploymentResponse.ok) throw new Error("Publishing status could not be loaded")

      const projectData = (await projectResponse.json()) as ProjectPayload
      const deploymentData = (await deploymentResponse.json()) as DeploymentPayload
      setProject(projectData.project || null)
      setDeployment(deploymentData.deployment || null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Publishing overview failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    if (isAdmin && projectId) void load()
  }, [isAdmin, projectId])

  function returnToEditor() {
    try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId) } catch {}
    router.push("/786-admin/chat")
  }

  if (isLoading || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050713] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></main>
  }

  const liveUrl = deployment?.slug ? `/p/${deployment.slug}` : ""
  const publishedDate = deployment?.published_at
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(deployment.published_at))
    : "Not published"

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(6,182,212,.15),transparent_30%),linear-gradient(135deg,#030511,#080417_48%,#120523)] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push("/786-admin/projects")} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> All projects
            </button>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 shadow-[0_0_32px_rgba(124,58,237,.38)]">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black sm:text-3xl">Publishing</h1>
                <p className="mt-1 text-sm text-slate-400">{project?.title || "Customer project"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/[0.08] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={returnToEditor} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black shadow-[0_0_28px_rgba(124,58,237,.36)]">
              Return to editor
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">{error}</div>
        ) : loading ? (
          <div className="grid min-h-[360px] place-items-center rounded-[32px] border border-white/10 bg-white/[0.035]"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,.88),rgba(30,15,55,.78))] shadow-[0_28px_90px_rgba(0,0,0,.42)]">
              <div className="border-b border-white/10 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">Production</p>
                    <h2 className="mt-2 text-2xl font-black">{deployment ? "Project is live" : "Project is not published"}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      {deployment ? "Customers can access the current published snapshot using the live URL below." : "Return to the editor and click Publish to create the first live customer version."}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${deployment?.status === "live" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-slate-400/20 bg-slate-400/10 text-slate-300"}`}>
                    <span className={`h-2 w-2 rounded-full ${deployment?.status === "live" ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.75)]" : "bg-slate-500"}`} />
                    {deployment?.status === "live" ? "Live" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:p-8">
                <div className="rounded-3xl border border-cyan-300/20 bg-[#050a18]/75 p-5">
                  <div className="flex items-center gap-2 text-sm font-black text-cyan-100"><Globe2 className="h-4 w-4" /> Customer URL</div>
                  {liveUrl ? (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <code className="break-all text-sm font-bold text-cyan-300">{typeof window !== "undefined" ? window.location.origin : ""}{liveUrl}</code>
                      <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100">
                        Open live <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : <p className="mt-3 text-sm text-slate-500">No live URL yet.</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Version</p>
                    <p className="mt-2 text-2xl font-black">{deployment?.version || "—"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                    <p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Last published</p>
                    <p className="mt-2 text-sm font-bold text-slate-200">{publishedDate}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="grid content-start gap-5">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><h3 className="font-black">Published snapshot</h3></div>
                <p className="mt-3 text-sm leading-6 text-slate-400">The live customer version remains separate from unpublished edits in the 786.Chat workspace.</p>
              </div>

              <div className="rounded-[28px] border border-violet-300/15 bg-violet-500/[0.06] p-6">
                <h3 className="font-black">Next publishing stages</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">Deployment history, rollback and real domain management will be added as separate verified subsystems.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
