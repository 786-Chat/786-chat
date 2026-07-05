"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Code2, FolderKanban, Loader2, Monitor, Paperclip, Plus, Rocket, Send, Smartphone, Tablet, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { SevenEightSixProject, SevenEightSixProjectFileMap } from "@/lib/786-admin/local-project-generator"
import type { AdminMessage, AdminProjectPreviewState, AdminProjectWithData } from "@/lib/786-admin/types"

const ADMIN_EMAIL = "mujeeb@job4u.com"
const CHAT_WIDTH_KEY = "786chat_admin_chat_width_v1"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const OLD_PROJECT_KEY = "786chat_admin_project_v5"
const LEGACY_PROJECTS_KEY = "786chat_admin_projects_v1"

const EDIT_CONTEXT_PRIMARY_FILES = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "components/footer.tsx",
  "components/header.tsx",
  "components/hero.tsx",
  "components/navbar.tsx",
  "components/nav.tsx",
  "lib/utils.ts",
  "README.md",
]

const EDIT_CONTEXT_MAX_EXTRA_FILES = 8

type Mode = "auto" | "deepseek-flash" | "deepseek-pro" | "gemini-flash" | "gemini-pro"
type Panel = "preview" | "code"
type Device = "desktop" | "tablet" | "ipad" | "mobile"
type UiMessage = { id: string; role: "user" | "assistant"; content: string; model?: string | null; reason?: string | null }

type ExistingProjectContext = {
  title: string
  description: string
  fileTree: string[]
  keyFiles: Record<string, string>
}

type PreviewPayload = { html: string; key: string }

type ActiveProject = {
  id: string
  title: string
  description: string
  prompt: string
  files: SevenEightSixProjectFileMap
  preview_state: AdminProjectPreviewState
}

type PreviewRoute = {
  path: string
  sourcePath: string
  componentName: string
  body: string
  exportedNames: string[]
}

function uiFromAdminMessage(m: AdminMessage): UiMessage {
  return { id: m.id, role: m.role === "system" ? "assistant" : m.role, content: m.content, model: m.model, reason: m.reason }
}

function filesToPreviewPayload(files: SevenEightSixProjectFileMap | undefined): PreviewPayload {
  const html = filesToHtml(files)
  return { html, key: stablePreviewKey(files, html) }
}

function routeFromPagePath(path: string): string | null {
  const normalized = path.replace(/^src\//, "")
  const match = normalized.match(/^app\/(.*\/)?page\.(?:tsx?|jsx?)$/)
  if (!match) return null
  const segments = (match[1] || "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment))
  return segments.length === 0 ? "/" : `/${segments.join("/")}`
}

function filesToHtml(files: SevenEightSixProjectFileMap | undefined) {
  if (!files || Object.keys(files).length === 0) {
    return buildEmptyPreview("", "Preview will appear here once a project is generated.")
  }

  const rawCss = files["app/globals.css"] || files["src/app/globals.css"] || ""
  const css = rawCss.replace(/@tailwind\s+[a-z]+\s*;?/gi, "").trim()
  const isSourceFile = (path: string) => /\.(tsx?|jsx?)$/.test(path) && !/\.d\.ts$/.test(path)
  const isLayoutFile = (path: string) => /^(src\/)?app\/layout\.(tsx?|jsx?)$/.test(path)
  const dependencyOrder = (path: string): number => {
    if (/^(src\/)?lib\//.test(path)) return 0
    if (/^(src\/)?(utils|util|helpers|data|constants|types)\//.test(path)) return 1
    if (/^(src\/)?hooks\//.test(path)) return 2
    if (/^(src\/)?components\//.test(path)) return 3
    return 4
  }

  const routeEntries = Object.entries(files)
    .map(([sourcePath, src]) => ({ sourcePath, src, path: routeFromPagePath(sourcePath) }))
    .filter((entry): entry is { sourcePath: string; src: string; path: string } => Boolean(entry.path) && typeof entry.src === "string" && entry.src.trim().length > 0)
    .sort((a, b) => a.path.localeCompare(b.path))

  if (!routeEntries.some((entry) => entry.path === "/")) {
    return buildEmptyPreview(css, "No app/page.tsx file was found in this project, so preview is unavailable.")
  }

  const routePathSet = new Set(routeEntries.map((entry) => entry.sourcePath))
  const dependencyBodies = Object.entries(files)
    .filter(([path]) => !routePathSet.has(path) && !isLayoutFile(path) && isSourceFile(path))
    .sort(([a], [b]) => dependencyOrder(a) - dependencyOrder(b) || a.localeCompare(b))
    .map(([path, src]) => {
      const transformed = transformPreviewSource(src)
      if (!transformed.body) return ""
      const publish = Array.from(new Set([...transformed.exportedNames, ...(transformed.defaultName ? [transformed.defaultName] : [])]))
        .map((name) => `if (typeof ${name} !== "undefined") globalThis.${name} = ${name};`)
        .join("\n")
      return `// ${path}\n(function(){\n${transformed.body}\n${publish}\n})();`
    })
    .filter(Boolean)
    .join("\n\n")

  const routes: PreviewRoute[] = routeEntries.map(({ path, sourcePath, src }, index) => {
    const transformed = transformPreviewSource(src)
    const localDefaultName = transformed.defaultName || `__PreviewPage${index}`
    const componentName = `__786Route${index}`
    const publishNamed = transformed.exportedNames
      .filter((name) => name !== localDefaultName)
      .map((name) => `if (typeof ${name} !== "undefined") globalThis.${name} = ${name};`)
      .join("\n")
    const body = `// ${sourcePath}\n(function(){\n${transformed.body}\n${publishNamed}\nif (typeof ${localDefaultName} !== "undefined") globalThis.${componentName} = ${localDefaultName};\n})();`
    return { path, sourcePath, componentName, body, exportedNames: transformed.exportedNames }
  })

  const userScript = [dependencyBodies, ...routes.map((route) => route.body)].filter(Boolean).join("\n\n")
  const safeUserScript = addMissingPreviewDataShims(userScript)
  const routeRegistry = Object.fromEntries(routes.map((route) => [route.path, route.componentName]))
  const runtimeSource = buildPreviewRuntimeSource(safeUserScript, routeRegistry)
  const runtimeSourceJson = safeScriptJson(runtimeSource)

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://cdn.tailwindcss.com"></script>
<style>${escapePreviewStyle(css)}</style>
<style>html,body{margin:0;padding:0;background:#0b111d;color:#e2e8f0;font-family:Inter,system-ui,-apple-system,sans-serif}#__preview_loading{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:32px;font-family:system-ui;color:#94a3b8;background:#0b111d;font-size:13px;line-height:1.6;letter-spacing:0.01em}#__preview_loading_dot{display:inline-block;width:8px;height:8px;border-radius:9999px;background:#67e8f9;margin-right:10px;box-shadow:0 0 12px rgba(103,232,249,0.6);animation:__pulse 1s ease-in-out infinite}@keyframes __pulse{0%,100%{opacity:0.4;transform:scale(0.9)}50%{opacity:1;transform:scale(1.15)}}#__preview_error{padding:24px;margin:24px;font-family:system-ui;color:#fecaca;background:#1a0f0f;border:1px solid #7f1d1d;border-radius:14px;white-space:pre-wrap;font-size:13px;line-height:1.5}</style>
</head>
<body>
<div id="root"><div id="__preview_loading"><span><span id="__preview_loading_dot"></span>Loading generated preview...</span></div></div>
<script>
(function(){
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch})}
  window.__showPreviewError = function(message){
    var root = document.getElementById('root')
    if (root) root.innerHTML = '<div id="__preview_error">Preview error: ' + escapeHtml(message) + '</div>'
  }
  window.addEventListener('error', function(event){
    var msg = event && event.message ? event.message : 'Unknown preview runtime error'
    window.__showPreviewError(msg)
  })
  window.addEventListener('unhandledrejection', function(event){
    var reason = event && event.reason ? event.reason : 'Unknown preview promise rejection'
    window.__showPreviewError(reason && reason.message ? reason.message : String(reason))
  })
  window.__previewStarted = false
  setTimeout(function(){
    var loading = document.getElementById('__preview_loading')
    if (loading && !window.__previewStarted) {
      window.__showPreviewError('Preview runtime did not start. A CDN script may be blocked or Babel could not compile the generated files.')
    }
  }, 4500)
})();
</script>
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin onerror="window.__showPreviewError('React CDN failed to load')"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin onerror="window.__showPreviewError('ReactDOM CDN failed to load')"></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js" onerror="window.__showPreviewError('Babel CDN failed to load')"></script>
<script>
(function(){
  try {
    window.__previewStarted = true
    if (!window.React) throw new Error('React runtime is unavailable')
    if (!window.ReactDOM) throw new Error('ReactDOM runtime is unavailable')
    if (!window.Babel) throw new Error('Babel runtime is unavailable')
    var source = ${runtimeSourceJson}
    var compiled = window.Babel.transform(source, { presets: ['env', 'react', 'typescript'], filename: 'preview.tsx' }).code
    new Function(compiled)()
  } catch (err) {
    window.__showPreviewError(err && err.message ? String(err.message) : String(err))
    console.error('[786.Chat preview]', err)
  }
})();
</script>
</body>
</html>`
}

function addMissingPreviewDataShims(source: string): string {
  const used = new Set<string>()
  const referenceRe = /\binitial[A-Z][A-Za-z0-9_$]*\b/g
  let match: RegExpExecArray | null

  while ((match = referenceRe.exec(source)) !== null) {
    const previous = match.index > 0 ? source[match.index - 1] : ""
    if (previous === "." || previous === "'" || previous === '"' || previous === "`") continue
    used.add(match[0])
  }

  const shims: string[] = []
  for (const name of used) {
    const declarationRe = new RegExp(`\\b(?:const|let|var|function|class)\\s+${name}\\b`)
    if (declarationRe.test(source)) continue

    let value = "[]"
    if (/customers?/i.test(name)) {
      value = `[
  { id: 'customer-1', name: 'Acme Industries', company: 'Acme Industries', email: 'hello@acme.test', status: 'Active', value: 24000, stage: 'Qualified' },
  { id: 'customer-2', name: 'Northstar Labs', company: 'Northstar Labs', email: 'team@northstar.test', status: 'New', value: 18000, stage: 'Proposal' },
  { id: 'customer-3', name: 'Summit Retail', company: 'Summit Retail', email: 'sales@summit.test', status: 'Active', value: 32000, stage: 'Won' }
]`
    } else if (/leads?/i.test(name)) {
      value = `[
  { id: 'lead-1', name: 'Acme Expansion', company: 'Acme Industries', status: 'New', stage: 'New', value: 12000, owner: 'Alex Morgan' },
  { id: 'lead-2', name: 'Northstar Upgrade', company: 'Northstar Labs', status: 'Qualified', stage: 'Qualified', value: 18000, owner: 'Jamie Lee' },
  { id: 'lead-3', name: 'Summit Renewal', company: 'Summit Retail', status: 'Proposal', stage: 'Proposal', value: 25000, owner: 'Taylor Reed' }
]`
    } else if (/deals?|pipeline/i.test(name)) {
      value = `[
  { id: 'deal-1', title: 'Enterprise Platform', name: 'Enterprise Platform', company: 'Acme Industries', stage: 'Qualified', value: 24000, probability: 65 },
  { id: 'deal-2', title: 'Analytics Upgrade', name: 'Analytics Upgrade', company: 'Northstar Labs', stage: 'Proposal', value: 18000, probability: 80 },
  { id: 'deal-3', title: 'Retail Automation', name: 'Retail Automation', company: 'Summit Retail', stage: 'Won', value: 32000, probability: 100 }
]`
    } else if (/activities?|events?/i.test(name)) {
      value = `[
  { id: 'activity-1', title: 'Follow-up call', description: 'Call with Acme Industries', time: '10:30 AM', type: 'call' },
  { id: 'activity-2', title: 'Proposal sent', description: 'Northstar analytics proposal', time: 'Yesterday', type: 'email' },
  { id: 'activity-3', title: 'Deal won', description: 'Summit Retail automation', time: '2 days ago', type: 'success' }
]`
    } else if (/products?|inventory|items?/i.test(name)) {
      value = `[
  { id: 'item-1', name: 'Premium Product', title: 'Premium Product', category: 'Featured', price: 49, stock: 24, quantity: 1, status: 'In Stock' },
  { id: 'item-2', name: 'Modern Collection', title: 'Modern Collection', category: 'New', price: 79, stock: 12, quantity: 1, status: 'In Stock' },
  { id: 'item-3', name: 'Signature Item', title: 'Signature Item', category: 'Popular', price: 99, stock: 6, quantity: 1, status: 'Low Stock' }
]`
    } else if (/students?/i.test(name)) {
      value = `[
  { id: 'student-1', name: 'Aisha Khan', className: 'Year 8', class: 'Year 8', attendance: 96, status: 'Active' },
  { id: 'student-2', name: 'Daniel Smith', className: 'Year 9', class: 'Year 9', attendance: 92, status: 'Active' },
  { id: 'student-3', name: 'Sara Ahmed', className: 'Year 10', class: 'Year 10', attendance: 98, status: 'Active' }
]`
    } else if (/teachers?/i.test(name)) {
      value = `[
  { id: 'teacher-1', name: 'Ms. Taylor', subject: 'Mathematics', status: 'Available' },
  { id: 'teacher-2', name: 'Mr. Wilson', subject: 'Science', status: 'Teaching' },
  { id: 'teacher-3', name: 'Mrs. Ahmed', subject: 'English', status: 'Available' }
]`
    } else if (/bookings?|appointments?/i.test(name)) {
      value = `[
  { id: 'booking-1', customer: 'Alex Morgan', service: 'Consultation', date: '2026-07-05', time: '10:00', status: 'Confirmed' },
  { id: 'booking-2', customer: 'Jamie Lee', service: 'Premium Session', date: '2026-07-05', time: '13:30', status: 'Pending' },
  { id: 'booking-3', customer: 'Taylor Reed', service: 'Follow-up', date: '2026-07-06', time: '09:30', status: 'Confirmed' }
]`
    } else if (/orders?|sales?/i.test(name)) {
      value = `[
  { id: 'order-1', customer: 'Acme Industries', total: 249, amount: 249, status: 'Completed', date: 'Today' },
  { id: 'order-2', customer: 'Northstar Labs', total: 179, amount: 179, status: 'Processing', date: 'Today' },
  { id: 'order-3', customer: 'Summit Retail', total: 329, amount: 329, status: 'Completed', date: 'Yesterday' }
]`
    } else if (/categories?/i.test(name)) {
      value = `['All', 'Featured', 'New', 'Popular']`
    }

    shims.push(`const ${name} = ${value}`)
  }

  return shims.length > 0 ? `${shims.join("\n")}\n\n${source}` : source
}

function buildPreviewRuntimeSource(userScript: string, routeRegistry: Record<string, string>): string {
  const routeRegistryJson = JSON.stringify(routeRegistry)
  return `
try {
  const __originalCreateContext = React.createContext.bind(React)
  const __noop = function () {}
  const __resolved = function () { return Promise.resolve() }
  const __sampleProducts = [
    { id: 'preview-product-1', name: 'Premium Preview Product', title: 'Premium Preview Product', price: 49, category: 'Featured', image: '', rating: 5, inStock: true },
    { id: 'preview-product-2', name: 'Modern Collection Item', title: 'Modern Collection Item', price: 79, category: 'New', image: '', rating: 4.8, inStock: true },
    { id: 'preview-product-3', name: 'Signature Ecommerce Item', title: 'Signature Ecommerce Item', price: 99, category: 'Popular', image: '', rating: 4.9, inStock: true }
  ]
  const __sampleCategories = ['All', 'Featured', 'New', 'Popular']
  function __previewValue() {
    var target = {
      products: __sampleProducts,
      allProducts: __sampleProducts,
      filteredProducts: __sampleProducts,
      categories: __sampleCategories,
      filters: { search: '', searchTerm: '', query: '', category: 'All', selectedCategory: 'All', sortBy: 'featured', sortOrder: 'asc', minPrice: 0, maxPrice: 9999, priceRange: [0, 9999] },
      cart: [], cartItems: [], wishlist: [], wishlistItems: [],
      user: { id: 'preview-user', name: 'Preview User', email: 'preview@786.chat' },
      theme: 'dark', toast: __noop, total: 0, subtotal: 0, count: 0, quantity: 0,
      isOpen: false, loading: false, error: null, search: '', query: '', keyword: '', searchTerm: '', searchQuery: '',
      category: 'All', selectedCategory: 'All', sortBy: 'featured', sortOrder: 'asc', minPrice: 0, maxPrice: 9999, priceRange: [0, 9999]
    }
    return new Proxy(target, {
      get: function (obj, prop) {
        if (prop in obj) return obj[prop]
        var key = String(prop)
        if (/^filtered(products|items|results|list|collection|rows)$/i.test(key)) return []
        if (/^(set|add|remove|toggle|update|clear|handle|on|open|close|apply|reset|select|filter|sort|show|hide)([A-Z_]|$)/.test(key)) return __noop
        if (/products|items|categories|list|results|collection|rows/i.test(key)) return []
        if (/filters|settings|options|state|form|data|meta/i.test(key)) return {}
        if (/term|query|search|keyword|category|sort|theme|view|mode|tab|status|email|name|title|label|description|slug|id/i.test(key)) {
          if (/category/i.test(key)) return 'All'
          if (/theme/i.test(key)) return 'dark'
          if (/sort/i.test(key)) return 'featured'
          return ''
        }
        if (/count|total|price|amount|quantity|index|page|limit|offset|size|min|max/i.test(key)) return 0
        if (/is|has|can|should|open|active|selected|loading|disabled|visible|checked|ready/i.test(key)) return false
        return __noop
      }
    })
  }
  const __previewContextFallback = __previewValue()
  function __safeCreateContext(defaultValue) {
    return __originalCreateContext(defaultValue === null || typeof defaultValue === 'undefined' ? __previewContextFallback : defaultValue)
  }
  try { React.createContext = __safeCreateContext } catch (_) {}

  const { useState, useEffect, useMemo, useCallback, useRef, useReducer, useContext, Fragment, forwardRef, memo, Children, cloneElement, isValidElement } = React
  const createContext = __safeCreateContext
  const Link = ({ children, href, ...rest }) => React.createElement('a', Object.assign({ href }, rest), children)
  const Image = ({ src, alt, width, height, fill, priority, ...rest }) => React.createElement('img', Object.assign({ src, alt, width, height }, rest))
  const __makeIcon = (name) => (props = {}) => React.createElement('span', Object.assign({}, props, { 'data-icon': name, 'aria-hidden': true, className: 'inline-block align-middle w-4 h-4 ' + (props.className || '') }))
  ;['FilterIcon','SearchIcon','CartIcon','ShoppingCartIcon','HeartIcon','WishlistIcon','UserIcon','MenuIcon','XIcon','PlusIcon','MinusIcon','StarIcon','ChevronLeftIcon','ChevronRightIcon','SlidersIcon','SlidersHorizontalIcon','GridIcon','ListIcon','PackageIcon','TagIcon','BellIcon','SettingsIcon','TrashIcon','EditIcon','EyeIcon'].forEach(function (name) { try { if (typeof globalThis[name] === 'undefined') globalThis[name] = __makeIcon(name) } catch (_) {} })

  const __audioNode = function () {
    return {
      connect: function () { return this }, disconnect: __noop, start: __noop, stop: __noop,
      frequency: { value: 0, setValueAtTime: __noop, linearRampToValueAtTime: __noop, exponentialRampToValueAtTime: __noop },
      gain: { value: 1, setValueAtTime: __noop, linearRampToValueAtTime: __noop, exponentialRampToValueAtTime: __noop },
    }
  }
  function __SafeAudioContext() {
    this.currentTime = 0
    this.destination = __audioNode()
    this.createOscillator = __audioNode
    this.createGain = __audioNode
    this.createAnalyser = __audioNode
    this.createBufferSource = __audioNode
    this.resume = __resolved
    this.close = __resolved
    this.suspend = __resolved
  }
  function __SafeAudio(src) {
    return { src: src || '', currentTime: 0, volume: 1, muted: false, loop: false, preload: 'auto', play: __resolved, pause: __noop, load: __noop, addEventListener: __noop, removeEventListener: __noop, dispatchEvent: function () { return true } }
  }
  try { globalThis.AudioContext = __SafeAudioContext; window.AudioContext = __SafeAudioContext } catch (_) {}
  try { globalThis.webkitAudioContext = __SafeAudioContext; window.webkitAudioContext = __SafeAudioContext } catch (_) {}
  try { globalThis.Audio = __SafeAudio; window.Audio = __SafeAudio } catch (_) {}

  if (typeof globalThis.cn === 'undefined') {
    globalThis.cn = function () {
      var args = Array.prototype.slice.call(arguments)
      return args.flat(Infinity).filter(Boolean).map(function (a) {
        return typeof a === 'string' ? a : Object.entries(a || {}).filter(function (e) { return e[1] }).map(function (e) { return e[0] }).join(' ')
      }).join(' ')
    }
  }
  if (typeof globalThis.clsx === 'undefined') globalThis.clsx = globalThis.cn
  if (typeof globalThis.twMerge === 'undefined') globalThis.twMerge = globalThis.cn
  if (typeof globalThis.cva === 'undefined') {
    globalThis.cva = function (base, _config) {
      return function () {
        var inputs = Array.prototype.slice.call(arguments)
        return globalThis.cn.apply(null, [base].concat(inputs))
      }
    }
  }

  ${escapePreviewScript(userScript)}

  class __PreviewErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null } }
    static getDerivedStateFromError(error) { return { error: error } }
    componentDidCatch(error, info) { console.error('[786.Chat preview render]', error, info) }
    render() {
      if (this.state.error) {
        var message = this.state.error && this.state.error.message ? String(this.state.error.message) : String(this.state.error)
        return React.createElement('div', { style: { margin: 24, padding: 24, borderRadius: 16, border: '1px solid rgba(248,113,113,0.55)', background: 'linear-gradient(135deg, rgba(127,29,29,0.35), rgba(15,23,42,0.95))', color: '#fecaca', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 } }, [
          React.createElement('div', { key: 'title', style: { color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 8 } }, 'Preview recovered from a render error'),
          React.createElement('div', { key: 'msg', style: { fontSize: 13, whiteSpace: 'pre-wrap' } }, message)
        ])
      }
      return this.props.children
    }
  }

  const __routeNames = ${routeRegistryJson}
  const __routes = {}
  Object.keys(__routeNames).forEach(function(path){
    var component = globalThis[__routeNames[path]]
    if (component) __routes[path] = component
  })
  const __mount__ = document.getElementById('root')
  const __reactRoot__ = ReactDOM.createRoot(__mount__)
  function __normalizeRoute(value) {
    var path = String(value || '/').trim()
    try { if (/^https?:\/\//i.test(path)) path = new URL(path).pathname || '/' } catch (_) {}
    path = path.split('?')[0].split('#')[0]
    if (!path.startsWith('/')) path = '/' + path
    path = path.replace(/\/{2,}/g, '/')
    if (path.length > 1) path = path.replace(/\/$/, '')
    return path || '/'
  }
  function __notifyRoute(path, found) {
    try { window.parent.postMessage({ type: '786-preview-route-changed', path: path, found: found }, '*') } catch (_) {}
  }
  function __renderRoute(value) {
    var path = __normalizeRoute(value)
    var Page = __routes[path]
    if (!Page) {
      var available = Object.keys(__routes).sort().join(', ')
      __reactRoot__.render(React.createElement('div', { id: '__preview_error' }, 'Route not found: ' + path + '\n\nAvailable routes: ' + available))
      __notifyRoute(path, false)
      return false
    }
    try { history.replaceState({ previewRoute: path }, '', path) } catch (_) {}
    __reactRoot__.render(React.createElement(__PreviewErrorBoundary, { key: path }, React.createElement(Page)))
    __notifyRoute(path, true)
    return true
  }
  window.__786PreviewNavigate = __renderRoute
  document.addEventListener('click', function(event) {
    var target = event.target
    if (!target || typeof target.closest !== 'function') return
    var anchor = target.closest('a[href]')
    if (!anchor) return
    var href = anchor.getAttribute('href') || ''
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return
    var url
    try { url = new URL(href, 'https://preview.786.chat') } catch (_) { return }
    if (url.origin !== 'https://preview.786.chat') return
    event.preventDefault()
    __renderRoute(url.pathname)
  }, true)
  window.addEventListener('message', function(event) {
    var data = event && event.data
    if (!data || data.type !== '786-preview-navigate') return
    __renderRoute(data.path)
  })
  __renderRoute('/')
} catch (err) {
  window.__showPreviewError(err && err.message ? String(err.message) : String(err))
  console.error('[786.Chat preview]', err)
}
`
}

function transformPreviewSource(src: string): { defaultName: string | null; exportedNames: string[]; body: string } {
  const lucideNames = new Set<string>()
  const exportedNames = new Set<string>()
  const lucideRe = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let match: RegExpExecArray | null

  while ((match = lucideRe.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const cleaned = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Z][\w$]*$/.test(cleaned)) lucideNames.add(cleaned)
    }
  }

  const namedExportRe = /\bexport\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g
  while ((match = namedExportRe.exec(src)) !== null) exportedNames.add(match[1])

  const exportListRe = /\bexport\s*\{([^}]*)\}\s*;?/g
  while ((match = exportListRe.exec(src)) !== null) {
    for (const raw of match[1].split(",")) {
      const localName = raw.trim().split(/\s+as\s+/i)[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(localName)) exportedNames.add(localName)
    }
  }

  const jsxIconRe = /<\s*([A-Z][\w$]*Icon)\b/g
  while ((match = jsxIconRe.exec(src)) !== null) lucideNames.add(match[1])
  const createElementIconRe = /React\.createElement\(\s*([A-Z][\w$]*Icon)\b/g
  while ((match = createElementIconRe.exec(src)) !== null) lucideNames.add(match[1])

  let source = src
  source = source.replace(/^["']use (client|server)["']\s*;?\s*\n?/m, "")
  source = source.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*import\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+\*\s+as\s+[\w$]+\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s*\{[^}]*\}\s+from\s+["'][^"']+["']\s*;?\s*$/gm, "")

  let defaultName: string | null = null
  const namedDefaultFunction = source.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/)
  if (namedDefaultFunction) {
    defaultName = namedDefaultFunction[1]
    source = source.replace(/export\s+default\s+function\s+/, "function ")
  } else if (/export\s+default\s+function\s*\(/.test(source)) {
    defaultName = "__DefaultExport__"
    source = source.replace(/export\s+default\s+function\s*\(/, "function __DefaultExport__(")
  } else {
    const namedDefault = source.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/)
    if (namedDefault) {
      defaultName = namedDefault[1]
      source = source.replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/, "")
    } else if (/export\s+default\s+/.test(source)) {
      defaultName = "__DefaultExport__"
      source = source.replace(/export\s+default\s+/, "const __DefaultExport__ = ")
    }
  }

  source = source.replace(/\bexport\s+(const|let|var|function|class|type|interface|enum)\b/g, "$1")
  source = source.replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
  source = source.replace(/^\s*export\s+type\s+[\s\S]*?(?=\n|$)/gm, "")

  const lucideShim = Array.from(lucideNames).map((name) => `globalThis.${name} = __makeIcon('${name}');`).join("\n")
  const body = (lucideShim ? `${lucideShim}\n` : "") + source.trim()
  return { defaultName, exportedNames: Array.from(exportedNames), body }
}

function escapePreviewScript(value: string): string {
  return value.replace(/<\/script>/gi, "<\\/script>")
}

function escapePreviewStyle(value: string): string {
  return value.replace(/<\/style>/gi, "<\\/style>")
}

function safeScriptJson(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

function stablePreviewKey(files: SevenEightSixProjectFileMap | undefined, html: string): string {
  const source = files ? Object.keys(files).sort().map((path) => `${path}:${files[path]}`).join("\n---786-file---\n") : html
  let hash = 2166136261
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

function buildEmptyPreview(css: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><style>${escapePreviewStyle(css)}</style><style>html,body{margin:0;padding:0;font-family:system-ui,sans-serif;background:#0b111d;color:#94a3b8}</style></head><body><div style="padding:32px;max-width:720px;margin:64px auto;border:1px solid rgba(148,163,184,0.18);background:rgba(255,255,255,0.03);border-radius:14px;color:#cbd5e1;font-size:13px;line-height:1.6">${message}</div></body></html>`
}

function buildExistingProjectContext(activeProject: ActiveProject | null, selectedFile: string): ExistingProjectContext | undefined {
  if (!activeProject) return undefined
  const fileTree = Object.keys(activeProject.files || {}).sort()
  if (fileTree.length === 0) return undefined
  const orderedCandidates = [selectedFile, ...EDIT_CONTEXT_PRIMARY_FILES, ...fileTree.filter((path) => path.startsWith("app/") || path.startsWith("components/")), ...fileTree]
  const keyFiles: Record<string, string> = {}
  for (const path of orderedCandidates) {
    if (Object.keys(keyFiles).length >= EDIT_CONTEXT_MAX_EXTRA_FILES) break
    if (!path || keyFiles[path] !== undefined) continue
    const content = activeProject.files[path]
    if (typeof content !== "string") continue
    keyFiles[path] = content
  }
  return { title: activeProject.title, description: activeProject.description, fileTree, keyFiles }
}

export default function SevenEightSixAdminChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [project, setProject] = useState<ActiveProject | null>(null)
  const [selectedFile, setSelectedFile] = useState("app/page.tsx")
  const [input, setInput] = useState("")
  const [mode] = useState<Mode>("auto")
  const [panel, setPanel] = useState<Panel>("preview")
  const [device, setDevice] = useState<Device>("desktop")
  const [sending, setSending] = useState(false)
  const [sound] = useState(true)
  const [chatWidth, setChatWidth] = useState(430)
  const [isResizing, setIsResizing] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])
  const fileNames = useMemo(() => Object.keys(project?.files || {}), [project])
  const previewPayload = useMemo(() => (project ? filesToPreviewPayload(project.files) : { html: "", key: "empty" }), [project])

  const previewFrameStyle = useMemo(() => {
    if (device === "mobile") return { width: "390px", height: "min(780px, calc(100vh - 118px))" }
    if (device === "tablet") return { width: "768px", height: "min(900px, calc(100vh - 118px))" }
    if (device === "ipad") return { width: "1024px", height: "min(820px, calc(100vh - 118px))" }
    return { width: "100%", height: "100%" }
  }, [device])

  useEffect(() => { if (!isLoading && !isAdmin) router.replace("/786-admin/login") }, [isLoading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    try { localStorage.removeItem(OLD_PROJECT_KEY); localStorage.removeItem(LEGACY_PROJECTS_KEY) } catch {}
    try {
      const savedWidth = Number(localStorage.getItem(CHAT_WIDTH_KEY))
      if (Number.isFinite(savedWidth) && savedWidth >= 360 && savedWidth <= 620) setChatWidth(savedWidth)
    } catch {}
    let cancelled = false
    async function hydrate() {
      let activeId: string | null = null
      try { activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY) } catch {}
      if (!activeId) return
      try {
        const res = await fetch(`/api/786-admin/projects/${activeId}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 404) { try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {} }
          return
        }
        const json = (await res.json()) as { project: AdminProjectWithData }
        if (cancelled || !json.project) return
        const p = json.project
        setProject({ id: p.id, title: p.title, description: p.description, prompt: p.prompt, files: p.files || {}, preview_state: p.preview_state || {} })
        setMessages((p.messages || []).map(uiFromAdminMessage))
        const initialFile = (p.preview_state?.active_file as string | undefined) || (p.files && p.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(p.files || {})[0]) || "app/page.tsx"
        setSelectedFile(initialFile)
      } catch {}
    }
    hydrate()
    return () => { cancelled = true }
  }, [isAdmin])

  useEffect(() => { try { localStorage.setItem(CHAT_WIDTH_KEY, String(Math.round(chatWidth))) } catch {} }, [chatWidth])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length, sending])

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e: MouseEvent) => setChatWidth(Math.min(Math.max(e.clientX - 92, 360), 620))
    const handleUp = () => setIsResizing(false)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isResizing])

  function tone(done = false) {
    if (!sound) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.value = 0.05
      ;(done ? [523, 659, 784] : [392, 523]).forEach((freq, i) => {
        const osc = ctx.createOscillator()
        osc.frequency.value = freq
        osc.connect(gain)
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.12)
      })
      setTimeout(() => ctx.close().catch(() => undefined), 600)
    } catch {}
  }

  function newChat() {
    setMessages([]); setProject(null); setSelectedFile("app/page.tsx"); setInput(""); setPanel("preview"); setDevice("desktop")
    try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
    tone(true)
  }

  async function persistAfterGeneration(generated: SevenEightSixProject, userText: string, assistantText: string, assistantModel: string | null, assistantReason: string | null): Promise<ActiveProject | null> {
    const activeFile = (generated.files && generated.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(generated.files || {})[0]) || "app/page.tsx"
    const previewStatePatch: AdminProjectPreviewState = { active_file: activeFile, entry_path: "app/page.tsx" }
    const metadataPatch = assistantModel ? { model: assistantModel } : undefined
    const messagesPayload = [
      { role: "user" as const, content: userText },
      { role: "assistant" as const, content: assistantText, model: assistantModel, reason: assistantReason },
    ]
    const projectId = project?.id || null
    try {
      const url = projectId ? `/api/786-admin/projects/${projectId}` : "/api/786-admin/projects"
      const method = projectId ? "PATCH" : "POST"
      const body: Record<string, unknown> = { prompt: userText, preview_state: previewStatePatch, files: generated.files, messages: messagesPayload }
      if (metadataPatch) body.metadata = metadataPatch
      if (!projectId) { body.title = generated.title; body.description = generated.description }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`)
      const json = (await res.json()) as { project: AdminProjectWithData }
      const saved = json.project
      try { localStorage.setItem(ACTIVE_PROJECT_ID_KEY, saved.id) } catch {}
      return { id: saved.id, title: saved.title, description: saved.description, prompt: saved.prompt, files: saved.files || {}, preview_state: saved.preview_state || {} }
    } catch (error) {
      console.error("[786.Chat] persistence failed", error)
      return null
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    const optimisticUser: UiMessage = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((old) => [...old, optimisticUser])
    setInput(""); setSending(true); setPanel("preview"); tone(false)
    try {
      const existing = buildExistingProjectContext(project, selectedFile)
      const requestBody: Record<string, unknown> = { message: text, mode }
      if (project?.id) requestBody.projectId = project.id
      if (existing) requestBody.existing = existing
      const res = await fetch("/api/786-admin/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) })
      const json = await res.json()
      if (!res.ok || !json.success || !json.project) throw new Error(json.error || "Project generation failed.")
      const generated: SevenEightSixProject = json.project
      const assistantText = json.response || `Created project: ${generated.title}\nFiles: ${Object.keys(generated.files).length}`
      const assistantModel: string | null = json.model ?? null
      const assistantReason: string | null = json.reason ?? null
      const persisted = await persistAfterGeneration(generated, text, assistantText, assistantModel, assistantReason)
      if (persisted) {
        setProject(persisted)
        setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: assistantText, model: assistantModel, reason: assistantReason }])
        const initialFile = (persisted.preview_state.active_file as string | undefined) || (persisted.files["app/page.tsx"] ? "app/page.tsx" : Object.keys(persisted.files)[0]) || "app/page.tsx"
        setSelectedFile(initialFile)
        tone(true)
      } else {
        setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", content: "Project was generated but could not be saved to Neon. Run POST /api/786-admin/setup once, then retry." }])
        tone(false)
      }
    } catch (error) {
      setMessages((old) => [...old, { id: `e-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Request failed." }])
      tone(false)
    } finally {
      setSending(false)
    }
  }

  if (isLoading || !isAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-200" /></main>
  }

  const deviceButtonClass = (value: Device) => `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${device === value ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`
  const deviceFrameClass = device === "desktop" ? "h-full w-full overflow-hidden bg-white" : `relative shrink-0 overflow-hidden bg-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${device === "mobile" ? "rounded-[34px] border-[9px] border-[#111827]" : "rounded-[26px] border-[8px] border-[#111827]"}`
  const iframeClass = `h-full w-full bg-white ${device === "desktop" ? "rounded-none" : device === "mobile" ? "rounded-[24px]" : "rounded-[17px]"}`

  return (
    <main className="h-screen overflow-hidden bg-[#050713] text-white">
      <div className="flex h-full">
        <aside className="hidden w-[92px] shrink-0 bg-[#06101c] pt-24 lg:block">
          <button onClick={() => router.push("/786-admin/projects")} className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/15 text-cyan-100" title="Projects"><FolderKanban className="h-5 w-5" /></button>
        </aside>

        <section className="relative flex h-full min-w-[360px] shrink-0 flex-col bg-[#081322]" style={{ width: chatWidth }}>
          <header className="flex h-[70px] shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
            <button onClick={newChat} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-400/15 px-4 py-2.5 text-sm font-black text-emerald-50"><Plus className="h-4 w-4" /><span>New Chat</span></button>
            <div className="hidden" aria-hidden="true" />
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 pb-40">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-500"><div className="mx-auto max-w-[300px]"><p className="text-xl font-semibold text-cyan-100/90">Welcome back to 786.Chat</p><p className="mt-3 text-sm leading-6">New chat is empty. Send a build prompt to create real project files.</p></div></div>
            ) : messages.map((m) => (
              <div key={m.id} className={`mb-4 rounded-3xl border p-4 text-sm leading-6 ${m.role === "user" ? "ml-8 border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "mr-8 border-white/10 bg-white/[0.045] text-slate-200"}`}>
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-400"><span>{m.role === "user" ? "You" : "786.Chat"}</span></div>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {false && m.reason && <p className="mt-3 text-xs text-purple-200/80">{m.reason}</p>}
              </div>
            ))}
            {sending && <div className="mr-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4"><div className="flex items-center gap-3"><Wand2 className="h-5 w-5 animate-pulse text-cyan-200" /><span>786.Chat is creating real project files...</span></div></div>}
            <div ref={endRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#101827]/95 p-4 backdrop-blur-xl">
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-[#162033] px-4 py-3">
              <Paperclip className="mt-2 h-5 w-5 shrink-0 text-slate-500" />
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} className="min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Ask 786.Chat to build a real project..." />
              <button onClick={send} disabled={sending || !input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-600 disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 truncate rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100">{project ? `Editing project "${project.title}" — changes save to Neon.` : "New Chat is empty. Build prompt creates real files saved to Neon."}</div>
          </div>
        </section>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true) }} className="hidden h-full w-[2px] shrink-0 cursor-col-resize border-0 bg-white/5 hover:bg-cyan-300/30 lg:block" title="Drag to resize chat and preview" />

        <section className="flex min-w-0 flex-1 flex-col bg-[#030408]">
          <header className="flex h-[70px] shrink-0 items-center gap-3 overflow-x-auto border-b border-white/10 px-5">
            <div className="min-w-[180px] flex-1 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-slate-400"><span className="block truncate">{sending ? "Generating new preview..." : project ? project.title : "No project yet"}</span></div>
            {panel === "preview" && <div className="flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.035] p-1">
              <button type="button" onClick={() => setDevice("desktop")} className={deviceButtonClass("desktop")} title="Desktop preview"><Monitor className="h-4 w-4" /><span>Desktop</span></button>
              <button type="button" onClick={() => setDevice("tablet")} className={deviceButtonClass("tablet")} title="Tablet preview"><Tablet className="h-4 w-4" /><span>Tablet</span></button>
              <button type="button" onClick={() => setDevice("ipad")} className={deviceButtonClass("ipad")} title="iPad preview"><Tablet className="h-4 w-4" /><span>iPad</span></button>
              <button type="button" onClick={() => setDevice("mobile")} className={deviceButtonClass("mobile")} title="Mobile preview"><Smartphone className="h-4 w-4" /><span>Mobile</span></button>
            </div>}
            <button onClick={() => setPanel("preview")} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${panel === "preview" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}><Monitor className="mr-2 inline h-4 w-4" />Preview</button>
            <button onClick={() => setPanel("code")} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${panel === "code" ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-100" : "border-white/10 text-slate-400"}`}><Code2 className="mr-2 inline h-4 w-4" />Code</button>
            <button className="shrink-0 rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950"><Rocket className="mr-2 inline h-4 w-4" />Publish</button>
          </header>

          {panel === "preview" ? (
            sending ? <div className="flex min-h-0 flex-1 items-center justify-center bg-[#070b12] p-6"><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-medium text-slate-300"><span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.7)]" />Loading generated preview...</div></div>
            : project && previewPayload.html ? <div className={`flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#070b12] ${device === "desktop" ? "p-0" : "p-6"}`}>
              <div className={deviceFrameClass} style={previewFrameStyle}>
                {device !== "desktop" && <div className={`pointer-events-none absolute left-1/2 top-1.5 z-10 -translate-x-1/2 bg-[#111827] ${device === "mobile" ? "h-5 w-24 rounded-full" : "h-2 w-16 rounded-full"}`} />}
                <iframe key={`${project.id}-${previewPayload.key}-${device}`} srcDoc={previewPayload.html} title={`${project.title} ${device} preview`} sandbox="allow-scripts allow-forms allow-popups" className={iframeClass} />
              </div>
            </div>
            : <div className="flex flex-1 items-center justify-center bg-[#070b12] p-6 text-center text-slate-500"><div><Monitor className="mx-auto mb-4 h-10 w-10 text-cyan-200" /><h2 className="text-xl font-black text-slate-300">No Preview Yet</h2><p className="mt-2">New chat starts with empty preview and empty code.</p></div></div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-4 p-6">
              <div className="min-h-0 overflow-auto rounded-3xl border border-white/10 bg-[#0d1320] p-3">
                {fileNames.length === 0 ? <p className="p-3 text-sm text-slate-500">No files yet.</p> : fileNames.map((file) => <button key={file} onClick={() => setSelectedFile(file)} className={`mb-2 block w-full rounded-2xl px-3 py-2 text-left text-xs font-bold ${selectedFile === file ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-300"}`}>{file}</button>)}
              </div>
              <pre className="min-h-0 overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-[#0d1320] p-5 text-xs leading-6 text-cyan-50"><code>{project?.files?.[selectedFile] || "Select a file."}</code></pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
