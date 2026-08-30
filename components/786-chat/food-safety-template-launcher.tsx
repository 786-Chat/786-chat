"use client"

import { BookOpenCheck, Loader2, Printer, RefreshCw, Settings2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { queueBuilderBuild } from "./api"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"

export function FoodSafetyTemplateLauncher() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  async function createTemplate() {
    if (creating) return
    setCreating(true)
    setError("")

    try {
      const response = await fetch("/api/786-chat/templates/food-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        project?: { id?: string; title?: string }
        error?: string
      }
      if (!response.ok || !payload.project?.id) {
        throw new Error(payload.error || "The Food Safety Record Book project could not be created.")
      }

      localStorage.setItem(ACTIVE_PROJECT_KEY, payload.project.id)

      try {
        await queueBuilderBuild(payload.project.id)
      } catch (buildError) {
        setError(`Project created, but the first preview build could not start: ${buildError instanceof Error ? buildError.message : "Build failed to start."}`)
        return
      }

      router.push("/786.chat")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The Food Safety Record Book project could not be created.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/786.chat/projects")}
          className="mb-5 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/[.08]"
        >
          ← Back to Projects
        </button>

        <section className="overflow-hidden rounded-[32px] border border-emerald-300/15 bg-[#0a1220] shadow-[0_35px_100px_rgba(0,0,0,.4)]">
          <div className="bg-[radial-gradient(circle_at_15%_5%,rgba(217,165,32,.24),transparent_24%),radial-gradient(circle_at_90%_15%,rgba(16,185,129,.18),transparent_28%),linear-gradient(135deg,#073b2c,#0b513d_52%,#101827)] px-6 py-10 sm:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">786.Chat reusable template</p>
                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">Food Safety Record Book</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                  Create a separate editable 197-page, 26-week food-safety project. Change the business name, address, dates,
                  staff, products, ingredients and allergens once in Master Setup and the complete book updates automatically.
                </p>
              </div>
              <div className="grid h-40 w-full max-w-sm place-items-center rounded-3xl border border-white/15 bg-white/[.07] p-5 backdrop-blur lg:w-72">
                <BookOpenCheck className="h-16 w-16 text-amber-300" />
                <div className="text-center">
                  <p className="text-2xl font-black">197 pages</p>
                  <p className="text-xs font-bold text-emerald-50/70">26 weeks · Monday to Sunday</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-10">
            {[
              [Settings2, "Master Setup", "One edit updates business details, staff and HACCP information everywhere."],
              [RefreshCw, "6-month renewal", "Keep the same customer and change the book start, assessment and review dates."],
              [BookOpenCheck, "Customer copies", "Duplicate the project from Projects for a new customer, then edit only their details."],
              [Printer, "Print / Save PDF", "The generated project can print the complete 197-page record book to PDF."],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof BookOpenCheck
              return (
                <article key={String(title)} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                  <FeatureIcon className="h-6 w-6 text-amber-300" />
                  <h2 className="mt-4 font-black">{String(title)}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{String(text)}</p>
                </article>
              )
            })}
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10">
            {error && (
              <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={() => void createTemplate()}
              disabled={creating}
              className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 text-sm font-black text-[#173421] shadow-[0_12px_35px_rgba(217,165,32,.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookOpenCheck className="h-5 w-5" />}
              {creating ? "Creating Food Safety Book…" : "Create Food Safety Record Book Project"}
            </button>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              This creates a new project. It does not alter your existing Raja Catering Operations Platform or any other 786.Chat project.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
