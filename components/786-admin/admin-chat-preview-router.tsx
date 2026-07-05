"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const PREVIEW_ORIGIN = "https://preview.786.chat"
const PREVIEW_ROUTE_KEY = "786chat_admin_preview_route_v1"

type PreviewWindow = Window & typeof globalThis & {
  React?: typeof import("react")
  ReactDOM?: {
    createRoot?: (container: Element | DocumentFragment) => { render: (node: unknown) => void }
  }
  __786PreviewRouteRoot?: { render: (node: unknown) => void }
}

type RouteRegistry = Record<string, string>

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

function routeFromPagePath(filePath: string): string | null {
  const normalized = filePath.replace(/^src\//, "")
  const match = normalized.match(/^app\/(.*\/)?page\.(?:tsx?|jsx?)$/)
  if (!match) return null
  const segments = (match[1] || "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment))
  return normalizePath(segments.length ? `/${segments.join("/")}` : "/")
}

function getPreviewIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"))
  return iframes.find((iframe) => /preview/i.test(iframe.title || "")) || null
}

function ensureUrlInput() {
  const container = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-url")
  if (!container || container.querySelector("#admin-chat-preview-url")) return

  container.innerHTML = `<span aria-hidden="true">🔒</span><input id="admin-chat-preview-url" value="${PREVIEW_ORIGIN}" aria-label="Preview URL" spellcheck="false" autocomplete="off" />`
  const input = container.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (!input) return

  input.style.width = "100%"
  input.style.minWidth = "0"
  input.style.border = "0"
  input.style.outline = "0"
  input.style.background = "transparent"
  input.style.color = "inherit"
  input.style.font = "inherit"
}

function setUrl(path: string) {
  const normalized = normalizePath(path)
  const input = document.querySelector<HTMLInputElement>("#admin-chat-preview-url")
  if (input) input.value = `${PREVIEW_ORIGIN}${normalized === "/" ? "" : normalized}`
  try { localStorage.setItem(PREVIEW_ROUTE_KEY, normalized) } catch {}
}

function getSavedRoute(): string {
  try { return normalizePath(localStorage.getItem(PREVIEW_ROUTE_KEY) || "/") } catch { return "/" }
}

function readRuntimeSource(iframe: HTMLIFrameElement): string | null {
  const srcDoc = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
  const match = srcDoc.match(/var source = ("(?:\\.|[^"\\])*")\s*\n\s*var compiled =/)
  if (!match) return null
  try { return JSON.parse(match[1]) as string } catch { return null }
}

function buildRouteRegistry(runtimeSource: string): RouteRegistry {
  const registry: RouteRegistry = {}
  const rootMatch = runtimeSource.match(/const __Root__ = \(typeof ([A-Za-z_$][\w$]*) !== 'undefined'\)/)
  if (rootMatch) registry["/"] = rootMatch[1]

  const blockPattern = /\/\/ ((?:src\/)?app\/(?:[^\n]*\/)?page\.(?:tsx?|jsx?))\n\(function\(\)\{\n([\s\S]*?)\n\}\)\(\);/g
  let block: RegExpExecArray | null
  while ((block = blockPattern.exec(runtimeSource)) !== null) {
    const route = routeFromPagePath(block[1])
    if (!route || route === "/") continue
    const publishPattern = /globalThis\.([A-Za-z_$][\w$]*)\s*=\s*\1\s*;/g
    let publish: RegExpExecArray | null
    let componentName: string | null = null
    while ((publish = publishPattern.exec(block[2])) !== null) componentName = publish[1]
    if (componentName) registry[route] = componentName
  }
  return registry
}

function showRouteNotFound(frameWindow: PreviewWindow, path: string, availableRoutes: string[]) {
  const documentRef = frameWindow.document
  const oldRoot = documentRef.getElementById("root")
  if (!oldRoot) return
  const root = documentRef.createElement("div")
  root.id = "root"
  oldRoot.replaceWith(root)
  root.innerHTML = `<div id="__preview_error"><strong>Route not found: ${path.replace(/[&<>"']/g, "")}</strong>\n\nAvailable routes:\n${availableRoutes.join("\n")}</div>`
}

function renderRoute(iframe: HTMLIFrameElement, path: string, notify = true): boolean {
  const frameWindow = iframe.contentWindow as PreviewWindow | null
  if (!frameWindow?.document || !frameWindow.React || !frameWindow.ReactDOM?.createRoot) return false
  const runtimeSource = readRuntimeSource(iframe)
  if (!runtimeSource) return false

  const registry = buildRouteRegistry(runtimeSource)
  const normalized = normalizePath(path)
  const componentName = registry[normalized]
  if (!componentName) {
    showRouteNotFound(frameWindow, normalized, Object.keys(registry).sort())
    setUrl(normalized)
    if (notify) window.postMessage({ type: "786-preview-route-changed", path: normalized, found: false }, window.location.origin)
    return true
  }

  const component = (frameWindow as unknown as Record<string, unknown>)[componentName]
  if (typeof component !== "function" && typeof component !== "object") return false

  const documentRef = frameWindow.document
  const oldRoot = documentRef.getElementById("root")
  if (!oldRoot) return false
  const root = documentRef.createElement("div")
  root.id = "root"
  oldRoot.replaceWith(root)
  frameWindow.__786PreviewRouteRoot = frameWindow.ReactDOM.createRoot(root)
  frameWindow.__786PreviewRouteRoot.render(frameWindow.React.createElement(component as never))
  try { frameWindow.history.replaceState({ previewRoute: normalized }, "", normalized) } catch {}
  setUrl(normalized)
  if (notify) window.postMessage({ type: "786-preview-route-changed", path: normalized, found: true }, window.location.origin)
  return true
}

function installIframeNavigation(iframe: HTMLIFrameElement) {
  const frameWindow = iframe.contentWindow as PreviewWindow | null
  const frameDocument = iframe.contentDocument
  if (!frameWindow || !frameDocument || iframe.dataset.previewRouterReady === "true") return
  iframe.dataset.previewRouterReady = "true"

  frameDocument.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof frameWindow.Element)) return
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return
    const rawHref = anchor.getAttribute("href") || ""
    if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return
    let url: URL
    try { url = new URL(rawHref, PREVIEW_ORIGIN) } catch { return }
    if (url.origin !== PREVIEW_ORIGIN) return
    event.preventDefault()
    renderRoute(iframe, url.pathname)
  }, true)

  frameWindow.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as { type?: string; path?: string } | null
    if (!data || data.type !== "786-preview-navigate" || typeof data.path !== "string") return
    renderRoute(iframe, data.path)
  })

  const savedRoute = getSavedRoute()
  if (savedRoute !== "/") renderRoute(iframe, savedRoute, false)
  else setUrl("/")
}

function navigate(path: string) {
  const iframe = getPreviewIframe()
  if (!iframe) return
  const normalized = normalizePath(path)
  iframe.contentWindow?.postMessage({ type: "786-preview-navigate", path: normalized }, "*")
  window.setTimeout(() => {
    if (!renderRoute(iframe, normalized)) setUrl(normalized)
  }, 0)
}

export function AdminChatPreviewRouter() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    ensureUrlInput()
    const wirePreview = () => {
      ensureUrlInput()
      const iframe = getPreviewIframe()
      if (!iframe) return
      if (iframe.contentDocument?.readyState === "complete") installIframeNavigation(iframe)
      iframe.addEventListener("load", () => installIframeNavigation(iframe), { once: true })
    }

    wirePreview()
    const observer = new MutationObserver(wirePreview)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.id !== "admin-chat-preview-url" || event.key !== "Enter") return
      event.preventDefault()
      navigate(target.value)
      target.blur()
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; path?: string } | null
      if (!data || data.type !== "786-preview-navigate" || typeof data.path !== "string") return
      navigate(data.path)
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
