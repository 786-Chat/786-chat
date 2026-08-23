"use client"

import {
  Code2,
  FolderOpen,
  Home,
  Menu,
  Monitor,
  Palette,
  Play,
  RefreshCw,
  Rocket,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"

function findWorkspaceButton(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("main button"))
    .find((button) => button.textContent?.trim() === label)
}

function clickWorkspaceButton(label: string) {
  const button = findWorkspaceButton(label)
  if (!button || button.disabled) return false
  button.click()
  return true
}

function clickWorkspaceButtonByAria(label: string) {
  const button = document.querySelector<HTMLButtonElement>(`main button[aria-label="${label}"]`)
  if (!button || button.disabled) return false
  button.click()
  return true
}

export function MobileWorkspaceMenu() {
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(""), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  function closeAndRun(action: () => boolean | void, unavailable = "This action is not available yet.") {
    const result = action()
    setOpen(false)
    if (result === false) setNotice(unavailable)
  }

  function setRoyalFusion() {
    const select = Array.from(document.querySelectorAll<HTMLSelectElement>("main select"))
      .find((item) => Array.from(item.options).some((option) => option.textContent?.trim() === "Royal Fusion"))
    if (!select) return false
    select.value = "royal"
    select.dispatchEvent(new Event("change", { bubbles: true }))
    return true
  }

  const actions = [
    { label: "786.Chat · Start work", icon: Play, run: () => clickWorkspaceButtonByAria("Show AI Agent") },
    { label: "Overview", icon: Home, run: () => { window.location.assign("/") } },
    { label: "Projects", icon: FolderOpen, run: () => { window.location.assign("/786.chat/projects") } },
    { label: "Chat", icon: Sparkles, run: () => clickWorkspaceButtonByAria("Show AI Agent") },
    { label: "Preview", icon: Monitor, run: () => clickWorkspaceButtonByAria("Show live preview") },
    { label: "Code", icon: Code2, run: () => clickWorkspaceButtonByAria("Show project code") },
    { label: "Rebuild", icon: RefreshCw, run: () => clickWorkspaceButton("Rebuild") },
    { label: "Restore", icon: RotateCcw, run: () => clickWorkspaceButton("Restore") },
    { label: "Royal Fusion", icon: Palette, run: setRoyalFusion },
    { label: "Undo", icon: Undo2, run: () => clickWorkspaceButton("Undo") },
    { label: "Deploy", icon: Rocket, run: () => {
      const button = document.querySelector<HTMLButtonElement>("main button[data-786-publish]")
      if (!button || button.disabled) return false
      button.click()
      return true
    } },
    { label: "New project", icon: Sparkles, run: () => clickWorkspaceButton("New project") },
  ]

  return (
    <>
      <style jsx global>{`
        @media (max-width: 1279px) {
          main button[aria-label="Open dashboard menu"],
          main button[aria-label="Show AI Agent"],
          main button[aria-label="Show live preview"],
          main button[aria-label="Show project code"] {
            display: none !important;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open mobile workspace menu"
        className="fixed bottom-5 right-4 z-[110] inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-300/30 bg-[#11182b]/95 px-4 text-sm font-black text-white shadow-[0_18px_55px_rgba(0,0,0,.48)] backdrop-blur-xl xl:hidden"
      >
        <Menu className="h-4 w-4 text-violet-200" /> Menu
      </button>

      {notice && (
        <div className="fixed bottom-20 right-4 z-[130] max-w-[280px] rounded-xl border border-amber-300/25 bg-[#11182b]/95 px-3 py-2 text-sm font-semibold text-amber-100 shadow-2xl xl:hidden">
          {notice}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[120] xl:hidden">
          <button type="button" aria-label="Close mobile workspace menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <aside className="relative flex h-full w-[min(340px,88vw)] flex-col border-r border-violet-300/20 bg-gradient-to-b from-[#251049] via-[#121033] to-[#070c1f] shadow-[26px_0_80px_rgba(0,0,0,.62)]">
            <header className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
              <div>
                <p className="text-lg font-black text-white">786.Chat</p>
                <p className="text-xs text-slate-400">Mobile workspace</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </header>

            <nav className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid gap-1.5">
                {actions.map(({ label, icon: Icon, run }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => closeAndRun(run, `${label} is not available for the current project yet.`)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-[15px] font-bold text-slate-200 transition hover:border-violet-300/20 hover:bg-white/[.07]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[.06] text-violet-200"><Icon className="h-4 w-4" /></span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
