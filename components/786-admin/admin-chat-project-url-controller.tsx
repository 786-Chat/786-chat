"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const PREVIEW_DISPLAY_ORIGIN = "https://786.chat"
const INTERACTIVE_STATE_BRIDGE_MARKER = 'data-786-preview-interactive-state="true"'

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

const INTERACTIVE_STATE_BRIDGE_SCRIPT = `<script ${INTERACTIVE_STATE_BRIDGE_MARKER}>
(function(){
  if (window.__786PreviewInteractiveStateInstalled) return;
  window.__786PreviewInteractiveStateInstalled = true;

  var legacyCategories = { all: '', starters: 'starters', 'main courses': 'main-courses', pizza: 'pizza', desserts: 'desserts', drinks: 'drinks' };
  var blockedAction = /^(add|buy|order|submit|save|delete|remove|edit|book|checkout|pay|send|login|log in|sign in|sign up|open|close|next|previous|back|refresh|publish|upload|download|cancel|confirm|continue)(\\s|$)/i;

  function textOf(node){ return String(node && node.textContent || '').trim().replace(/\\s+/g, ' '); }
  function slugOf(value){
    return String(value || '').trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  }
  function buttonFrom(event){
    var target = event && event.target;
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('button,[role=tab],[role=button]');
  }
  function directButtons(parent){
    if (!parent || !parent.children) return [];
    return Array.prototype.filter.call(parent.children, function(child){
      return child && child.matches && child.matches('button,[role=tab],[role=button]');
    });
  }
  function isExplicitStateControl(button){
    if (!button || !button.matches) return false;
    if (button.matches('[role=tab],[data-tab],[data-filter],[data-category],[data-view],[aria-controls]')) return true;
    var parent = button.parentElement;
    return !!(parent && parent.matches && parent.matches('[role=tablist],[data-tabs],[data-filters],[data-filter-group],[data-category-group],[data-view-group]'));
  }
  function isSafeGroupedControl(button){
    var parent = button && button.parentElement;
    var siblings = directButtons(parent);
    if (siblings.length < 2 || siblings.length > 12) return false;
    for (var i = 0; i < siblings.length; i++) {
      var label = textOf(siblings[i]);
      if (!label || label.length > 40 || blockedAction.test(label)) return false;
    }
    return true;
  }
  function stateValue(button){
    var explicit = button.getAttribute('data-view') || button.getAttribute('data-tab') || button.getAttribute('data-filter') || button.getAttribute('data-category') || '';
    return slugOf(explicit || textOf(button));
  }
  function publish(event){
    var button = buttonFrom(event);
    if (!button) return;
    var label = textOf(button);
    if (!label || blockedAction.test(label)) return;
    if (!isExplicitStateControl(button) && !isSafeGroupedControl(button)) return;
    var value = stateValue(button);
    if (!value && label.toLowerCase() !== 'all') return;
    setTimeout(function(){
      try {
        window.parent.postMessage({ type: '786-preview-view-changed', view: value, label: label }, '*');
        var legacy = legacyCategories[label.toLowerCase()];
        if (typeof legacy !== 'undefined') window.parent.postMessage({ type: '786-preview-category-changed', category: legacy }, '*');
      } catch (_) {}
    }, 0);
  }
  function applyView(value){
    var wanted = slugOf(value);
    var buttons = Array.prototype.slice.call(document.querySelectorAll('button,[role=tab],[role=button]'));
    for (var i = 0; i < buttons.length; i++) {
      if (!isExplicitStateControl(buttons[i]) && !isSafeGroupedControl(buttons[i])) continue;
      if (stateValue(buttons[i]) === wanted) { buttons[i].click(); return true; }
    }
    return false;
  }

  document.addEventListener('click', publish, true);
  window.addEventListener('message', function(event){
    var data = event && event.data;
    if (!data) return;
    if (data.type === '786-preview-apply-view') applyView(data.view || '');
    if (data.type === '786-preview-apply-category') applyView(data.category || '');
  });
})();
<\/script>`

type PreviewLocation = {
  path: string
  category: string
  view: string
}

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

function normalizeStateValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

function readLocation(projectId: string): PreviewLocation {
  if (!projectId) return { path: "/", category: "", view: "" }
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(projectId)) || "{}") as Partial<PreviewLocation>
    const category = normalizeStateValue(String(value.category || ""))
    return {
      path: normalizePath(value.path || "/"),
      category,
      view: normalizeStateValue(String(value.view || category)),
    }
  } catch {
    return { path: "/", category: "", view: "" }
  }
}

function saveLocation(projectId: string, location: PreviewLocation): void {
  if (!projectId) return
  try { localStorage.setItem(storageKey(projectId), JSON.stringify(location)) } catch {}
}

function getPreviewIframe(): HTMLIFrameElement | null {
  return Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe")).find((frame) => /preview/i.test(frame.title || "")) || null
}

function injectInteractiveStateBridge(srcDoc: string): string {
  if (!srcDoc || srcDoc.includes(INTERACTIVE_STATE_BRIDGE_MARKER)) return srcDoc
  if (srcDoc.includes("</head>")) return srcDoc.replace("</head>", `${INTERACTIVE_STATE_BRIDGE_SCRIPT}\n</head>`)
  if (srcDoc.includes("<body>")) return srcDoc.replace("<body>", `<body>\n${INTERACTIVE_STATE_BRIDGE_SCRIPT}`)
  return `${INTERACTIVE_STATE_BRIDGE_SCRIPT}\n${srcDoc}`
}

function visibleUrl(_projectId: string, location: PreviewLocation): string {
  const normalizedPath = normalizePath(location.path)
  const category = normalizeStateValue(location.category)
  const view = normalizeStateValue(location.view)
  const categoryRoute = normalizedPath === "/menu" ? CATEGORY_ROUTE_BY_VALUE[category] : undefined
  const route = categoryRoute || (normalizedPath === "/" ? "" : normalizedPath)
  if (categoryRoute || !view) return `${PREVIEW_DISPLAY_ORIGIN}${route}`
  return `${PREVIEW_DISPLAY_ORIGIN}${route}?view=${encodeURIComponent(view)}`
}

function parseInput(value: string, projectId: string): PreviewLocation {
  let raw = value.trim()
  let category = ""
  let view = ""
  try {
    const url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw || "/", PREVIEW_DISPLAY_ORIGIN)
    raw = url.pathname
    category = normalizeStateValue(url.searchParams.get("category") || "")
    view = normalizeStateValue(url.searchParams.get("view") || url.searchParams.get("tab") || url.searchParams.get("filter") || "")
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
  if (path === "/home") return { path: "/", category: "", view }
  const cleanCategory = CATEGORY_VALUE_BY_ROUTE[path]
  if (cleanCategory) return { path: "/menu", category: cleanCategory, view: cleanCategory }
  if (path === "/menu") return { path, category, view: view || category }
  return { path, category: "", view }
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
      if (document.activeElement !== input) input.value = visibleUrl(projectId, location)
    }

    const sendLocationToFrame = (frame: HTMLIFrameElement) => {
      frame.contentWindow?.postMessage({ type: "786-preview-navigate", path: location.path }, "*")
      window.setTimeout(() => {
        frame.contentWindow?.postMessage({ type: "786-preview-apply-view", view: location.view }, "*")
        frame.contentWindow?.postMessage({ type: "786-preview-apply-category", category: location.category }, "*")
      }, 120)
    }

    const patchInteractiveStateBridge = () => {
      const frame = getPreviewIframe()
      if (!frame || patchedFrames.has(frame)) return
      const current = frame.getAttribute("srcdoc") || frame.srcdoc || ""
      if (!current) return
      const patched = injectInteractiveStateBridge(current)
      patchedFrames.add(frame)
      if (patched === current) return
      frame.addEventListener("load", () => sendLocationToFrame(frame), { once: true })
      frame.srcdoc = patched
    }

    const navigate = (next: PreviewLocation) => {
      location = {
        path: normalizePath(next.path),
        category: normalizeStateValue(next.category),
        view: normalizeStateValue(next.view),
      }
      saveLocation(projectId, location)
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
      const data = event.data as { type?: string; path?: string; category?: string; view?: string } | null
      if (!data) return

      if (data.type === "786-preview-route-changed" && typeof data.path === "string") {
        const nextPath = normalizePath(data.path)
        if (nextPath !== location.path) {
          location.category = ""
          location.view = ""
        }
        location.path = nextPath
      } else if (data.type === "786-preview-category-changed") {
        location.path = "/menu"
        location.category = normalizeStateValue(String(data.category || ""))
        location.view = location.category
      } else if (data.type === "786-preview-view-changed") {
        location.view = normalizeStateValue(String(data.view || ""))
        if (location.path === "/menu" && CATEGORY_ROUTE_BY_VALUE[location.view] !== undefined) {
          location.category = location.view
        } else {
          location.category = ""
        }
      } else {
        return
      }

      saveLocation(projectId, location)
      ensureInput()
    }

    const apply = () => {
      syncProject()
      ensureInput()
      patchInteractiveStateBridge()
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
