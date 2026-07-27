"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_CHAT_PATH = "/786-admin/chat"
const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"
const EDITOR_ATTRIBUTE = "data-786-real-code-editor"

function activeProjectId(): string {
  try {
    return (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || "").trim()
  } catch {
    return ""
  }
}

function selectedFilePath(container: Element): string {
  const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).filter((button) => {
    if (button.closest(`[${EDITOR_ATTRIBUTE}]`)) return false
    return /\.(?:tsx?|jsx?|css|html|json|md)$/i.test((button.textContent || "").trim())
  })
  const selected = buttons.find((button) =>
    button.className.includes("bg-[rgb(var(--accent))]"),
  )
  return (selected?.textContent || buttons[0]?.textContent || "app/page.tsx").trim()
}

export function AdminChatRealCodeEditor() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname?.startsWith(ADMIN_CHAT_PATH)) return

    let disposed = false
    let projectWatch: number | undefined

    const install = () => {
      const code = document.querySelector<HTMLElement>("main pre code")
      const pre = code?.closest<HTMLElement>("pre")
      const grid = pre?.parentElement
      if (!code || !pre || !grid || pre.hasAttribute(EDITOR_ATTRIBUTE)) return

      pre.setAttribute(EDITOR_ATTRIBUTE, "true")
      pre.style.display = "none"

      const editor = document.createElement("section")
      editor.setAttribute(EDITOR_ATTRIBUTE, "true")
      editor.className = "min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-black/30"
      editor.innerHTML = `
        <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div class="min-w-0">
            <div data-editor-path class="truncate text-xs font-black text-cyan-100">app/page.tsx</div>
            <div data-editor-status class="mt-1 text-[11px] text-slate-400">Select a file to edit.</div>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" data-editor-reload class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/10">Reload</button>
            <button type="button" data-editor-save class="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-400">Save file</button>
          </div>
        </div>
        <textarea data-editor-text spellcheck="false" class="block h-full min-h-[480px] w-full resize-none bg-transparent p-5 font-mono text-xs leading-6 text-cyan-50 outline-none" aria-label="Project source code"></textarea>
      `
      grid.appendChild(editor)

      const textarea = editor.querySelector<HTMLTextAreaElement>("[data-editor-text]")!
      const pathLabel = editor.querySelector<HTMLElement>("[data-editor-path]")!
      const status = editor.querySelector<HTMLElement>("[data-editor-status]")!
      const save = editor.querySelector<HTMLButtonElement>("[data-editor-save]")!
      const reload = editor.querySelector<HTMLButtonElement>("[data-editor-reload]")!

      let currentPath = ""
      let original = ""
      let loading = false
      let loadedProjectId = ""
      let requestSequence = 0

      const setStatus = (message: string, tone: "normal" | "error" | "success" = "normal") => {
        status.textContent = message
        status.style.color = tone === "error" ? "#fda4af" : tone === "success" ? "#86efac" : "#94a3b8"
      }

      const load = async () => {
        if (loading || disposed) return
        const projectId = activeProjectId()
        const sequence = ++requestSequence
        if (!projectId) {
          loadedProjectId = ""
          currentPath = ""
          original = ""
          textarea.value = ""
          setStatus("Open or create a project before editing code.", "error")
          return
        }

        const nextPath = selectedFilePath(grid)
        loading = true
        textarea.disabled = true
        save.disabled = true
        pathLabel.textContent = nextPath
        setStatus("Loading saved file…")

        try {
          const response = await fetch(`/api/786-admin/projects/${projectId}`, { cache: "no-store" })
          const json = await response.json()
          if (!response.ok || !json?.project) throw new Error(json?.error || "Could not load project")
          if (disposed || sequence !== requestSequence || projectId !== activeProjectId()) return

          loadedProjectId = projectId
          currentPath = nextPath
          original = String(json.project.files?.[currentPath] || "")
          textarea.value = original
          setStatus("Ready. Press Ctrl+S or Save file.")
        } catch (error) {
          if (sequence === requestSequence) {
            setStatus(error instanceof Error ? error.message : "Could not load file.", "error")
          }
        } finally {
          if (sequence === requestSequence) {
            loading = false
            textarea.disabled = false
            save.disabled = false
          }
        }
      }

      const saveFile = async () => {
        if (loading || !currentPath || !loadedProjectId) return
        if (loadedProjectId !== activeProjectId()) {
          setStatus("The active project changed. Reload this editor before saving.", "error")
          void load()
          return
        }

        const projectId = loadedProjectId
        loading = true
        textarea.disabled = true
        save.disabled = true
        setStatus("Saving to Neon…")

        try {
          const response = await fetch(`/api/786-admin/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              files: { [currentPath]: textarea.value },
              preview_state: { active_file: currentPath },
              revision_source: "manual-code-editor",
              revision_label: `Before editing ${currentPath}`,
            }),
          })
          const json = await response.json()
          if (!response.ok || !json?.project) throw new Error(json?.error || "Save failed")
          if (projectId !== activeProjectId()) {
            setStatus("Saved to the previous project. Loading the active project…", "success")
            loading = false
            textarea.disabled = false
            save.disabled = false
            void load()
            return
          }

          original = textarea.value
          setStatus("Saved. Reloading the project preview…", "success")
          window.setTimeout(() => window.location.reload(), 450)
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Save failed.", "error")
          loading = false
          textarea.disabled = false
          save.disabled = false
        }
      }

      textarea.addEventListener("input", () => {
        setStatus(textarea.value === original ? "No unsaved changes." : "Unsaved changes")
      })
      textarea.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault()
          void saveFile()
        }
      })
      save.addEventListener("click", () => void saveFile())
      reload.addEventListener("click", () => void load())

      const fileButtons = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"))
      for (const button of fileButtons) {
        if (editor.contains(button)) continue
        button.addEventListener("click", () => window.setTimeout(() => void load(), 30))
      }

      projectWatch = window.setInterval(() => {
        if (!loading && activeProjectId() !== loadedProjectId) void load()
      }, 500)

      void load()
    }

    install()
    const observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      disposed = true
      window.clearInterval(projectWatch)
      observer.disconnect()
      document.querySelectorAll(`[${EDITOR_ATTRIBUTE}]`).forEach((element) => {
        if (element.tagName === "PRE") element.removeAttribute(EDITOR_ATTRIBUTE)
        else element.remove()
      })
      document.querySelectorAll<HTMLElement>("main pre").forEach((element) => { element.style.display = "" })
    }
  }, [pathname])

  return null
}
