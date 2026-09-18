"use client"

import { ArrowRight, Route as RouteIcon } from "lucide-react"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useState } from "react"

const ACTIVE_PROJECT_KEY = "786chat_builder_active_project"
const ROUTE_KEY_PREFIX = "786chat_preview_route_"

function normalizeRoute(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "/"

  // Only allow a path/query/hash inside the current verified preview origin.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function locatePreviewHeader(): HTMLElement | null {
  const labels = Array.from(document.querySelectorAll("span"))
  const label = labels.find((node) => {
    const text = node.textContent?.trim()
    return text === "Live preview" || text === "Project code"
  })
  const header = label?.parentElement
  if (!header || !header.className.includes("h-12")) return null
  return header
}

function locatePreviewIframe(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>('iframe[title$="compiled preview"]')
}

function savedRouteForProject(): string {
  const projectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
  if (!projectId) return "/"
  return normalizeRoute(localStorage.getItem(`${ROUTE_KEY_PREFIX}${projectId}`) || "/")
}

export function PreviewRouteBar() {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [route, setRoute] = useState("/")
  const [visible, setVisible] = useState(true)

  const storageKey = useMemo(() => {
    if (typeof window === "undefined") return null
    const projectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
    return projectId ? `${ROUTE_KEY_PREFIX}${projectId}` : null
  }, [host])

  const applyRoute = useCallback((nextValue?: string) => {
    const next = normalizeRoute(nextValue ?? route)
    setRoute(next)

    const projectId = localStorage.getItem(ACTIVE_PROJECT_KEY)
    if (projectId) localStorage.setItem(`${ROUTE_KEY_PREFIX}${projectId}`, next)

    const frame = locatePreviewIframe()
    if (!frame?.src) return

    try {
      const current = new URL(frame.src)
      const target = new URL(next, current.origin)
      if (frame.src !== target.href) frame.src = target.href
    } catch {
      // The iframe can briefly have no deploy URL while a build is switching states.
    }
  }, [route])

  useEffect(() => {
    setRoute(savedRouteForProject())

    let mountedHost: HTMLDivElement | null = null
    let lastProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY)

    const sync = () => {
      const header = locatePreviewHeader()
      const frame = locatePreviewIframe()
      const currentProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY)

      if (currentProjectId !== lastProjectId) {
        lastProjectId = currentProjectId
        setRoute(savedRouteForProject())
      }

      const heading = header?.querySelector("span")?.textContent?.trim()
      setVisible(heading === "Live preview")

      if (header && (!mountedHost || !mountedHost.isConnected)) {
        mountedHost = document.createElement("div")
        mountedHost.dataset.previewRouteBar = "true"
        mountedHost.className = "mx-2 min-w-0 flex-1"
        const deviceControl = Array.from(header.children).find((child) =>
          child instanceof HTMLElement && child.className.includes("ml-auto"),
        )
        header.insertBefore(mountedHost, deviceControl || null)
        setHost(mountedHost)
      }

      if (frame?.src && currentProjectId) {
        const saved = normalizeRoute(localStorage.getItem(`${ROUTE_KEY_PREFIX}${currentProjectId}`) || "/")
        try {
          const current = new URL(frame.src)
          const wanted = new URL(saved, current.origin)
          if (current.pathname + current.search + current.hash !== saved && frame.dataset.routeApplied !== saved) {
            frame.dataset.routeApplied = saved
            frame.src = wanted.href
          }
        } catch {
          // Ignore transient iframe URLs while build status changes.
        }
      }
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    const timer = window.setInterval(sync, 1200)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      mountedHost?.remove()
    }
  }, [])

  if (!host || !visible) return null

  return createPortal(
    <form
      className="mx-auto flex h-7 w-full max-w-[280px] min-w-[118px] items-center overflow-hidden rounded-md border border-cyan-300/20 bg-[#091322]/95 shadow-[0_0_20px_rgba(34,211,238,.08)]"
      onSubmit={(event) => {
        event.preventDefault()
        applyRoute()
      }}
      title="Preview a route such as /portal or /login"
    >
      <RouteIcon className="ml-2 h-3.5 w-3.5 shrink-0 text-cyan-300" />
      <input
        aria-label="Live preview route"
        value={route}
        onChange={(event) => setRoute(event.target.value)}
        onBlur={() => {
          if (!route.trim()) setRoute("/")
        }}
        placeholder="/portal"
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] font-semibold text-cyan-50 outline-none placeholder:text-slate-500"
      />
      <button
        type="submit"
        aria-label="Open preview route"
        className="grid h-full w-8 shrink-0 place-items-center border-l border-cyan-300/15 text-cyan-200 transition hover:bg-cyan-300/10 hover:text-white"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>,
    host,
  )
}
