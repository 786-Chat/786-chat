"use client"

import { useEffect } from "react"

const CLEANUP_MARK = "data-customer-preview-chrome-hidden"
const STABILITY_OVERLAY = "data-customer-preview-stability-overlay"
const STABILITY_LISTENER = "data-customer-preview-stability-listener"

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

function getPreviewPanel() {
  const previewSection = document.querySelector<HTMLElement>(
    '.customer-workspace-route .customer-approved-preview'
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
    }
  }, [])

  return null
}
