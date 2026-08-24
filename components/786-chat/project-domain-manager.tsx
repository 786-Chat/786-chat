"use client"

import {
  Check,
  ExternalLink,
  Globe2,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  BuilderDeploymentDomain,
  BuilderDeploymentLifecycle,
} from "./contracts"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"

type LifecyclePayload = BuilderDeploymentLifecycle & {
  success?: boolean
  error?: string
}

function domainAddress(domain: BuilderDeploymentDomain) {
  if (domain.address_type === "path") {
    return `786.chat/p/${domain.slug || ""}`
  }
  return domain.hostname || "Domain"
}

function domainHref(domain: BuilderDeploymentDomain) {
  if (domain.address_type === "path") {
    return `https://786.chat/p/${domain.slug || ""}`
  }
  return `https://${domain.hostname}`
}

function readyForPrimary(domain: BuilderDeploymentDomain) {
  if (domain.address_type === "path") return domain.status === "active"
  return domain.status === "active" && domain.dns_status === "verified" && domain.ssl_status === "active"
}

function typeLabel(domain: BuilderDeploymentDomain) {
  if (domain.address_type === "path") return "786.Chat project link"
  if (domain.address_type === "subdomain") return "786.Chat subdomain"
  return "Custom domain"
}

export function ProjectDomainManager() {
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState("")
  const [lifecycle, setLifecycle] = useState<BuilderDeploymentLifecycle>({
    deployment: null,
    domains: [],
    history: [],
  })
  const [loading, setLoading] = useState(false)
  const [busyDomain, setBusyDomain] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    function syncProject() {
      const next = localStorage.getItem(ACTIVE_PROJECT_KEY) || ""
      setProjectId((current) => current === next ? current : next)
    }
    syncProject()
    const interval = window.setInterval(syncProject, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const load = useCallback(async (activeProjectId = projectId) => {
    if (!activeProjectId) {
      setLifecycle({ deployment: null, domains: [], history: [] })
      return
    }
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/786-chat/projects/${activeProjectId}/deploy`, {
        cache: "no-store",
      })
      const payload = (await response.json().catch(() => ({}))) as LifecyclePayload
      if (!response.ok) throw new Error(payload.error || "Could not load project domains.")
      setLifecycle({
        deployment: payload.deployment || null,
        domains: payload.domains || [],
        history: payload.history || [],
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load project domains.")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) void load(projectId)
  }, [open, projectId, load])

  async function runDomainAction(
    domain: BuilderDeploymentDomain,
    action: "refresh-domain" | "set-primary-domain" | "remove-domain",
  ) {
    if (!projectId || busyDomain) return
    if (action === "remove-domain") {
      const confirmed = window.confirm(
        `Remove ${domainAddress(domain)} from this project? The project files and deployment will not be deleted.`,
      )
      if (!confirmed) return
    }

    setBusyDomain(domain.id)
    setError("")
    setNotice("")
    try {
      const response = await fetch(`/api/786-chat/projects/${projectId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, domainId: domain.id }),
      })
      const payload = (await response.json().catch(() => ({}))) as LifecyclePayload
      if (!response.ok) throw new Error(payload.error || "Domain action failed.")
      setLifecycle({
        deployment: payload.deployment || null,
        domains: payload.domains || [],
        history: payload.history || [],
      })
      setNotice(
        action === "remove-domain"
          ? "Domain removed."
          : action === "set-primary-domain"
            ? "Primary domain updated."
            : "Domain status refreshed.",
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Domain action failed.")
    } finally {
      setBusyDomain("")
    }
  }

  const primary = useMemo(
    () => lifecycle.domains.find((domain) => domain.is_primary) || null,
    [lifecycle.domains],
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[80] inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-[#08111f]/95 px-4 py-2.5 text-[14px] font-black text-cyan-100 shadow-[0_16px_45px_rgba(0,0,0,.45)] backdrop-blur-xl hover:border-cyan-300/45"
      >
        <Globe2 className="h-4 w-4" /> Domains
        {lifecycle.domains.length > 0 && (
          <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-[12px] text-cyan-200">
            {lifecycle.domains.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/45 backdrop-blur-[2px]" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setOpen(false)
        }}>
          <aside className="flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#070d18] shadow-[-30px_0_80px_rgba(0,0,0,.5)]">
            <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
              <Globe2 className="mr-2 h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-[16px] font-black text-white">Project domains</h2>
                <p className="text-[12px] text-slate-500">All addresses connected to this project</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close domain manager" className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!projectId ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-[14px] text-slate-400">
                  Open a project first. Its connected domains will appear here.
                </div>
              ) : loading ? (
                <div className="grid min-h-40 place-items-center text-slate-400">
                  <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-300" /><p className="mt-3 text-[14px]">Loading domains…</p></div>
                </div>
              ) : (
                <>
                  {primary && (
                    <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-4">
                      <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[.12em] text-emerald-300"><Star className="h-3.5 w-3.5 fill-current" /> Current primary</div>
                      <a href={domainHref(primary)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-[14px] font-bold text-white hover:text-cyan-200">
                        {domainAddress(primary)} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </div>
                  )}

                  <div className="space-y-3">
                    {lifecycle.domains.map((domain) => {
                      const busy = busyDomain === domain.id
                      const ready = readyForPrimary(domain)
                      return (
                        <div key={domain.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <a href={domainHref(domain)} target="_blank" rel="noreferrer" className="break-all text-[14px] font-bold text-cyan-100 hover:text-cyan-300">
                                  {domainAddress(domain)}
                                </a>
                                {domain.is_primary && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-black text-emerald-200">PRIMARY</span>}
                              </div>
                              <p className="mt-1 text-[12px] text-slate-500">{typeLabel(domain)}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate-400">
                                <span className="rounded bg-white/[.04] px-2 py-1">DNS {domain.dns_status}</span>
                                <span className="rounded bg-white/[.04] px-2 py-1">SSL {domain.ssl_status}</span>
                                <span className="rounded bg-white/[.04] px-2 py-1">App {domain.status}</span>
                              </div>
                            </div>
                            {ready && <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                            {domain.address_type !== "path" && (
                              <button type="button" onClick={() => void runDomainAction(domain, "refresh-domain")} disabled={Boolean(busyDomain)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[12px] font-bold text-slate-300 hover:bg-white/[.06] disabled:opacity-40">
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
                              </button>
                            )}
                            {!domain.is_primary && ready && (
                              <button type="button" onClick={() => void runDomainAction(domain, "set-primary-domain")} disabled={Boolean(busyDomain)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-2 text-[12px] font-black text-emerald-200 hover:bg-emerald-300/[.12] disabled:opacity-40">
                                <Star className="h-3.5 w-3.5" /> Make primary
                              </button>
                            )}
                            {lifecycle.domains.length > 1 && (
                              <button type="button" onClick={() => void runDomainAction(domain, "remove-domain")} disabled={Boolean(busyDomain)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 px-3 py-2 text-[12px] font-bold text-rose-200 hover:bg-rose-300/[.08] disabled:opacity-40">
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {!lifecycle.domains.length && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-5 text-[14px] leading-6 text-slate-400">
                      No deployment address is connected yet. Use Deploy to add a 786.Chat subdomain or your own custom domain.
                    </div>
                  )}
                </>
              )}

              {error && <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-[13px] text-rose-200">{error}</div>}
              {notice && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-3 text-[13px] text-emerald-200">{notice}</div>}
            </div>

            <div className="shrink-0 border-t border-white/10 p-4 text-[12px] leading-5 text-slate-500">
              Removing a domain disconnects only that address. It does not delete the project or its deployment history.
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
