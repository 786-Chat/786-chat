"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const STORAGE_MARKER = 'data-786-preview-storage="true"'
const STORAGE_SHIM = `<script ${STORAGE_MARKER}>
(function(){
  try {
    var memory = {};
    function createStorage(){
      return {
        get length(){ return Object.keys(memory).length; },
        key: function(index){ return Object.keys(memory)[index] || null; },
        getItem: function(key){ key = String(key); return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
        setItem: function(key, value){ memory[String(key)] = String(value); },
        removeItem: function(key){ delete memory[String(key)]; },
        clear: function(){ memory = {}; }
      };
    }
    var safeLocalStorage = createStorage();
    var safeSessionStorage = createStorage();
    try { Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: function(){ return safeLocalStorage; } }); } catch (_) {}
    try { Object.defineProperty(window, 'sessionStorage', { configurable: true, enumerable: true, get: function(){ return safeSessionStorage; } }); } catch (_) {}
    window.__786PreviewLocalStorage = safeLocalStorage;
    window.__786PreviewSessionStorage = safeSessionStorage;
  } catch (_) {}
})();
</script>`

function isPreviewIframe(iframe: HTMLIFrameElement): boolean {
  return /preview/i.test(iframe.getAttribute("title") || "")
}

function injectStorageShim(srcDoc: string): string {
  if (!srcDoc || srcDoc.includes(STORAGE_MARKER)) return srcDoc
  if (srcDoc.includes("<head>")) return srcDoc.replace("<head>", `<head>\n${STORAGE_SHIM}`)
  if (srcDoc.includes("<body>")) return srcDoc.replace("<body>", `<body>\n${STORAGE_SHIM}`)
  return `${STORAGE_SHIM}\n${srcDoc}`
}

function patchIframe(iframe: HTMLIFrameElement) {
  if (!isPreviewIframe(iframe)) return
  const current = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  const patched = injectStorageShim(current)
  if (!patched || patched === current) return

  HTMLIFrameElement.prototype.setAttribute.call(iframe, "srcdoc", patched)
  const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
  descriptor?.set?.call(iframe, patched)
}

export function AdminChatPreviewStorageGuard() {
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
