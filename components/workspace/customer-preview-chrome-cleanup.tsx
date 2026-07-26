"use client"

import { useEffect } from "react"

const CLEANUP_MARK = "data-customer-preview-chrome-hidden"

function hide(element: HTMLElement | null) {
  if (!element || element.hasAttribute(CLEANUP_MARK)) return
  element.setAttribute(CLEANUP_MARK, "true")
  element.style.setProperty("display", "none", "important")
  element.setAttribute("aria-hidden", "true")
}

function findRowByText(root: HTMLElement, text: string) {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("div"))
  return candidates.find((element) => {
    const value = (element.textContent || "").trim()
    if (!value.includes(text)) return false
    const parentValue = (element.parentElement?.textContent || "").trim()
    return parentValue === value || element.children.length <= 3
  }) || null
}

function findDeviceRow(root: HTMLElement) {
  const desktop = root.querySelector<HTMLElement>('[title="Desktop"]')
  const tablet = root.querySelector<HTMLElement>('[title="Tablet"]')
  const mobile = root.querySelector<HTMLElement>('[title="Mobile"]')
  if (!desktop || !tablet || !mobile) return null

  let row: HTMLElement | null = desktop.parentElement
  while (row && row !== root) {
    if (row.contains(tablet) && row.contains(mobile)) return row
    row = row.parentElement
  }

  return null
}

function cleanCustomerPreviewChrome() {
  const root = document.querySelector<HTMLElement>(
    '.customer-workspace-route .customer-approved-preview'
  )
  if (!root) return

  const titleRow = findRowByText(root, "Preview")
  const statusRow =
    findRowByText(root, "Live Preview - Your AI Generated Project") ||
    findRowByText(root, "Preview Ready") ||
    findRowByText(root, "Website Preview")
  const deviceRow = findDeviceRow(root)

  hide(titleRow)
  hide(statusRow)
  hide(deviceRow)
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
