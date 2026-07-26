"use client"

import { useEffect } from "react"

const CLEANUP_MARK = "data-customer-preview-chrome-hidden"

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

function cleanCustomerPreviewChrome() {
  const previewSection = document.querySelector<HTMLElement>(
    '.customer-workspace-route .customer-approved-preview'
  )
  if (!previewSection) return

  const previewPanel = previewSection.firstElementChild as HTMLElement | null
  if (!previewPanel) return

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
}

export function CustomerPreviewChromeCleanup() {
  useEffect(() => {
    cleanCustomerPreviewChrome()

    const observer = new MutationObserver(cleanCustomerPreviewChrome)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    const timer = window.setInterval(cleanCustomerPreviewChrome, 500)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
    }
  }, [])

  return null
}
