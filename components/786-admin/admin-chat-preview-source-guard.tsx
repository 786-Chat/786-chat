"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const PREVIEW_SAFETY_SCRIPT = `<script data-786-preview-safety="true">
(function(){
  try {
    if (typeof EventTarget !== 'undefined' && !EventTarget.prototype.closest) {
      EventTarget.prototype.closest = function(selector){
        return this && this.nodeType === 1 && Element.prototype.closest
          ? Element.prototype.closest.call(this, selector)
          : null
      }
    }
    if (typeof Node !== 'undefined' && !Node.prototype.closest) {
      Node.prototype.closest = function(selector){
        return this && this.nodeType === 1 && Element.prototype.closest
          ? Element.prototype.closest.call(this, selector)
          : null
      }
    }
    if (typeof SVGElement !== 'undefined' && !SVGElement.prototype.closest && typeof Element !== 'undefined' && Element.prototype.closest) {
      SVGElement.prototype.closest = Element.prototype.closest
    }
    if (typeof Element !== 'undefined' && !Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector || function(){ return false }
    }
  } catch (_) {}
})();
</script>`

function injectPreviewSafety(srcDoc: string): string {
  if (srcDoc.includes('data-786-preview-safety="true"')) return srcDoc
  if (srcDoc.includes("</head>")) return srcDoc.replace("</head>", `${PREVIEW_SAFETY_SCRIPT}\n</head>`)
  if (srcDoc.includes("<body>")) return srcDoc.replace("<body>", `<body>\n${PREVIEW_SAFETY_SCRIPT}`)
  return `${PREVIEW_SAFETY_SCRIPT}\n${srcDoc}`
}

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

  return injectPreviewSafety(next)
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
