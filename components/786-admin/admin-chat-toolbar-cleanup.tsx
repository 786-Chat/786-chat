"use client"

import { usePathname } from "next/navigation"
import { Check, ChevronDown, Code2, Globe2, Monitor, Palette, RefreshCw, Rocket, Sparkles } from "lucide-react"
import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

const themes = [
  ["Purple Galaxy", "Default", "from-violet-950 via-purple-700 to-fuchsia-400"],
  ["Green Aurora", "Fresh & Modern", "from-emerald-950 via-emerald-500 to-teal-200"],
  ["Blue Ocean", "Calm & Professional", "from-blue-950 via-blue-600 to-cyan-300"],
  ["Dark Navy", "Deep & Focused", "from-black via-slate-950 to-cyan-950"],
  ["White Mode", "Clean & Minimal", "from-white via-slate-100 to-white"],
]

function AdminChatGalaxyHeader() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[82px] border-b border-violet-400/25 bg-[#060012]/90 text-white shadow-[0_20px_70px_rgba(88,28,135,0.28)] backdrop-blur-2xl">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(147,51,234,.40),transparent_26%),radial-gradient(circle_at_58%_0%,rgba(56,189,248,.16),transparent_28%),linear-gradient(180deg,rgba(12,0,28,.98),rgba(6,0,18,.92))]" />
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(245,208,254,.9)_1px,transparent_1px),radial-gradient(rgba(103,232,249,.7)_1px,transparent_1px)] [background-position:12px_18px,54px_34px] [background-size:72px_72px,120px_120px]" />
      </div>

      <div className="relative flex h-full items-center gap-3 px-3 sm:px-5 lg:px-6">
        <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-violet-300/30 bg-violet-500/20 shadow-[0_0_35px_rgba(139,92,246,.30)] lg:grid">
          <Sparkles className="h-5 w-5 text-violet-100" />
        </div>

        <div className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-600/25 px-4 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_12px_35px_rgba(91,33,182,.24)]">
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">New Chat</span>
        </div>

        <div className="mx-auto flex min-w-0 max-w-[520px] flex-1 items-center gap-3 rounded-2xl border border-violet-300/25 bg-black/20 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
          <Globe2 className="h-4 w-4 shrink-0 text-violet-100/85" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-violet-50">/</div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/55 sm:block">Admin workspace</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto">
          <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white">
            <Monitor className="h-4 w-4 text-cyan-200" />
            <span className="hidden md:inline">Preview</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 md:block" />
          </div>

          <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white">
            <Code2 className="h-4 w-4 text-violet-100" />
            <span className="hidden md:inline">Code</span>
          </div>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-white/[0.045] text-violet-100">
            <RefreshCw className="h-4 w-4" />
          </div>

          <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white">
            <Rocket className="h-4 w-4 text-fuchsia-100" />
            <span className="hidden lg:inline">Publish</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 lg:block" />
          </div>

          <div className="group relative">
            <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-white/[0.045] px-3 text-sm font-black text-white">
              <Palette className="h-4 w-4 text-violet-100" />
              <span className="hidden lg:inline">Theme</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-violet-200/70 lg:block" />
            </div>

            <div className="invisible absolute right-0 top-[56px] w-[290px] rounded-3xl border border-violet-300/25 bg-[#080516]/95 p-3 opacity-0 shadow-[0_30px_90px_rgba(0,0,0,.70)] backdrop-blur-2xl transition group-hover:visible group-hover:opacity-100">
              <div className="px-3 pb-3 pt-2 text-center text-xs font-semibold text-violet-100/70">Choose Theme</div>
              <div className="space-y-2">
                {themes.map(([label, description, swatch], index) => (
                  <div key={label} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${index === 0 ? "border-violet-300/65 bg-violet-600/25" : "border-transparent bg-white/[0.025]"}`}>
                    <span className={`grid h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${swatch}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{label}</span>
                      <span className="block truncate text-xs font-medium text-slate-300/80">{description}</span>
                    </span>
                    {index === 0 && <Check className="h-4 w-4 shrink-0 text-violet-100" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
