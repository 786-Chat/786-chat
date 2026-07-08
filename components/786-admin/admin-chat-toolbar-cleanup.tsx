"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Check, ChevronDown, Code2, Globe2, Monitor, Palette, Power, RefreshCw, Rocket, Sparkles } from "lucide-react"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const themes = [
  ["Purple Galaxy", "Default", "from-violet-950 via-purple-700 to-fuchsia-400"],
  ["Green Aurora", "Fresh & Modern", "from-emerald-950 via-emerald-500 to-teal-200"],
  ["Blue Ocean", "Calm & Professional", "from-blue-950 via-blue-600 to-cyan-300"],
  ["Dark Navy", "Deep & Focused", "from-black via-slate-950 to-cyan-950"],
  ["White Mode", "Clean & Minimal", "from-white via-slate-100 to-white"],
]

function findNativeButton(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent?.toLowerCase().includes(label.toLowerCase()))
}

function refreshPreview() {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe")
  if (!iframe) return
  const html = iframe.srcdoc
  iframe.srcdoc = ""
  window.setTimeout(() => {
    iframe.srcdoc = html
  }, 40)
}

function AdminChatGalaxyHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const style = document.createElement("style")
    style.id = "admin-chat-single-galaxy-shell"
    style.textContent = `
      body { overflow: hidden; }
      main { padding-top: 82px !important; background: #030008 !important; }
      main > div { height: calc(100vh - 82px) !important; }
      main > div > section:first-of-type > header,
      main > div > section:last-of-type > header,
      #admin-chat-browser-bar { display: none !important; }
      main > div > aside { padding-top: 34px !important; background: linear-gradient(180deg, rgba(30,5,74,.96), rgba(4,0,18,.98)) !important; }
      main > div > section:first-of-type { background: radial-gradient(circle at 30% 18%, rgba(168,85,247,.32), transparent 34%), linear-gradient(180deg, rgba(29,8,65,.96), rgba(2,6,23,.98)) !important; }
      main > div > section:last-of-type { background: #030711 !important; }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-[2147483000] h-[82px] overflow-visible border-b border-violet-400/25 bg-[#060012]/95 text-white shadow-[0_20px_70px_rgba(88,28,135,0.28)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(147,51,234,.40),transparent_26%),radial-gradient(circle_at_58%_0%,rgba(56,189,248,.16),transparent_28%),linear-gradient(180deg,rgba(12,0,28,.98),rgba(6,0,18,.92))]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(245,208,254,.9)_1px,transparent_1px),radial-gradient(rgba(103,232,249,.7)_1px,transparent_1px)] [background-position:12px_18px,54px_34px] [background-size:72px_72px,120px_120px]" />

      <div className="relative flex h-full items-center gap-3 px-3 sm:px-5 lg:px-6">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/30 bg-violet-500/20 shadow-[0_0_35px_rgba(139,92,246,.30)]">
          <Sparkles className="h-5 w-5 text-violet-100" />
        </div>

        <button type="button" onClick={() => findNativeButton("New Chat")?.click()} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-600/35 px-4 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_12px_35px_rgba(91,33,182,.24)] transition hover:border-violet-200/60 hover:bg-violet-500/45">
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">New Chat</span>
        </button>

        <div className="mx-auto flex min-w-0 max-w-[520px] flex-1 items-center gap-3 rounded-2xl border border-violet-300/25 bg-black/20 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
          <Globe2 className="h-4 w-4 shrink-0 text-violet-100/85" />
          <div className="truncate text-sm font-bold text-violet-50">/</div>
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto">
          <button type="button" onClick={() => findNativeButton("Preview")?.click()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white transition hover:border-cyan-200/50 hover:bg-cyan-400/10">
            <Monitor className="h-4 w-4 text-cyan-200" /><span className="hidden md:inline">Preview</span><ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 md:block" />
          </button>
          <button type="button" onClick={() => findNativeButton("Code")?.click()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white transition hover:border-violet-200/60 hover:bg-violet-500/15">
            <Code2 className="h-4 w-4 text-violet-100" /><span className="hidden md:inline">Code</span>
          </button>
          <button type="button" onClick={refreshPreview} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-white/[0.045] text-violet-100 transition hover:border-cyan-200/50 hover:bg-cyan-400/10" aria-label="Refresh preview">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => findNativeButton("Publish")?.click()} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white transition hover:border-fuchsia-200/60 hover:bg-fuchsia-500/15">
            <Rocket className="h-4 w-4 text-fuchsia-100" /><span className="hidden lg:inline">Publish</span><ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 lg:block" />
          </button>

          <div className="relative">
            <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white transition hover:border-violet-200/60 hover:bg-violet-500/15">
              <Palette className="h-4 w-4 text-violet-100" /><span className="hidden lg:inline">Theme</span><ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 lg:block" />
            </button>
            {open && (
              <div className="absolute right-0 top-[56px] w-[290px] rounded-3xl border border-violet-300/25 bg-[#080516]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,.70)] backdrop-blur-2xl">
                <div className="px-3 pb-3 pt-2 text-center text-xs font-semibold text-violet-100/70">Choose Theme</div>
                <div className="space-y-2">
                  {themes.map(([label, description, swatch], index) => (
                    <button key={label} type="button" onClick={() => setOpen(false)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${index === 0 ? "border-violet-300/65 bg-violet-600/25" : "border-transparent hover:border-white/10 hover:bg-white/[0.045]"}`}>
                      <span className={`grid h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${swatch}`} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-white">{label}</span><span className="block truncate text-xs font-medium text-slate-300/80">{description}</span></span>
                      {index === 0 && <Check className="h-4 w-4 shrink-0 text-violet-100" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => { window.location.href = "/786-admin/projects" }} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-white/[0.045] text-violet-100 transition hover:border-rose-200/50 hover:bg-rose-500/10" aria-label="Projects">
            <Power className="h-4 w-4" />
          </button>
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
