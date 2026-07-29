"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ExternalLink, Globe2, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

type DomainRow = {
  id: string
  project_id: string
  project_title: string
  address_type: "path" | "subdomain" | "custom"
  slug: string | null
  hostname: string | null
  is_primary: boolean
  status: "pending" | "configuring" | "active" | "error"
  dns_status: "not_required" | "pending" | "verifying" | "verified" | "error"
  ssl_status: "pending" | "provisioning" | "active" | "error"
  error_message: string | null
  updated_at: string
}

function badge(value: string) {
  const tone = value === "active" || value === "verified" || value === "not_required"
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
    : value === "error"
      ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
      : "border-amber-300/20 bg-amber-400/10 text-amber-100"
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone}`}>{value.replaceAll("_", " ")}</span>
}

function domainUrl(row: DomainRow) {
  if (row.address_type === "path" && row.slug) return `/p/${row.slug}`
  if (row.hostname) return `https://${row.hostname}`
  return ""
}

export default function AdminDomainsPage() {
  const router = useRouter()
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/786-admin/domains", { cache: "no-store" })
      const data = await response.json().catch(() => ({})) as { domains?: DomainRow[]; error?: string }
      if (!response.ok) throw new Error(data.error || "Could not load domains.")
      setDomains(data.domains || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load domains.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return domains
    return domains.filter((row) =>
      [row.project_title, row.hostname, row.slug, row.status, row.ssl_status]
        .some((value) => String(value || "").toLowerCase().includes(needle)),
    )
  }, [domains, query])

  const active = domains.filter((row) => row.status === "active").length
  const waiting = domains.filter((row) => row.status === "pending" || row.status === "configuring").length
  const sslActive = domains.filter((row) => row.ssl_status === "active").length

  return (
    <main className="min-h-screen bg-[#050713] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.push("/786-admin/chat")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10" aria-label="Back to builder">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">786.Chat infrastructure</p>
              <h1 className="mt-1 text-3xl font-black">Domains</h1>
              <p className="mt-1 text-sm text-slate-400">Customer addresses, DNS verification and free SSL status.</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10 disabled:opacity-40">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total addresses", domains.length, Globe2, "text-cyan-200"],
            ["Active applications", active, ShieldCheck, "text-emerald-200"],
            ["Awaiting configuration", waiting, Loader2, "text-amber-200"],
          ].map(([label, value, Icon, tone]) => {
            const CardIcon = Icon as typeof Globe2
            return (
              <div key={String(label)} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-5">
                <CardIcon className={`h-5 w-5 ${tone}`} />
                <p className="mt-5 text-3xl font-black">{String(value)}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{String(label)}</p>
              </div>
            )
          })}
        </section>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, project or domain…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-600" />
          <span className="text-xs font-bold text-slate-500">{sslActive} HTTPS active</span>
        </div>

        <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
          {loading ? (
            <div className="grid min-h-72 place-items-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
          ) : error ? (
            <div className="m-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-5 text-sm text-rose-100">{error}</div>
          ) : visible.length === 0 ? (
            <div className="grid min-h-72 place-items-center px-6 text-center">
              <div><Globe2 className="mx-auto h-10 w-10 text-slate-600" /><h2 className="mt-4 text-lg font-black">No deployment domains yet</h2><p className="mt-2 text-sm text-slate-500">Deploy a project from the builder to create the first truthful domain record.</p></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="border-b border-white/10 bg-black/20 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Project / address</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">DNS</th>
                    <th className="px-5 py-4">Free SSL</th>
                    <th className="px-5 py-4">Application</th>
                    <th className="px-5 py-4">Updated</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const url = domainUrl(row)
                    return (
                      <tr key={row.id} className="border-b border-white/[0.07] last:border-0 hover:bg-white/[0.025]">
                        <td className="px-5 py-4">
                          <p className="font-black text-white">{row.project_title}</p>
                          <p className="mt-1 max-w-sm break-all text-xs text-cyan-200">{url || "Address unavailable"}</p>
                          {row.error_message && <p className="mt-1 max-w-md text-xs text-rose-300">{row.error_message}</p>}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold capitalize text-slate-300">{row.address_type}</td>
                        <td className="px-5 py-4">{badge(row.dns_status)}</td>
                        <td className="px-5 py-4">{badge(row.ssl_status)}</td>
                        <td className="px-5 py-4">{badge(row.status)}</td>
                        <td className="px-5 py-4 text-xs text-slate-400">{new Date(row.updated_at).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-cyan-200 hover:text-white">Open <ExternalLink className="h-3.5 w-3.5" /></a>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
