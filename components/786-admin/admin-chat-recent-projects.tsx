"use client"

import { useEffect } from "react"

const ACTIVE_PROJECT_ID_KEY = "786chat_admin_active_project_id_v1"

type ProjectItem = {
  id: string
  title: string
  description?: string
  updated_at?: string
  kind?: string
  file_count?: number
  message_count?: number
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] || char)
}

function relativeDate(value?: string) {
  if (!value) return "Recently updated"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently updated"
  const diff = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? "" : "s"} ago`
}

export function AdminChatRecentProjects() {
  useEffect(() => {
    let stopped = false
    let mounted = false

    function findEmptyPreview() {
      return Array.from(document.querySelectorAll<HTMLElement>("h2")).find((node) => node.textContent?.trim() === "No Preview Yet")?.parentElement?.parentElement || null
    }

    async function install() {
      if (stopped || mounted) return
      const empty = findEmptyPreview()
      if (!empty) return
      mounted = true

      try {
        const response = await fetch("/api/786-admin/projects", { cache: "no-store" })
        if (!response.ok) throw new Error("Projects could not be loaded")
        const json = await response.json() as { projects?: ProjectItem[] }
        const projects = Array.isArray(json.projects) ? json.projects.slice(0, 6) : []
        if (stopped || !empty.isConnected) return

        empty.className = "h-full overflow-y-auto p-6 md:p-8"
        empty.innerHTML = `
          <div class="mx-auto max-w-6xl">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Workspace</p>
                <h2 class="mt-2 text-2xl font-black text-white">Your recent projects</h2>
                <p class="mt-2 text-sm text-slate-400">Open a project to continue editing, previewing and publishing.</p>
              </div>
              <button data-view-all class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">View all →</button>
            </div>
            <div data-project-grid class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"></div>
          </div>`

        const grid = empty.querySelector<HTMLElement>("[data-project-grid]")
        if (!grid) return

        if (projects.length === 0) {
          grid.innerHTML = `<div class="col-span-full rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center"><p class="text-base font-bold text-white">No saved projects yet</p><p class="mt-2 text-sm text-slate-400">Use New Chat and send a build prompt to create your first project.</p></div>`
        } else {
          grid.innerHTML = projects.map((project, index) => {
            const title = escapeHtml(project.title || "Untitled project")
            const description = escapeHtml(project.description || "Saved 786.Chat project")
            const updated = escapeHtml(relativeDate(project.updated_at))
            const hue = (index * 67 + 205) % 360
            return `
              <article data-project-card="${project.id}" class="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#10131d] shadow-xl transition hover:-translate-y-1 hover:border-cyan-300/40">
                <div class="relative h-36 overflow-hidden border-b border-white/10" style="background:radial-gradient(circle at 75% 22%,hsla(${hue},90%,65%,.48),transparent 34%),linear-gradient(135deg,#070914,#15233c)">
                  <div class="absolute inset-0 opacity-60" style="background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:22px 22px"></div>
                  <div class="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/35 p-3 backdrop-blur-md">
                    <p class="truncate text-sm font-black text-white">${title}</p>
                    <p class="mt-1 truncate text-[11px] text-slate-300">${description}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-3 p-4">
                  <div class="min-w-0"><p class="truncate text-sm font-bold text-white">${title}</p><p class="mt-1 text-[11px] text-slate-400">${updated}</p></div>
                  <button type="button" data-menu-button="${project.id}" aria-label="Project menu" class="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-white/10 hover:text-white">⋮</button>
                </div>
                <div data-menu="${project.id}" class="absolute bottom-14 right-3 z-20 hidden w-32 rounded-xl border border-white/10 bg-[#090b12] p-1 shadow-2xl">
                  <button type="button" data-delete="${project.id}" class="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-300 hover:bg-rose-500/15">Delete</button>
                </div>
              </article>`
          }).join("")
        }

        empty.querySelector("[data-view-all]")?.addEventListener("click", () => { window.location.href = "/786-admin/projects" })

        empty.querySelectorAll<HTMLElement>("[data-project-card]").forEach((card) => {
          card.addEventListener("click", (event) => {
            const target = event.target as HTMLElement
            if (target.closest("[data-menu-button]") || target.closest("[data-delete]")) return
            const id = card.dataset.projectCard
            if (!id) return
            localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id)
            window.location.reload()
          })
        })

        empty.querySelectorAll<HTMLElement>("[data-menu-button]").forEach((button) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation()
            const id = button.dataset.menuButton
            empty.querySelectorAll<HTMLElement>("[data-menu]").forEach((menu) => menu.classList.toggle("hidden", menu.dataset.menu !== id || !menu.classList.contains("hidden")))
          })
        })

        empty.querySelectorAll<HTMLElement>("[data-delete]").forEach((button) => {
          button.addEventListener("click", async (event) => {
            event.stopPropagation()
            const id = button.dataset.delete
            if (!id || !window.confirm("Delete this project permanently?")) return
            button.textContent = "Deleting…"
            const response = await fetch(`/api/786-admin/projects/${id}`, { method: "DELETE" })
            if (!response.ok) {
              button.textContent = "Delete failed"
              return
            }
            if (localStorage.getItem(ACTIVE_PROJECT_ID_KEY) === id) localStorage.removeItem(ACTIVE_PROJECT_ID_KEY)
            button.closest("[data-project-card]")?.remove()
          })
        })
      } catch {
        mounted = false
      }
    }

    const observer = new MutationObserver(() => { void install() })
    observer.observe(document.body, { childList: true, subtree: true })
    void install()

    return () => {
      stopped = true
      observer.disconnect()
    }
  }, [])

  return null
}
