"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Code2, Globe2, Monitor, Palette, Power, RefreshCw, Rocket, Smartphone, Sparkles } from "lucide-react"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const devices = [
  ["Full Preview", "desktop"],
  ["Desktop", "desktop"],
  ["Laptop", "desktop"],
  ["Tablet", "tablet"],
  ["iPad Mini", "ipad"],
  ["iPad Pro", "ipad"],
  ["Surface Pro", "tablet"],
  ["Galaxy Tab", "tablet"],
  ["Galaxy Fold", "mobile"],
  ["iPhone 7 Plus", "mobile"],
  ["iPhone 13", "mobile"],
  ["iPhone 15", "mobile"],
  ["iPhone 16", "mobile"],
  ["iPhone 16 Pro Max", "mobile"],
  ["Pixel 9", "mobile"],
  ["Galaxy S25", "mobile"],
  ["Custom Width", "desktop"],
]

const themes = [
  ["Purple Galaxy", "Default", "from-violet-950 via-purple-700 to-fuchsia-400", "galaxy"],
  ["Dark Navy", "Deep & Focused", "from-black via-slate-950 to-cyan-950", "galaxy"],
  ["Green Aurora", "Fresh & Modern", "from-emerald-950 via-emerald-500 to-teal-200", "forest"],
  ["Blue Ocean", "Calm & Professional", "from-blue-950 via-blue-600 to-cyan-300", "ocean"],
  ["Mixed Galaxy", "Purple, blue & green", "from-violet-700 via-cyan-500 to-emerald-400", "galaxy"],
  ["White Mode", "Clean & Minimal", "from-white via-slate-100 to-white", "galaxy"],
]

function nativeButtons() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("main > div > section:last-of-type > header button, main > div > section:first-of-type > header button"))
}

function findNativeButton(label: string) {
  return nativeButtons().find((button) => button.textContent?.toLowerCase().includes(label.toLowerCase()))
}

function patchPreviewHtml(html: string) {
  if (!html || html.includes("data-786-module-shim")) return html
  const shim = `<script data-786-module-shim="true">window.module=window.module||{exports:{}};window.exports=window.exports||window.module.exports;window.require=window.require||function(){return {}};<\/script>`
  if (html.includes("<head>")) return html.replace("<head>", `<head>\n${shim}`)
  if (html.includes("<body>")) return html.replace("<body>", `<body>\n${shim}`)
  return `${shim}\n${html}`
}

function refreshPreview() {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe")
  if (!iframe) return
  const html = patchPreviewHtml(iframe.getAttribute("srcdoc") || iframe.srcdoc || "")
  iframe.srcdoc = ""
  window.setTimeout(() => {
    iframe.srcdoc = html
  }, 40)
}

function selectNativeDevice(kind: string) {
  const label = kind === "desktop" ? "Desktop" : kind === "tablet" ? "Tablet" : kind === "ipad" ? "iPad" : "Mobile"
  findNativeButton(label)?.click()
}

function applyTheme(theme: string) {
  try { localStorage.setItem("786chat_admin_real_theme_v1", theme) } catch {}
  document.documentElement.setAttribute("data-real-admin-theme", theme)
  document.getElementById("admin-chat-theme-portal")?.remove()
  document.getElementById("admin-chat-real-theme-menu")?.remove()
}

function IconButton({ children, onClick, label, accent = "violet" }: { children: React.ReactNode; onClick?: () => void; label: string; accent?: "violet" | "cyan" | "fuchsia" | "rose" }) {
  const hover = accent === "cyan" ? "hover:border-cyan-200/50 hover:bg-cyan-400/10" : accent === "fuchsia" ? "hover:border-fuchsia-200/60 hover:bg-fuchsia-500/15" : accent === "rose" ? "hover:border-rose-200/50 hover:bg-rose-500/10" : "hover:border-violet-200/60 hover:bg-violet-500/15"
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-white/[0.045] text-white transition ${hover}`}>
      {children}
    </button>
  )
}

function AdminChatGalaxyHeader() {
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState("Full Preview")
  const [selectedTheme, setSelectedTheme] = useState("Purple Galaxy")

  useEffect(() => {
    const style = document.createElement("style")
    style.id = "admin-chat-single-galaxy-shell"
    style.textContent = `
      body { overflow: hidden; }
      main { padding-top: 82px !important; background: #030008 !important; }
      main > div { height: calc(100vh - 82px) !important; }
      main > div > section:first-of-type > header,
      main > div > section:last-of-type > header,
      #admin-chat-browser-bar,
      #admin-chat-real-theme-menu,
      #admin-chat-theme-portal { display: none !important; }
      main > div > aside { padding-top: 34px !important; background: linear-gradient(180deg, rgba(30,5,74,.96), rgba(4,0,18,.98)) !important; }
      main > div > section:first-of-type { background: radial-gradient(circle at 30% 18%, rgba(168,85,247,.32), transparent 34%), linear-gradient(180deg, rgba(29,8,65,.96), rgba(2,6,23,.98)) !important; }
      main > div > section:last-of-type { background: #030711 !important; }
    `
    document.head.appendChild(style)

    const patch = () => {
      document.getElementById("admin-chat-browser-bar")?.remove()
      document.getElementById("admin-chat-real-theme-menu")?.remove()
      const iframe = document.querySelector<HTMLIFrameElement>("iframe")
      if (!iframe) return
      const html = iframe.getAttribute("srcdoc") || iframe.srcdoc || ""
      const patched = patchPreviewHtml(html)
      if (patched !== html) iframe.srcdoc = patched
    }
    patch()
    const observer = new MutationObserver(patch)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["srcdoc"] })
    return () => {
      observer.disconnect()
      style.remove()
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[2147483000] h-[82px] overflow-visible border-b border-violet-400/25 bg-[#060012]/95 text-white shadow-[0_20px_70px_rgba(88,28,135,0.28)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(147,51,234,.40),transparent_26%),radial-gradient(circle_at_58%_0%,rgba(56,189,248,.16),transparent_28%),linear-gradient(180deg,rgba(12,0,28,.98),rgba(6,0,18,.92))]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(245,208,254,.9)_1px,transparent_1px),radial-gradient(rgba(103,232,249,.7)_1px,transparent_1px)] [background-position:12px_18px,54px_34px] [background-size:72px_72px,120px_120px]" />

      <div className="relative flex h-full items-center gap-3 px-3 sm:px-5 lg:px-6">
        <IconButton label="786.Chat"><Sparkles className="h-5 w-5 text-violet-100" /></IconButton>

        <button type="button" onClick={() => findNativeButton("New Chat")?.click()} title="New Chat" aria-label="New Chat" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-violet-600/35 text-lg font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_12px_35px_rgba(91,33,182,.24)] transition hover:border-violet-200/60 hover:bg-violet-500/45">+</button>

        <div className="mx-auto flex min-w-0 max-w-[430px] flex-1 items-center gap-3 rounded-2xl border border-violet-300/25 bg-black/20 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
          <Globe2 className="h-4 w-4 shrink-0 text-violet-100/85" />
          <div className="truncate text-sm font-bold text-violet-50">/</div>
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto">
          <div className="relative">
            <IconButton label={`Preview size: ${selectedDevice}`} accent="cyan" onClick={() => setDeviceOpen((value) => !value)}><Smartphone className="h-4 w-4 text-cyan-200" /></IconButton>
            {deviceOpen && (
              <div className="absolute right-0 top-[56px] max-h-[70vh] w-[260px] overflow-auto rounded-3xl border border-violet-300/25 bg-[#080516]/95 p-2 shadow-[0_30px_90px_rgba(0,0,0,.70)] backdrop-blur-2xl">
                <div className="px-3 pb-2 pt-2 text-xs font-semibold text-violet-100/70">Preview Size</div>
                {devices.map(([label, kind]) => (
                  <button key={label} type="button" onClick={() => { setSelectedDevice(label); selectNativeDevice(kind); setDeviceOpen(false); findNativeButton("Preview")?.click() }} className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-violet-500/15 ${selectedDevice === label ? "bg-violet-600/25 text-white" : "text-slate-300"}`}>
                    <span>{label}</span>
                    {selectedDevice === label && <Check className="h-4 w-4 text-violet-100" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <IconButton label="Preview" accent="cyan" onClick={() => findNativeButton("Preview")?.click()}><Monitor className="h-4 w-4 text-cyan-200" /></IconButton>
          <IconButton label="Code" onClick={() => findNativeButton("Code")?.click()}><Code2 className="h-4 w-4 text-violet-100" /></IconButton>
          <IconButton label="Refresh preview" accent="cyan" onClick={refreshPreview}><RefreshCw className="h-4 w-4 text-violet-100" /></IconButton>
          <IconButton label="Publish" accent="fuchsia" onClick={() => findNativeButton("Publish")?.click()}><Rocket className="h-4 w-4 text-fuchsia-100" /></IconButton>

          <div className="relative">
            <IconButton label={`Theme: ${selectedTheme}`} onClick={() => setThemeOpen((value) => !value)}><Palette className="h-4 w-4 text-violet-100" /></IconButton>
            {themeOpen && (
              <div className="absolute right-0 top-[56px] w-[290px] rounded-3xl border border-violet-300/25 bg-[#080516]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,.70)] backdrop-blur-2xl">
                <div className="px-3 pb-3 pt-2 text-center text-xs font-semibold text-violet-100/70">Choose Theme</div>
                <div className="space-y-2">
                  {themes.map(([label, description, swatch, theme]) => (
                    <button key={label} type="button" onClick={() => { setSelectedTheme(label); applyTheme(theme); setThemeOpen(false) }} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selectedTheme === label ? "border-violet-300/65 bg-violet-600/25" : "border-transparent hover:border-white/10 hover:bg-white/[0.045]"}`}>
                      <span className={`grid h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${swatch}`} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-white">{label}</span><span className="block truncate text-xs font-medium text-slate-300/80">{description}</span></span>
                      {selectedTheme === label && <Check className="h-4 w-4 shrink-0 text-violet-100" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <IconButton label="Projects" accent="rose" onClick={() => { window.location.href = "/786-admin/projects" }}><Power className="h-4 w-4" /></IconButton>
        </div>
      </div>
    </div>
  )
}

export function AdminChatToolbarCleanup() {
  const pathname = usePathname()
  return (
    <>
      {pathname === "/786-admin/chat" && <AdminChatGalaxyHeader />}
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
