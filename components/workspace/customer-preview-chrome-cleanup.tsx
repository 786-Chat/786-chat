"use client"

import { useEffect } from "react"

const CLEANUP_MARK = "data-customer-preview-chrome-hidden"
const STABILITY_OVERLAY = "data-customer-preview-stability-overlay"
const STABILITY_LISTENER = "data-customer-preview-stability-listener"
const ACTIVE_PROJECT_SCOPE = "786chat-active-project-preview-scope"
const DESIGN_IDENTITY_PREFIX = "786chat-project-design-identity:"

const DESIGN_PROFILES = [
  "editorial asymmetric layout, warm sand and ink palette, coral accents, strong serif display headings, thin rules and generous whitespace",
  "aurora glass interface, deep navy base, cyan and violet highlights, translucent layered cards, soft glows and rounded geometry",
  "industrial data grid, charcoal base, lime and amber accents, condensed headings, sharp borders and modular dashboard blocks",
  "minimal monochrome system, white and near-black surfaces, electric blue accent, oversized typography, crisp spacing and restrained motion",
  "organic premium style, cream background, forest green and terracotta accents, soft curves, tactile cards and calm editorial typography",
  "luxury dark composition, black and burgundy surfaces, muted gold accents, elegant serif headings, cinematic spacing and refined borders",
  "playful modular design, cobalt blue, sunny yellow and pink accents, bold rounded typography, offset cards and energetic micro-interactions",
  "soft professional workspace, slate and teal palette with lavender accents, balanced grids, subtle shadows and clean humanist typography",
] as const

function hide(element: HTMLElement | null) {
  if (!element) return
  element.setAttribute(CLEANUP_MARK, "true")
  element.style.setProperty("display", "none", "important")
  element.setAttribute("aria-hidden", "true")
}

function restore(element: HTMLElement | null) {
  if (!element) return
  element.removeAttribute(CLEANUP_MARK)
  element.removeAttribute("aria-hidden")
  element.style.removeProperty("display")
}

function getProjectScope() {
  const params = new URLSearchParams(window.location.search)
  const projectId = params.get("projectId")?.trim()

  if (projectId) return `project:${projectId}`

  if (params.get("newProject") === "1") {
    return `new:${params.get("fresh") || "current"}`
  }

  return "new:workspace"
}

function clearLegacyPreviewCache() {
  for (const key of Object.keys(window.localStorage)) {
    if (
      key.startsWith("mujeebproai_last_preview_html") ||
      key.includes("preview_history") ||
      key.endsWith("_backup")
    ) {
      window.localStorage.removeItem(key)
    }
  }
}

function syncProjectPreviewScope() {
  const nextScope = getProjectScope()
  const previousScope = window.sessionStorage.getItem(ACTIVE_PROJECT_SCOPE) || ""
  const promotedNewProject =
    previousScope.startsWith("new:") && nextScope.startsWith("project:")

  if (!previousScope || (previousScope !== nextScope && !promotedNewProject)) {
    clearLegacyPreviewCache()
  }

  if (previousScope !== nextScope) {
    window.sessionStorage.setItem(ACTIVE_PROJECT_SCOPE, nextScope)
  }

  return nextScope
}

function hashText(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function getOrCreateDesignIdentity(scope: string) {
  const key = `${DESIGN_IDENTITY_PREFIX}${scope}`
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing

  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const seed = `${scope}:${randomPart}`
  const profile = DESIGN_PROFILES[hashText(seed) % DESIGN_PROFILES.length]
  const identity = `${seed}|${profile}`

  window.sessionStorage.setItem(key, identity)
  return identity
}

function addUniqueDesignInstruction(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body

  const payload = body as Record<string, unknown>
  const projectId = typeof payload.projectId === "string" ? payload.projectId.trim() : ""
  const chatId = typeof payload.chatId === "string" ? payload.chatId.trim() : ""
  const messages = Array.isArray(payload.messages) ? payload.messages : []

  if (projectId || chatId || messages.length === 0) return body

  const clonedMessages = JSON.parse(JSON.stringify(messages)) as Array<Record<string, unknown>>
  const lastUserIndex = clonedMessages.findLastIndex((message) => message.role === "user")
  if (lastUserIndex < 0) return body

  const lastUserMessage = clonedMessages[lastUserIndex]
  const parts = Array.isArray(lastUserMessage.parts)
    ? (lastUserMessage.parts as Array<Record<string, unknown>>)
    : []
  const textPartIndex = parts.findLastIndex(
    (part) => part.type === "text" && typeof part.text === "string"
  )

  if (textPartIndex < 0) return body

  const originalText = String(parts[textPartIndex].text || "")
  if (originalText.includes("UNIQUE_DESIGN_ID:")) return body

  const identity = getOrCreateDesignIdentity(syncProjectPreviewScope())
  const [, profile = DESIGN_PROFILES[0]] = identity.split("|")
  const designSeed = identity.split("|")[0]

  parts[textPartIndex].text = `${originalText}\n\nPROJECT_FILE_SYSTEM_RULE:\nUNIQUE_DESIGN_ID: ${designSeed}\nMANDATORY NEW PROJECT THEME: ${profile}. Create a completely independent visual identity. Do not reuse any previous project colour palette, hero composition, navigation pattern, card style, typography pairing, section order, CTA wording, background treatment, component names, sample content or template structure. The generated files must belong only to this project.`
  lastUserMessage.parts = parts
  clonedMessages[lastUserIndex] = lastUserMessage

  return {
    ...payload,
    messages: clonedMessages,
  }
}

function getPreviewPanel() {
  const previewSection = document.querySelector<HTMLElement>(
    ".customer-workspace-route .customer-approved-preview"
  )

  return (previewSection?.firstElementChild as HTMLElement | null) || null
}

function cleanCustomerPreviewChrome() {
  const previewPanel = getPreviewPanel()
  if (!previewPanel) return null

  // A previous selector could hide the whole preview panel. Always restore the
  // real panel and its content before hiding only the duplicate chrome rows.
  restore(previewPanel)

  const rows = Array.from(previewPanel.children) as HTMLElement[]
  if (rows.length >= 4) {
    hide(rows[0])
    hide(rows[1])
    hide(rows[2])
    restore(rows[3])
    rows[3].style.setProperty("min-height", "0")
    rows[3].style.setProperty("flex", "1 1 0%")
    rows[3].style.setProperty("position", "relative")
  }

  // The approved customer header is the only URL/control bar. Show the real
  // root route rather than repeating the project title such as “Login Page”.
  const routeLabel = document.querySelector<HTMLElement>(
    'main[data-workspace-role="customer"] header span.truncate'
  )
  if (routeLabel && routeLabel.textContent !== "/") {
    routeLabel.textContent = "/"
    routeLabel.setAttribute("title", "/")
  }

  return rows[3] || null
}

function getPreviewFrame(contentRow: HTMLElement) {
  return contentRow.querySelector<HTMLIFrameElement>(
    'iframe[title="Project Preview"], iframe[title="Generated Preview"], iframe[title="Website Preview"]'
  )
}

function ensureStabilityOverlay(contentRow: HTMLElement) {
  let overlay = contentRow.querySelector<HTMLElement>(`[${STABILITY_OVERLAY}]`)
  if (overlay) return overlay

  overlay = document.createElement("div")
  overlay.setAttribute(STABILITY_OVERLAY, "true")
  overlay.setAttribute("aria-live", "polite")
  overlay.style.cssText = [
    "position:absolute",
    "inset:0",
    "z-index:60",
    "display:none",
    "align-items:center",
    "justify-content:center",
    "background:#08080d",
    "opacity:1",
    "transition:opacity 180ms ease",
    "pointer-events:none",
  ].join(";")

  const badge = document.createElement("div")
  badge.textContent = "Loading preview…"
  badge.style.cssText = [
    "border:1px solid rgba(34,211,238,.22)",
    "border-radius:12px",
    "background:rgba(34,211,238,.07)",
    "padding:10px 14px",
    "color:rgba(165,243,252,.9)",
    "font:600 12px/1.2 system-ui,sans-serif",
    "box-shadow:0 18px 50px rgba(0,0,0,.35)",
  ].join(";")

  overlay.appendChild(badge)
  contentRow.appendChild(overlay)
  return overlay
}

export function CustomerPreviewChromeCleanup() {
  useEffect(() => {
    let revealTimer: number | null = null
    let hideOverlayTimer: number | null = null
    let currentFrame: HTMLIFrameElement | null = null
    let currentFrameSource = ""

    syncProjectPreviewScope()

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (url.includes("/api/chat") && typeof init?.body === "string") {
        try {
          const parsedBody = JSON.parse(init.body)
          const isolatedBody = addUniqueDesignInstruction(parsedBody)
          return originalFetch(input, {
            ...init,
            body: JSON.stringify(isolatedBody),
          })
        } catch {
          // Keep the original request when it is not JSON or cannot be cloned.
        }
      }

      return originalFetch(input, init)
    }

    const clearRevealTimers = () => {
      if (revealTimer !== null) window.clearTimeout(revealTimer)
      if (hideOverlayTimer !== null) window.clearTimeout(hideOverlayTimer)
      revealTimer = null
      hideOverlayTimer = null
    }

    const revealWhenSettled = (
      frame: HTMLIFrameElement,
      contentRow: HTMLElement,
      overlay: HTMLElement
    ) => {
      clearRevealTimers()

      // Project update events can arrive almost together. Keep one cover visible
      // until the final iframe has remained loaded long enough to be stable.
      revealTimer = window.setTimeout(() => {
        const latestFrame = getPreviewFrame(contentRow)
        if (latestFrame !== frame || currentFrame !== frame) return

        frame.style.setProperty("opacity", "1")
        overlay.style.setProperty("opacity", "0")

        hideOverlayTimer = window.setTimeout(() => {
          if (currentFrame === frame) {
            overlay.style.setProperty("display", "none")
          }
        }, 190)
      }, 420)
    }

    const stabilizeCustomerPreview = () => {
      syncProjectPreviewScope()

      const contentRow = cleanCustomerPreviewChrome()
      if (!contentRow) return

      const overlay = ensureStabilityOverlay(contentRow)
      const frame = getPreviewFrame(contentRow)

      if (!frame) {
        currentFrame = null
        currentFrameSource = ""
        clearRevealTimers()
        overlay.style.setProperty("display", "none")
        return
      }

      const frameSource =
        frame.getAttribute("src") || frame.getAttribute("srcdoc") || "inline-preview"
      const frameChanged = frame !== currentFrame || frameSource !== currentFrameSource

      if (frameChanged) {
        clearRevealTimers()
        currentFrame = frame
        currentFrameSource = frameSource

        frame.style.setProperty("opacity", "0")
        frame.style.setProperty("transition", "opacity 180ms ease")
        overlay.style.setProperty("display", "flex")
        overlay.style.setProperty("opacity", "1")
      }

      if (!frame.hasAttribute(STABILITY_LISTENER)) {
        frame.setAttribute(STABILITY_LISTENER, "true")
        frame.addEventListener("load", () => {
          const activeRow = cleanCustomerPreviewChrome()
          if (!activeRow) return
          revealWhenSettled(frame, activeRow, ensureStabilityOverlay(activeRow))
        })
      }

      // The iframe may already be complete before this guard attaches.
      try {
        if (frame.contentDocument?.readyState === "complete") {
          revealWhenSettled(frame, contentRow, overlay)
        }
      } catch {
        // Cross-origin previews reveal through their normal load event.
      }
    }

    stabilizeCustomerPreview()

    const observer = new MutationObserver(stabilizeCustomerPreview)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["src", "srcdoc"],
    })

    const timer = window.setInterval(stabilizeCustomerPreview, 350)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      clearRevealTimers()
      window.fetch = originalFetch
    }
  }, [])

  return null
}
