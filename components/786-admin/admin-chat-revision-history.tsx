"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const BUTTON_ID = "admin-chat-revision-history-button"
const DIALOG_ID = "admin-chat-revision-history-dialog"

type Revision = {
  id: string
  label: string
  source: string
  files?: Record<string, string>
  created_at: string
}

function activeProjectId() {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function removeDialog() {
  document.getElementById(DIALOG_ID)?.remove()
}

function makeButton(label: string, primary = false) {
  const button = document.createElement("button")
  button.type = "button"
  button.textContent = label
  Object.assign(button.style, {
    border: primary ? "1px solid rgba(168,85,247,.7)" : "1px solid rgba(255,255,255,.12)",
    background: primary ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.07)",
    color: "white",
    padding: "9px 12px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  })
  return button
}

async function fetchRevisions(projectId: string): Promise<Revision[]> {
  const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/revisions?limit=50`, {
    cache: "no-store",
    credentials: "include",
  })
  const data = (await response.json().catch(() => null)) as null | { revisions?: Revision[]; error?: string }
  if (!response.ok) throw new Error(data?.error || "Could not load project history")
  return Array.isArray(data?.revisions) ? data!.revisions! : []
}

async function createCheckpoint(projectId: string) {
  const label = window.prompt("Checkpoint name", "Manual checkpoint")?.trim()
  if (!label) return
  const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/revisions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, source: "manual" }),
  })
  const data = (await response.json().catch(() => null)) as null | { error?: string }
  if (!response.ok) throw new Error(data?.error || "Could not create checkpoint")
}

async function restoreRevision(projectId: string, revision: Revision) {
  const confirmed = window.confirm(
    `Restore “${revision.label}”? A safety checkpoint of the current project will be created first.`,
  )
  if (!confirmed) return

  const response = await fetch(
    `/api/786-admin/projects/${encodeURIComponent(projectId)}/revisions/${encodeURIComponent(revision.id)}/restore`,
    { method: "POST", credentials: "include", cache: "no-store" },
  )
  const data = (await response.json().catch(() => null)) as null | { error?: string }
  if (!response.ok) throw new Error(data?.error || "Could not restore revision")

  removeDialog()
  window.location.reload()
}

function revisionDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

async function openDialog() {
  const projectId = activeProjectId()
  if (!projectId) {
    window.alert("Open or create a project first.")
    return
  }

  removeDialog()
  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "grid",
    placeItems: "center",
    padding: "18px",
    background: "rgba(2,6,23,.82)",
    backdropFilter: "blur(16px)",
  })

  const card = document.createElement("section")
  Object.assign(card.style, {
    width: "min(760px,100%)",
    maxHeight: "min(780px,calc(100vh - 36px))",
    overflow: "auto",
    padding: "22px",
    borderRadius: "24px",
    border: "1px solid rgba(168,85,247,.35)",
    background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(30,14,57,.99))",
    color: "white",
    boxShadow: "0 32px 110px rgba(0,0,0,.75)",
    fontFamily: "system-ui,sans-serif",
  })

  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" })
  const heading = document.createElement("div")
  heading.innerHTML = `<h2 style="margin:0;font-size:22px">Project history</h2><p style="margin:5px 0 0;color:#aebbd0;font-size:13px">Restore any saved version. The current state is backed up automatically.</p>`
  const close = makeButton("Close")
  close.onclick = removeDialog
  header.append(heading, close)

  const actions = document.createElement("div")
  Object.assign(actions.style, { display: "flex", gap: "10px", margin: "18px 0" })
  const checkpoint = makeButton("Create checkpoint", true)
  actions.appendChild(checkpoint)

  const list = document.createElement("div")
  Object.assign(list.style, { display: "grid", gap: "10px" })
  list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">Loading history…</div>`

  checkpoint.onclick = async () => {
    checkpoint.disabled = true
    checkpoint.textContent = "Saving…"
    try {
      await createCheckpoint(projectId)
      removeDialog()
      await openDialog()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not create checkpoint")
      checkpoint.disabled = false
      checkpoint.textContent = "Create checkpoint"
    }
  }

  card.append(header, actions, list)
  overlay.appendChild(card)
  overlay.onclick = (event) => { if (event.target === overlay) removeDialog() }
  document.body.appendChild(overlay)

  try {
    const revisions = await fetchRevisions(projectId)
    list.replaceChildren()
    if (!revisions.length) {
      list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">No revisions yet. Create a checkpoint or make an AI edit.</div>`
      return
    }

    for (const revision of revisions) {
      const row = document.createElement("article")
      Object.assign(row.style, {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "14px",
        padding: "14px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,.1)",
        background: "rgba(255,255,255,.045)",
      })
      const fileCount = revision.files ? Object.keys(revision.files).length : 0
      const info = document.createElement("div")
      info.innerHTML = `<strong style="display:block;font-size:14px">${revision.label.replace(/[<>&]/g, "")}</strong><span style="display:block;margin-top:5px;color:#9fb0c8;font-size:12px">${revisionDate(revision.created_at)} · ${revision.source} · ${fileCount} files</span>`
      const restore = makeButton("Restore")
      restore.onclick = async () => {
        restore.disabled = true
        restore.textContent = "Restoring…"
        try {
          await restoreRevision(projectId, revision)
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Could not restore revision")
          restore.disabled = false
          restore.textContent = "Restore"
        }
      }
      row.append(info, restore)
      list.appendChild(row)
    }
  } catch (error) {
    list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(127,29,29,.22);color:#fecaca">${error instanceof Error ? error.message : "Could not load history"}</div>`
  }
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return

  const button = document.createElement("button")
  button.id = BUTTON_ID
  button.type = "button"
  button.textContent = "History"
  button.title = "Project history and restore"
  Object.assign(button.style, {
    height: "42px",
    padding: "0 14px",
    borderRadius: "14px",
    border: "1px solid rgba(168,85,247,.34)",
    background: "rgba(88,28,135,.2)",
    color: "#f5f3ff",
    fontWeight: "800",
    cursor: "pointer",
  })
  button.onclick = () => void openDialog()
  header.appendChild(button)
}

export function AdminChatRevisionHistory() {
  useEffect(() => {
    installButton()
    const timer = window.setInterval(installButton, 700)
    const observer = new MutationObserver(installButton)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
      document.getElementById(BUTTON_ID)?.remove()
      removeDialog()
    }
  }, [])

  return null
}
