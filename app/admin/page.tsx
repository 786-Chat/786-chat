"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Globe,
  Loader2,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Customer = {
  id: string
  name: string
  email: string
  email_verified: boolean
  account_status: string
  created_at: string
  chat_count: number | string
}

type Stats = {
  total_users: number | string
  pending_users: number | string
  active_users: number | string
  verified_users: number | string
  new_users_7d: number | string
}

const quickLinks = [
  { href: "/admin/users", title: "Customer approvals", text: "Approve new registrations before they can use 786.Chat.", icon: Users },
  { href: "/admin/monitoring", title: "Platform monitoring", text: "Check health, build and operational signals.", icon: Activity },
  { href: "/admin/ai-control", title: "AI control", text: "Manage the AI provider and generation controls.", icon: Bot },
  { href: "/admin/site-deployments", title: "Deployments", text: "Review customer deployment activity and status.", icon: Rocket },
  { href: "/admin/customer-sites", title: "Customer sites", text: "See customer websites and application destinations.", icon: Globe },
]

export default function AdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/users", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Could not load admin data")
        setCustomers(data.users || [])
        setStats(data.stats || null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const pending = useMemo(() => customers.filter((customer) => customer.account_status === "pending").slice(0, 5), [customers])
  const recent = useMemo(() => customers.slice(0, 6), [customers])

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-300" /></div>
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/[.06] to-violet-600/10 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" /> Owner control centre
            </div>
            <h1 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">Run 786.Chat from one focused admin area.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">Approve customers, watch platform activity, control AI and review deployments. Old pricing, shop and theme-sales clutter has been removed from the main admin navigation.</p>
          </div>
          <Button asChild className="h-11 bg-gradient-to-r from-cyan-500 to-violet-600 font-bold">
            <Link href="/admin/users">Review customer requests <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Clock3} label="Waiting approval" value={Number(stats?.pending_users || 0)} tone="text-amber-300" />
        <Stat icon={CheckCircle2} label="Active customers" value={Number(stats?.active_users || 0)} tone="text-emerald-300" />
        <Stat icon={Users} label="Total accounts" value={Number(stats?.total_users || 0)} tone="text-cyan-300" />
        <Stat icon={ShieldCheck} label="Verified emails" value={Number(stats?.verified_users || 0)} tone="text-violet-300" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="border-white/10 bg-white/[.025] text-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Pending customer approvals</h2>
                <p className="mt-1 text-sm text-slate-500">New accounts cannot enter the builder until you approve them.</p>
              </div>
              <Link href="/admin/users" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View all</Link>
            </div>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No customers are waiting for approval.</div>
              ) : pending.map((customer) => (
                <Link key={customer.id} href="/admin/users" className="flex items-center gap-4 rounded-2xl border border-amber-300/10 bg-amber-300/[.035] p-4 transition hover:bg-amber-300/[.07]">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-300/10 font-bold text-amber-200">{customer.name?.charAt(0) || "?"}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{customer.name || "Unnamed customer"}</p>
                    <p className="truncate text-sm text-slate-500">{customer.email}</p>
                  </div>
                  <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-200">Pending</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[.025] text-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Admin shortcuts</h2>
            <p className="mt-1 text-sm text-slate-500">Only the controls needed to operate 786.Chat.</p>
            <div className="mt-5 grid gap-3">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[.035]">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><item.icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-0.5 text-xs text-slate-500">{item.text}</p></div>
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/[.025] text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold">Recent customers</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{customer.name || "Unnamed customer"}</p>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold capitalize ${customer.account_status === "active" ? "bg-emerald-400/10 text-emerald-300" : customer.account_status === "pending" ? "bg-amber-300/10 text-amber-200" : "bg-slate-400/10 text-slate-300"}`}>{customer.account_status}</span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">{customer.email}</p>
                <p className="mt-3 text-xs text-slate-600">{customer.email_verified ? "Email verified" : "Email not verified"} · {Number(customer.chat_count || 0)} chats</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <Card className="border-white/10 bg-white/[.025] text-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between"><Icon className={`h-5 w-5 ${tone}`} /><span className="text-xs text-slate-600">Live</span></div>
        <p className="mt-5 text-3xl font-black">{value.toLocaleString()}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </CardContent>
    </Card>
  )
}
