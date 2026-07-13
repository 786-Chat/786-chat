"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const BUTTON_ID = "admin-chat-ai-edit-review-button"
const DIALOG_ID = "admin-chat-ai-edit-review-dialog"

type Change = { path: string; action: "upsert" | "delete"; content?: string }
type Proposal = {
  id: string
  prompt: string
  summary: string
  provider: string | null
  model: string | null
  status: "proposed" | "applied" | "rejected" | "conflict" | "failed"
  changes: Change[]
  error_message: string | null
  created_at: string
}

function activeProjectId() {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function removeDialog() { document.getElementById(DIALOG_ID)?.remove() }

function button(label: string, primary = false) {
  const el = document.createElement("button")
  el.type = "button"
  el.textContent = label
  Object.assign(el.style, {
    border: primary ? "1px solid rgba(168,85,247,.75)" : "1px solid rgba(255,255,255,.14)",
    background: primary ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.07)",
    color: "white", padding: "9px 12px", borderRadius: "12px", fontWeight: "800", cursor: "pointer",
  })
  return el
}

async function load(projectId: string): Promise<Proposal[]> {
  const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/ai-edits?limit=50`, { cache: "no-store", credentials: "include" })
  const data = await response.json().catch(() => null) as { proposals?: Proposal[]; error?: string } | null
  if (!response.ok) throw new Error(data?.error || "Could not load AI edits")
  return Array.isArray(data?.proposals) ? data!.proposals! : []
}

async function update(projectId: string, proposalId: string, action: "apply" | "reject", acceptedPaths?: string[]) {
  const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/ai-edits`, {
    method: "PATCH", credentials: "include", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposalId, action, acceptedPaths }),
  })
  const data = await response.json().catch(() => null) as { error?: string; conflicts?: string[] } | null
  if (!response.ok) {
    const conflicts = Array.isArray(data?.conflicts) && data!.conflicts!.length ? ` Conflicts: ${data!.conflicts!.join(", ")}` : ""
    throw new Error((data?.error || "Could not update AI edit") + conflicts)
  }
}

function safe(value: string) { return value.replace(/[<>&]/g, "") }
function when(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString() }

async function openDialog() {
  const projectId = activeProjectId()
  if (!projectId) return window.alert("Open or create a project first.")
  removeDialog()

  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center", padding: "18px", background: "rgba(2,6,23,.84)", backdropFilter: "blur(16px)" })
  const card = document.createElement("section")
  Object.assign(card.style, { width: "min(1040px,100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", padding: "22px", borderRadius: "24px", border: "1px solid rgba(168,85,247,.35)", background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(30,14,57,.99))", color: "white", boxShadow: "0 32px 110px rgba(0,0,0,.75)", fontFamily: "system-ui,sans-serif" })
  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" })
  const title = document.createElement("div")
  title.innerHTML = `<h2 style="margin:0;font-size:22px">AI edit review</h2><p style="margin:5px 0 0;color:#aebbd0;font-size:13px">Review every proposed file, apply selected changes, or reject the proposal.</p>`
  const close = button("Close")
  close.onclick = removeDialog
  header.append(title, close)
  const list = document.createElement("div")
  Object.assign(list.style, { display: "grid", gap: "14px", marginTop: "18px" })
  list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">Loading proposals…</div>`
  card.append(header, list)
  overlay.append(card)
  overlay.onclick = (event) => { if (event.target === overlay) removeDialog() }
  document.body.append(overlay)

  try {
    const proposals = await load(projectId)
    list.replaceChildren()
    if (!proposals.length) {
      list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">No AI edit proposals yet.</div>`
      return
    }

    for (const proposal of proposals) {
      const article = document.createElement("article")
      Object.assign(article.style, { padding: "16px", borderRadius: "18px", border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.045)" })
      const meta = document.createElement("div")
      meta.innerHTML = `<strong style="font-size:15px">${safe(proposal.summary || "AI edit")}</strong><div style="margin-top:5px;color:#9fb0c8;font-size:12px">${when(proposal.created_at)} · ${safe(proposal.status)}${proposal.model ? ` · ${safe(proposal.model)}` : ""}</div><p style="margin:10px 0;color:#d8e0ee;font-size:13px">${safe(proposal.prompt)}</p>`
      article.append(meta)

      const accepted = new Set(proposal.changes.map((item) => item.path))
      const changes = document.createElement("div")
      Object.assign(changes.style, { display: "grid", gap: "9px", marginTop: "12px" })
      for (const change of proposal.changes) {
        const row = document.createElement("label")
        Object.assign(row.style, { display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px", alignItems: "start", padding: "12px", borderRadius: "14px", background: "rgba(15,23,42,.72)", border: "1px solid rgba(255,255,255,.08)" })
        const check = document.createElement("input")
        check.type = "checkbox"
        check.checked = true
        check.disabled = proposal.status !== "proposed" && proposal.status !== "conflict"
        check.onchange = () => check.checked ? accepted.add(change.path) : accepted.delete(change.path)
        const body = document.createElement("div")
        const preview = change.action === "delete" ? "File will be deleted" : (change.content || "").slice(0, 1200)
        body.innerHTML = `<div style="font-weight:800;font-size:13px">${safe(change.action.toUpperCase())} · ${safe(change.path)}</div><pre style="white-space:pre-wrap;word-break:break-word;margin:8px 0 0;max-height:220px;overflow:auto;color:#cbd5e1;font-size:12px;line-height:1.45">${safe(preview)}</pre>`
        row.append(check, body)
        changes.append(row)
      }
      article.append(changes)

      if (proposal.error_message) {
        const error = document.createElement("div")
        error.textContent = proposal.error_message
        Object.assign(error.style, { marginTop: "10px", color: "#fecaca", fontSize: "12px" })
        article.append(error)
      }

      const actions = document.createElement("div")
      Object.assign(actions.style, { display: "flex", flexWrap: "wrap", gap: "9px", marginTop: "14px" })
      if (proposal.status === "proposed" || proposal.status === "conflict") {
        const apply = button("Apply selected", true)
        const all = button("Select all")
        const none = button("Select none")
        const reject = button("Reject proposal")
        all.onclick = () => { accepted.clear(); proposal.changes.forEach((item) => accepted.add(item.path)); changes.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => { el.checked = true }) }
        none.onclick = () => { accepted.clear(); changes.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => { el.checked = false }) }
        apply.onclick = async () => {
          if (!accepted.size) return window.alert("Select at least one file.")
          apply.disabled = true; apply.textContent = "Applying…"
          try { await update(projectId, proposal.id, "apply", [...accepted]); removeDialog(); window.location.reload() }
          catch (error) { window.alert(error instanceof Error ? error.message : "Could not apply edit"); apply.disabled = false; apply.textContent = "Apply selected" }
        }
        reject.onclick = async () => {
          if (!window.confirm("Reject this AI edit proposal?")) return
          reject.disabled = true
          try { await update(projectId, proposal.id, "reject"); removeDialog(); await openDialog() }
          catch (error) { window.alert(error instanceof Error ? error.message : "Could not reject edit"); reject.disabled = false }
        }
        actions.append(apply, all, none, reject)
      }
      article.append(actions)
      list.append(article)
    }
  } catch (error) {
    list.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(127,29,29,.22);color:#fecaca">${safe(error instanceof Error ? error.message : "Could not load AI edits")}</div>`
  }
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return
  const el = button("AI Edits")
  el.id = BUTTON_ID
  el.title = "Review and apply AI file changes"
  Object.assign(el.style, { height: "42px", padding: "0 14px", borderRadius: "14px", border: "1px solid rgba(34,211,238,.35)", background: "rgba(8,145,178,.16)", color: "#ecfeff" })
  el.onclick = () => void openDialog()
  header.append(el)
}

export function AdminChatAiEditReview() {
  useEffect(() => {
    installButton()
    const timer = window.setInterval(installButton, 700)
    const observer = new MutationObserver(installButton)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.clearInterval(timer); observer.disconnect(); document.getElementById(BUTTON_ID)?.remove(); removeDialog() }
  }, [])
  return null
}
