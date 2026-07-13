"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const BUTTON_ID = "admin-chat-collaboration-button"
const DIALOG_ID = "admin-chat-collaboration-dialog"

type Collaborator = { id: string; email: string; role: "editor" | "reviewer" | "viewer"; created_at: string }
type Comment = { id: string; author_email: string; body: string; file_path: string | null; line_number: number | null; status: "open" | "resolved"; created_at: string }

function projectId() { try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" } }
function closeDialog() { document.getElementById(DIALOG_ID)?.remove() }
function esc(value: string) { return value.replace(/[<>&]/g, "") }
function btn(label: string, primary = false) {
  const el = document.createElement("button")
  el.type = "button"
  el.textContent = label
  Object.assign(el.style, { border: primary ? "1px solid rgba(168,85,247,.7)" : "1px solid rgba(255,255,255,.13)", background: primary ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.07)", color: "white", padding: "9px 12px", borderRadius: "12px", fontWeight: "800", cursor: "pointer" })
  return el
}
async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "include", cache: "no-store", ...init })
  const data = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Request failed")
  return data || {}
}

async function openDialog() {
  const id = projectId()
  if (!id) return window.alert("Open or create a project first.")
  closeDialog()
  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center", padding: "18px", background: "rgba(2,6,23,.84)", backdropFilter: "blur(16px)" })
  const card = document.createElement("section")
  Object.assign(card.style, { width: "min(980px,100%)", maxHeight: "calc(100vh - 36px)", overflow: "auto", padding: "22px", borderRadius: "24px", border: "1px solid rgba(168,85,247,.35)", background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(30,14,57,.99))", color: "white", boxShadow: "0 32px 110px rgba(0,0,0,.75)", fontFamily: "system-ui,sans-serif" })
  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" })
  const title = document.createElement("div")
  title.innerHTML = '<h2 style="margin:0;font-size:22px">Collaboration</h2><p style="margin:5px 0 0;color:#aebbd0;font-size:13px">Manage project members and review comments.</p>'
  const close = btn("Close")
  close.onclick = closeDialog
  header.append(title, close)

  const tabs = document.createElement("div")
  Object.assign(tabs.style, { display: "flex", gap: "9px", margin: "18px 0" })
  const membersTab = btn("Members", true)
  const commentsTab = btn("Comments")
  tabs.append(membersTab, commentsTab)
  const body = document.createElement("div")
  card.append(header, tabs, body)
  overlay.append(card)
  overlay.onclick = (event) => { if (event.target === overlay) closeDialog() }
  document.body.append(overlay)

  async function renderMembers() {
    body.innerHTML = '<div style="color:#aebbd0">Loading members…</div>'
    try {
      const data = await json(`/api/786-admin/projects/${encodeURIComponent(id)}/collaborators`)
      const collaborators = Array.isArray(data.collaborators) ? data.collaborators as Collaborator[] : []
      body.replaceChildren()
      const form = document.createElement("div")
      Object.assign(form.style, { display: "grid", gridTemplateColumns: "1fr auto auto", gap: "9px", marginBottom: "16px" })
      const email = document.createElement("input")
      email.type = "email"; email.placeholder = "member@example.com"
      const role = document.createElement("select")
      role.innerHTML = '<option value="editor">Editor</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option>'
      for (const input of [email, role]) Object.assign(input.style, { padding: "11px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,.13)", background: "#111827", color: "white" })
      const add = btn("Add member", true)
      add.onclick = async () => {
        if (!email.value.trim()) return window.alert("Enter an email address.")
        add.disabled = true
        try { await json(`/api/786-admin/projects/${encodeURIComponent(id)}/collaborators`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.value.trim(), role: role.value }) }); await renderMembers() }
        catch (error) { window.alert(error instanceof Error ? error.message : "Could not add member"); add.disabled = false }
      }
      form.append(email, role, add)
      body.append(form)
      const list = document.createElement("div")
      Object.assign(list.style, { display: "grid", gap: "9px" })
      if (!collaborators.length) list.innerHTML = '<div style="padding:16px;border-radius:14px;background:rgba(255,255,255,.05);color:#aebbd0">No collaborators yet.</div>'
      for (const item of collaborators) {
        const row = document.createElement("div")
        Object.assign(row.style, { display: "grid", gridTemplateColumns: "1fr auto auto", gap: "10px", alignItems: "center", padding: "13px", borderRadius: "14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" })
        const info = document.createElement("div")
        info.innerHTML = `<strong>${esc(item.email)}</strong><div style="margin-top:4px;color:#9fb0c8;font-size:12px">${esc(item.role)}</div>`
        const select = document.createElement("select")
        select.innerHTML = '<option value="editor">Editor</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option>'
        select.value = item.role
        select.onchange = async () => { try { await json(`/api/786-admin/projects/${encodeURIComponent(id)}/collaborators`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: item.email, role: select.value }) }) } catch (error) { window.alert(error instanceof Error ? error.message : "Could not update role") } }
        Object.assign(select.style, { padding: "8px", borderRadius: "10px", background: "#111827", color: "white" })
        const remove = btn("Remove")
        remove.onclick = async () => { if (!window.confirm(`Remove ${item.email}?`)) return; try { await json(`/api/786-admin/projects/${encodeURIComponent(id)}/collaborators?email=${encodeURIComponent(item.email)}`, { method: "DELETE" }); await renderMembers() } catch (error) { window.alert(error instanceof Error ? error.message : "Could not remove member") } }
        row.append(info, select, remove); list.append(row)
      }
      body.append(list)
    } catch (error) { body.innerHTML = `<div style="color:#fecaca">${esc(error instanceof Error ? error.message : "Could not load members")}</div>` }
  }

  async function renderComments() {
    body.innerHTML = '<div style="color:#aebbd0">Loading comments…</div>'
    try {
      const data = await json(`/api/786-admin/projects/${encodeURIComponent(id)}/comments`)
      const comments = Array.isArray(data.comments) ? data.comments as Comment[] : []
      body.replaceChildren()
      const form = document.createElement("div")
      Object.assign(form.style, { display: "grid", gap: "9px", marginBottom: "16px" })
      const text = document.createElement("textarea")
      text.placeholder = "Add a review comment"
      const path = document.createElement("input"); path.placeholder = "Optional file path"
      for (const input of [text, path]) Object.assign(input.style, { padding: "11px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.06)", color: "white" })
      const add = btn("Add comment", true)
      add.onclick = async () => { if (!text.value.trim()) return; add.disabled = true; try { await json(`/api/786-admin/projects/${encodeURIComponent(id)}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text.value.trim(), file_path: path.value.trim() || null }) }); await renderComments() } catch (error) { window.alert(error instanceof Error ? error.message : "Could not add comment"); add.disabled = false } }
      form.append(text, path, add); body.append(form)
      const list = document.createElement("div"); Object.assign(list.style, { display: "grid", gap: "9px" })
      if (!comments.length) list.innerHTML = '<div style="padding:16px;border-radius:14px;background:rgba(255,255,255,.05);color:#aebbd0">No review comments yet.</div>'
      for (const item of comments) {
        const row = document.createElement("article")
        Object.assign(row.style, { padding: "14px", borderRadius: "14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" })
        row.innerHTML = `<strong style="font-size:13px">${esc(item.author_email)}</strong><p style="margin:8px 0;color:#d8e0ee;white-space:pre-wrap">${esc(item.body)}</p><div style="color:#9fb0c8;font-size:12px">${item.file_path ? esc(item.file_path) : "General"} · ${esc(item.status)}</div>`
        const toggle = btn(item.status === "open" ? "Resolve" : "Reopen")
        toggle.style.marginTop = "10px"
        toggle.onclick = async () => { try { await json(`/api/786-admin/projects/${encodeURIComponent(id)}/comments`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment_id: item.id, status: item.status === "open" ? "resolved" : "open" }) }); await renderComments() } catch (error) { window.alert(error instanceof Error ? error.message : "Could not update comment") } }
        row.append(toggle); list.append(row)
      }
      body.append(list)
    } catch (error) { body.innerHTML = `<div style="color:#fecaca">${esc(error instanceof Error ? error.message : "Could not load comments")}</div>` }
  }

  membersTab.onclick = () => { membersTab.style.background = "linear-gradient(135deg,#7c3aed,#2563eb)"; commentsTab.style.background = "rgba(255,255,255,.07)"; void renderMembers() }
  commentsTab.onclick = () => { commentsTab.style.background = "linear-gradient(135deg,#7c3aed,#2563eb)"; membersTab.style.background = "rgba(255,255,255,.07)"; void renderComments() }
  await renderMembers()
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return
  const button = btn("Collaborate")
  button.id = BUTTON_ID
  Object.assign(button.style, { height: "42px", padding: "0 14px", borderRadius: "14px", border: "1px solid rgba(16,185,129,.35)", background: "rgba(5,150,105,.16)", color: "#ecfdf5" })
  button.onclick = () => void openDialog()
  header.append(button)
}

export function AdminChatCollaboration() {
  useEffect(() => {
    installButton()
    const timer = window.setInterval(installButton, 700)
    const observer = new MutationObserver(installButton)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.clearInterval(timer); observer.disconnect(); document.getElementById(BUTTON_ID)?.remove(); closeDialog() }
  }, [])
  return null
}
