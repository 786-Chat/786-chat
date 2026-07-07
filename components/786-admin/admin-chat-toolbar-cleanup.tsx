"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const STYLE_ID = "admin-chat-toolbar-cleanup-style"
const PROJECT_STYLE_ID = "admin-projects-compact-style"
const PROJECT_SEARCH_ID = "admin-projects-search"
const LIVE_NAV_ID = "admin-live-projects-nav"
const MENU_ID = "admin-chat-device-menu"
const DEVICE_LABEL_ID = "admin-chat-device-label"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const DEVICE_KEY = "786chat_admin_device_dropdown_v1"

type DevicePreset = { label: string; width: number | null; height: number | null; base: "Desktop" | "Tablet" | "iPad" | "Mobile"; radius: string; border: string }
type ProjectListItem = { id: string; title: string; description?: string; prompt?: string }
type ProjectWithData = ProjectListItem & { files?: Record<string, string> }

const DEVICES: DevicePreset[] = [
  { label: "Full Preview", width: null, height: null, base: "Desktop", radius: "0", border: "0" },
  { label: "Desktop", width: null, height: null, base: "Desktop", radius: "0", border: "0" },
  { label: "Laptop", width: 1366, height: 768, base: "Desktop", radius: "22px", border: "10px solid #0f172a" },
  { label: "Tablet", width: 768, height: 900, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "iPad Mini", width: 744, height: 1000, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "iPad Pro", width: 1024, height: 1180, base: "iPad", radius: "30px", border: "10px solid #111827" },
  { label: "Surface Pro", width: 912, height: 1100, base: "iPad", radius: "30px", border: "10px solid #111827" },
  { label: "Galaxy Tab", width: 800, height: 1120, base: "Tablet", radius: "30px", border: "10px solid #111827" },
  { label: "Galaxy Fold", width: 430, height: 932, base: "Mobile", radius: "24px", border: "9px solid #111827" },
  { label: "iPhone 7 Plus", width: 414, height: 736, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 13", width: 390, height: 844, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 15", width: 393, height: 852, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 16", width: 393, height: 852, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "iPhone 16 Pro Max", width: 440, height: 956, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Pixel 9", width: 412, height: 915, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Galaxy S25", width: 412, height: 915, base: "Mobile", radius: "38px", border: "10px solid #111827" },
  { label: "Custom Width", width: 480, height: 860, base: "Mobile", radius: "38px", border: "10px solid #111827" },
]

function selectedDeviceLabel() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY)
    return DEVICES.some((device) => device.label === stored) ? stored! : "Full Preview"
  } catch {
    return "Full Preview"
  }
}

function updatePreviewButtonLabel(anchor: HTMLButtonElement, label = selectedDeviceLabel()) {
  let badge = anchor.querySelector<HTMLSpanElement>(`#${DEVICE_LABEL_ID}`)
  if (!badge) {
    badge = document.createElement("span")
    badge.id = DEVICE_LABEL_ID
    badge.style.cssText = "display:inline-flex;align-items:center;max-width:126px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#a5f3fc;font:800 12px system-ui;"
    anchor.appendChild(badge)
  }
  badge.textContent = label === "Full Preview" ? "" : `· ${label}`
  anchor.setAttribute("aria-label", `Preview device: ${label}`)
  anchor.title = `Preview device: ${label}`
}

function selectNativeDevice(base: DevicePreset["base"]) { document.querySelector<HTMLButtonElement>(`button[title="${base} preview"]`)?.click() }

function clearDeviceFrameInlineStyles() {
  const section = document.querySelector<HTMLElement>("main > div > section:last-of-type")
  if (!section) return
  const candidates = Array.from(section.querySelectorAll<HTMLElement>("div,aside,nav"))
  for (const element of candidates) {
    const style = element.getAttribute("style") || ""
    if (!style.includes("calc(100vh - 118px)") && !style.includes("0 28px 90px") && !style.includes("background: #fff") && !style.includes("background: rgb(255") && !style.includes("width: 800px") && !style.includes("width: 1024px") && !style.includes("width: 912px") && !style.includes("width: 768px") && !style.includes("width: 430px") && !style.includes("width: 414px") && !style.includes("width: 390px") && !style.includes("width: 393px") && !style.includes("width: 440px") && !style.includes("width: 412px") && !style.includes("width: 480px")) continue
    element.style.width = ""
    element.style.height = ""
    element.style.maxWidth = ""
    element.style.maxHeight = ""
    element.style.border = ""
    element.style.borderRadius = ""
    element.style.overflow = ""
    element.style.background = ""
    element.style.boxShadow = ""
  }
}

function resizePreview(device: DevicePreset, anchor?: HTMLButtonElement) {
  try { localStorage.setItem(DEVICE_KEY, device.label) } catch {}
  if (anchor) updatePreviewButtonLabel(anchor, device.label)
  selectNativeDevice(device.base)
  setTimeout(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("section:last-of-type iframe")
    const frame = iframe?.parentElement
    if (!iframe || !frame) return
    frame.style.width = device.width ? `${device.width}px` : "100%"
    frame.style.height = device.height ? `min(${device.height}px, calc(100vh - 118px))` : "100%"
    frame.style.maxWidth = device.width ? "calc(100vw - 520px)" : "100%"
    frame.style.maxHeight = device.height ? "calc(100vh - 118px)" : "100%"
    frame.style.border = device.border
    frame.style.borderRadius = device.radius
    frame.style.overflow = "hidden"
    frame.style.background = "#020617"
    frame.style.boxShadow = device.width ? "0 28px 90px rgba(0,0,0,.58)" : "none"
    iframe.style.borderRadius = device.width ? `calc(${device.radius} - 10px)` : "0"
  }, 120)
}

function closeMenu() { document.getElementById(MENU_ID)?.remove() }

function openMenu(anchor: HTMLButtonElement) {
  const existing = document.getElementById(MENU_ID)
  if (existing) { existing.remove(); return }
  const rect = anchor.getBoundingClientRect()
  const menu = document.createElement("div")
  const selected = selectedDeviceLabel()
  menu.id = MENU_ID
  menu.setAttribute("role", "menu")
  menu.setAttribute("aria-label", "Preview device selector")
  const availableBelow = window.innerHeight - rect.bottom - 18
  const maxHeight = Math.max(220, Math.min(520, availableBelow))
  menu.style.cssText = `position:fixed;top:${rect.bottom + 10}px;right:${Math.max(18, window.innerWidth - rect.right)}px;z-index:2147483647;width:260px;max-height:${maxHeight}px;overflow:auto;padding:10px;border-radius:22px;border:1px solid rgba(139,92,246,.40);background:#020617;color:white;box-shadow:0 28px 90px rgba(0,0,0,.72);backdrop-filter:blur(20px);scrollbar-color:#475569 #020617;`
  DEVICES.forEach((device) => {
    const option = document.createElement("button")
    const active = device.label === selected
    option.type = "button"
    option.setAttribute("role", "menuitemradio")
    option.setAttribute("aria-checked", String(active))
    option.innerHTML = `<span>${device.label}</span>${active ? '<span aria-hidden="true" style="color:#67e8f9;font-size:16px">✓</span>' : ""}`
    option.style.cssText = `display:flex;align-items:center;justify-content:space-between;width:100%;margin:0 0 6px;padding:11px 12px;border-radius:15px;border:1px solid ${active ? "rgba(34,211,238,.58)" : "rgba(148,163,184,.18)"};background:${active ? "linear-gradient(135deg,rgba(8,145,178,.32),rgba(109,40,217,.30))" : "rgba(15,23,42,.90)"};color:white;cursor:pointer;font:800 13px system-ui;text-align:left;box-shadow:${active ? "0 0 24px rgba(34,211,238,.12)" : "none"};`
    option.onmouseenter = () => { if (!active) option.style.background = "rgba(30,41,59,.98)" }
    option.onmouseleave = () => { if (!active) option.style.background = "rgba(15,23,42,.90)" }
    option.onclick = () => { resizePreview(device, anchor); closeMenu() }
    menu.appendChild(option)
  })
  document.body.appendChild(menu)
}

function sanitizePreviewHtml(value: string): string { return value.replace(/<script[\s\S]*?<\/script>/gi, "") }
function projectCardSrcDoc(project: ProjectWithData): string {
  const files = project.files || {}
  const htmlFile = files["index.html"] || files["public/index.html"]
  if (htmlFile && htmlFile.includes("<")) return sanitizePreviewHtml(htmlFile)
  const css = (files["app/globals.css"] || files["src/app/globals.css"] || "").replace(/@tailwind\s+[a-z]+\s*;?/gi, "")
  const source = files["app/page.tsx"] || files["src/app/page.tsx"] || ""
  const hasLogin = /login|sign in|password|email/i.test(`${project.title} ${project.description || ""} ${source}`)
  const title = project.title || "786.Chat Project"
  const description = project.description || project.prompt || "Generated 786.Chat project"
  const body = hasLogin ? `<main class="login"><section><h1>${title}</h1><input placeholder="Email"/><input placeholder="Password" type="password"/><button>Sign In</button><a>Forgot password?</a></section></main>` : `<main class="hero"><section><p>786.Chat Preview</p><h1>${title}</h1><span>${description}</span><button>Open Project</button></section></main>`
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css} html,body{margin:0;min-height:100%;font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#0f172a}.login,.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px}.login section{width:min(560px,88vw);border-radius:24px;background:white;padding:42px;box-shadow:0 28px 80px rgba(15,23,42,.28);text-align:center}.login h1,.hero h1{font-size:42px;line-height:1.05;margin:0 0 26px;font-weight:900}.login input{display:block;width:100%;box-sizing:border-box;margin:14px 0;padding:18px 20px;border:1px solid #cbd5e1;border-radius:10px;font-size:16px}.login button,.hero button{border:0;border-radius:10px;background:#2563eb;color:white;padding:16px 24px;font-weight:900;font-size:16px;width:100%;margin-top:10px}.login a{display:block;color:#2563eb;margin-top:22px}.hero section{max-width:760px;color:white}.hero p{font-weight:900;letter-spacing:.16em;text-transform:uppercase;opacity:.8}.hero h1{font-size:58px}.hero span{display:block;font-size:20px;line-height:1.6;opacity:.9;margin-bottom:26px}.hero button{width:auto;background:white;color:#111827}</style></head><body>${body}</body></html>`
}

function installProjectCardPreviews(projects: ProjectWithData[]) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("article"))
  cards.forEach((card, index) => {
    const project = projects[index]
    if (!project || card.dataset.livePreviewInstalled === "true") return
    const previewBox = card.querySelector<HTMLElement>(".mb-5.overflow-hidden.rounded-2xl")
    if (!previewBox) return
    card.dataset.livePreviewInstalled = "true"
    previewBox.innerHTML = ""
    previewBox.style.height = "112px"
    previewBox.style.background = "#020617"
    const iframe = document.createElement("iframe")
    iframe.title = `${project.title} card preview`
    iframe.srcdoc = projectCardSrcDoc(project)
    iframe.sandbox.add("allow-scripts", "allow-forms")
    iframe.style.cssText = "width:100%;height:100%;border:0;background:#020617;transform:scale(.45);transform-origin:top left;width:222%;height:222%;pointer-events:none;"
    previewBox.appendChild(iframe)
  })
}

function resetPreviewStateBeforeOpen() {
  try {
    localStorage.removeItem(DEVICE_KEY)
    Object.keys(localStorage).forEach((key) => { if (key.startsWith("786chat_admin_preview_location_v2_")) localStorage.removeItem(key) })
  } catch {}
}

function installProjectSearch() {
  if (!document.getElementById(LIVE_NAV_ID)) {
    const nav = document.querySelector<HTMLElement>("aside nav")
    const button = document.createElement("button")
    button.id = LIVE_NAV_ID
    button.type = "button"
    button.innerHTML = `<span style="display:grid;width:20px;height:20px;place-items:center">📡</span><span>Live Projects</span>`
    button.style.cssText = "display:flex;width:100%;align-items:center;gap:12px;border-radius:16px;border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.10);padding:12px 16px;text-align:left;color:#d1fae5;font:800 14px system-ui;cursor:pointer;box-shadow:0 0 24px rgba(16,185,129,.10);"
    button.onclick = () => { window.location.href = "/786-admin/live" }
    nav?.appendChild(button)
  }
  if (document.getElementById(PROJECT_SEARCH_ID)) return
  const intro = document.querySelector<HTMLElement>("main section > div.mb-8")
  if (!intro) return
  const wrap = document.createElement("div")
  wrap.id = PROJECT_SEARCH_ID
  wrap.innerHTML = `<label style="display:block;max-width:620px"><span style="display:block;margin-bottom:8px;color:#93c5fd;font:800 12px system-ui;letter-spacing:.08em;text-transform:uppercase">Search project name</span><input placeholder="Search projects by name, prompt, or description..." style="width:100%;height:48px;border-radius:18px;border:1px solid rgba(96,165,250,.35);background:rgba(15,23,42,.72);color:white;padding:0 18px;font:800 14px system-ui;outline:none;box-shadow:0 0 35px rgba(37,99,235,.12)" /></label>`
  intro.insertAdjacentElement("afterend", wrap)
  const input = wrap.querySelector("input")
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase()
    document.querySelectorAll<HTMLElement>("article").forEach((card) => { card.style.display = card.textContent?.toLowerCase().includes(q) ? "" : "none" })
  })
}

function installProjectsCompactStyle() {
  document.getElementById(PROJECT_STYLE_ID)?.remove()
  const style = document.createElement("style")
  style.id = PROJECT_STYLE_ID
  style.textContent = `main section > div.grid.gap-5{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important;gap:18px!important}main section>article,main section article{border-radius:24px!important;padding:18px!important}main section article h2{font-size:20px!important;line-height:1.2!important;margin-top:12px!important}main section article p{font-size:13px!important;line-height:1.55!important}main section article .mb-5{margin-bottom:14px!important}main section article button{padding:9px 14px!important;border-radius:14px!important;font-size:13px!important}main section article [class*="h-14"][class*="w-14"]{width:46px!important;height:46px!important;border-radius:16px!important}main section article [class*="h-7"][class*="w-7"]{width:22px!important;height:22px!important}#${PROJECT_SEARCH_ID}{margin:-10px 0 24px}`
  document.head.appendChild(style)
}

export function AdminChatToolbarCleanup() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname === "/786-admin/projects") {
      installProjectsCompactStyle(); installProjectSearch()
      let cancelled = false
      const openCapture = (event: MouseEvent) => {
        const button = (event.target as HTMLElement | null)?.closest("button")
        if (button?.textContent?.trim() === "Open in chat") resetPreviewStateBeforeOpen()
      }
      document.addEventListener("click", openCapture, true)
      fetch("/api/786-admin/projects", { cache: "no-store" }).then((res) => res.ok ? res.json() : { projects: [] }).then(async (json) => {
        if (cancelled) return
        const list = Array.isArray(json.projects) ? (json.projects as ProjectListItem[]) : []
        const detailed = await Promise.all(list.map(async (project) => {
          const res = await fetch(`/api/786-admin/projects/${project.id}`, { cache: "no-store" }).catch(() => null)
          if (!res?.ok) return project
          const data = await res.json().catch(() => ({}))
          return (data.project || project) as ProjectWithData
        }))
        if (!cancelled) setTimeout(() => { installProjectSearch(); installProjectCardPreviews(detailed) }, 200)
      }).catch(() => undefined)
      return () => { cancelled = true; document.removeEventListener("click", openCapture, true); document.getElementById(PROJECT_STYLE_ID)?.remove(); document.getElementById(PROJECT_SEARCH_ID)?.remove(); document.getElementById(LIVE_NAV_ID)?.remove() }
    }
    if (pathname !== "/786-admin/chat") return
    document.getElementById(STYLE_ID)?.remove()
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      #admin-chat-browser-bar,#admin-chat-project-pages,main > div > section:last-of-type > header > div[class*="rounded-full"][class*="p-1"],main > div > section:last-of-type > header button[title="Desktop preview"],main > div > section:last-of-type > header button[title="Tablet preview"],main > div > section:last-of-type > header button[title="iPad preview"],main > div > section:last-of-type > header button[title="Mobile preview"]{display:none!important}
      main > div > section:last-of-type > header{position:relative!important;overflow:hidden!important;border-color:rgba(168,85,247,.28)!important;background:radial-gradient(circle at 12% 15%,rgba(147,51,234,.36),transparent 34%),radial-gradient(circle at 72% 8%,rgba(14,165,233,.16),transparent 32%),linear-gradient(180deg,rgba(17,8,40,.98),rgba(8,7,24,.96))!important;box-shadow:inset 0 -1px 0 rgba(168,85,247,.22),0 0 55px rgba(88,28,135,.18)!important}
      main > div > section:last-of-type > header::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.45;background-image:radial-gradient(#f5d0fe 1px,transparent 1px),radial-gradient(rgba(103,232,249,.7) 1px,transparent 1px);background-size:72px 72px,118px 118px;background-position:8px 12px,42px 38px;animation:adminHeaderStars 18s linear infinite}main > div > section:last-of-type > header>*{position:relative;z-index:1}@keyframes adminHeaderStars{from{background-position:8px 12px,42px 38px}to{background-position:80px 84px,160px 156px}}
      main > div > section:last-of-type{background:#020617!important;color:#dbeafe!important}
      main > div > section:last-of-type > div:not(:has(iframe)),main > div > section:last-of-type > div:not(:has(iframe)) > div,main > div > section:last-of-type aside,main > div > section:last-of-type nav{background:#07101f!important;color:#dbeafe!important;border-color:rgba(34,211,238,.22)!important;box-shadow:none!important}
      main > div > section:last-of-type > div:not(:has(iframe)) button,main > div > section:last-of-type aside button,main > div > section:last-of-type nav button{color:#dbeafe!important;background:rgba(15,23,42,.82)!important;border-color:rgba(51,65,85,.72)!important}
      main > div > section:last-of-type > div:not(:has(iframe)) button[class*="bg-cyan"],main > div > section:last-of-type aside button[class*="bg-cyan"],main > div > section:last-of-type nav button[class*="bg-cyan"]{background:linear-gradient(135deg,#22d3ee,#7c3aed)!important;color:#06101c!important}
      main > div > section:last-of-type pre,main > div > section:last-of-type code{background:#0b1220!important;color:#e2e8f0!important}
      #${MENU_ID}::-webkit-scrollbar{width:8px}#${MENU_ID}::-webkit-scrollbar-track{background:#020617}#${MENU_ID}::-webkit-scrollbar-thumb{background:#334155;border-radius:999px}
    `
    document.head.appendChild(style)
    const onModeClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest(`#${MENU_ID}`) && !target?.closest('button[data-device-dropdown="true"]')) closeMenu()
      const button = target?.closest("button")
      const label = button?.textContent?.trim().toLowerCase() || ""
      if (label === "code" || label.includes("code")) {
        clearDeviceFrameInlineStyles()
        window.setTimeout(clearDeviceFrameInlineStyles, 80)
        window.setTimeout(clearDeviceFrameInlineStyles, 240)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeMenu() }
    document.addEventListener("click", onModeClick, true)
    document.addEventListener("keydown", onKeyDown)
    const timer = window.setInterval(() => {
      const preview = Array.from(document.querySelectorAll<HTMLButtonElement>("main > div > section:last-of-type > header button")).find((button) => button.textContent?.includes("Preview"))
      if (!preview) return
      updatePreviewButtonLabel(preview)
      if (preview.dataset.deviceDropdown === "true") return
      preview.dataset.deviceDropdown = "true"
      preview.setAttribute("aria-haspopup", "menu")
      preview.setAttribute("aria-expanded", "false")
      preview.append(" ▾")
      preview.addEventListener("click", () => {
        const willOpen = !document.getElementById(MENU_ID)
        preview.setAttribute("aria-expanded", String(willOpen))
        setTimeout(() => openMenu(preview), 0)
      })
    }, 400)
    const recoverTimer = window.setTimeout(() => { try { const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY); const hasIframe = Boolean(document.querySelector("section:last-of-type iframe")); const alreadyReloaded = sessionStorage.getItem(`786chat_reload_${activeProjectId}`) === "1"; if (activeProjectId && !hasIframe && !alreadyReloaded) { sessionStorage.setItem(`786chat_reload_${activeProjectId}`, "1"); window.location.reload() } } catch {} }, 1800)
    return () => { document.removeEventListener("click", onModeClick, true); document.removeEventListener("keydown", onKeyDown); window.clearInterval(timer); window.clearTimeout(recoverTimer); closeMenu(); style.remove() }
  }, [pathname])
  return <><AdminChatPublishController /><AdminChatPublishingOverviewLink /></>
}
