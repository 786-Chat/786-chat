"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, AlertTriangle, CheckCircle2, CircleAlert, RefreshCw, Siren } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Incident = {
  id: string
  title: string
  category: string
  status: "open" | "acknowledged" | "resolved"
  severity: "warning" | "error" | "critical"
  occurrence_count: number
  error_code: string | null
  error_message: string | null
  last_seen_at: string
}

type JourneyRun = {
  id: string
  status: "running" | "passed" | "failed"
  current_stage: string
  stages: Array<{ name: string; status: string; durationMs: number }>
  started_at: string
  completed_at: string | null
}

type MonitoringPayload = {
  incidents: Incident[]
  runs: JourneyRun[]
  events: Array<{
    id: string
    category: string
    event_name: string
    status: string
    severity: string
    error_message: string | null
    created_at: string
  }>
  summary: {
    open_incidents?: number
    critical_incidents?: number
    failures_24h?: number
    journeys_passed_7d?: number
    journeys_failed_7d?: number
  }
}

function when(value: string | null) {
  return value ? new Date(value).toLocaleString("en-GB") : "—"
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/monitoring", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Monitoring data is unavailable.")
      setData(payload)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Monitoring data is unavailable.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function updateIncident(id: string, status: "acknowledged" | "resolved") {
    const response = await fetch("/api/admin/monitoring", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (response.ok) await load()
  }

  async function runJourney() {
    setRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/cron/customer-journey", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Customer journey failed.")
      await load()
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Customer journey failed.")
      await load()
    } finally {
      setRunning(false)
    }
  }

  const summary = data?.summary || {}
  const openIncidents = data?.incidents.filter((incident) => incident.status !== "resolved") || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production monitoring</h1>
          <p className="text-muted-foreground">Build, AI, deployment and complete customer-journey health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button onClick={() => void runJourney()} disabled={running}>
            <Activity className={`mr-2 h-4 w-4 ${running ? "animate-pulse" : ""}`} />
            {running ? "Running journey…" : "Run full journey"}
          </Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Open incidents", summary.open_incidents || 0, CircleAlert],
          ["Critical", summary.critical_incidents || 0, Siren],
          ["Failures · 24h", summary.failures_24h || 0, AlertTriangle],
          ["Journeys passed · 7d", summary.journeys_passed_7d || 0, CheckCircle2],
          ["Journeys failed · 7d", summary.journeys_failed_7d || 0, Activity],
        ].map(([label, value, Icon]) => (
          <Card key={String(label)}><CardContent className="p-5">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">{String(label)}</p>
            <p className="mt-1 text-3xl font-bold">{String(value)}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Active incidents</CardTitle><CardDescription>Repeated failures are grouped by fingerprint.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {openIncidents.length === 0 && <p className="py-8 text-center text-muted-foreground">No open incidents.</p>}
          {openIncidents.map((incident) => (
            <div key={incident.id} className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${incident.severity === "critical" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{incident.severity}</span>
                  <strong>{incident.title}</strong>
                  <span className="text-xs text-muted-foreground">×{incident.occurrence_count}</span>
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">{incident.error_message || incident.error_code}</p>
                <p className="mt-1 text-xs text-muted-foreground">Last seen {when(incident.last_seen_at)}</p>
              </div>
              <div className="flex gap-2">
                {incident.status === "open" && <Button size="sm" variant="outline" onClick={() => void updateIncident(incident.id, "acknowledged")}>Acknowledge</Button>}
                <Button size="sm" onClick={() => void updateIncident(incident.id, "resolved")}>Resolve</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Customer journeys</CardTitle><CardDescription>Register → verify → login → create → edit → rebuild → deploy.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(data?.runs || []).slice(0, 10).map((run) => (
              <div key={run.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3"><strong className="capitalize">{run.status}</strong><span className="text-xs text-muted-foreground">{when(run.started_at)}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">Stage: {run.current_stage} · {(run.stages || []).length} checks recorded</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent operational events</CardTitle><CardDescription>Structured production telemetry retained in Neon.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {(data?.events || []).slice(0, 12).map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 rounded-xl border p-3">
                <div><strong className="text-sm">{event.event_name.replaceAll("_", " ")}</strong><p className="text-xs text-muted-foreground">{event.category} · {event.status}</p></div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{when(event.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
