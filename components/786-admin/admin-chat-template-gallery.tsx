"use client"

import { useEffect } from "react"

const BUTTON_ID = "admin-chat-template-gallery-button"
const DIALOG_ID = "admin-chat-template-gallery-dialog"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type Template = {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  file_count: number
}

function removeDialog() {
  document.getElementById(DIALOG_ID)?.remove()
}

function makeButton(label: string, primary = false) {
  const button = document.createElement("button")
  button.type = "button"
  button.textContent = label
  Object.assign(button.style, {
    border: primary ? "1px solid rgba(168,85,247,.7)" : "1px solid rgba(255,255,255,.13)",
    background: primary ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.07)",
    color: "white",
    padding: "9px 12px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  })
  return button
}

async function fetchTemplates(): Promise<Template[]> {
  const response = await fetch("/api/786-admin/templates", { credentials: "include", cache: "no-store" })
  const data = (await response.json().catch(() => null)) as null | { templates?: Template[]; error?: string }
  if (!response.ok) throw new Error(data?.error || "Could not load templates")
  return Array.isArray(data?.templates) ? data.templates : []
}

async function createFromTemplate(template: Template) {
  const title = window.prompt("Project name", template.name)?.trim()
  if (!title) return

  const response = await fetch("/api/786-admin/templates", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: template.id, title }),
  })
  const data = (await response.json().catch(() => null)) as null | { project?: { id?: string }; error?: string }
  if (!response.ok || !data?.project?.id) throw new Error(data?.error || "Could not create project")

  localStorage.setItem(ACTIVE_PROJECT_ID_KEY, data.project.id)
  removeDialog()
  window.location.reload()
}

async function openDialog() {
  removeDialog()
  const overlay = document.createElement("div")
  overlay.id = DIALOG_ID
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "2147483647", display: "grid", placeItems: "center",
    padding: "18px", background: "rgba(2,6,23,.84)", backdropFilter: "blur(16px)",
  })
  const card = document.createElement("section")
  Object.assign(card.style, {
    width: "min(980px,100%)", maxHeight: "min(820px,calc(100vh - 36px))", overflow: "auto",
    padding: "22px", borderRadius: "24px", border: "1px solid rgba(168,85,247,.35)",
    background: "linear-gradient(145deg,rgba(7,12,29,.99),rgba(30,14,57,.99))", color: "white",
    boxShadow: "0 32px 110px rgba(0,0,0,.75)", fontFamily: "system-ui,sans-serif",
  })
  const header = document.createElement("div")
  Object.assign(header.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" })
  const heading = document.createElement("div")
  heading.innerHTML = '<h2 style="margin:0;font-size:22px">Project templates</h2><p style="margin:5px 0 0;color:#aebbd0;font-size:13px">Create a complete starter project in one click.</p>'
  const close = makeButton("Close")
  close.onclick = removeDialog
  header.append(heading, close)

  const controls = document.createElement("div")
  Object.assign(controls.style, { display: "flex", gap: "10px", margin: "18px 0", flexWrap: "wrap" })
  const search = document.createElement("input")
  search.placeholder = "Search templates"
  Object.assign(search.style, { flex: "1 1 260px", padding: "11px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.06)", color: "white" })
  const category = document.createElement("select")
  Object.assign(category.style, { padding: "11px 13px", borderRadius: "12px", border: "1px solid rgba(255,255,255,.13)", background: "#111827", color: "white" })
  category.innerHTML = '<option value="">All categories</option><option value="business">Business</option><option value="commerce">Commerce</option><option value="content">Content</option><option value="product">Product</option><option value="personal">Personal</option>'
  controls.append(search, category)

  const grid = document.createElement("div")
  Object.assign(grid.style, { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "14px" })
  grid.innerHTML = '<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">Loading templates…</div>'
  card.append(header, controls, grid)
  overlay.appendChild(card)
  overlay.onclick = (event) => { if (event.target === overlay) removeDialog() }
  document.body.appendChild(overlay)

  try {
    const templates = await fetchTemplates()
    const render = () => {
      const query = search.value.trim().toLowerCase()
      const selectedCategory = category.value
      const filtered = templates.filter((item) => {
        const matchesText = !query || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query)
        return matchesText && (!selectedCategory || item.category === selectedCategory)
      })
      grid.replaceChildren()
      if (!filtered.length) {
        grid.innerHTML = '<div style="padding:18px;border-radius:16px;background:rgba(255,255,255,.05);color:#aebbd0">No matching templates.</div>'
        return
      }
      for (const template of filtered) {
        const item = document.createElement("article")
        Object.assign(item.style, { display: "grid", gap: "12px", padding: "17px", borderRadius: "18px", border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.045)" })
        const info = document.createElement("div")
        info.innerHTML = `<span style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#c4b5fd">${template.category}</span><h3 style="margin:7px 0 6px;font-size:18px">${template.name}</h3><p style="margin:0;color:#aebbd0;font-size:13px;line-height:1.5">${template.description}</p><p style="margin:10px 0 0;color:#8493a8;font-size:12px">${template.file_count} starter files</p>`
        const create = makeButton("Create project", true)
        create.onclick = async () => {
          create.disabled = true
          create.textContent = "Creating…"
          try { await createFromTemplate(template) }
          catch (error) {
            window.alert(error instanceof Error ? error.message : "Could not create project")
            create.disabled = false
            create.textContent = "Create project"
          }
        }
        item.append(info, create)
        grid.appendChild(item)
      }
    }
    search.oninput = render
    category.onchange = render
    render()
  } catch (error) {
    grid.innerHTML = `<div style="padding:18px;border-radius:16px;background:rgba(127,29,29,.22);color:#fecaca">${error instanceof Error ? error.message : "Could not load templates"}</div>`
  }
}

function installButton() {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header || document.getElementById(BUTTON_ID)) return
  const button = document.createElement("button")
  button.id = BUTTON_ID
  button.type = "button"
  button.textContent = "Templates"
  button.title = "Create a project from a template"
  Object.assign(button.style, { height: "42px", padding: "0 14px", borderRadius: "14px", border: "1px solid rgba(59,130,246,.35)", background: "rgba(30,64,175,.2)", color: "#eff6ff", fontWeight: "800", cursor: "pointer" })
  button.onclick = () => void openDialog()
  header.appendChild(button)
}

export function AdminChatTemplateGallery() {
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
