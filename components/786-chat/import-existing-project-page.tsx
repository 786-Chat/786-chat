"use client"

import { ArchiveRestore, CheckCircle2, Loader2, ShieldCheck, UploadCloud } from "lucide-react"
import { useMemo, useState } from "react"

import { importExistingProjectZip } from "@/components/786-chat/project-import"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"

type Progress = {
  stage: string
  detail: string
  current?: number
  total?: number
}

export function ImportExistingProjectPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("FoodSafetyMenu-Migrated")
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const canImport = Boolean(file && title.trim() && !busy)
  const progressText = useMemo(() => {
    if (!progress) return "Ready to import a Replit/source ZIP."
    if (progress.current && progress.total) return `${progress.detail} (${progress.current}/${progress.total})`
    return progress.detail
  }, [progress])

  async function runImport() {
    if (!file || !title.trim() || busy) return
    setBusy(true)
    setDone(false)
    setError("")
    try {
      const result = await importExistingProjectZip(file, title, setProgress)
      localStorage.setItem(ACTIVE_PROJECT_KEY, result.project.id)
      setProgress({
        stage: "done",
        detail: `Imported ${result.sourceFileCount} source files and ${result.assetCount} assets. Opening the new project…`,
      })
      setDone(true)
      window.setTimeout(() => window.location.assign("/786.chat"), 900)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Project import failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050813] px-4 py-10 text-slate-100">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-violet-300/20 bg-[#0a1020]/95 p-6 shadow-2xl shadow-violet-950/30 md:p-9">
        <div className="mb-7 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-violet-500/15 text-violet-200">
            <ArchiveRestore className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-violet-300">786.Chat migration</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Import an existing project</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Creates a brand-new project. Existing Raja Catering and other saved projects are not changed.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-200">New project name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={busy}
              className="h-12 rounded-xl border border-slate-700 bg-[#070c18] px-4 text-base outline-none focus:border-violet-400"
              placeholder="FoodSafetyMenu-Migrated"
            />
          </label>

          <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-400/[.04] p-5 transition hover:bg-cyan-400/[.07]">
            <span className="flex items-center gap-2 text-sm font-bold text-cyan-100"><UploadCloud className="h-4 w-4" /> Source ZIP</span>
            <span className="text-sm text-slate-400">Choose the source ZIP copied from Replit. Secret files such as .env are intentionally skipped.</span>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              disabled={busy}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:font-bold file:text-violet-100"
            />
            {file && <span className="text-xs font-semibold text-emerald-300">Selected: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span>}
          </label>

          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-4 text-sm leading-6 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-amber-100"><ShieldCheck className="h-4 w-4" /> Safe migration rules</div>
            <p className="mt-1">The original Replit project is not deleted or modified. Binary web assets are copied to managed storage. Deployment is not started automatically; compatibility and security review happen first.</p>
          </div>

          {(progress || busy || done) && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm text-slate-200">
              {done ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />}
              <span>{progressText}</span>
            </div>
          )}

          {error && <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">{error}</div>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canImport}
              onClick={() => void runImport()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
              Import as new project
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => window.location.assign("/786.chat")}
              className="h-11 rounded-xl border border-slate-700 bg-[#0b1222] px-5 text-sm font-bold text-slate-200 disabled:opacity-40"
            >
              Back to 786.Chat
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
