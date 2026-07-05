"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

function getProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) => /preview/i.test(frame.title || "")) || null
}

function getPublishButton(): HTMLButtonElement | null {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  if (!header) return null
  return Array.from(header.querySelectorAll<HTMLButtonElement>("button")).find((button) => /^(publish|republish|publishing\.\.\.)$/i.test((button.textContent || "").trim())) || null
}

function removeDialog() {
  document.getElementById("admin-chat-publish-dialog")?.remove()
}

function createShell(title: string, subtitle: string) {
  removeDialog()
  const overlay = document.createElement("div")
  overlay.id = "admin-chat-publish-dialog"
  overlay.style.position = "fixed"
  overlay.style.inset = "0"
  overlay.style.zIndex = "2147483647"
  overlay.style.display = "grid"
  overlay.style.placeItems = "center"
  overlay.style.padding = "24px"
  overlay.style.background = "rgba(2,6,23,.72)"
  overlay.style.backdropFilter = "blur(14px)"

  const card = document.createElement("div")
  card.style.width = "min(520px,100%)"
  card.style.borderRadius = "28px"
  card.style.border = "1px solid rgba(103,232,249,.28)"
  card.style.background = "linear-gradient(145deg,rgba(15,23,42,.99),rgba(30,15,55,.99))"
  card.style.boxShadow = "0 35px 120px rgba(0,0,0,.72),0 0 55px rgba(124,58,237,.22)"
  card.style.padding = "28px"
  card.style.color = "white"
  card.style.fontFamily = "system-ui,sans-serif"

  const heading = document.createElement("h2")
  heading.textContent = title
  heading.style.margin = "0"
  heading.style.fontSize = "24px"
  heading.style.fontWeight = "900"

  const copy = document.createElement("p")
  copy.textContent = subtitle
  copy.style.margin = "10px 0 0"
  copy.style.color = "#cbd5e1"
  copy.style.lineHeight = "1.6"

  card.append(heading, copy)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
  return { overlay, card }
}

function showError(message: string) {
  const { card } = createShell("Publishing failed", message)
  const close = document.createElement("button")
  close.textContent = "Close"
  close.style.marginTop = "22px"
  close.style.width = "100%"
  close.style.padding = "13px"
  close.style.border = "0"
  close.style.borderRadius = "16px"
  close.style.background = "#ef4444"
  close.style.color = "white"
  close.style.fontWeight = "900"
  close.onclick = removeDialog
  card.appendChild(close)
}

function showSuccess(url: string, version?: number) {
  const fullUrl = `${window.location.origin}${url}`
  const { card } = createShell("Project is live", `Published successfully${version ? ` as version ${version}` : ""}.`)

  const urlBox = document.createElement("div")
  urlBox.textContent = fullUrl
  urlBox.style.marginTop = "20px"
  urlBox.style.padding = "14px"
  urlBox.style.borderRadius = "16px"
  urlBox.style.border = "1px solid rgba(103,232,249,.25)"
  urlBox.style.background = "rgba(2,6,23,.72)"
  urlBox.style.color = "#67e8f9"
  urlBox.style.wordBreak = "break-all"
  urlBox.style.fontWeight = "800"

  const actions = document.createElement("div")
  actions.style.display = "grid"
  actions.style.gridTemplateColumns = "1fr 1fr"
  actions.style.gap = "12px"
  actions.style.marginTop = "18px"

  const close = document.createElement("button")
  close.textContent = "Close"
  close.style.padding = "13px"
  close.style.borderRadius = "16px"
  close.style.border = "1px solid rgba(255,255,255,.14)"
  close.style.background = "rgba(255,255,255,.06)"
  close.style.color = "white"
  close.style.fontWeight = "900"
  close.onclick = removeDialog

  const open = document.createElement("a")
  open.href = url
  open.target = "_blank"
  open.rel = "noopener noreferrer"
  open.textContent = "Open live project"
  open.style.display = "grid"
  open.style.placeItems = "center"
  open.style.padding = "13px"
  open.style.borderRadius = "16px"
  open.style.background = "linear-gradient(135deg,#7c3aed,#06b6d4)"
  open.style.color = "white"
  open.style.fontWeight = "900"
  open.style.textDecoration = "none"

  actions.append(close, open)
  card.append(urlBox, actions)
}

function showConfirmation(action: string, onConfirm: () => void) {
  const { overlay, card } = createShell(`${action} this project?`, "This will create a live customer version using the current saved project files and preview.")

  const note = document.createElement("div")
  note.textContent = "The customer URL will use the project name and remain separate from the 786.Chat owner workspace."
  note.style.marginTop = "18px"
  note.style.padding = "14px"
  note.style.borderRadius = "16px"
  note.style.background = "rgba(34,211,238,.08)"
  note.style.color = "#cffafe"
  note.style.lineHeight = "1.5"

  const actions = document.createElement("div")
  actions.style.display = "grid"
  actions.style.gridTemplateColumns = "1fr 1fr"
  actions.style.gap = "12px"
  actions.style.marginTop = "20px"

  const cancel = document.createElement("button")
  cancel.textContent = "Cancel"
  cancel.style.padding = "13px"
  cancel.style.borderRadius = "16px"
  cancel.style.border = "1px solid rgba(255,255,255,.14)"
  cancel.style.background = "rgba(255,255,255,.06)"
  cancel.style.color = "white"
  cancel.style.fontWeight = "900"
  cancel.onclick = removeDialog

  const confirm = document.createElement("button")
  confirm.textContent = action
  confirm.style.padding = "13px"
  confirm.style.border = "0"
  confirm.style.borderRadius = "16px"
  confirm.style.background = "linear-gradient(135deg,#7c3aed,#06b6d4)"
  confirm.style.color = "white"
  confirm.style.fontWeight = "900"
  confirm.onclick = () => { overlay.remove(); onConfirm() }

  actions.append(cancel, confirm)
  card.append(note, actions)
}

export function AdminChatPublishController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    let busy = false

    const syncStatus = async () => {
      const projectId = getProjectId()
      const button = getPublishButton()
      if (!projectId || !button || busy) return
      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/publish`, { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as { deployment?: { status?: string } | null }
        if (data.deployment?.status === "live") button.textContent = "Republish"
      } catch {}
    }

    const publish = async (button: HTMLButtonElement) => {
      const projectId = getProjectId()
      const iframe = getPreviewIframe()
      const html = iframe?.getAttribute("srcdoc") || iframe?.srcdoc || ""
      if (!projectId) return showError("Create or open a project before publishing.")
      if (!html) return showError("The active project preview is not ready to publish.")

      busy = true
      const originalLabel = button.textContent || "Publish"
      button.disabled = true
      button.textContent = "Publishing..."
      try {
        const response = await fetch(`/api/786-admin/projects/${encodeURIComponent(projectId)}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html }),
        })
        const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string; deployment?: { version?: number } }
        if (!response.ok || !data.url) throw new Error(data.error || "Publish failed")
        button.textContent = "Republish"
        showSuccess(data.url, data.deployment?.version)
      } catch (error) {
        button.textContent = originalLabel
        showError(error instanceof Error ? error.message : "Publish failed")
      } finally {
        busy = false
        button.disabled = false
      }
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const button = target.closest<HTMLButtonElement>("main > div > section:last-of-type > header button")
      if (!button || !/^(publish|republish)$/i.test((button.textContent || "").trim()) || busy) return
      event.preventDefault()
      event.stopPropagation()
      const action = (button.textContent || "Publish").trim()
      showConfirmation(action, () => void publish(button))
    }

    document.addEventListener("click", onClick, true)
    window.setTimeout(syncStatus, 400)

    return () => {
      document.removeEventListener("click", onClick, true)
      removeDialog()
    }
  }, [pathname])

  return null
}
