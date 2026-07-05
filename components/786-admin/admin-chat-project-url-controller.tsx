"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const PREVIEW_DISPLAY_ORIGIN = "https://786.chat"
const CATEGORY_BRIDGE_MARKER = 'data-786-preview-category-bridge="true"'

const CATEGORY_ROUTE_BY_VALUE: Record<string, string> = {
  starters: "/starters",
  "main-courses": "/main-courses",
  pizza: "/pizza",
  desserts: "/desserts",
  drinks: "/drinks",
}

const CATEGORY_VALUE_BY_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_ROUTE_BY_VALUE).map(([category, route]) => [route, category]),
)

const CATEGORY_BRIDGE_SCRIPT = `<script ${CATEGORY_BRIDGE_MARKER}>
(function(){
  if (window.__786PreviewCategoryBridgeInstalled) return;
  window.__786PreviewCategoryBridgeInstalled = true;
  var labels = { all: '', starters: 'starters', 'main courses': 'main-courses', pizza: 'pizza', desserts: 'desserts', drinks: 'drinks' };
  function labelOf(node){ return String(node && node.textContent || '').trim().toLowerCase().replace(/\\s+/g, ' '); }
  function buttonFrom(event){
    var target = event && event.target;
    if (!target) return null;
    if (typeof target.closest === 'function') return target.closest('button,[role=button]');
    return null;
  }
  function publish(event){
    var button = buttonFrom(event);
    if (!button) return;
    var label = labelOf(button);
    if (!Object.prototype.hasOwnProperty.call(labels, label)) return;
    setTimeout(function(){
      try { window.parent.postMessage({ type: '786-preview-category-changed', category: labels[label] }, '*'); } catch (_) {}
    }, 0);
  }
  document.addEventListener('click', publish, true);
  window.addEventListener('message', function(event){
    var data = event && event.data;
    if (!data || data.type !== '786-preview-apply-category') return;
    var wanted = String(data.category || '').trim().toLowerCase();
    var buttons = Array.prototype.slice.call(document.querySelectorAll('button,[role=button]'));
    for (var i = 0; i < buttons.length; i++) {
      var label = labelOf(buttons[i]);
      if (Object.prototype.hasOwnProperty.call(labels, label) && labels[label] === wanted) {
        buttons[i].click();
        break;
      }
    }
  });
})();
<\/script>`

function getProjectId(): string {
  try { return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim() } catch { return "" }
}

function storageKey(projectId: string): string {
  return `786chat_admin_preview_location_v2_${projectId}`
}

function normalizePath(value: string): string {
  let path = value.trim() || "/"
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || "/"
  } catch {}
  path = path.split("?")[0].split("#")[0]
  if (!path.startsWith("/")) path = `/${path}`
  path = path.replace(/\/{2,}/g, "/")
  if (path.length > 1) path = path.replace(/\/$/, "")
  return (path || "/").toLowerCase()
}

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

function readLocation(projectId: string): { path: string; category: string } {
  if (!projectId) return { path: "/", category: "" }
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(projectId)) || "{}") as { path?: string; category?: string }
    return {
      path: normalizePath(value.path || "/"),
      category: normalizeCategory(String(value.category || "")),
    }
  } catch {
    return { path: "/", category: "" }
  }
}

function saveLocation(projectId: string, path: string, category: string): void {
  if (!projectId) return
  try { localStorage.setItem(storageKey(projectId), JSON.stringify({ path, category })) } catch {}
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) => /preview/i.test(frame.title || "")) || null
}

function injectCategoryBridge(srcDoc: string): string {
  if (!srcDoc || srcDoc.includes(CATEGORY_BRIDGE_MARKER)) return srcDoc
  if (srcDoc.includes("</head>")) return srcDoc.replace("</head>", `${CATEGORY_BRIDGE_SCRIPT}\n</head>`)
  if (srcDoc.includes("<body>")) return srcDoc.replace("<body>", `<body>\n${CATEGORY_BRIDGE_SCRIPT}`)
  return `${CATEGORY_BRIDGE_SCRIPT}\n${srcDoc}`
}

function visibleUrl(_projectId: string, path: string, category: string): string {
  const normalizedPath = normalizePath(path)
  const normalizedCategory = normalizeCategory(category)
  const categoryRoute = normalizedPath === "/menu" ? CATEGORY_ROUTE_BY_VALUE[normalizedCategory] : undefined
  const route = categoryRoute || (normalizedPath === "/" ? "" : normalizedPath)
  return `${PREVIEW_DISPLAY_ORIGIN}${route}`
}

function parseInput(value: string, projectId: string): { path: string; category: string } {
  let raw = value.trim()
  let category = ""
  try {
    const url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw || "/", PREVIEW_DISPLAY_ORIGIN)
    raw = url.pathname
    category = normalizeCategory(url.searchParams.get("category") || "")
  } catch {}

  let path = normalizePath(raw)
  if (projectId) {
    const full = `/${projectId.toLowerCase()}`
    const short = `/${projectId.slice(0, 8).toLowerCase()}`
    if (path === full || path === short) path = "/"
    else if (path.startsWith(`${full}/`)) path = path.slice(full.length) || "/"
    else if (path.startsWith(`${short}/`)) path = path.slice(short.length) || "/"
  }

  path = normalizePath(path)
  if (path === "/home") return { path: "/", category: "" }
  const cleanCategory = CATEGORY_VALUE_BY_ROUTE[path]
  if (cleanCategory) return { path: "/menu", category: cleanCategory }
  if (path === "/menu") return { path, category }
  return { path, category: "" }
}

export function AdminChatProjectUrlController() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    let projectId = getProjectId()
    let location = readLocation(projectId)
    const patchedFrames = new WeakSet<HTMLIFrameElement>()

    const ensureInput = () => {
      const container = document.querySelector<HTMLElement>("#admin-chat-browser-bar .browser-url")
      if (!container) return
      let input = container.querySelector<HTMLInputElement>("#admin-chat-project-url")
      if (!input) {
        container.innerHTML = '<span aria-hidden="true">🔒</span><input id="admin-chat-project-url" aria-label="Project preview URL" autocomplete="off" spellcheck="false" />'
        input = container.querySelector<HTMLInputElement>("#admin-chat-project-url")
      }
      if (!input) return
      input.style.width = "100%"
      input.style.minWidth = "0"
      input.style.border = "0"
      input.style.outline = "0"
      input.style.background = "transparent"
      input.style.color = "inherit"
      input.style.font = "inherit"
      input.style.cursor = "text"
      input.style.pointerEvents = "auto"
      if (document.activeElement !== input) input.value = visibleUrl(projectId, location.path, location.category)
    }

    const sendLocationToFrame = (frame: HTMLIFrameElement) => {
      frame.contentWindow?.postMessage({ type: "786-preview-navigate", path: location.path }, "*")
      window.setTimeout(() => {
        frame.contentWindow?.postMessage({ type: "786-preview-apply-category", category: location.category }, "*")
      }, 120)
    }

    const patchCategoryBridge = () => {
      const frame = getPreviewIframe()
      if (!frame || patchedFrames.has(frame)) return
      const current = frame.getAttribute("srcdoc") || frame.srcdoc || ""
      if (!current) return
      const patched = injectCategoryBridge(current)
      patchedFrames.add(frame)
      if (patched === current) return
      frame.addEventListener("load", () => sendLocationToFrame(frame), { once: true })
      frame.srcdoc = patched
    }

    const navigate = (next: { path: string; category: string }) => {
      location = {
        path: normalizePath(next.path),
        category: normalizeCategory(next.category),
      }
      saveLocation(projectId, location.path, location.category)
      ensureInput()
      const frame = getPreviewIframe()
      if (frame) sendLocationToFrame(frame)
    }

    const syncProject = () => {
      const nextId = getProjectId()
      if (nextId === projectId) return
      projectId = nextId
      location = readLocation(projectId)
      ensureInput()
      window.setTimeout(() => navigate(location), 120)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement) || target.id !== "admin-chat-project-url" || event.key !== "Enter") return
      event.preventDefault()
      navigate(parseInput(target.value, projectId))
      target.blur()
    }

    const onMessage = (event: MessageEvent) => {
      const frame = getPreviewIframe()
      if (!frame || event.source !== frame.contentWindow) return
      const data = event.data as { type?: string; path?: string; category?: string } | null
      if (!data) return

      if (data.type === "786-preview-route-changed" && typeof data.path === "string") {
        const nextPath = normalizePath(data.path)
        if (nextPath !== "/menu") location.category = ""
        else if (location.path !== "/menu") location.category = ""
        location.path = nextPath
      } else if (data.type === "786-preview-category-changed") {
        location.path = "/menu"
        location.category = normalizeCategory(String(data.category || ""))
      } else {
        return
      }

      saveLocation(projectId, location.path, location.category)
      ensureInput()
    }

    const apply = () => {
      syncProject()
      ensureInput()
      patchCategoryBridge()
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })
    const timer = window.setInterval(apply, 800)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("message", onMessage)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("message", onMessage)
    }
  }, [pathname])

  return null
}
