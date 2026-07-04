"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const REAL_THEME_KEY = "786chat_admin_real_theme_v1"

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
  next = next.replace(/^[ \t]*import\s+(?:type\s+)?[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm, "")
  next = next.replace(/^[ \t]*import\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm, "")
  next = next.replace(/^[ \t]*export\s+(?:\*|\{[^}]*\})[\s\S]*?\s+from\s+["'][^"']+["']\s*;?\s*(?:\/\/[^\r\n]*)?$/gm, "")

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

function installRealDashboardTheme() {
  const existing = document.getElementById("admin-chat-real-theme-style")
  if (existing) return

  const style = document.createElement("style")
  style.id = "admin-chat-real-theme-style"
  style.textContent = `
    html[data-real-admin-theme="galaxy"] body {
      background: radial-gradient(circle at 15% 10%, rgba(168,85,247,.24), transparent 28%), radial-gradient(circle at 82% 8%, rgba(34,211,238,.15), transparent 24%), linear-gradient(135deg,#030511,#080318 48%,#16002c) !important;
    }
    html[data-real-admin-theme="ocean"] body {
      background: radial-gradient(circle at 15% 10%, rgba(56,189,248,.24), transparent 28%), linear-gradient(135deg,#03111f,#082f49,#0f172a) !important;
    }
    html[data-real-admin-theme="forest"] body {
      background: radial-gradient(circle at 15% 10%, rgba(34,197,94,.22), transparent 28%), linear-gradient(135deg,#03110b,#052e16,#0f172a) !important;
    }
    html[data-real-admin-theme] main { background: transparent !important; }
    html[data-real-admin-theme] main > div > aside,
    html[data-real-admin-theme] main > div > section:first-of-type {
      background: linear-gradient(180deg, rgba(36,8,70,.92), rgba(3,7,18,.92)) !important;
      border-right: 1px solid rgba(168,85,247,.24) !important;
      box-shadow: inset -1px 0 0 rgba(168,85,247,.16), 0 0 45px rgba(88,28,135,.18) !important;
    }
    html[data-real-admin-theme] main > div > section:last-of-type,
    html[data-real-admin-theme] main > div > section:last-of-type > header,
    html[data-real-admin-theme] main > div > section:last-of-type > div {
      background: rgba(3,5,17,.72) !important;
    }
    html[data-real-admin-theme] header,
    html[data-real-admin-theme] .rounded-2xl,
    html[data-real-admin-theme] .rounded-3xl,
    html[data-real-admin-theme] textarea,
    html[data-real-admin-theme] input,
    html[data-real-admin-theme] pre {
      border-color: rgba(168,85,247,.24) !important;
      box-shadow: 0 0 28px rgba(88,28,135,.14) !important;
    }
    html[data-real-admin-theme] button {
      transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease !important;
    }
    html[data-real-admin-theme] button:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 24px rgba(168,85,247,.36) !important;
    }
    #admin-chat-real-stars {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: .66;
      background-image: radial-gradient(#fff 1px, transparent 1px), radial-gradient(rgba(216,180,254,.85) 1px, transparent 1px);
      background-size: 44px 44px, 83px 83px;
      animation: adminRealStars 18s linear infinite;
    }
    @keyframes adminRealStars { from { background-position: 0 0, 0 0 } to { background-position: 88px 88px, -83px 83px } }
    #admin-chat-real-theme-menu {
      position: fixed;
      right: 18px;
      top: 82px;
      z-index: 999997;
      color: white;
      font: 600 13px system-ui, sans-serif;
    }
    #admin-chat-real-theme-menu button {
      border: 1px solid rgba(168,85,247,.32);
      background: rgba(15,23,42,.82);
      color: white;
      border-radius: 14px;
      padding: 10px 12px;
      cursor: pointer;
      backdrop-filter: blur(16px);
    }
    #admin-chat-real-theme-options {
      display: none;
      margin-top: 8px;
      width: 190px;
      border: 1px solid rgba(168,85,247,.28);
      border-radius: 16px;
      padding: 8px;
      background: rgba(2,6,23,.94);
      box-shadow: 0 24px 70px rgba(0,0,0,.45);
    }
    #admin-chat-real-theme-menu[data-open="true"] #admin-chat-real-theme-options { display: block; }
    #admin-chat-real-theme-options button { display: block; width: 100%; margin-bottom: 6px; text-align: left; }
    .admin-chat-magic-dot {
      position: fixed;
      width: 12px;
      height: 12px;
      left: 0;
      top: 0;
      z-index: 999999;
      pointer-events: none;
      border-radius: 999px;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, #fff, #a855f7 46%, transparent 78%);
      box-shadow: 0 0 20px rgba(168,85,247,.9);
      animation: adminMagicDot .6s ease-out forwards;
    }
    @keyframes adminMagicDot { to { opacity: 0; transform: translate(-50%, -50%) scale(.2); } }
  `
  document.head.appendChild(style)
}

function applyRealDashboardTheme() {
  installRealDashboardTheme()

  const saved = localStorage.getItem(REAL_THEME_KEY)
  const theme = saved === "ocean" || saved === "forest" || saved === "galaxy" ? saved : "galaxy"
  document.documentElement.setAttribute("data-real-admin-theme", theme)

  if (!document.getElementById("admin-chat-real-stars")) {
    const stars = document.createElement("div")
    stars.id = "admin-chat-real-stars"
    stars.setAttribute("aria-hidden", "true")
    document.body.appendChild(stars)
  }

  let menu = document.getElementById("admin-chat-real-theme-menu")
  if (!menu) {
    menu = document.createElement("div")
    menu.id = "admin-chat-real-theme-menu"
    menu.innerHTML = `
      <button type="button" data-theme-toggle>Theme</button>
      <div id="admin-chat-real-theme-options">
        <button type="button" data-theme="galaxy">Galaxy Neon</button>
        <button type="button" data-theme="ocean">Ocean Breeze</button>
        <button type="button" data-theme="forest">Forest Mint</button>
      </div>
    `
    document.body.appendChild(menu)
    menu.addEventListener("click", (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest("[data-theme-toggle]")) {
        menu?.setAttribute("data-open", menu.getAttribute("data-open") === "true" ? "false" : "true")
        return
      }
      const choice = target.closest("[data-theme]")?.getAttribute("data-theme")
      if (choice === "galaxy" || choice === "ocean" || choice === "forest") {
        localStorage.setItem(REAL_THEME_KEY, choice)
        document.documentElement.setAttribute("data-real-admin-theme", choice)
        menu?.setAttribute("data-open", "false")
      }
    })
  }
}

function clearFakeDashboardPreviewIfActive() {
  const titleText = document.body.textContent || ""
  if (!titleText.includes("Galaxy Neon Dashboard for 786.Chat")) return
  try {
    localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
  } catch {}
}

export function AdminChatPreviewSourceGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    applyRealDashboardTheme()
    clearFakeDashboardPreviewIfActive()

    const onMove = (event: MouseEvent) => {
      const dot = document.createElement("span")
      dot.className = "admin-chat-magic-dot"
      dot.style.left = `${event.clientX}px`
      dot.style.top = `${event.clientY}px`
      document.body.appendChild(dot)
      window.setTimeout(() => dot.remove(), 650)
    }
    window.addEventListener("mousemove", onMove, { passive: true })

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
    const observer = new MutationObserver(() => {
      applyRealDashboardTheme()
      patchPreviewIframes()
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })

    return () => {
      observer.disconnect()
      window.removeEventListener("mousemove", onMove)
      HTMLIFrameElement.prototype.setAttribute = originalSetAttribute
      if (srcdocDescriptor) Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", srcdocDescriptor)
      document.getElementById("admin-chat-real-stars")?.remove()
      document.getElementById("admin-chat-real-theme-menu")?.remove()
      document.documentElement.removeAttribute("data-real-admin-theme")
    }
  }, [pathname])

  return null
}
