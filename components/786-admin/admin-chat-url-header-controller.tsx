"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function normalizeRoute(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return "/"
  const withoutOrigin = trimmed.replace(/^https?:\/\/[^/]+/i, "")
  const withoutPreviewHost = withoutOrigin.replace(/^\/?(?:786\.preview|786\.chat|\.replit\.dev)/i, "")
  const route = `/${withoutPreviewHost.replace(/^\/+/, "").split(/[?#]/)[0]}`
  return route.replace(/\/+$/, "") || "/"
}

export function AdminChatUrlHeaderController() {
  useEffect(() => {
    let currentRoute = "/"
    let input: HTMLInputElement | null = null
    let stopped = false
    let requestSequence = 0
    const history = ["/"]
    let historyIndex = 0

    function currentPreviewFrame() {
      return document.querySelector<HTMLIFrameElement>('iframe[title$=" preview"]')
    }

    function setRouteError(message = "") {
      if (!input) return
      input.classList.toggle("ring-2", Boolean(message))
      input.classList.toggle("ring-rose-400", Boolean(message))
      input.title = message || `Preview route ${currentRoute}`
    }

    async function applyRoute(routeValue: string, pushHistory = true) {
      const route = normalizeRoute(routeValue)
      currentRoute = route
      if (input) input.value = route

      if (pushHistory && history[historyIndex] !== route) {
        history.splice(historyIndex + 1)
        history.push(route)
        historyIndex = history.length - 1
      }

      const projectId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY)
      const iframe = currentPreviewFrame()
      if (!projectId || !iframe) return
      if (iframe.dataset.previewRoute === route && iframe.dataset.previewProject === projectId) return
      if (iframe.dataset.previewRoutePending === `${projectId}:${route}`) return

      const sequence = ++requestSequence
      iframe.dataset.previewRoutePending = `${projectId}:${route}`

      try {
        const response = await fetch(`/api/786-admin/projects/${projectId}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Project could not be loaded")
        const json = await response.json()
        const files = (json.project?.files || {}) as Record<string, string>
        const expected = route === "/" ? "app/page.tsx" : `app/${route.replace(/^\//, "")}/page.tsx`
        const alternatives = route === "/" ? [expected, "app/page.jsx"] : [expected, expected.replace(/\.tsx$/, ".jsx")]
        if (!alternatives.some((path) => Boolean(files[path]))) throw new Error(`Page ${route} was not generated`)
        if (stopped || sequence !== requestSequence || iframe !== currentPreviewFrame()) return

        const nextSrc = `/api/projects/${encodeURIComponent(projectId)}/preview?raw=1&path=${encodeURIComponent(route)}&v=${Date.now()}`
        iframe.dataset.previewRoute = route
        iframe.dataset.previewProject = projectId
        delete iframe.dataset.previewRoutePending
        iframe.removeAttribute("srcdoc")
        iframe.src = nextSrc
        setRouteError()
      } catch (error) {
        if (sequence !== requestSequence) return
        delete iframe.dataset.previewRoutePending
        setRouteError(error instanceof Error ? error.message : "Route preview failed")
      }
    }

    function button(label: string, title: string, onClick: () => void) {
      const node = document.createElement("button")
      node.type = "button"
      node.textContent = label
      node.title = title
      node.className = "grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      node.addEventListener("click", onClick)
      return node
    }

    function install() {
      if (stopped || input) return
      const header = document.querySelector("header")
      if (!header) return
      const target = Array.from(header.querySelectorAll<HTMLDivElement>("div")).find((element) => element.textContent?.trim() === "/")
      if (!target) return

      target.innerHTML = ""
      target.className = "ml-3 mr-auto flex h-10 min-w-0 max-w-[620px] flex-1 items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-2 shadow-inner"
      const back = button("←", "Back", () => {
        if (historyIndex <= 0) return
        historyIndex -= 1
        void applyRoute(history[historyIndex], false)
      })
      const forward = button("→", "Forward", () => {
        if (historyIndex >= history.length - 1) return
        historyIndex += 1
        void applyRoute(history[historyIndex], false)
      })
      const refresh = button("↻", "Refresh preview", () => {
        const iframe = currentPreviewFrame()
        if (iframe) {
          delete iframe.dataset.previewRoute
          delete iframe.dataset.previewProject
        }
        void applyRoute(currentRoute, false)
      })
      refresh.dataset.routeRefresh = "true"
      const link = document.createElement("span")
      link.textContent = "↗"
      link.className = "ml-1 text-xs text-slate-500"
      const host = document.createElement("span")
      host.textContent = "786.chat"
      host.className = "shrink-0 text-[11px] font-semibold text-slate-400"

      input = document.createElement("input")
      input.value = currentRoute
      input.placeholder = "/login"
      input.setAttribute("aria-label", "Preview route")
      input.className = "min-w-0 flex-1 bg-transparent px-1 text-left text-xs font-semibold text-slate-100 outline-none placeholder:text-slate-600"
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void applyRoute(input?.value || "/")
      })
      input.addEventListener("blur", () => void applyRoute(input?.value || "/"))
      target.append(back, forward, refresh, link, host, input)
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; path?: string } | null
      if (data?.type === "786-preview-route" && typeof data.path === "string") void applyRoute(data.path)
    }
    window.addEventListener("message", onMessage)

    const observer = new MutationObserver(() => {
      install()
      const iframe = currentPreviewFrame()
      if (!iframe) return
      const projectId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || ""
      const applied = iframe.dataset.previewRoute === currentRoute && iframe.dataset.previewProject === projectId
      const pending = iframe.dataset.previewRoutePending === `${projectId}:${currentRoute}`
      if (!applied && !pending) void applyRoute(currentRoute, false)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    install()

    return () => {
      stopped = true
      requestSequence += 1
      observer.disconnect()
      window.removeEventListener("message", onMessage)
    }
  }, [])

  return null
}
