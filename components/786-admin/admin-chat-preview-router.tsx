"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ROUTER_MARKER = "__786PreviewRouterInstalled"

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((iframe) =>
    /preview/i.test(iframe.title || "")
  ) || null
}

function normalizePath(value: string): string {
  let path = value.trim()
  if (!path) return "/"
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || "/"
  } catch {}
  path = path.split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/{2,}/g, "/")
  if (path.length > 1) path = path.replace(/\/$/, "")
  return path || "/"
}

function patchPreviewSource(srcDoc: string): string {
  if (!srcDoc || srcDoc.includes(ROUTER_MARKER)) return srcDoc
  if (!srcDoc.includes("const __Root__ =")) return srcDoc

  const runtime = `
  globalThis.${ROUTER_MARKER} = true
  function __786NormalizePath(value) {
    var path = String(value || '/').trim()
    try { if (/^https?:\\/\\//i.test(path)) path = new URL(path).pathname || '/' } catch (_) {}
    path = path.split('?')[0].split('#')[0]
    if (path.charAt(0) !== '/') path = '/' + path
    path = path.replace(/\\/{2,}/g, '/')
    if (path.length > 1) path = path.replace(/\\/$/, '')
    return path || '/'
  }
  function __786FindRoute(path) {
    if (path === '/') return globalThis.Page || globalThis.Home || globalThis.HomePage || globalThis.__DefaultExport__ || null
    var leaf = path.split('/').filter(Boolean).pop() || ''
    var pascal = leaf.split(/[-_\\s]+/).filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1)
    }).join('')
    return globalThis[pascal + 'Page'] || globalThis[pascal] || globalThis[pascal + 'Screen'] || null
  }
  function __786RenderRoute(value) {
    var path = __786NormalizePath(value)
    var Component = __786FindRoute(path)
    if (!Component) {
      window.__showPreviewError('Preview route not found: ' + path)
      return
    }
    var mount = document.getElementById('root')
    globalThis.__786PreviewRoot = globalThis.__786PreviewRoot || ReactDOM.createRoot(mount)
    globalThis.__786PreviewRoot.render(React.createElement(Component))
    globalThis.__786PreviewPath = path
    try { parent.postMessage({ type: '786-preview-path', path: path }, '*') } catch (_) {}
  }
  document.addEventListener('click', function (event) {
    var target = event.target
    var anchor = target && target.closest ? target.closest('a[href]') : null
    if (!anchor) return
    var href = anchor.getAttribute('href') || ''
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return
    try {
      var parsed = new URL(href, 'https://preview.786.chat')
      if (parsed.origin !== 'https://preview.786.chat') return
      event.preventDefault()
      event.stopPropagation()
      __786RenderRoute(parsed.pathname)
    } catch (_) {}
  }, true)
  window.addEventListener('message', function (event) {
    var data = event && event.data
    if (!data || data.type !== '786-preview-navigate') return
    __786RenderRoute(data.path || '/')
  })
`

  return srcDoc
    .replace("  const __Root__ =", `${runtime}\n  const __Root__ =`)
    .replace(
      "ReactDOM.createRoot(__mount__).render(",
      "globalThis.__786PreviewRoot = globalThis.__786PreviewRoot || ReactDOM.createRoot(__mount__); globalThis.__786PreviewRoot.render("
    )
}

function patchIframe(iframe: HTMLIFrameElement) {
  const current = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  const patched = patchPreviewSource(current)
  if (!patched || patched === current) return

  const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc")
  descriptor?.set?.call(iframe, patched)
}

function ensureUrlInput() {
  const container = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-url")
  if (!container || container.querySelector("#admin-chat-preview-url")) return
  container.innerHTML = '<span>🔒</span><input id="admin-chat-preview-url" value="https://preview.786.chat" aria-label="Preview URL" spellcheck="false" />'
  const input = container.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (input) {
    input.style.width = "100%"
    input.style.minWidth = "0"
    input.style.border = "0"
    input.style.outline = "0"
    input.style.background = "transparent"
    input.style.color = "inherit"
    input.style.font = "inherit"
  }
}

function setUrl(path: string) {
  const input = document.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (!input) return
  const normalized = normalizePath(path)
  input.value = `https://preview.786.chat${normalized === "/" ? "" : normalized}`
}

function navigate(path: string) {
  const iframe = getPreviewIframe()
  if (!iframe) return
  patchIframe(iframe)
  const normalized = normalizePath(path)
  setUrl(normalized)
  iframe.contentWindow?.postMessage({ type: "786-preview-navigate", path: normalized }, "*")
  window.setTimeout(() => iframe.contentWindow?.postMessage({ type: "786-preview-navigate", path: normalized }, "*"), 120)
}

export function AdminChatPreviewRouter() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    const apply = () => {
      ensureUrlInput()
      const iframe = getPreviewIframe()
      if (iframe) patchIframe(iframe)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.id !== "admin-chat-preview-url" || event.key !== "Enter") return
      event.preventDefault()
      navigate(target.value)
      target.blur()
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== "786-preview-path") return
      setUrl(data.path || "/")
    }

    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("message", onMessage)

    return () => {
      observer.disconnect()
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("message", onMessage)
    }
  }, [pathname])

  return null
}
