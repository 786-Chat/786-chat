"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const DIALOG_STYLE_ID = "admin-chat-publish-dialog-style"

function getProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function getProjectTitle(): string {
  const header = document.querySelector<HTMLElement>("main > div > section:last-of-type > header")
  const title = header?.querySelector<HTMLElement>(":scope > div:first-child")?.textContent?.trim()
  return title && title !== "No project yet" ? title : "Customer Project"
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "customer-project"
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

function installDialogStyles() {
  if (document.getElementById(DIALOG_STYLE_ID)) return
  const style = document.createElement("style")
  style.id = DIALOG_STYLE_ID
  style.textContent = `
    @keyframes adminPublishCardIn {
      from { opacity: 0; transform: translateY(18px) scale(.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes adminPublishGlow {
      0%,100% { transform: translate3d(-8%, -6%, 0) scale(1); opacity: .45; }
      50% { transform: translate3d(12%, 8%, 0) scale(1.12); opacity: .72; }
    }
    #admin-chat-publish-dialog [data-publish-card] {
      animation: adminPublishCardIn .26s ease-out both;
    }
    #admin-chat-publish-dialog [data-publish-glow] {
      animation: adminPublishGlow 6s ease-in-out infinite;
    }
    #admin-chat-publish-dialog button,
    #admin-chat-publish-dialog a {
      transition: transform .16s ease, filter .16s ease, border-color .16s ease;
    }
    #admin-chat-publish-dialog button:hover,
    #admin-chat-publish-dialog a:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
    }
  `
  document.head.appendChild(style)
}

function createShell(title: string, subtitle: string) {
  removeDialog()
  installDialogStyles()

  const overlay = document.createElement("div")
  overlay.id = "admin-chat-publish-dialog"
  overlay.style.position = "fixed"
  overlay.style.inset = "0"
  overlay.style.zIndex = "2147483647"
  overlay.style.display = "grid"
  overlay.style.placeItems = "center"
  overlay.style.padding = "18px"
  overlay.style.background = "rgba(2,6,23,.76)"
  overlay.style.backdropFilter = "blur(16px)"

  const card = document.createElement("div")
  card.setAttribute("data-publish-card", "true")
  card.style.position = "relative"
  card.style.overflow = "hidden"
  card.style.width = "min(560px,100%)"
  card.style.maxHeight = "min(720px,calc(100vh - 36px))"
  card.style.overflowY = "auto"
  card.style.borderRadius = "24px"
  card.style.border = "1px solid rgba(103,232,249,.28)"
  card.style.background = "linear-gradient(145deg,rgba(10,16,36,.99),rgba(28,15,55,.99))"
  card.style.boxShadow = "0 34px 110px rgba(0,0,0,.72),0 0 48px rgba(124,58,237,.20)"
  card.style.padding = "22px"
  card.style.color = "white"
  card.style.fontFamily = "system-ui,sans-serif"

  const glow = document.createElement("div")
  glow.setAttribute("data-publish-glow", "true")
  glow.style.position = "absolute"
  glow.style.inset = "-45% 30% 35% -20%"
  glow.style.pointerEvents = "none"
  glow.style.background = "radial-gradient(circle,rgba(34,211,238,.18),rgba(124,58,237,.08) 45%,transparent 70%)"

  const content = document.createElement("div")
  content.style.position = "relative"
  content.style.zIndex = "1"

  const heading = document.createElement("h2")
  heading.textContent = title
  heading.style.margin = "0"
  heading.style.fontSize = "22px"
  heading.style.fontWeight = "900"

  const copy = document.createElement("p")
  copy.textContent = subtitle
  copy.style.margin = "8px 0 0"
  copy.style.color = "#cbd5e1"
  copy.style.fontSize = "14px"
  copy.style.lineHeight = "1.55"

  content.append(heading, copy)
  card.append(glow, content)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
  return { overlay, card: content }
}

function showError(message: string) {
  const { card } = createShell("Publishing failed", message)
  const close = document.createElement("button")
  close.textContent = "Close"
  close.style.marginTop = "18px"
  close.style.width = "100%"
  close.style.padding = "12px"
  close.style.border = "0"
  close.style.borderRadius = "14px"
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
  urlBox.style.marginTop = "18px"
  urlBox.style.padding = "13px"
  urlBox.style.borderRadius = "14px"
  urlBox.style.border = "1px solid rgba(103,232,249,.25)"
  urlBox.style.background = "rgba(2,6,23,.72)"
  urlBox.style.color = "#67e8f9"
  urlBox.style.wordBreak = "break-all"
  urlBox.style.fontSize = "13px"
  urlBox.style.fontWeight = "800"

  const actions = document.createElement("div")
  actions.style.display = "grid"
  actions.style.gridTemplateColumns = "1fr 1fr"
  actions.style.gap = "10px"
  actions.style.marginTop = "16px"

  const close = document.createElement("button")
  close.textContent = "Close"
  close.style.padding = "12px"
  close.style.borderRadius = "14px"
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
  open.style.padding = "12px"
  open.style.borderRadius = "14px"
  open.style.background = "linear-gradient(135deg,#7c3aed,#06b6d4)"
  open.style.color = "white"
  open.style.fontWeight = "900"
  open.style.textDecoration = "none"

  actions.append(close, open)
  card.append(urlBox, actions)
}

function createAddressOption(input: {
  title: string
  description: string
  example: string
  active?: boolean
  badge?: string
}) {
  const option = document.createElement("div")
  option.style.position = "relative"
  option.style.display = "grid"
  option.style.gridTemplateColumns = "22px 1fr auto"
  option.style.gap = "10px"
  option.style.alignItems = "start"
  option.style.padding = "13px"
  option.style.borderRadius = "16px"
  option.style.border = input.active ? "1px solid rgba(34,211,238,.72)" : "1px solid rgba(255,255,255,.10)"
  option.style.background = input.active ? "linear-gradient(135deg,rgba(6,182,212,.12),rgba(124,58,237,.12))" : "rgba(255,255,255,.035)"
  option.style.opacity = input.active ? "1" : ".72"

  const radio = document.createElement("span")
  radio.textContent = input.active ? "◉" : "○"
  radio.style.color = input.active ? "#67e8f9" : "#64748b"
  radio.style.fontSize = "17px"
  radio.style.lineHeight = "1.2"

  const body = document.createElement("div")
  const heading = document.createElement("div")
  heading.textContent = input.title
  heading.style.fontWeight = "900"
  heading.style.fontSize = "14px"

  const description = document.createElement("div")
  description.textContent = input.description
  description.style.marginTop = "3px"
  description.style.color = "#94a3b8"
  description.style.fontSize = "12px"
  description.style.lineHeight = "1.4"

  const example = document.createElement("div")
  example.textContent = input.example
  example.style.marginTop = "7px"
  example.style.color = input.active ? "#67e8f9" : "#a78bfa"
  example.style.fontSize = "12px"
  example.style.fontWeight = "800"
  example.style.wordBreak = "break-all"

  body.append(heading, description, example)

  const badge = document.createElement("span")
  badge.textContent = input.badge || (input.active ? "Ready" : "Future")
  badge.style.padding = "4px 7px"
  badge.style.borderRadius = "999px"
  badge.style.background = input.active ? "rgba(34,211,238,.14)" : "rgba(167,139,250,.12)"
  badge.style.color = input.active ? "#a5f3fc" : "#c4b5fd"
  badge.style.fontSize = "10px"
  badge.style.fontWeight = "900"
  badge.style.textTransform = "uppercase"
  badge.style.letterSpacing = ".04em"

  option.append(radio, body, badge)
  return option
}

function showConfirmation(action: string, onConfirm: () => void) {
  const projectTitle = getProjectTitle()
  const slug = slugify(projectTitle)
  const { overlay, card } = createShell(`${action} ${projectTitle}?`, "Choose how customers will access this project. Only the default URL is active in this test phase.")

  const sectionTitle = document.createElement("div")
  sectionTitle.textContent = "Customer web address"
  sectionTitle.style.marginTop = "16px"
  sectionTitle.style.marginBottom = "9px"
  sectionTitle.style.color = "#e2e8f0"
  sectionTitle.style.fontSize = "13px"
  sectionTitle.style.fontWeight = "900"

  const options = document.createElement("div")
  options.style.display = "grid"
  options.style.gap = "9px"

  options.append(
    createAddressOption({
      title: "Use default 786.Chat URL",
      description: "Works immediately and remains separate from the owner workspace.",
      example: `https://786.chat/p/${slug}-project-id`,
      active: true,
    }),
    createAddressOption({
      title: "Use a professional 786.Chat subdomain",
      description: "Example only for now. Wildcard DNS and Vercel domain support will be added later.",
      example: `https://${slug}.786.chat`,
      badge: "Later",
    }),
    createAddressOption({
      title: "Customer’s own domain",
      description: "Example only for now. Real DNS records, SSL and verification will be added in the domain phase.",
      example: `https://www.${slug}.com`,
      badge: "Later",
    }),
  )

  const note = document.createElement("div")
  note.textContent = "This test publish will use the first option. The other choices are visible examples and will not create fake DNS or domains."
  note.style.marginTop = "12px"
  note.style.padding = "11px 12px"
  note.style.borderRadius = "14px"
  note.style.background = "rgba(34,211,238,.07)"
  note.style.color = "#cffafe"
  note.style.fontSize = "12px"
  note.style.lineHeight = "1.45"

  const actions = document.createElement("div")
  actions.style.display = "grid"
  actions.style.gridTemplateColumns = "1fr 1fr"
  actions.style.gap = "10px"
  actions.style.marginTop = "16px"

  const cancel = document.createElement("button")
  cancel.textContent = "Cancel"
  cancel.style.padding = "12px"
  cancel.style.borderRadius = "14px"
  cancel.style.border = "1px solid rgba(255,255,255,.14)"
  cancel.style.background = "rgba(255,255,255,.06)"
  cancel.style.color = "white"
  cancel.style.fontWeight = "900"
  cancel.onclick = removeDialog

  const confirm = document.createElement("button")
  confirm.textContent = action
  confirm.style.padding = "12px"
  confirm.style.border = "0"
  confirm.style.borderRadius = "14px"
  confirm.style.background = "linear-gradient(135deg,#7c3aed,#06b6d4)"
  confirm.style.color = "white"
  confirm.style.fontWeight = "900"
  confirm.onclick = () => { overlay.remove(); onConfirm() }

  actions.append(cancel, confirm)
  card.append(sectionTitle, options, note, actions)
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
