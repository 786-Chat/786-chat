"use client"

import { useEffect, useMemo, useState } from "react"
import { Command, Download, FileCode2, Files, History, Monitor, Plus, Search, SquareTerminal, X } from "lucide-react"

type CommandItem = {
  id: string
  label: string
  shortcut?: string
  icon: typeof Monitor
  run: () => void
}

function clickButton(label: string) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
  const target = buttons.find((button) => button.textContent?.trim().toLowerCase().includes(label.toLowerCase()))
  target?.click()
}

function downloadWorkspaceSnapshot() {
  const payload = {
    product: "786 Chat AI",
    exportedAt: new Date().toISOString(),
    route: window.location.pathname + window.location.search,
    note: "Open the project Files or Code tabs to review the current workspace files.",
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `786-chat-workspace-${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function WorkspaceCommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const commands = useMemo<CommandItem[]>(() => [
    { id: "new", label: "Start new chat", shortcut: "Ctrl+N", icon: Plus, run: () => clickButton("New Chat") },
    { id: "preview", label: "Open preview", shortcut: "Ctrl+1", icon: Monitor, run: () => clickButton("Preview") },
    { id: "code", label: "Open code", shortcut: "Ctrl+2", icon: FileCode2, run: () => clickButton("Code") },
    { id: "files", label: "Open files", shortcut: "Ctrl+3", icon: Files, run: () => clickButton("Files") },
    { id: "terminal", label: "Open terminal", shortcut: "Ctrl+4", icon: SquareTerminal, run: () => clickButton("Terminal") },
    { id: "history", label: "Open history", shortcut: "Ctrl+5", icon: History, run: () => clickButton("History") },
    { id: "download", label: "Download workspace snapshot", shortcut: "Ctrl+Shift+E", icon: Download, run: downloadWorkspaceSnapshot },
  ], [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault()
        setOpen((value) => !value)
        return
      }
      if ((event.ctrlKey || event.metaKey) && key === "n") {
        event.preventDefault(); clickButton("New Chat")
      }
      if ((event.ctrlKey || event.metaKey) && ["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault()
        const labels = ["Preview", "Code", "Files", "Terminal", "History"]
        clickButton(labels[Number(event.key) - 1])
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "e") {
        event.preventDefault(); downloadWorkspaceSnapshot()
      }
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filtered = commands.filter((command) => command.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[70] hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-slate-200 shadow-2xl backdrop-blur-xl hover:bg-slate-900 md:inline-flex"
        aria-label="Open command palette"
      >
        <Command className="h-4 w-4 text-cyan-300" /> Commands <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#080b18] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[420px] overflow-auto p-2">
              {filtered.map((command) => {
                const Icon = command.icon
                return (
                  <button key={command.id} onClick={() => { command.run(); setOpen(false); setQuery("") }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-200 hover:bg-white/5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-cyan-300"><Icon className="h-4 w-4" /></span>
                    <span className="flex-1 font-medium">{command.label}</span>
                    {command.shortcut && <kbd className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-500">{command.shortcut}</kbd>}
                  </button>
                )
              })}
              {filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">No matching command.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
