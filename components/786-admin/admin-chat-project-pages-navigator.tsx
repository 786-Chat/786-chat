"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type ProjectResponse = {
  project?: {
    id?: string
    files?: Record<string, unknown>
  }
}

function getActiveProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function normalizePath(value: string): string {
  let path = String(value || "/").trim() || "/"
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || "/"
  } catch {}
  path = path.split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/{2,}/g, "/")
  if (path.length > 1) path = path.replace(/\/$/, "")
  return path || "/"
}

function routeFromPagePath(filePath: string): string | null {
  const normalized = filePath.replace(/^src\//, "")
  const match = normalized.match(/^app\/(.*\/)?page\.(?:tsx?|jsx?)$/)
  if (!match) return null

  const segments = (match[1] || "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment))

  return segments.length === 0 ? "/" : `/${segments.join("/")}`
}

function readablePageName(path: string): string {
  if (path === "/") return "Home"

  return path
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(" / ")
}

function locationStorageKey(projectId: string): string {
  return `786chat_admin_preview_location_v2_${projectId}`
}

function readSavedPath(projectId: string): string {
  if (!projectId) return "/"
  try {
    const parsed = JSON.parse(localStorage.getItem(locationStorageKey(projectId)) || "{}") as { path?: string }
    return normalizePath(parsed.path || "/")
  } catch {
    return "/"
  }
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) =>
      /preview/i.test(frame.title || ""),
    ) || null
  )
}

function ensureNavigator(routes: string[], activePath: string): HTMLSelectElement | null {
  const browserBar = document.getElementById("admin-chat-browser-bar")
  const urlContainer = browserBar?.querySelector<HTMLElement>(".browser-url")
  if (!browserBar || !urlContainer) return null

  let wrapper = browserBar.querySelector<HTMLElement>("#admin-chat-project-pages")
  if (!wrapper) {
    wrapper = document.createElement("label")
    wrapper.id = "admin-chat-project-pages"
    wrapper.className = "browser-chip"
    wrapper.setAttribute("aria-label", "Project pages")
    wrapper.innerHTML = '<span aria-hidden="true">▦</span><select id="admin-chat-project-pages-select" aria-label="Project pages"></select>'
    urlContainer.insertAdjacentElement("beforebegin", wrapper)
  }

  wrapper.style.display = routes.length > 0 ? "inline-flex" : "none"
  wrapper.style.gap = "7px"
  wrapper.style.maxWidth = "220px"
  wrapper.style.paddingRight = "8px"

  const select = wrapper.querySelector<HTMLSelectElement>("#admin-chat-project-pages-select")
  if (!select) return null

  select.style.maxWidth = "170px"
  select.style.border = "0"
  select.style.outline = "0"
  select.style.background = "transparent"
  select.style.color = "inherit"
  select.style.font = "inherit"
  select.style.fontWeight = "800"
  select.style.cursor = "pointer"

  const signature = routes.join("|")
  if (select.dataset.routes !== signature) {
    select.innerHTML = ""
    for (const route of routes) {
      const option = document.createElement("option")
      option.value = route
      option.textContent = readablePageName(route)
      option.style.color = "#0f172a"
      select.appendChild(option)
    }
    select.dataset.routes = signature
  }

  const selected = routes.includes(activePath) ? activePath : routes.includes("/") ? "/" : routes[0]
  if (selected && document.activeElement !== select) select.value = selected
  return select
}

export function AdminChatProjectPagesNavigator() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let projectId = ""
    let routes: string[] = []
    let activePath = "/"
    let requestVersion = 0

    const render = () => {
      const select = ensureNavigator(routes, activePath)
      if (select && select.value !== activePath && routes.includes(activePath)) select.value = activePath
    }

    const loadProjectPages = async (nextProjectId: string) => {
      const version = ++requestVersion
      if (!nextProjectId) {
        routes = []
        activePath = "/"
        render()
        return
      }

      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(nextProjectId)}`, {
          cache: "no-store",
        })
        if (!response.ok) throw new Error(`Project pages request failed (${response.status})`)

        const data = (await response.json()) as ProjectResponse
        if (version !== requestVersion || nextProjectId !== projectId) return

        const files = data.project?.files || {}
        routes = Array.from(
          new Set(
            Object.entries(files)
              .filter(([, content]) => typeof content === "string" && content.trim().length > 0)
              .map(([filePath]) => routeFromPagePath(filePath))
              .filter((route): route is string => Boolean(route)),
          ),
        ).sort((a, b) => {
          if (a === "/") return -1
          if (b === "/") return 1
          return a.localeCompare(b)
        })
        activePath = readSavedPath(projectId)
        render()
      } catch (error) {
        console.error("[786.Chat] project pages navigator failed", error)
        routes = []
        render()
      }
    }

    const syncProject = () => {
      const nextProjectId = getActiveProjectId()
      if (nextProjectId === projectId) {
        render()
        return
      }

      projectId = nextProjectId
      activePath = readSavedPath(projectId)
      void loadProjectPages(projectId)
    }

    const onChange = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLSelectElement) || target.id !== "admin-chat-project-pages-select") return

      const nextPath = normalizePath(target.value)
      if (!routes.includes(nextPath)) return
      activePath = nextPath
      getPreviewIframe()?.contentWindow?.postMessage({ type: "786-preview-navigate", path: nextPath }, "*")
    }

    const onMessage = (event: MessageEvent) => {
      const frame = getPreviewIframe()
      if (!frame || event.source !== frame.contentWindow) return

      const data = event.data as { type?: string; path?: string } | null
      if (!data || data.type !== "786-preview-route-changed" || typeof data.path !== "string") return

      const nextPath = normalizePath(data.path)
      if (!routes.includes(nextPath)) return
      activePath = nextPath
      render()
    }

    syncProject()
    const observer = new MutationObserver(syncProject)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(syncProject, 800)
    document.addEventListener("change", onChange)
    window.addEventListener("message", onMessage)

    return () => {
      requestVersion += 1
      observer.disconnect()
      window.clearInterval(timer)
      document.removeEventListener("change", onChange)
      window.removeEventListener("message", onMessage)
      document.getElementById("admin-chat-project-pages")?.remove()
    }
  }, [pathname])

  return null
}
