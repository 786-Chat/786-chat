"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function normalizeRoute(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return "/"
  const withoutOrigin = trimmed.replace(/^https?:\/\/[^/]+/i, "")
  const withoutPreviewHost = withoutOrigin.replace(/^\/?(?:786\.preview|\.replit\.dev)/i, "")
  const route = `/${withoutPreviewHost.replace(/^\/+/, "").split(/[?#]/)[0]}`
  return route.replace(/\/+$/, "") || "/"
}

function routeFromFile(path: string) {
  const normalized = path.replace(/^src\//, "")
  const match = normalized.match(/^app\/(.*\/)?page\.(?:tsx?|jsx?)$/)
  if (!match) return null
  const parts = (match[1] || "").split("/").filter(Boolean).filter((part) => !/^\(.*\)$/.test(part))
  return parts.length ? `/${parts.join("/")}` : "/"
}

function componentName(source: string) {
  return source.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)?.[1]
    || source.match(/(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)[\s\S]*?export\s+default\s+\1/)?.[1]
    || source.match(/export\s+default\s+([A-Za-z_$][\w$]*)/)?.[1]
    || null
}

export function AdminChatUrlHeaderController() {
  useEffect(() => {
    let currentRoute = "/"
    let input: HTMLInputElement | null = null
    let stopped = false
    const history = ["/"]
    let historyIndex = 0

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
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title$=" preview"]')
      if (!projectId || !iframe) return

      try {
        const response = await fetch(`/api/786-admin/projects/${projectId}`, { cache: "no-store" })
        if (!response.ok) throw new Error("Project could not be loaded")
        const json = await response.json()
        const files = (json.project?.files || {}) as Record<string, string>
        const entry = Object.entries(files).find(([path]) => routeFromFile(path) === route)
        if (!entry) throw new Error(`Page ${route} was not found`)

        const name = componentName(entry[1])
        if (!name) throw new Error(`Page ${route} cannot be previewed yet`)

        const base = iframe.dataset.routeBaseSrcdoc || iframe.getAttribute("srcdoc") || ""
        if (!base) throw new Error("Preview is not ready")
        iframe.dataset.routeBaseSrcdoc = base

        const next = base.replace(
          /root\.render\(React\.createElement\(globalThis\.__Page/,
          `root.render(React.createElement(globalThis.${name}`,
        )
        if (next === base && route !== "/") throw new Error(`Page ${route} cannot be previewed yet`)
        iframe.srcdoc = next
        input?.classList.remove("ring-2", "ring-rose-400")
        if (input) input.title = `Preview route ${route}`
      } catch (error) {
        input?.classList.add("ring-2", "ring-rose-400")
        if (input) input.title = error instanceof Error ? error.message : "Route preview failed"
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
      const refresh = button("↻", "Refresh preview", () => void applyRoute(currentRoute, false))
      const link = document.createElement("span")
      link.textContent = "↗"
      link.className = "ml-1 text-xs text-slate-500"
      const host = document.createElement("span")
      host.textContent = "786.preview"
      host.className = "shrink-0 text-[11px] font-semibold text-slate-400"

      input = document.createElement("input")
      input.value = "/"
      input.placeholder = "/login"
      input.setAttribute("aria-label", "Preview route")
      input.className = "min-w-0 flex-1 bg-transparent px-1 text-left text-xs font-semibold text-slate-100 outline-none placeholder:text-slate-600"
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void applyRoute(input?.value || "/")
      })
      input.addEventListener("blur", () => void applyRoute(input?.value || "/"))
      target.append(back, forward, refresh, link, host, input)
    }

    const observer = new MutationObserver(() => {
      install()
      if (currentRoute !== "/") {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe[title$=" preview"]')
        if (iframe && !iframe.dataset.routeApplied) {
          iframe.dataset.routeApplied = "1"
          void applyRoute(currentRoute, false)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    install()

    return () => {
      stopped = true
      observer.disconnect()
    }
  }, [])

  return null
}
