"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Save } from "lucide-react"

type Props = {
  projectId: string
  files: Record<string, string>
  onSaved: (files: Record<string, string>) => void
}

export function CustomerCodeEditor({ projectId, files, onSaved }: Props) {
  const paths = useMemo(() => Object.keys(files).sort((a, b) => a.localeCompare(b)), [files])
  const [selectedFile, setSelectedFile] = useState(paths[0] || "")
  const [draftFiles, setDraftFiles] = useState<Record<string, string>>(files)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setDraftFiles(files)
    setSelectedFile((current) => (current && files[current] !== undefined ? current : Object.keys(files).sort()[0] || ""))
    setSaved(false)
    setError("")
  }, [files, projectId])

  const selectedContent = selectedFile ? draftFiles[selectedFile] ?? "" : ""
  const dirty = paths.some((path) => (draftFiles[path] ?? "") !== (files[path] ?? ""))

  async function saveFiles() {
    if (!projectId || !dirty || saving) return
    setSaving(true)
    setSaved(false)
    setError("")

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveFiles", files: draftFiles }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || "Could not save project files")
      onSaved(draftFiles)
      setSaved(true)
      window.dispatchEvent(new CustomEvent("chat-updated", { detail: { projectId } }))
      window.setTimeout(() => setSaved(false), 1800)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save project files")
    } finally {
      setSaving(false)
    }
  }

  if (!paths.length) {
    return <div className="flex h-full items-center justify-center bg-[#08080d] text-sm text-white/40">No project files found.</div>
  }

  return (
    <div className="flex h-full min-h-0 bg-[#0b0f17] text-white">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/10">
        <div className="border-b border-white/10 p-3 text-xs font-semibold text-white/50">Project Files</div>
        {paths.map((path) => (
          <button
            key={path}
            type="button"
            onClick={() => setSelectedFile(path)}
            className={`w-full px-3 py-2 text-left text-xs transition ${selectedFile === path ? "bg-white/10 text-cyan-300" : "text-white/70 hover:bg-white/[0.06]"}`}
          >
            {path}
          </button>
        ))}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <span className="truncate text-xs text-white/45">{selectedFile}</span>
          <div className="flex items-center gap-3">
            {error ? <span className="max-w-[360px] truncate text-[11px] text-red-300">{error}</span> : null}
            <button
              type="button"
              onClick={saveFiles}
              disabled={!dirty || saving}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving" : saved ? "Saved" : "Save"}
            </button>
          </div>
        </header>

        <textarea
          value={selectedContent}
          onChange={(event) => {
            const value = event.target.value
            setDraftFiles((current) => ({ ...current, [selectedFile]: value }))
            setSaved(false)
          }}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-[#080b12] p-4 font-mono text-xs leading-6 text-white/85 outline-none"
          aria-label={`Edit ${selectedFile}`}
        />
      </section>
    </div>
  )
}
