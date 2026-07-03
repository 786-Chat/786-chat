"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function stripGeneratedModuleLines(srcDoc: string): string {
  let next = srcDoc

  // Generated React is executed inside a runtime string, so generated module
  // lines can appear escaped inside JSON: \nimport { X } from 'lucide-react' // comment\n.
  next = next.replace(
    /\\n[ \t]*import[ \t]+(?:type[ \t]+)?[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )
  next = next.replace(
    /\\n[ \t]*import[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )
  next = next.replace(
    /\\n[ \t]*export[ \t]+(?:\*|\{[^}]*\})[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g,
    "\\n"
  )

  // Also protect against raw multiline srcDoc text.
  next = next.replace(
    /^[ \t]*import\s+(?:type\s+)?[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )
  next = next.replace(
    /^[ \t]*import\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )
  next = next.replace(
    /^[ \t]*export\s+(?:\*|\{[^}]*\})[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm,
    ""
  )

  return next
}

function shouldPatchIframe(iframe: HTMLIFrameElement): boolean {
  const title = iframe.getAttribute("title") || ""
  return /preview/i.test(title)
}

function patchOneIframe(iframe: HTMLIFrameElement) {
  if (!shouldPatchIframe(iframe)) return

  const current = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  if (!current || !current.includes("var source =")) return

  const patched = stripGeneratedModuleLines(current)
  if (patched === current) return

  HTMLIFrameElement.prototype.setAttribute.call(iframe, "srcdoc", patched)
  const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
  descriptor?.set?.call(iframe, patched)
}

export function AdminChatPreviewSourceGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const srcdocDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
    const originalSetAttribute = HTMLIFrameElement.prototype.setAttribute

    if (srcdocDescriptor?.set && srcdocDescriptor.get) {
      Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", {
        configurable: true,
        enumerable: srcdocDescriptor.enumerable,
        get: srcdocDescriptor.get,
        set(value: string) {
          const next = typeof value === "string" ? stripGeneratedModuleLines(value) : value
          srcdocDescriptor.set?.call(this, next)
        },
      })
    }

    HTMLIFrameElement.prototype.setAttribute = function patchedSetAttribute(name: string, value: string) {
      if (name.toLowerCase() === "srcdoc" && typeof value === "string") {
        return originalSetAttribute.call(this, name, stripGeneratedModuleLines(value))
      }
      return originalSetAttribute.call(this, name, value)
    }

    const patchPreviewIframes = () => {
      const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
      for (const iframe of iframes) patchOneIframe(iframe)
    }

    patchPreviewIframes()
    const observer = new MutationObserver(patchPreviewIframes)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["srcdoc"],
    })

    return () => {
      observer.disconnect()
      HTMLIFrameElement.prototype.setAttribute = originalSetAttribute
      if (srcdocDescriptor) {
        Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", srcdocDescriptor)
      }
    }
  }, [pathname])

  return null
}
