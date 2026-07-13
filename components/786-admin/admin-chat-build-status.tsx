"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const ROOT_ID = "admin-chat-build-status"

type Build = {
  status: "queued" | "running" | "passed" | "failed" | "cancelled"
  logs?: string
  error_message?: string | null
  github_pr_url?: string | null
  deployment_url?: string | null
  updated_at?: string
}

function activeProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function removeRoot() {
  document.getElementById(ROOT_ID)?.remove()
}

function statusColor(status: Build["status"]): string {
  if (status === "passed") return "#22c55e"
  if (status === "failed" || status === "cancelled") return "#ef4444"
  if (status === "running") return "#06b6d4"
  return "#f59e0b"
}

function showDetails(build: Build) {
  document.getElementById(`${ROOT_ID}-dialog`)?.remove()
  const overlay = document.createElement("div")
  overlay.id = `${ROOT_ID}-dialog`
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "2147483647", display: "grid",
    placeItems: "center", padding: "18px", background: "rgba(2,6,23,.78)", backdropFilter: "blur(14px)",
  })
  const card = document.createElement("div")
  Object.assign(card.style, {
    width: "min(720px,100%)", maxHeight: "min(760px,calc(100vh - 36px))", overflow: "auto",
    padding: "22px", borderRadius: "22px", border: `1px solid ${statusColor(build.status)}66`,
    background: "linear-gradient(145deg,rgba(8,15,32,.99),rgba(28,15,55,.99))",
    color: "white", boxShadow: "0 30px 100px rgba(0,0,0,.7)", fontFamily: "system-ui,sans-serif",
  })
  const title = document.createElement("h2")
  title.textContent = `Build ${build.status}`
  title.style.margin = "0"
  title.style.textTransform = "capitalize"
  const error = document.createElement("p")
  error.textContent = build.error_message || "Install, lint, TypeScript, build, GitHub publishing, and Vercel deployment status."
  error.style.color = build.error_message ? "#fca5a5" : "#cbd5e1"
  const links = document.createElement("div")
  links.style.display = "flex"
  links.style.flexWrap = "wrap"
  links.style.gap = "10px"
  for (const [label, url] of [["Open GitHub PR", build.github_pr_url], ["Open Vercel preview", build.deployment_url]] as const) {
    if (!url) continue
    const link = document.createElement("a")
    link.href = url
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.textContent = label
    Object.assign(link.style, { padding: "10px 13px", borderRadius: "12px", background: "#7c3aed", color: "white", textDecoration: "none", fontWeight: "800" })
    links.appendChild(link)
  }
  const log = document.createElement("pre")
  log.textContent = build.logs?.trim() || "No build logs yet."
  Object.assign(log.style, { marginTop: "16px", padding: "14px", borderRadius: "14px", background: "#020617", border: "1px solid rgba(255,255,255,.1)", color: "#cbd5e1", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12px", lineHeight: "1.55" })
  const close = document.createElement("button")
  close.textContent = "Close"
  Object.assign(close.style, { marginTop: "14px", width: "100%", padding: "11px", border: "0", borderRadius: "12px", background: "rgba(255,255,255,.1)", color: "white", fontWeight: "800", cursor: "pointer" })
  close.onclick = () => overlay.remove()
  overlay.onclick = (event) => { if (event.target === overlay) overlay.remove() }
  card.append(title, error, links, log, close)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
}

function mountBadge(build: Build | null) {
  removeRoot()
  if (!build) return
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return
  const button = document.createElement("button")
  button.id = ROOT_ID
  button.type = "button"
  button.textContent = `Build: ${build.status}`
  Object.assign(button.style, {
    marginLeft: "8px", padding: "7px 11px", borderRadius: "999px", cursor: "pointer",
    border: `1px solid ${statusColor(build.status)}88`, background: `${statusColor(build.status)}22`,
    color: "white", fontSize: "12px", fontWeight: "900", textTransform: "capitalize",
  })
  button.onclick = () => showDetails(build)
  header.appendChild(button)
}

export function AdminChatBuildStatus() {
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      const id = activeProjectId()
      if (!id) { mountBadge(null); timer = setTimeout(poll, 4000); return }
      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(id)}/build`, { cache: "no-store" })
        const data = await response.json().catch(() => null) as null | { build?: Build | null }
        if (!stopped) mountBadge(response.ok ? data?.build || null : null)
      } catch {
        if (!stopped) mountBadge(null)
      }
      if (!stopped) timer = setTimeout(poll, 5000)
    }

    void poll()
    return () => { stopped = true; if (timer) clearTimeout(timer); removeRoot(); document.getElementById(`${ROOT_ID}-dialog`)?.remove() }
  }, [])

  return null
}
