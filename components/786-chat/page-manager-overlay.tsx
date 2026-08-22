"use client"

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Trash2,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  generateBuilderProject,
  loadBuilderProject,
  queueBuilderBuild,
  saveBuilderProject,
} from "./api"
import type { BuilderProject } from "./contracts"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"

const PROTECTED_PAGE_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify",
  "/auth",
])

type ManagedPage = {
  route: string
  label: string
  file: string
  protected: boolean
}

type PageManagerState = {
  order: string[]
  hidden: string[]
}

function pageLabel(route: string) {
  if (route === "/") return "Home"
  return route
    .slice(1)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function routeFromPageFile(path: string) {
  if (!/^(?:src\/)?app\//.test(path) || !/\/page\.(?:tsx?|jsx?)$/.test(`/${path}`)) return null
  const relative = path
    .replace(/^(?:src\/)?app\//, "")
    .replace(/(?:^|\/)page\.(?:tsx?|jsx?)$/, "")
  const segments = relative
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("(") && !segment.startsWith("@"))

  if (segments.some((segment) => segment.includes("[") || segment.includes("]"))) return null
  if (segments.length > 1) return null
  return segments.length ? `/${segments[0]}` : "/"
}

function manageablePages(files: Record<string, string>): ManagedPage[] {
  const seen = new Set<string>()
  const pages: ManagedPage[] = []
  for (const file of Object.keys(files)) {
    const route = routeFromPageFile(file)
    if (!route || seen.has(route)) continue
    seen.add(route)
    pages.push({
      route,
      label: pageLabel(route),
      file,
      protected: PROTECTED_PAGE_ROUTES.has(route),
    })
  }
  return pages
}

function normalizePageManagerState(project: BuilderProject, pages: ManagedPage[]): PageManagerState {
  const available = new Set(pages.map((page) => page.route))
  const raw = project.metadata.page_manager
  const record = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
  const rawOrder = Array.isArray(record.order) ? record.order.filter((value): value is string => typeof value === "string") : []
  const rawHidden = Array.isArray(record.hidden) ? record.hidden.filter((value): value is string => typeof value === "string") : []
  const order = rawOrder.filter((route) => available.has(route))
  for (const page of pages) {
    if (!order.includes(page.route)) order.push(page.route)
  }
  return {
    order,
    hidden: rawHidden.filter((route) => available.has(route)),
  }
}

async function savePageManagerState(project: BuilderProject, state: PageManagerState, label: string) {
  const response = await fetch(`/api/786-chat/projects/${project.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: project.prompt,
      files: project.files,
      preview_state: project.previewState,
      metadata: { ...project.metadata, page_manager: state },
      revision_label: label,
      revision_source: "page-manager",
      record_generation_job: false,
    }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(payload.error || "Page manager state could not be saved.")
  }
  return (await loadBuilderProject(project.id)).project
}

function navigationPositionInstruction(state: PageManagerState, route: string) {
  const index = state.order.indexOf(route)
  const before = index > 0 ? state.order[index - 1] : null
  const after = index >= 0 && index < state.order.length - 1 ? state.order[index + 1] : null
  if (before && after) return `Place it after ${before} and before ${after}.`
  if (before) return `Place it immediately after ${before}.`
  if (after) return `Place it immediately before ${after}.`
  return "Place it in the primary navigation."
}

export function BuilderPageManagerOverlay() {
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState<BuilderProject | null>(null)
  const [busyRoute, setBusyRoute] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const refreshProject = useCallback(async () => {
    const projectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
    if (!projectId) {
      setProject(null)
      return
    }
    try {
      const loaded = await loadBuilderProject(projectId)
      setProject(loaded.project)
    } catch {
      setProject(null)
    }
  }, [])

  useEffect(() => {
    void refreshProject()
    const timer = window.setInterval(() => {
      const currentId = localStorage.getItem(ACTIVE_PROJECT_KEY)
      if (currentId !== project?.id) void refreshProject()
    }, 1200)
    return () => window.clearInterval(timer)
  }, [project?.id, refreshProject])

  useEffect(() => {
    if (open) void refreshProject()
  }, [open, refreshProject])

  const pages = useMemo(() => manageablePages(project?.files || {}), [project])
  const state = useMemo(
    () => project ? normalizePageManagerState(project, pages) : { order: [], hidden: [] },
    [pages, project],
  )
  const pageMap = useMemo(() => new Map(pages.map((page) => [page.route, page])), [pages])
  const orderedPages = useMemo(
    () => state.order.flatMap((route) => {
      const page = pageMap.get(route)
      return page ? [page] : []
    }),
    [pageMap, state.order],
  )

  async function applyPageEdit(page: ManagedPage, instruction: string, nextState: PageManagerState, label: string, removing = false) {
    if (!project || busyRoute) return
    setBusyRoute(page.route)
    setNotice("")
    setError("")
    try {
      const generated = await generateBuilderProject({
        message: instruction,
        projectId: project.id,
        attachments: [],
        existing: {
          title: project.title,
          description: project.description,
          fileTree: Object.keys(project.files),
          keyFiles: project.files,
        },
      })
      let saved = await saveBuilderProject({
        currentProjectId: project.id,
        userPrompt: label,
        generated,
      })
      if (removing && manageablePages(saved.files).some((candidate) => candidate.route === page.route)) {
        throw new Error(`${page.label} was not removed safely. The original page is still present, so no page-manager state was changed.`)
      }
      saved = await savePageManagerState(saved, nextState, `Page manager: ${label}`)
      setProject(saved)
      setNotice(`${label}. Rebuilding verified preview…`)
      await queueBuilderBuild(saved.id)
      window.setTimeout(() => window.location.reload(), 700)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The page change could not be completed.")
    } finally {
      setBusyRoute("")
    }
  }

  async function movePage(page: ManagedPage, offset: -1 | 1) {
    const index = state.order.indexOf(page.route)
    const target = index + offset
    if (index < 0 || target < 0 || target >= state.order.length || state.hidden.includes(page.route)) return
    const order = [...state.order]
    const targetRoute = order[target]
    ;[order[index], order[target]] = [order[target], order[index]]
    const direction = offset < 0 ? "before" : "after"
    const instruction = [
      "Edit only the existing application's primary navigation order.",
      `Move the navigation item for ${page.label} (${page.route}) one position ${offset < 0 ? "left/earlier" : "right/later"}, ${direction} ${targetRoute}.`,
      "Update every primary navigation variant consistently, including desktop, tablet and mobile menus.",
      "Do not rename, delete or recreate routes. Do not redesign page content. Preserve authentication, backend logic, APIs and data.",
      "Remove no other navigation items. Ensure the complete project still type-checks and builds.",
    ].join(" ")
    await applyPageEdit(page, instruction, { ...state, order }, `Moved ${page.label} ${offset < 0 ? "left" : "right"}`)
  }

  async function togglePage(page: ManagedPage) {
    const hidden = state.hidden.includes(page.route)
    const nextHidden = hidden
      ? state.hidden.filter((route) => route !== page.route)
      : [...state.hidden, page.route]
    const instruction = hidden
      ? [
          `Restore ${page.label} (${page.route}) to the application's primary navigation.`,
          navigationPositionInstruction({ ...state, hidden: nextHidden }, page.route),
          "Add it consistently to desktop, tablet and mobile primary menus using the existing navigation style.",
          "Do not change the route, page content, authentication, backend logic, APIs or data. Ensure the project still builds.",
        ].join(" ")
      : [
          `Hide ${page.label} (${page.route}) from the application's primary navigation only.`,
          "Keep the page route, page files, API routes, database tables and all existing data intact so the page can be restored later.",
          "Remove only primary desktop, tablet and mobile navigation links/buttons for this route. Do not redesign anything else. Ensure the project still builds.",
        ].join(" ")
    await applyPageEdit(page, instruction, { ...state, hidden: nextHidden }, `${hidden ? "Showed" : "Hid"} ${page.label}`)
  }

  async function removePage(page: ManagedPage) {
    if (page.protected || !project) return
    const confirmed = window.confirm(
      `Remove the ${page.label} page?\n\nThis removes the page UI and navigation link. Shared backend/API/database data will be preserved.`,
    )
    if (!confirmed) return
    const nextState = {
      order: state.order.filter((route) => route !== page.route),
      hidden: state.hidden.filter((route) => route !== page.route),
    }
    const instruction = [
      `Remove the optional page route ${page.route} (${page.file}) from this existing application because the customer no longer requires it.`,
      "Remove navigation links and imports that exist only for this page, and repair any now-broken internal links.",
      "Do not delete database tables, API routes, stored customer data, authentication infrastructure, or shared backend services. Preserve all other pages and features.",
      "Do not remove protected login, registration, password-reset or verification routes. Ensure the complete project type-checks and builds after the removal.",
    ].join(" ")
    await applyPageEdit(page, instruction, nextState, `Removed ${page.label} page`, true)
  }

  if (!project) return null

  return (
    <div className="fixed right-3 top-[72px] z-[75] font-sans text-slate-100">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-300/30 bg-[#08111f]/95 px-3 text-[14px] font-black text-cyan-100 shadow-[0_14px_40px_rgba(0,0,0,.45)] backdrop-blur-xl"
          aria-label="Open pages manager"
        >
          <FileText className="h-4 w-4" /> Pages
        </button>
      ) : (
        <aside className="flex max-h-[calc(100vh-88px)] w-[360px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#08111f]/[.98] shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <header className="flex shrink-0 items-center border-b border-[#263550] px-4 py-3">
            <FileText className="mr-2 h-4 w-4 text-cyan-300" />
            <div>
              <b className="block text-[14px]">Pages &amp; navigation</b>
              <span className="text-[12px] text-slate-500">Move, hide, show or remove optional pages</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10" aria-label="Close pages manager">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {orderedPages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#345078] p-4 text-[14px] text-slate-400">No top-level pages are available yet.</p>
            ) : (
              <div className="space-y-2">
                {orderedPages.map((page, index) => {
                  const hidden = state.hidden.includes(page.route)
                  const working = busyRoute === page.route
                  return (
                    <article key={page.route} className={`rounded-xl border p-3 ${hidden ? "border-amber-300/25 bg-amber-300/[.05]" : "border-[#263550] bg-[#0d1526]"}`}>
                      <div className="flex items-start gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <b className="truncate text-[14px]">{page.label}</b>
                            {hidden && <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-200">Hidden</span>}
                            {page.protected && <span className="inline-flex items-center gap-1 rounded bg-violet-300/10 px-1.5 py-0.5 text-[11px] font-bold text-violet-200"><Lock className="h-2.5 w-2.5" /> Protected</span>}
                          </span>
                          <code className="mt-1 block truncate text-[12px] text-slate-500">{page.route}</code>
                        </span>
                        {working && <Loader2 className="mt-1 h-4 w-4 animate-spin text-cyan-300" />}
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        <button type="button" onClick={() => void movePage(page, -1)} disabled={Boolean(busyRoute) || hidden || index === 0} aria-label={`Move ${page.label} left`} title="Move page left in navigation" className="grid h-8 w-8 place-items-center rounded-lg border border-[#32435f] text-slate-300 disabled:opacity-25">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void movePage(page, 1)} disabled={Boolean(busyRoute) || hidden || index === orderedPages.length - 1} aria-label={`Move ${page.label} right`} title="Move page right in navigation" className="grid h-8 w-8 place-items-center rounded-lg border border-[#32435f] text-slate-300 disabled:opacity-25">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void togglePage(page)} disabled={Boolean(busyRoute)} className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-300/20 px-2.5 text-[12px] font-bold text-cyan-100 disabled:opacity-30">
                          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {hidden ? "Show" : "Hide"}
                        </button>
                        <button type="button" onClick={() => void removePage(page)} disabled={Boolean(busyRoute) || page.protected} title={page.protected ? "Required system page cannot be removed" : "Remove optional page"} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-300/20 px-2.5 text-[12px] font-bold text-rose-200 disabled:cursor-not-allowed disabled:opacity-25">
                          {page.protected ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Remove
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="mt-3 rounded-xl border border-[#263550] bg-[#0a1120] p-3 text-[12px] leading-5 text-slate-400">
              <b className="text-slate-200">Safe page controls:</b> Hide keeps the route and data. Remove deletes only the optional page UI and preserves shared APIs, database tables and stored data. Required auth pages are protected.
            </div>
            {notice && <p className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-400/[.06] p-2 text-[12px] text-emerald-200">{notice}</p>}
            {error && <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-400/[.06] p-2 text-[12px] text-rose-200">{error}</p>}
          </div>
        </aside>
      )}
    </div>
  )
}
