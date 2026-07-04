"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react"
import { usePathname } from "next/navigation"

type ProgressStage =
  | "idle"
  | "thinking"
  | "generating"
  | "preparing"
  | "saving"
  | "completed"
  | "failed"

type ProgressState = {
  stage: ProgressStage
  detail: string
}

const CHAT_ENDPOINT = "/api/786-admin/chat"
const PROJECT_ENDPOINT = /^\/api\/786-admin\/projects(?:\/[^/?#]+)?(?:[?#].*)?$/
const OLD_WORKING_TEXT = "786.Chat is creating real project files"
const ACTIVE_ATTR = "data-admin-generation-progress-active"

function requestPath(input: RequestInfo | URL): string {
  try {
    if (typeof input === "string") return new URL(input, window.location.origin).pathname
    if (input instanceof URL) return input.pathname
    return new URL(input.url, window.location.origin).pathname
  } catch {
    return ""
  }
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase()
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase()
  return "GET"
}

function findChatScroll(): HTMLElement | null {
  return document.querySelector<HTMLElement>("main > div > section:first-of-type div.flex-1.overflow-y-auto")
}

function progressIsActive(): boolean {
  return document.documentElement.getAttribute(ACTIVE_ATTR) === "true"
}

function setProgressActive(active: boolean) {
  if (active) document.documentElement.setAttribute(ACTIVE_ATTR, "true")
  else document.documentElement.removeAttribute(ACTIVE_ATTR)
}

function hideLegacyWorkingCard(hidden: boolean) {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("main div"))
  for (const element of candidates) {
    const text = element.textContent?.trim() || ""
    if (!text.includes(OLD_WORKING_TEXT)) continue
    if (hidden) {
      if (!element.dataset.generationOriginalDisplay) {
        element.dataset.generationOriginalDisplay = element.style.display || "__empty__"
      }
      element.style.display = "none"
    } else if (element.dataset.generationOriginalDisplay) {
      element.style.display = element.dataset.generationOriginalDisplay === "__empty__" ? "" : element.dataset.generationOriginalDisplay
      delete element.dataset.generationOriginalDisplay
    }
  }
}

export function AdminChatGenerationProgress() {
  const pathname = usePathname()
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [progress, setProgress] = useState<ProgressState>({ stage: "idle", detail: "" })

  const active = progress.stage !== "idle"
  const failed = progress.stage === "failed"
  const completed = progress.stage === "completed"

  const title = useMemo(() => {
    if (progress.stage === "thinking") return "Thinking about your request"
    if (progress.stage === "generating") return "Generating real project files"
    if (progress.stage === "preparing") return "Preparing your live project"
    if (progress.stage === "saving") return "Saving project to Neon"
    if (progress.stage === "completed") return "Project created successfully"
    if (progress.stage === "failed") return "Generation stopped"
    return ""
  }, [progress.stage])

  useEffect(() => {
    if (pathname !== "/786-admin/chat") {
      setHost(null)
      setProgress({ stage: "idle", detail: "" })
      setProgressActive(false)
      return
    }

    let disposed = false
    let hideTimer: number | undefined
    let generatingTimer: number | undefined
    let hostNode: HTMLDivElement | null = null

    const ensureHost = () => {
      if (disposed) return
      const scroll = findChatScroll()
      if (!scroll) return
      hostNode = document.getElementById("admin-chat-generation-progress-host") as HTMLDivElement | null
      if (!hostNode) {
        hostNode = document.createElement("div")
        hostNode.id = "admin-chat-generation-progress-host"
        hostNode.className = "mr-8 mb-4"
        scroll.appendChild(hostNode)
      } else if (hostNode.parentElement !== scroll) {
        scroll.appendChild(hostNode)
      }
      setHost(hostNode)
      window.requestAnimationFrame(() => hostNode?.scrollIntoView({ behavior: "smooth", block: "end" }))
    }

    const showProgress = (next: ProgressState) => {
      setProgressActive(true)
      setProgress(next)
      hideLegacyWorkingCard(true)
      ensureHost()
    }

    const finishLater = (next: ProgressState, delay: number) => {
      window.clearTimeout(hideTimer)
      showProgress(next)
      hideTimer = window.setTimeout(() => {
        setProgress({ stage: "idle", detail: "" })
        setProgressActive(false)
        hideLegacyWorkingCard(false)
      }, delay)
    }

    ensureHost()
    const observer = new MutationObserver(() => {
      ensureHost()
      hideLegacyWorkingCard(progressIsActive())
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = requestPath(input)
      const method = requestMethod(input, init)
      const isChatRequest = path === CHAT_ENDPOINT && method === "POST"
      const isProjectSave = PROJECT_ENDPOINT.test(path) && (method === "POST" || method === "PATCH")

      if (isChatRequest) {
        window.clearTimeout(hideTimer)
        window.clearTimeout(generatingTimer)
        showProgress({ stage: "thinking", detail: "786.Chat is analysing your instructions before code generation starts." })
        generatingTimer = window.setTimeout(() => {
          showProgress({ stage: "generating", detail: "The AI is building complete React, TypeScript and project files." })
        }, 500)
      } else if (isProjectSave) {
        window.clearTimeout(generatingTimer)
        showProgress({ stage: "saving", detail: "Generated files and chat history are being saved to your active project." })
      }

      try {
        const response = await originalFetch(input, init)

        if (isChatRequest) {
          window.clearTimeout(generatingTimer)
          if (response.ok) {
            showProgress({ stage: "preparing", detail: "Code generation finished. 786.Chat is preparing the preview and project data." })
          } else {
            finishLater({ stage: "failed", detail: `The generation request returned HTTP ${response.status}. The error message is shown in chat.` }, 6000)
          }
        } else if (isProjectSave) {
          if (response.ok) {
            finishLater({ stage: "completed", detail: "The real project files were saved successfully and the preview can now load." }, 2600)
          } else {
            finishLater({ stage: "failed", detail: `Project saving returned HTTP ${response.status}. Nothing is being reported as saved unless Neon accepted it.` }, 6000)
          }
        }

        return response
      } catch (error) {
        if (isChatRequest || isProjectSave) {
          const message = error instanceof Error ? error.message : "The request failed before receiving a response."
          finishLater({ stage: "failed", detail: message }, 6000)
        }
        throw error
      }
    }

    return () => {
      disposed = true
      observer.disconnect()
      window.fetch = originalFetch
      window.clearTimeout(hideTimer)
      window.clearTimeout(generatingTimer)
      setProgressActive(false)
      hideLegacyWorkingCard(false)
      hostNode?.remove()
    }
  }, [pathname])

  if (!host || !active) return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`overflow-hidden rounded-3xl border p-4 shadow-[0_18px_60px_rgba(88,28,135,0.28)] backdrop-blur-xl ${
        failed
          ? "border-red-400/35 bg-red-950/35"
          : completed
            ? "border-emerald-300/35 bg-emerald-950/30"
            : "border-violet-300/30 bg-[linear-gradient(135deg,rgba(76,29,149,0.32),rgba(8,20,42,0.92))]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full ${failed ? "bg-red-500/15" : completed ? "bg-emerald-400/15" : "bg-violet-500/15"}`}>
          {!failed && !completed && <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-cyan-300 border-t-violet-300" />}
          {failed ? <XCircle className="h-6 w-6 text-red-300" /> : completed ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : <Sparkles className="h-5 w-5 animate-pulse text-violet-200" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-black text-white">{title}</p>
            {!failed && !completed && <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-300">{progress.detail}</p>
        </div>
      </div>

      {!failed && !completed && (
        <div className="mt-4 grid gap-2 text-xs text-slate-300">
          {[
            ["thinking", "Analysing requirements"],
            ["generating", "Generating components and pages"],
            ["preparing", "Preparing live preview"],
            ["saving", "Saving project files"],
          ].map(([stage, label]) => {
            const order = ["thinking", "generating", "preparing", "saving"]
            const currentIndex = order.indexOf(progress.stage)
            const itemIndex = order.indexOf(stage)
            const done = itemIndex < currentIndex
            const current = itemIndex === currentIndex
            return (
              <div key={stage} className={`flex items-center gap-2 ${current ? "text-violet-100" : done ? "text-emerald-300" : "text-slate-500"}`}>
                <span className={`h-2 w-2 rounded-full ${current ? "animate-pulse bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.9)]" : done ? "bg-emerald-400" : "bg-slate-700"}`} />
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>,
    host
  )
}
