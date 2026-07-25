"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function normalizeRoute(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return "/"
  const withoutOrigin = trimmed.replace(/^https?:\/\/[^/]+/i, "")
  const route = `/${withoutOrigin.replace(/^\/+/, "").split(/[?#]/)[0]}`
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

    async function applyRoute(routeValue: string) {
      const route = normalizeRoute(routeValue)
      currentRoute = route
      if (input) input.value = route

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
      } catch (error) {
        input?.classList.add("ring-2", "ring-rose-400")
        if (input) input.title = error instanceof Error ? error.message : "Route preview failed"
      }
    }

    function install() {
      if (stopped || input) return
      const header = document.querySelector("header")
      if (!header) return
      const target = Array.from(header.querySelectorAll<HTMLDivElement>("div")).find((element) => element.textContent?.trim() === "/")
      if (!target) return

      target.innerHTML = ""
      target.classList.remove("hidden")
      target.classList.add("flex")
      const icon = document.createElement("span")
      icon.textContent = "▣"
      icon.className = "text-slate-300"
      input = document.createElement("input")
      input.value = "/"
      input.placeholder = "/login"
      input.setAttribute("aria-label", "Preview route")
      input.className = "min-w-0 flex-1 bg-transparent text-center text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-600"
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void applyRoute(input?.value || "/")
      })
      input.addEventListener("blur", () => void applyRoute(input?.value || "/"))
      target.append(icon, input)
    }

    const observer = new MutationObserver(() => {
      install()
      if (currentRoute !== "/") {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe[title$=" preview"]')
        if (iframe && !iframe.dataset.routeApplied) {
          iframe.dataset.routeApplied = "1"
          void applyRoute(currentRoute)
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
