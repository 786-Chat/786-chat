"use client"

import { ChevronRight, FileText } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

const PAGE_MANAGER_TRIGGER = 'button[aria-label="Open pages manager"]'
const DESIGN_CLOSE_BUTTON = 'button[aria-label="Close visual editor"]'
const ACCESS_MOUNT_ATTR = "data-786-page-manager-access"

export function BuilderPageManagerAccessBridge() {
  const [mount, setMount] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let currentMount: HTMLElement | null = null

    const syncMount = () => {
      const closeButton = document.querySelector<HTMLButtonElement>(DESIGN_CLOSE_BUTTON)
      const designPanel = closeButton?.closest("aside")

      if (!designPanel) {
        if (currentMount?.isConnected) currentMount.remove()
        currentMount = null
        setMount(null)
        return
      }

      const existing = designPanel.querySelector<HTMLElement>(`[${ACCESS_MOUNT_ATTR}]`)
      if (existing) {
        if (currentMount !== existing) {
          currentMount = existing
          setMount(existing)
        }
        return
      }

      const accessMount = document.createElement("div")
      accessMount.setAttribute(ACCESS_MOUNT_ATTR, "true")
      accessMount.className = "shrink-0 border-b border-[#263550] p-3"

      const header = designPanel.firstElementChild
      if (header) header.insertAdjacentElement("afterend", accessMount)
      else designPanel.prepend(accessMount)

      currentMount = accessMount
      setMount(accessMount)
    }

    syncMount()
    const observer = new MutationObserver(syncMount)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      if (currentMount?.isConnected) currentMount.remove()
    }
  }, [])

  const openPageManager = () => {
    document.querySelector<HTMLButtonElement>(DESIGN_CLOSE_BUTTON)?.click()
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(PAGE_MANAGER_TRIGGER)?.click()
    }, 0)
  }

  return (
    <>
      <style>{`${PAGE_MANAGER_TRIGGER}{display:none !important;}`}</style>
      {mount
        ? createPortal(
            <button
              type="button"
              onClick={openPageManager}
              className="flex w-full items-center gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/[.06] p-3 text-left text-cyan-50 transition hover:bg-cyan-300/[.10]"
              aria-label="Open pages and navigation settings"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                <FileText className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14px]">Pages &amp; navigation</b>
                <span className="mt-0.5 block text-[12px] leading-4 text-slate-400">Move, hide, show or remove optional pages</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>,
            mount,
          )
        : null}
    </>
  )
}
