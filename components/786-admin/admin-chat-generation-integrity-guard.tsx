"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminChatPreviewDocumentGuard } from "@/components/786-admin/admin-chat-preview-document-guard"

const FULL_REGEN_RE = /\b(?:regenerate|rebuild|redesign|replace|start over|from scratch)\b[\s\S]{0,80}\b(?:completely|entire|all files|from scratch|clean)\b|\b(?:full|complete)\s+(?:regeneration|redesign|rebuild)\b/i
const CONTAMINATION_RE = /\/786-admin\/|SevenEightSixAdminChatPage|PremiumAdminBackground|Ask 786\.Chat|New Chat[\s\S]{0,200}(?:Preview|Publish)|admin-chat-/i
const GENERIC_COPY_RE = /AI Generated Project|Top-tier digital craftsmanship|Enter the experience|Analytics[\s\S]{0,120}Automation[\s\S]{0,120}Team Workspace[\s\S]{0,120}Integrations/i

type GeneratedSnapshot = {
  title?: string
  description?: string
  files?: Record<string, string>
}

function extractProjectName(message: string): string {
  const patterns = [
    /(?:called|named)\s+[“"]?([^\n.!?,"”]{2,60})/i,
    /(?:preserve|keep)\s+(?:the\s+)?([A-Z][A-Za-z0-9 &'-]{1,50})\s+name/i,
    /(?:regenerate|rebuild|redesign|replace)\s+(?:this\s+)?([A-Z][A-Za-z0-9 &'-]{1,50}?)\s+project\b/i,
  ]
  for (const pattern of patterns) {
    const match = message.match(pattern)?.[1]?.trim()
    if (match) return match
  }
  return ""
}

function projectText(value: unknown): string {
  if (!value || typeof value !== "object") return ""
  const raw = value as { title?: unknown; description?: unknown; files?: unknown }
  const files = raw.files && typeof raw.files === "object" ? Object.values(raw.files as Record<string, unknown>).join("\n") : ""
  return `${String(raw.title || "")}\n${String(raw.description || "")}\n${files}`
}

function violatesIntent(message: string, project: unknown): boolean {
  const text = projectText(project)
  if (!text || CONTAMINATION_RE.test(text) || GENERIC_COPY_RE.test(text)) return true
  const lower = message.toLowerCase()
  if (/aviation|private jet|aircraft|crown air/.test(lower)) {
    if (/\b(?:analytics|automation|team workspace|integrations)\b/i.test(text)) return true
    if (!/\b(?:fleet|aircraft|destinations?|membership|concierge|enquiry|crown air)\b/i.test(text)) return true
  }
  if (/children|academy|learning|student|school/.test(lower) && /\b(?:fleet|private jet|concierge)\b/i.test(text)) return true
  return false
}

function cleanRegenerationBody(body: Record<string, unknown>): Record<string, unknown> {
  const original = String(body.message || "").trim()
  const name = extractProjectName(original)
  const prefix = name ? `Create a complete customer website called ${name}.\n\n` : "Create a complete customer website from the following requirements.\n\n"
  return {
    ...body,
    message: `${prefix}${original}\n\nMANDATORY CLEAN REGENERATION:\n- Replace every previous project file. Do not preserve or imitate the old project.\n- Generate customer-facing website code only. Never include 786.Chat, admin, chat, editor, dashboard-builder or project-management UI.\n- Use only industry-specific navigation and copy requested by the user.\n- Do not invent Analytics, Automation, Team Workspace or Integrations unless explicitly requested.\n- Do not use generic template slogans or placeholder sections.\n- All navigation must remain inside this customer project.\n- Return a complete app/page.tsx and app/globals.css that directly satisfy the prompt.`,
    existing: undefined,
    designSeed: `clean-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    __integrityRetry: Boolean(body.__integrityRetry),
  }
}

function parseBody(init?: RequestInit): Record<string, unknown> | null {
  if (typeof init?.body !== "string") return null
  try { return JSON.parse(init.body) as Record<string, unknown> } catch { return null }
}

function sameGeneratedSnapshot(
  pending: GeneratedSnapshot | null,
  files: Record<string, unknown>,
): boolean {
  if (!pending?.files || !files) return false
  const pendingPaths = Object.keys(pending.files).sort()
  const savedPaths = Object.keys(files).sort()
  if (pendingPaths.length === 0 || pendingPaths.length !== savedPaths.length) return false
  return pendingPaths.every((path, index) => path === savedPaths[index])
}

export function AdminChatGenerationIntegrityGuard() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/786-admin/chat") return
    const originalFetch = window.fetch.bind(window)
    let pendingGenerated: GeneratedSnapshot | null = null

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      const method = String(init?.method || "GET").toUpperCase()
      const body = parseBody(init)

      const isChatRequest = url.includes("/api/786-admin/chat") && method === "POST"
      if (isChatRequest && body) {
        // Never let a result from an earlier request affect a later manual save.
        pendingGenerated = null
        const message = String(body.message || "")
        let response: Response

        if (FULL_REGEN_RE.test(message)) {
          const cleaned = cleanRegenerationBody(body)
          response = await originalFetch(input, { ...init, body: JSON.stringify(cleaned) })
          let json: any
          try { json = await response.clone().json() } catch { return response }

          if (response.ok && json?.success && violatesIntent(message, json.project) && !body.__integrityRetry) {
            const retryBody = cleanRegenerationBody({
              ...body,
              __integrityRetry: true,
              message: `${message}\n\nThe previous generated result was rejected because it contained unrelated or generic content. Rebuild it now with exact industry-specific sections and no reused files.`,
            })
            const retry = await originalFetch(input, { ...init, body: JSON.stringify(retryBody) })
            try {
              const retryJson = await retry.clone().json()
              if (retry.ok && retryJson?.success && !violatesIntent(message, retryJson.project)) {
                pendingGenerated = retryJson.project as GeneratedSnapshot
                return retry
              }
            } catch {}
          }

          if (!response.ok || !json?.success || violatesIntent(message, json.project)) {
            return new Response(JSON.stringify({ success: false, error: "Generated result was rejected because it did not follow your project instructions. The incorrect files were not saved." }), {
              status: 422,
              headers: { "Content-Type": "application/json" },
            })
          }
          pendingGenerated = json.project as GeneratedSnapshot
          return response
        }

        response = await originalFetch(input, init)
        try {
          const json = await response.clone().json()
          if (response.ok && json?.success && json?.project) pendingGenerated = json.project as GeneratedSnapshot
        } catch {}
        return response
      }

      const isProjectSave = /\/api\/786-admin\/projects\/[^/?#]+/.test(url) && method === "PATCH"
      if (isProjectSave && body && body.files && typeof body.files === "object") {
        const files = body.files as Record<string, unknown>

        // Only the complete file set returned by the immediately preceding AI
        // generation may replace the project snapshot. Manual code edits and
        // other partial file updates must remain merge operations.
        if (pendingGenerated && sameGeneratedSnapshot(pendingGenerated, files)) {
          const nextBody: Record<string, unknown> = {
            ...body,
            replace_files: true,
            revision_source: "ai-generation",
            revision_label: "Before replacing generated project snapshot",
          }
          if (pendingGenerated.title) nextBody.title = pendingGenerated.title
          if (pendingGenerated.description) nextBody.description = pendingGenerated.description

          const response = await originalFetch(input, { ...init, body: JSON.stringify(nextBody) })
          if (response.ok) pendingGenerated = null
          return response
        }

        return originalFetch(input, init)
      }

      return originalFetch(input, init)
    }

    return () => { window.fetch = originalFetch }
  }, [pathname])

  return <AdminChatPreviewDocumentGuard />
}
