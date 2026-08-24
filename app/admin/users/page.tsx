"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Customer = {
  id: string
  name: string
  email: string
  role: string | null
  plan: string | null
  email_verified: boolean
  account_status: string
  created_at: string
  updated_at: string
  chat_count: number | string
}

type Stats = {
  total_users: number | string
  pending_users: number | string
  active_users: number | string
  verified_users: number | string
  new_users_7d: number | string
}

const OWNER_EMAIL = "mujeeb@job4u.com"

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [error, setError] = useState("")

  async function loadCustomers() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/users", { credentials: "include", cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load customers")
      setCustomers(data.users || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  async function updateCustomer(customer: Customer, action: "approve" | "reject" | "suspend") {
    setActionLoading(`${customer.id}:${action}`)
    setError("")
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: customer.id, action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not update customer")
      await loadCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update customer")
    } finally {
      setActionLoading("")
    }
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.name || customer.email}? This cannot be undone.`)) return
    setActionLoading(`${customer.id}:delete`)
    setError("")
    try {
      const response = await fetch(`/api/admin/users?userId=${encodeURIComponent(customer.id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not delete customer")
      await loadCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete customer")
    } finally {
      setActionLoading("")
    }
  }

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesSearch = !query || customer.name?.toLowerCase().includes(query) || customer.email.toLowerCase().includes(query)
      const matchesFilter = filter === "all" || customer.account_status === filter
      return matchesSearch && matchesFilter
    })
  }, [customers, filter, search])

  const pending = useMemo(() => customers.filter((customer) => customer.account_status === "pending"), [customers])

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/[.05] to-violet-600/10 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" /> Customer access control
            </div>
            <h1 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">Customer approvals</h1>
            <p className="mt-3 leading-7 text-slate-400">A new customer can register and verify their email, but they cannot open the 786.Chat builder until you press <strong className="text-white">Approve</strong>.</p>
          </div>
          <Button variant="outline" onClick={loadCustomers} disabled={loading} className="border-white/15 bg-white/[.03]">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Clock3} label="Waiting approval" value={Number(stats?.pending_users || 0)} tone="text-amber-300" />
        <Stat icon={UserCheck} label="Active customers" value={Number(stats?.active_users || 0)} tone="text-emerald-300" />
        <Stat icon={Users} label="Total accounts" value={Number(stats?.total_users || 0)} tone="text-cyan-300" />
        <Stat icon={CheckCircle2} label="Verified emails" value={Number(stats?.verified_users || 0)} tone="text-violet-300" />
      </section>

      {pending.length > 0 && (
        <Card className="border-amber-300/20 bg-amber-300/[.035] text-white">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-amber-200"><Clock3 className="h-5 w-5" /><h2 className="text-lg font-bold">Needs your approval ({pending.length})</h2></div>
            <div className="grid gap-3 xl:grid-cols-2">
              {pending.map((customer) => <CustomerCard key={customer.id} customer={customer} actionLoading={actionLoading} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />)}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="rounded-[24px] border border-white/10 bg-white/[.02] p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email…" className="h-11 border-white/10 bg-black/20 pl-9" />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#060a16] px-4 text-sm text-slate-300 outline-none">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid min-h-[260px] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-300" /></div>
      ) : visible.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 p-12 text-center text-slate-500">No matching customers.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((customer) => <CustomerCard key={customer.id} customer={customer} actionLoading={actionLoading} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} />)}
        </div>
      )}
    </div>
  )
}

function CustomerCard({
  customer,
  actionLoading,
  updateCustomer,
  deleteCustomer,
}: {
  customer: Customer
  actionLoading: string
  updateCustomer: (customer: Customer, action: "approve" | "reject" | "suspend") => Promise<void>
  deleteCustomer: (customer: Customer) => Promise<void>
}) {
  const owner = customer.email.toLowerCase() === OWNER_EMAIL
  const busy = actionLoading.startsWith(`${customer.id}:`)
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#070b18]/80 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-lg font-black text-cyan-100">{customer.name?.charAt(0)?.toUpperCase() || "?"}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold">{customer.name || "Unnamed customer"}</h3>
            {owner && <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-200">Owner</span>}
            <StatusBadge status={customer.account_status} />
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">{customer.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Info label="Email" value={customer.email_verified ? "Verified" : "Not verified"} />
        <Info label="Chats" value={String(Number(customer.chat_count || 0))} />
        <Info label="Created" value={new Date(customer.created_at).toLocaleDateString("en-GB")} />
      </div>

      {!owner && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {customer.account_status !== "active" && (
            <Button size="sm" disabled={busy} onClick={() => updateCustomer(customer, "approve")} className="bg-emerald-500 text-white hover:bg-emerald-400">
              {actionLoading === `${customer.id}:approve` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />} Approve
            </Button>
          )}
          {customer.account_status === "active" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => updateCustomer(customer, "suspend")} className="border-amber-300/20 text-amber-200 hover:bg-amber-300/10">
              <Ban className="mr-2 h-4 w-4" /> Suspend
            </Button>
          )}
          {customer.account_status !== "rejected" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => updateCustomer(customer, "reject")} className="border-rose-300/20 text-rose-200 hover:bg-rose-300/10">
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => deleteCustomer(customer)} className="ml-auto text-slate-500 hover:bg-rose-500/10 hover:text-rose-200">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      )}
    </article>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === "active" ? "bg-emerald-400/10 text-emerald-300" : status === "pending" ? "bg-amber-300/10 text-amber-200" : status === "suspended" ? "bg-orange-400/10 text-orange-300" : status === "rejected" ? "bg-rose-400/10 text-rose-300" : "bg-slate-400/10 text-slate-300"
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles}`}>{status || "unknown"}</span>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[.03] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 truncate font-medium text-slate-300">{value}</p></div>
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return <Card className="border-white/10 bg-white/[.025] text-white"><CardContent className="p-5"><Icon className={`h-5 w-5 ${tone}`} /><p className="mt-5 text-3xl font-black">{value.toLocaleString()}</p><p className="mt-1 text-sm text-slate-500">{label}</p></CardContent></Card>
}
