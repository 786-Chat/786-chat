"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const BUTTON_ID = "admin-chat-deployment-center-button"
const DIALOG_ID = "admin-chat-deployment-center-dialog"

type Deployment = Record<string, unknown>
type Summary = Record<string, unknown>

function activeProjectId() {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}
function closeDialog() { document.getElementById(DIALOG_ID)?.remove() }
function esc(value: unknown) { return String(value ?? "").replace(/[<>&]/g, "") }
function when(value: unknown) {
  const date = new Date(String(value ?? ""))
  return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleString()
}
function button(label: string, primary = false) {
  const el = document.createElement("button")
  el.type = "button"
  el.textContent = label
  Object.assign(el.style, {
    border: primary ? "1px solid rgba(168,85,247,.7)" : "1px solid rgba(255,255,255,.13)",
    background: primary ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.07)",
    color: "white", padding: "9px 12px", borderRadius: "12px", fontWeight: "800", cursor: "pointer",
  })
  return el
}
function pick(item: Deployment, ...keys: string[]) {
  for (const key of keys) if (item[key] !== undefined && item[key] !== null) return item[key]
  return null
}

async function openDialog() {
  const projectId = activeProjectId()
  if (!projectId) return window.alert("Open or create a project first.")
  closeDialog()

  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center", padding: "18px", background: "rgba(2,6,23,.84)", backdropFilter: "blur(16px)" })
  const card = document.createElement("section")
  Object.assign(card.style, { width: "min(1040px,100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", padding: "22px", borderRadius: "24px", border: "1px solid rgba(59,130,246,.35)", background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(15,23,42,.99))", color: "white", boxShadow: "0 32px 110px rgba(0,0,0,.75)", fontFamily: "system-ui,sans-serif" })
  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" })
  const title = document.createElement("div")
  title.innerHTML = '<h2 style="margin:0;font-size:22px">Deployment center</h2><p style="margin:5px 0 0;color:#aebbd0;font-size:13px">Build history, deployment status, logs, and preview links.</p>'
  const close = button("Close")
  close.onclick = closeDialog
  header.append(title, close)
  const body = document.createElement("div")
  body.innerHTML = '<div style="margin-top:18px;color:#aebbd0">Loading deployment history…</div>'
  card.append(header, body)
  overlay.append(card)
  overlay.onclick = (event) => { if (event.target === overlay) closeDialog() }
  document.body.append(overlay)

  try {
    const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/deployments?limit=50`, { credentials: "include", cache: "no-store" })
    const data = await response.json().catch(() => null) as null | { deployments?: Deployment[]; summary?: Summary; error?: string }
    if (!response.ok) throw new Error(data?.error || "Could not load deployments")
    const deployments = Array.isArray(data?.deployments) ? data!.deployments! : []
    const summary = data?.summary || {}
    body.replaceChildren()

    const stats = document.createElement("div")
    Object.assign(stats.style, { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "10px", margin: "18px 0" })
    const statItems: Array<[string, unknown]> = [
      ["Total", summary.total ?? deployments.length],
      ["Passed", summary.passed ?? summary.successful ?? 0],
      ["Failed", summary.failed ?? 0],
      ["Running", summary.running ?? 0],
      ["Success rate", summary.success_rate ?? summary.successRate ?? "—"],
    ]
    for (const [label, value] of statItems) {
      const item = document.createElement("div")
      item.innerHTML = `<div style="color:#94a3b8;font-size:12px">${label}</div><strong style="display:block;margin-top:5px;font-size:20px">${esc(value)}</strong>`
      Object.assign(item.style, { padding: "14px", borderRadius: "15px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" })
      stats.append(item)
    }
    body.append(stats)

    const list = document.createElement("div")
    Object.assign(list.style, { display: "grid", gap: "10px" })
    if (!deployments.length) list.innerHTML = '<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">No builds or deployments yet.</div>'
    for (const item of deployments) {
      const status = pick(item, "status", "build_status", "deployment_status") || "unknown"
      const url = pick(item, "deployment_url", "vercel_url", "preview_url", "url")
      const githubUrl = pick(item, "github_pr_url", "pull_request_url")
      const created = pick(item, "created_at", "started_at", "updated_at")
      const completed = pick(item, "completed_at", "finished_at")
      const row = document.createElement("article")
      Object.assign(row.style, { padding: "15px", borderRadius: "16px", background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)" })
      const name = pick(item, "title", "build_id", "id", "branch_name") || "Deployment"
      row.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><strong>${esc(name)}</strong><div style="margin-top:5px;color:#9fb0c8;font-size:12px">${when(created)}${completed ? ` → ${when(completed)}` : ""}</div></div><span style="padding:5px 9px;border-radius:999px;background:rgba(59,130,246,.17);font-size:12px;font-weight:800">${esc(status)}</span></div>`
      const actions = document.createElement("div")
      Object.assign(actions.style, { display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "12px" })
      if (typeof url === "string" && url) {
        const open = button("Open deployment", true)
        open.onclick = () => window.open(url.startsWith("http") ? url : `https://${url}`, "_blank", "noopener,noreferrer")
        actions.append(open)
      }
      if (typeof githubUrl === "string" && githubUrl) {
        const openGitHub = button("Open GitHub PR")
        openGitHub.onclick = () => window.open(githubUrl, "_blank", "noopener,noreferrer")
        actions.append(openGitHub)
      }
      const logs = pick(item, "logs", "build_logs", "error_message")
      if (typeof logs === "string" && logs) {
        const showLogs = button("View logs")
        showLogs.onclick = () => window.alert(logs.slice(0, 12000))
        actions.append(showLogs)
      }
      row.append(actions)
      list.append(row)
    }
    body.append(list)
  } catch (error) {
    body.innerHTML = `<div style="margin-top:18px;padding:18px;border-radius:16px;background:rgba(127,29,29,.22);color:#fecaca">${esc(error instanceof Error ? error.message : "Could not load deployments")}</div>`
  }
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return
  const el = button("Deployments")
  el.id = BUTTON_ID
  el.title = "Deployment history and status"
  Object.assign(el.style, { height: "42px", padding: "0 14px", borderRadius: "14px", border: "1px solid rgba(59,130,246,.35)", background: "rgba(30,64,175,.2)", color: "#eff6ff" })
  el.onclick = () => void openDialog()
  header.append(el)
}

export function AdminChatDeploymentCenter() {
  useEffect(() => {
    installButton()
    const timer = window.setInterval(installButton, 700)
    const observer = new MutationObserver(installButton)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.clearInterval(timer); observer.disconnect(); document.getElementById(BUTTON_ID)?.remove(); closeDialog() }
  }, [])
  return null
}
