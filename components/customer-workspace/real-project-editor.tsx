"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileCode2, Loader2, RotateCcw, Save, X } from "lucide-react"
import { useSearchParams } from "next/navigation"

type ProjectPayload = {
  id: string
  name: string
  files: Record<string, string>
  updated_at?: string
}

function downloadProject(project: ProjectPayload, files: Record<string, string>) {
  const blob = new Blob([
    JSON.stringify({ product: "786 Chat AI", project: { id: project.id, name: project.name }, files }, null, 2),
  ], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "786-project"}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function RealProjectEditor() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId") || ""
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState<ProjectPayload | null>(null)
  const [files, setFiles] = useState<Record<string, string>>({})
  const [savedFiles, setSavedFiles] = useState<Record<string, string>>({})
  const [selectedPath, setSelectedPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const paths = useMemo(() => Object.keys(files).sort(), [files])
  const dirty = JSON.stringify(files) !== JSON.stringify(savedFiles)

  useEffect(() => {
    if (!open || !projectId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to load project")
        if (cancelled) return
        const nextFiles = data.project?.files || {}
        setProject(data.project)
        setFiles(nextFiles)
        setSavedFiles(nextFiles)
        setSelectedPath(Object.keys(nextFiles).sort()[0] || "")
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Failed to load project")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, projectId])

  async function saveFiles() {
    if (!projectId || !dirty) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveFiles", files }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save project")
      setSavedFiles(files)
      setNotice(`Saved ${data.fileCount || Object.keys(files).length} files`)
      window.dispatchEvent(new CustomEvent("project-files-saved", { detail: { projectId, files } }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save project")
    } finally {
      setSaving(false)
    }
  }

  if (!projectId) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[75] inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-2xl backdrop-blur-xl hover:bg-slate-900"
      >
        <FileCode2 className="h-4 w-4" /> Project editor
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] bg-black/80 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#060914] text-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-bold">{project?.name || "Project files"}</p>
                <p className="text-xs text-slate-500">Real customer-owned files · {paths.length} files</p>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={!project} onClick={() => project && downloadProject(project, files)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"><Download className="h-4 w-4" /> Export</button>
                <button disabled={!dirty || saving} onClick={() => { setFiles(savedFiles); setNotice("Unsaved changes restored") }} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Undo</button>
                <button disabled={!dirty || saving} onClick={saveFiles} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </header>

            {error && <div className="border-b border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</div>}
            {notice && <div className="border-b border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{notice}</div>}

            {loading ? (
              <div className="grid flex-1 place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="grid min-h-0 flex-1 grid-cols-[230px_1fr]">
                <aside className="overflow-auto border-r border-white/10 bg-black/20 p-2">
                  {paths.map((path) => (
                    <button key={path} onClick={() => setSelectedPath(path)} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${selectedPath === path ? "bg-cyan-300/10 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                      <FileCode2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{path}</span>
                    </button>
                  ))}
                </aside>
                <div className="min-w-0">
                  <div className="flex h-10 items-center justify-between border-b border-white/10 px-4 text-xs text-slate-400"><span>{selectedPath || "Select a file"}</span><span className={dirty ? "text-amber-300" : "text-emerald-300"}>{dirty ? "Unsaved changes" : "Saved"}</span></div>
                  <textarea
                    value={selectedPath ? files[selectedPath] || "" : ""}
                    onChange={(event) => selectedPath && setFiles((current) => ({ ...current, [selectedPath]: event.target.value }))}
                    disabled={!selectedPath}
                    spellCheck={false}
                    className="h-[calc(100%-2.5rem)] w-full resize-none bg-[#02040a] p-5 font-mono text-[13px] leading-6 text-slate-200 outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
