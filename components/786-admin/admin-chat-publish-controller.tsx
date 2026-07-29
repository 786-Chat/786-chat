"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Copy, ExternalLink, Globe2, Link2, Loader2, LockKeyhole, X } from "lucide-react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type AddressType = "path" | "subdomain" | "custom"
type PublishStep = "choose" | "publishing" | "result" | "error"
type DnsRecord = { type: string; name: string; value: string; reason?: string }
type DomainResult = {
  address_type: AddressType
  hostname: string | null
  status: "pending" | "configuring" | "active" | "error" | "removed"
  dns_status: "not_required" | "pending" | "verifying" | "verified" | "error"
  ssl_status: "pending" | "provisioning" | "active" | "error"
  dns_records?: DnsRecord[]
  error_message?: string | null
}
type PublishResult = {
  url: string
  requestedUrl?: string
  fallbackUrl?: string
  deployment?: { version?: number }
  domain?: DomainResult
}

function projectId() {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function projectTitle() {
  const title = document.querySelector<HTMLElement>("[data-admin-project-title]")?.textContent?.trim()
  return title || "Customer Project"
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "customer-project"
}

function previewHtml() {
  const frame = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
    .find((item) => /preview/i.test(item.title || ""))
  return frame?.srcdoc || frame?.getAttribute("srcdoc") || ""
}

function AddressCard(props: {
  selected: boolean
  title: string
  description: string
  example: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`grid w-full grid-cols-[22px_1fr_auto] gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
        props.selected
          ? "border-cyan-300/70 bg-gradient-to-br from-cyan-400/15 to-violet-500/15"
          : "border-white/10 bg-white/[0.035] hover:border-white/20"
      }`}
    >
      <span className={`mt-0.5 text-lg ${props.selected ? "text-cyan-200" : "text-slate-600"}`}>
        {props.selected ? "◉" : "○"}
      </span>
      <span>
        <span className="block text-sm font-black text-white">{props.title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">{props.description}</span>
        <span className={`mt-2 block break-all text-xs font-bold ${props.selected ? "text-cyan-200" : "text-violet-300"}`}>
          {props.example}
        </span>
      </span>
      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
        props.selected ? "bg-cyan-300/15 text-cyan-100" : "bg-white/5 text-slate-400"
      }`}>
        {props.badge || "Available"}
      </span>
    </button>
  )
}

export function AdminChatPublishController() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<PublishStep>("choose")
  const [addressType, setAddressType] = useState<AddressType>("subdomain")
  const [addressValue, setAddressValue] = useState("")
  const [title, setTitle] = useState("Customer Project")
  const [result, setResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState("")

  const suggestedSlug = useMemo(() => slugify(title), [title])
  const selectedValue = addressValue.trim() || suggestedSlug
  const requestedExample = addressType === "path"
    ? `https://786.chat/p/${suggestedSlug}-project-id`
    : addressType === "subdomain"
      ? `https://${selectedValue}.786.chat`
      : `https://${addressValue.trim() || "app.customer.com"}`

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    const listener = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest<HTMLButtonElement>("[data-admin-publish]")
      if (!button) return
      event.preventDefault()
      event.stopPropagation()
      setTitle(projectTitle())
      setAddressValue("")
      setAddressType("subdomain")
      setResult(null)
      setError("")
      setStep("choose")
      setOpen(true)
    }
    document.addEventListener("click", listener, true)
    return () => document.removeEventListener("click", listener, true)
  }, [pathname])

  if (pathname !== "/786-admin/chat" || !open) return null

  const close = () => {
    if (step !== "publishing") setOpen(false)
  }

  const publish = async () => {
    const id = projectId()
    const html = previewHtml()
    if (!id) {
      setError("Create or open a project before publishing.")
      setStep("error")
      return
    }
    if (!html) {
      setError("The current project preview is not ready.")
      setStep("error")
      return
    }
    setStep("publishing")
    try {
      const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(id)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          addressType,
          addressValue: addressType === "subdomain" ? selectedValue : addressValue.trim(),
        }),
      })
      const data = await response.json().catch(() => ({})) as PublishResult & { error?: string }
      if (!response.ok || !data.url) throw new Error(data.error || "Deployment could not be created.")
      setResult(data)
      setStep("result")
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Deployment failed.")
      setStep("error")
    }
  }

  const domain = result?.domain
  const domainActive = domain?.status === "active" && domain?.ssl_status === "active"

  return (
    <div className="fixed inset-0 z-[2147483647] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 text-white backdrop-blur-xl">
      <div className="relative my-4 w-full max-w-xl overflow-hidden rounded-[28px] border border-cyan-300/25 bg-gradient-to-br from-[#091124] via-[#11102b] to-[#21103b] p-6 shadow-[0_40px_120px_rgba(0,0,0,.75)]">
        <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <button
            type="button"
            onClick={close}
            disabled={step === "publishing"}
            className="absolute right-0 top-0 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-40"
            aria-label="Close deployment"
          >
            <X className="h-4 w-4" />
          </button>

          {step === "choose" && (
            <>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Deploy verified project</p>
              <h2 className="mt-2 pr-12 text-2xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Choose the production address. Customer domains receive free automatic SSL after DNS and ownership verification.
              </p>

              <div className="mt-6 grid gap-3">
                <AddressCard
                  selected={addressType === "path"}
                  onClick={() => setAddressType("path")}
                  title="786.Chat project link"
                  description="Safe internal address with no DNS setup."
                  example={`https://786.chat/p/${suggestedSlug}-project-id`}
                  badge="Immediate"
                />
                <AddressCard
                  selected={addressType === "subdomain"}
                  onClick={() => setAddressType("subdomain")}
                  title="Professional 786.Chat subdomain"
                  description="Recommended default for customer applications."
                  example={`https://${selectedValue}.786.chat`}
                  badge="Recommended"
                />
                <AddressCard
                  selected={addressType === "custom"}
                  onClick={() => setAddressType("custom")}
                  title="Customer-owned domain"
                  description="Connect a domain from Namecheap, Cloudflare or another DNS provider."
                  example={`https://${addressValue.trim() || "app.customer.com"}`}
                />
              </div>

              {addressType !== "path" && (
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-black text-slate-300">
                    {addressType === "subdomain" ? "786.Chat subdomain" : "Customer domain"}
                  </span>
                  <div className="flex items-center rounded-2xl border border-white/10 bg-slate-950/50 px-4 focus-within:border-cyan-300/60">
                    <Globe2 className="h-4 w-4 shrink-0 text-cyan-200" />
                    <input
                      value={addressValue}
                      onChange={(event) => setAddressValue(event.target.value)}
                      placeholder={addressType === "subdomain" ? suggestedSlug : "app.customer.com"}
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                    />
                    {addressType === "subdomain" && <span className="text-xs font-bold text-slate-400">.786.chat</span>}
                  </div>
                </label>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] p-3 text-xs leading-5 text-emerald-100">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                SSL/HTTPS is free. “Active” is shown only after the provider confirms DNS, ownership and certificate readiness.
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={close} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void publish()}
                  disabled={addressType === "custom" && !addressValue.trim()}
                  className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Deploy to {requestedExample.replace(/^https?:\/\//, "")}
                </button>
              </div>
            </>
          )}

          {step === "publishing" && (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <Loader2 className="mx-auto h-11 w-11 animate-spin text-cyan-200" />
                <h2 className="mt-5 text-xl font-black">Creating deployment</h2>
                <p className="mt-2 text-sm text-slate-400">Saving the production version and requesting the selected address…</p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="py-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Deployment stopped</p>
              <h2 className="mt-3 text-2xl font-black">Nothing was marked verified</h2>
              <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">{error}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={close} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black">Close</button>
                <button type="button" onClick={() => setStep("choose")} className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 text-sm font-black text-slate-950">Try again</button>
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="py-2">
              <div className={`grid h-14 w-14 place-items-center rounded-full ${domainActive || domain?.address_type === "path" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                {domainActive || domain?.address_type === "path" ? <Check className="h-7 w-7" /> : <Globe2 className="h-7 w-7" />}
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                {domainActive || domain?.address_type === "path" ? "Deployment available" : "Deployment created · DNS required"}
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {domainActive || domain?.address_type === "path" ? "Project address is ready" : "Finish domain verification"}
              </h2>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="break-all text-sm font-black text-cyan-200">{result.requestedUrl || result.url}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-wide">
                  <span className="rounded-lg bg-white/5 px-2 py-2 text-center">DNS: {domain?.dns_status || "not required"}</span>
                  <span className="rounded-lg bg-white/5 px-2 py-2 text-center">SSL: {domain?.ssl_status || "active"}</span>
                  <span className="rounded-lg bg-white/5 px-2 py-2 text-center">App: {domain?.status || "active"}</span>
                </div>
              </div>

              {Array.isArray(domain?.dns_records) && domain.dns_records.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-black text-slate-300">Add these exact records at the customer’s DNS provider</p>
                  <div className="grid gap-2">
                    {domain.dns_records.map((record, index) => (
                      <div key={`${record.type}-${record.name}-${index}`} className="grid grid-cols-[52px_1fr_34px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs">
                        <span className="font-black text-violet-200">{record.type}</span>
                        <span className="min-w-0 break-all text-slate-300">{record.name} → {record.value}</span>
                        <button type="button" onClick={() => void navigator.clipboard.writeText(record.value)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5" aria-label="Copy DNS value">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!domainActive && result.fallbackUrl && (
                <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/[0.07] p-3 text-xs leading-5 text-amber-100">
                  Until DNS and free SSL are verified, the safe 786.Chat link remains available at {result.fallbackUrl}.
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={close} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black">Close</button>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 text-sm font-black text-slate-950">
                  Open project <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <a href="/786-admin/domains" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan-200 hover:text-white">
                <Link2 className="h-3.5 w-3.5" /> Manage all domains
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
