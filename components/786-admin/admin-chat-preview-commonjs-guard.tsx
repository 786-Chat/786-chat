"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const COMMONJS_MARKER = 'data-786-preview-commonjs="true"'
const COMMONJS_SHIM = `<script ${COMMONJS_MARKER}>
(function(){
  try {
    if (typeof globalThis.module === 'undefined') {
      globalThis.module = { exports: {} }
    }
    if (typeof globalThis.exports === 'undefined') {
      globalThis.exports = globalThis.module.exports
    }
    if (typeof globalThis.require === 'undefined') {
      globalThis.require = function previewRequire(name) {
        if (name === 'react') return globalThis.React || {}
        if (name === 'react-dom') return globalThis.ReactDOM || {}
        if (name === 'next/link') return globalThis.Link || function LinkFallback(props){ return props && props.children ? props.children : null }
        if (name === 'next/image') return globalThis.Image || function ImageFallback(){ return null }
        return {}
      }
    }
  } catch (_) {}
})();
</script>`

function isPreviewIframe(iframe: HTMLIFrameElement): boolean {
  return /preview/i.test(iframe.getAttribute("title") || "")
}

function injectCommonJsShim(srcDoc: string): string {
  if (!srcDoc || srcDoc.includes(COMMONJS_MARKER)) return srcDoc
  if (srcDoc.includes("<head>")) return srcDoc.replace("<head>", `<head>\n${COMMONJS_SHIM}`)
  if (srcDoc.includes("<body>")) return srcDoc.replace("<body>", `<body>\n${COMMONJS_SHIM}`)
  return `${COMMONJS_SHIM}\n${srcDoc}`
}

function patchIframe(iframe: HTMLIFrameElement) {
  if (!isPreviewIframe(iframe)) return
  const current = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  const patched = injectCommonJsShim(current)
  if (!patched || patched === current) return

  const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
  HTMLIFrameElement.prototype.setAttribute.call(iframe, "srcdoc", patched)
  descriptor?.set?.call(iframe, patched)
}

export function AdminChatPreviewCommonJsGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let scheduled = false
    const patchAll = () => {
      scheduled = false
      const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
      for (const iframe of iframes) patchIframe(iframe)
    }

    const schedulePatch = () => {
      if (scheduled) return
      scheduled = true
      window.requestAnimationFrame(patchAll)
    }

    schedulePatch()
    const observer = new MutationObserver(schedulePatch)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["srcdoc"],
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
