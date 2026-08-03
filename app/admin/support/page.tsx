"use client"

import { useCallback, useEffect, useState } from "react"
import { Headphones, Loader2, RefreshCw, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Ticket = {
  id: string
  reference: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "normal" | "high" | "urgent"
  created_at: string
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/support", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Support inbox is unavailable.")
      setTickets(payload.tickets || [])
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Support inbox is unavailable.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function setStatus(id: string, status: Ticket["status"]) {
    const response = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (response.ok) await load()
  }

  const openCount = tickets.filter((ticket) => ticket.status === "open").length
  const urgentCount = tickets.filter((ticket) => ticket.priority === "urgent" && !["resolved", "closed"].includes(ticket.status)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold">Support inbox</h1><p className="text-muted-foreground">Tracked customer requests from the public Support page.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-400">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="p-5"><Headphones className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-sm text-muted-foreground">Open requests</p><p className="text-3xl font-bold">{openCount}</p></CardContent></Card><Card><CardContent className="p-5"><ShieldAlert className="h-5 w-5 text-red-500" /><p className="mt-3 text-sm text-muted-foreground">Urgent security</p><p className="text-3xl font-bold">{urgentCount}</p></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Requests</CardTitle></CardHeader><CardContent className="space-y-4">
        {!loading && tickets.length === 0 && <p className="py-10 text-center text-muted-foreground">No support requests yet.</p>}
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-xl border p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{ticket.reference} · {ticket.subject}</strong><span className={`rounded-full px-2 py-1 text-xs ${ticket.priority === "urgent" ? "bg-red-500/15 text-red-500" : "bg-muted"}`}>{ticket.priority}</span><span className="rounded-full bg-muted px-2 py-1 text-xs">{ticket.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{ticket.name} · {ticket.email} · {ticket.category} · {new Date(ticket.created_at).toLocaleString("en-GB")}</p><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">{ticket.message}</p></div>
              <div className="flex shrink-0 flex-wrap gap-2">{ticket.status === "open" && <Button size="sm" variant="outline" onClick={() => void setStatus(ticket.id, "in_progress")}>Start</Button>}{!["resolved", "closed"].includes(ticket.status) && <Button size="sm" onClick={() => void setStatus(ticket.id, "resolved")}>Resolve</Button>}{ticket.status === "resolved" && <Button size="sm" variant="outline" onClick={() => void setStatus(ticket.id, "closed")}>Close</Button>}</div>
            </div>
          </article>
        ))}
      </CardContent></Card>
    </div>
  )
}
