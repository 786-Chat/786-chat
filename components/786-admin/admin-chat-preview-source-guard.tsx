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
        return this && this.nodeType === 1 && Element.prototype.closest ? Element.prototype.closest.call(this, selector) : null
      }
    }
    if (typeof Node !== 'undefined' && !Node.prototype.closest) {
      Node.prototype.closest = function(selector){
        return this && this.nodeType === 1 && Element.prototype.closest ? Element.prototype.closest.call(this, selector) : null
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
  next = next.replace(/\\n[ \t]*import[ \t]+(?:type[ \t]+)?[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g, "\\n")
  next = next.replace(/\\n[ \t]*import[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g, "\\n")
  next = next.replace(/\\n[ \t]*export[ \t]+(?:\*|\{[^}]*\})[^\\n]*?[ \t]+from[ \t]+["'][^"']+["'][ \t]*;?[ \t]*(?:\/\/[^\\n]*)?(?=\\n)/g, "\\n")
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
  if (document.getElementById("admin-chat-real-theme-style")) return

  const style = document.createElement("style")
  style.id = "admin-chat-real-theme-style"
  style.textContent = `
    html[data-real-admin-theme="galaxy"] body { background: linear-gradient(135deg,#030511,#070316 46%,#15002a) !important; }
    html[data-real-admin-theme="ocean"] body { background: linear-gradient(135deg,#03111f,#082f49,#0f172a) !important; }
    html[data-real-admin-theme="forest"] body { background: linear-gradient(135deg,#03110b,#052e16,#0f172a) !important; }
    html[data-real-admin-theme] main { background: transparent !important; }

    html[data-real-admin-theme] main > div > aside,
    html[data-real-admin-theme] main > div > section:first-of-type {
      position: relative;
      overflow: hidden;
      background: radial-gradient(circle at 30% 20%, rgba(168,85,247,.22), transparent 30%), linear-gradient(180deg, rgba(35,7,73,.96), rgba(2,6,23,.96)) !important;
      border-right: 1px solid rgba(168,85,247,.28) !important;
      box-shadow: inset -1px 0 0 rgba(168,85,247,.18), 0 0 55px rgba(88,28,135,.22) !important;
    }
    html[data-real-admin-theme] main > div > aside::before,
    html[data-real-admin-theme] main > div > section:first-of-type::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: .72;
      background-image: radial-gradient(#fff 1px, transparent 1px), radial-gradient(rgba(216,180,254,.82) 1px, transparent 1px);
      background-size: 44px 44px, 83px 83px;
      animation: adminRealStars 18s linear infinite;
      z-index: 0;
    }
    html[data-real-admin-theme] main > div > aside > *,
    html[data-real-admin-theme] main > div > section:first-of-type > * { position: relative; z-index: 1; }

    html[data-real-admin-theme] main > div > section:first-of-type > header {
      height: 76px !important;
      background: rgba(5,8,22,.62) !important;
      border-bottom: 1px solid rgba(168,85,247,.30) !important;
      box-shadow: 0 12px 40px rgba(88,28,135,.18) !important;
      backdrop-filter: blur(18px) !important;
    }
    html[data-real-admin-theme] main > div > section:first-of-type > header button {
      background: linear-gradient(135deg, rgba(126,34,206,.92), rgba(88,28,135,.95)) !important;
      border-color: rgba(216,180,254,.42) !important;
      color: #fff !important;
      box-shadow: 0 0 26px rgba(168,85,247,.44), inset 0 0 18px rgba(255,255,255,.08) !important;
    }

    html[data-real-admin-theme] main > div > section:last-of-type { background: #060914 !important; }
    html[data-real-admin-theme] main > div > section:last-of-type > header {
      height: 76px !important;
      gap: 14px !important;
      background: linear-gradient(180deg, rgba(3,5,17,.96), rgba(3,5,17,.82)) !important;
      border-bottom: 1px solid rgba(168,85,247,.24) !important;
      box-shadow: 0 16px 50px rgba(0,0,0,.34), 0 0 34px rgba(88,28,135,.18) !important;
      backdrop-filter: blur(20px) !important;
    }
    html[data-real-admin-theme] main > div > section:last-of-type > header::before {
      content: "✦ 786.Chat";
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-right: 8px;
      color: white;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: -.02em;
      text-shadow: 0 0 18px rgba(168,85,247,.75);
    }
    html[data-real-admin-theme] main > div > section:last-of-type > header > div:first-child {
      max-width: 430px !important;
      background: rgba(10,14,32,.78) !important;
      border-color: rgba(168,85,247,.25) !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.03), 0 0 26px rgba(88,28,135,.14) !important;
    }
    html[data-real-admin-theme] main > div > section:last-of-type > header button {
      min-height: 42px !important;
      border-radius: 16px !important;
      border-color: rgba(168,85,247,.28) !important;
      background: rgba(16,18,42,.78) !important;
      color: #f8f7ff !important;
      font-weight: 800 !important;
    }
    html[data-real-admin-theme] main > div > section:last-of-type > header button:last-of-type,
    html[data-real-admin-theme] main > div > section:last-of-type > header button:has(.lucide-rocket) {
      background: linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4) !important;
      color: #fff !important;
      box-shadow: 0 0 26px rgba(124,58,237,.58) !important;
    }
    html[data-real-admin-theme] main > div > section:last-of-type > div { background: #070b12 !important; }
    html[data-real-admin-theme] iframe { box-shadow: none !important; filter: none !important; }

    html[data-real-admin-theme] main > div > section:first-of-type div[class*="rounded-3xl"],
    html[data-real-admin-theme] textarea,
    html[data-real-admin-theme] input,
    html[data-real-admin-theme] pre {
      border-color: rgba(168,85,247,.26) !important;
      box-shadow: 0 0 28px rgba(88,28,135,.16) !important;
      backdrop-filter: blur(14px) !important;
    }
    html[data-real-admin-theme] main > div > section:first-of-type div[class*="rounded-3xl"] {
      background: linear-gradient(135deg, rgba(30,16,62,.72), rgba(12,18,43,.72)) !important;
    }
    html[data-real-admin-theme] textarea::placeholder { color: rgba(203,213,225,.55) !important; }
    html[data-real-admin-theme] button { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease !important; }
    html[data-real-admin-theme] button:hover { transform: translateY(-1px); box-shadow: 0 0 24px rgba(168,85,247,.36) !important; }

    #admin-chat-agent-card {
      margin: 14px 16px 0;
      border: 1px solid rgba(168,85,247,.28);
      border-radius: 24px;
      padding: 16px;
      color: white;
      background: linear-gradient(135deg, rgba(25,10,56,.76), rgba(4,10,28,.82));
      box-shadow: 0 0 36px rgba(88,28,135,.22);
      backdrop-filter: blur(18px);
    }
    #admin-chat-agent-card .agent-title { display:flex; align-items:center; gap:10px; font-weight:900; }
    #admin-chat-agent-card .agent-orb { width:38px; height:38px; border-radius:999px; display:grid; place-items:center; background:radial-gradient(circle,#c084fc,#5b21b6 58%,#0f172a); box-shadow:0 0 24px rgba(168,85,247,.72); animation:agentPulse 1.8s ease-in-out infinite; }
    #admin-chat-agent-card .agent-subtitle { margin-top:2px; color:#a78bfa; font-size:12px; }

    .admin-agent-working {
      margin-top:14px;
      display:none;
      border-top:1px solid rgba(168,85,247,.18);
      padding-top:14px;
    }
    html[data-admin-agent-sending="true"] .admin-agent-working { display:block; }
    .admin-agent-ring { width:92px; height:92px; margin: 6px auto 14px; border-radius:999px; position:relative; background:conic-gradient(from 0deg,#22d3ee,#a855f7,#7c3aed,#22d3ee); animation:agentSpin 1.3s linear infinite; box-shadow:0 0 36px rgba(168,85,247,.54); }
    .admin-agent-ring::before { content:"⚙"; position:absolute; inset:9px; border-radius:999px; display:grid; place-items:center; background:#070b18; color:#c084fc; font-size:24px; animation:agentSpinReverse 2s linear infinite; }
    .admin-agent-steps { display:grid; gap:8px; color:#d8b4fe; font-size:12px; }
    .admin-agent-steps span { display:flex; align-items:center; gap:8px; }
    .admin-agent-steps span::before { content:""; width:7px; height:7px; border-radius:999px; background:#a855f7; box-shadow:0 0 12px rgba(168,85,247,.9); }
    html[data-admin-agent-sending="false"] .admin-agent-done { display:flex; }
    .admin-agent-done { display:none; margin-top:12px; align-items:center; gap:10px; color:#86efac; font-size:12px; font-weight:800; }
    .admin-agent-done::before { content:"✓"; width:22px; height:22px; display:grid; place-items:center; border-radius:999px; background:#22c55e; color:white; box-shadow:0 0 20px rgba(34,197,94,.55); }

    @keyframes adminRealStars { from { background-position: 0 0, 0 0 } to { background-position: 88px 88px, -83px 83px } }
    @keyframes agentSpin { to { transform: rotate(360deg); } }
    @keyframes agentSpinReverse { to { transform: rotate(-360deg); } }
    @keyframes agentPulse { 50% { transform: scale(1.08); } }

    #admin-chat-real-theme-menu { position: relative; z-index: 60; color: white; font: 800 13px system-ui, sans-serif; flex-shrink: 0; }
    #admin-chat-real-theme-menu button { border:1px solid rgba(168,85,247,.34); background:rgba(15,23,42,.82); color:white; border-radius:16px; padding:10px 13px; cursor:pointer; backdrop-filter:blur(16px); }
    #admin-chat-real-theme-options { display:none; position:absolute; right:0; top:calc(100% + 10px); width:230px; border:1px solid rgba(168,85,247,.30); border-radius:20px; padding:10px; background:rgba(2,6,23,.97); box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 42px rgba(88,28,135,.28); }
    #admin-chat-real-theme-menu[data-open="true"] #admin-chat-real-theme-options { display:block; }
    #admin-chat-real-theme-options button { display:flex; width:100%; margin-bottom:7px; text-align:left; align-items:center; gap:10px; justify-content:flex-start; }
    .admin-chat-magic-dot { position:fixed; width:12px; height:12px; left:0; top:0; z-index:999999; pointer-events:none; border-radius:999px; transform:translate(-50%,-50%); background:radial-gradient(circle,#fff,#a855f7 46%,transparent 78%); box-shadow:0 0 20px rgba(168,85,247,.9); animation:adminMagicDot .6s ease-out forwards; }
    @keyframes adminMagicDot { to { opacity:0; transform:translate(-50%,-50%) scale(.2); } }
  `
  document.head.appendChild(style)
}

function currentTheme() {
  const saved = localStorage.getItem(REAL_THEME_KEY)
  return saved === "ocean" || saved === "forest" || saved === "galaxy" ? saved : "galaxy"
}

function applyRealDashboardTheme() {
  installRealDashboardTheme()
  document.documentElement.setAttribute("data-real-admin-theme", currentTheme())

  let menu = document.getElementById("admin-chat-real-theme-menu")
  if (!menu) {
    menu = document.createElement("div")
    menu.id = "admin-chat-real-theme-menu"
    menu.innerHTML = `
      <button type="button" data-theme-toggle>✾ Theme</button>
      <div id="admin-chat-real-theme-options">
        <button type="button" data-theme="galaxy">🟣 Galaxy Neon</button>
        <button type="button" data-theme="ocean">🔵 Ocean Breeze</button>
        <button type="button" data-theme="forest">🟢 Forest Mint</button>
      </div>
    `
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

  const topHeader = document.querySelector("main > div > section:last-of-type > header")
  if (topHeader && !topHeader.contains(menu)) topHeader.appendChild(menu)

  const chatSection = document.querySelector("main > div > section:first-of-type")
  const chatScroll = chatSection?.querySelector("div.flex-1.overflow-y-auto")
  if (chatScroll && !document.getElementById("admin-chat-agent-card")) {
    const agent = document.createElement("div")
    agent.id = "admin-chat-agent-card"
    agent.innerHTML = `
      <div class="agent-title"><span class="agent-orb">✦</span><div><div>AI Assistant</div><div class="agent-subtitle">Galaxy Model v2.5</div></div></div>
      <div class="admin-agent-working">
        <div class="admin-agent-ring"></div>
        <div class="admin-agent-steps"><span>Analyzing requirements</span><span>Generating components</span><span>Applying premium theme</span><span>Optimizing performance</span></div>
      </div>
      <div class="admin-agent-done">Agent ready</div>
    `
    chatScroll.insertAdjacentElement("afterbegin", agent)
  }

  const sending = Boolean(document.body.textContent?.includes("786.Chat is creating real project files"))
  document.documentElement.setAttribute("data-admin-agent-sending", sending ? "true" : "false")
}

function clearFakeDashboardPreviewIfActive() {
  const titleText = document.body.textContent || ""
  if (!titleText.includes("Galaxy Neon Dashboard for 786.Chat")) return
  try { localStorage.removeItem(ACTIVE_PROJECT_ID_KEY) } catch {}
}

function isDashboardChromeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest("main > div > aside, main > div > section:first-of-type, main > div > section:last-of-type > header"))
}

export function AdminChatPreviewSourceGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return

    applyRealDashboardTheme()
    clearFakeDashboardPreviewIfActive()

    const onMove = (event: MouseEvent) => {
      if (!isDashboardChromeTarget(event.target)) return
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
      if (name.toLowerCase() === "srcdoc" && typeof value === "string") return originalSetAttribute.call(this, name, stripGeneratedModuleLines(value))
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
      document.getElementById("admin-chat-real-theme-menu")?.remove()
      document.documentElement.removeAttribute("data-real-admin-theme")
      document.documentElement.removeAttribute("data-admin-agent-sending")
    }
  }, [pathname])

  return null
}
