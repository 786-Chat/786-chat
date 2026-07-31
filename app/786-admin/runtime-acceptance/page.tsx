"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Database, Loader2, Play, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PremiumAdminBackground } from "@/components/786-admin/premium-background"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CONFIRMATION = "RUN_PHASE_3_RUNTIME_ACCEPTANCE"
const CASES = [
  { id: "crm", title: "CRM", detail: "Lead capture → opportunity → conversion" },
  { id: "manufacturing", title: "Manufacturing", detail: "Batch → quality → traceability and recall" },
  { id: "pest-iot", title: "Pest IoT", detail: "Device → telemetry → alert → technician" },
] as const

type CaseId = typeof CASES[number]["id"]
type RunState = {
  state: "idle" | "generating" | "building" | "passed" | "failed"
  projectId?: string
  message?: string
  result?: Record<string, unknown>
}

function failureMessage(result: Record<string, any>, status: number) {
  const generation = result?.generation && typeof result.generation === "object"
    ? result.generation
    : result
  const errors = Array.isArray(generation?.validation?.errors)
    ? generation.validation.errors.map((error: unknown) => String(error)).filter(Boolean)
    : []
  if (errors.length > 0) {
    const repair = generation?.repairAttempted === true ? "Repair attempted. " : ""
    return `${repair}${errors.join(" | ")}`
  }
  return generation?.error || result?.error || `Runtime acceptance failed (${status}).`
}

export default function RuntimeAcceptancePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [runs, setRuns] = useState<Record<CaseId, RunState>>({
    crm: { state: "idle" },
    manufacturing: { state: "idle" },
    "pest-iot": { state: "idle" },
  })
  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user],
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isAdmin, isLoading, router])

  async function poll(caseId: CaseId, projectId: string) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      const response = await fetch(
        `/api/786-chat/system-acceptance/runtime?projectId=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      )
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setRuns((current) => ({
          ...current,
          [caseId]: { state: "failed", projectId, message: result.error || "Status check failed.", result },
        }))
        return
      }
      const status = result?.build?.status
      if (result.passed === true) {
        setRuns((current) => ({
          ...current,
          [caseId]: { state: "passed", projectId, message: "Neon, build and compiled preview passed.", result },
        }))
        return
      }
      if (status === "failed" || status === "cancelled") {
        setRuns((current) => ({
          ...current,
          [caseId]: { state: "failed", projectId, message: result?.build?.error_message || "Build failed.", result },
        }))
        return
      }
      setRuns((current) => ({
        ...current,
        [caseId]: { ...current[caseId], state: "building", projectId, message: `Build ${status || "queued"}…`, result },
      }))
    }
    setRuns((current) => ({
      ...current,
      [caseId]: { ...current[caseId], state: "failed", message: "Timed out waiting for the isolated build." },
    }))
  }

  async function runCase(caseId: CaseId) {
    setRuns((current) => ({
      ...current,
      [caseId]: { state: "generating", message: "Generating and validating the complete system…" },
    }))
    try {
      const response = await fetch("/api/786-chat/system-acceptance/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, confirm: CONFIRMATION }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.projectId) {
        setRuns((current) => ({
          ...current,
          [caseId]: { state: "failed", message: failureMessage(result, response.status), result },
        }))
        return
      }
      const projectId = String(result.projectId)
      setRuns((current) => ({
        ...current,
        [caseId]: { state: "building", projectId, message: "Neon passed; isolated build queued.", result },
      }))
      await poll(caseId, projectId)
    } catch (error) {
      setRuns((current) => ({
        ...current,
        [caseId]: { state: "failed", message: error instanceof Error ? error.message : "Runtime acceptance failed." },
      }))
    }
  }

  if (isLoading || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050713] text-cyan-200"><Loader2 className="h-7 w-7 animate-spin" /></main>
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050713] px-5 py-10 text-white sm:px-8 lg:px-14">
      <PremiumAdminBackground />
      <section className="relative z-10 mx-auto max-w-6xl">
        <button onClick={() => router.push("/786-admin/projects")} className="mb-8 text-sm font-bold text-slate-400 hover:text-white">
          ← Back to Projects
        </button>
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-cyan-200">
            <Database className="h-4 w-4" /> Phase 3
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Runtime acceptance matrix</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Each case uses the canonical AI generator, real temporary Neon workflow, saved project,
            isolated production build and compiled HTTPS preview. Run one case at a time.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {CASES.map((acceptanceCase) => {
            const run = runs[acceptanceCase.id]
            const active = run.state === "generating" || run.state === "building"
            return (
              <article key={acceptanceCase.id} className="rounded-[28px] border border-white/10 bg-[#0d1423]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,.3)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-300">
                    {acceptanceCase.id}
                  </span>
                  {run.state === "passed" ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> :
                    run.state === "failed" ? <XCircle className="h-6 w-6 text-red-300" /> :
                      active ? <Loader2 className="h-6 w-6 animate-spin text-cyan-300" /> : null}
                </div>
                <h2 className="text-2xl font-black">{acceptanceCase.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{acceptanceCase.detail}</p>
                <div className="mt-5 min-h-16 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs leading-5 text-slate-400">
                  {run.message || "Ready to run."}
                </div>
                <button
                  disabled={active}
                  onClick={() => runCase(acceptanceCase.id)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-400 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {run.state === "passed" ? "Run again" : active ? "Running…" : "Run acceptance"}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
