"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { FileText, Image as ImageIcon, Loader2, X } from "lucide-react"

type ReadyAttachment = {
  url: string
  mediaType: string
  name: string
}

type AttachmentItem = {
  id: string
  name: string
  mediaType: string
  previewUrl: string | null
  uploading: boolean
  error: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 8
const ATTACHMENT_MARKER_START = "[[786_ATTACHMENTS:"
const ATTACHMENT_MARKER_END = "]]"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Could not read the selected file."))
    reader.readAsDataURL(file)
  })
}

function normalizeClipboardFile(file: File): File {
  if (file.name && file.name !== "image.png") return file

  const extension = file.type === "image/jpeg"
    ? "jpg"
    : file.type === "image/webp"
      ? "webp"
      : file.type === "image/gif"
        ? "gif"
        : "png"

  return new File(
    [file],
    `pasted-screenshot-${Date.now()}.${extension}`,
    {
      type: file.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
      lastModified: Date.now(),
    }
  )
}

function encodeAttachments(attachments: ReadyAttachment[]): string {
  const json = JSON.stringify(attachments)
  const bytes = new TextEncoder().encode(json)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeAttachments(value: string): ReadyAttachment[] {
  try {
    const binary = atob(value)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) =>
      item &&
      typeof item.url === "string" &&
      typeof item.mediaType === "string"
    )
  } catch {
    return []
  }
}

function attachmentMarker(attachments: ReadyAttachment[]): string {
  return `${ATTACHMENT_MARKER_START}${encodeAttachments(attachments)}${ATTACHMENT_MARKER_END}`
}

function extractAttachmentMarker(content: string): {
  cleanContent: string
  attachments: ReadyAttachment[]
} {
  const start = content.indexOf(ATTACHMENT_MARKER_START)
  if (start < 0) return { cleanContent: content, attachments: [] }

  const payloadStart = start + ATTACHMENT_MARKER_START.length
  const end = content.indexOf(ATTACHMENT_MARKER_END, payloadStart)
  if (end < 0) return { cleanContent: content, attachments: [] }

  const encoded = content.slice(payloadStart, end)
  const cleanContent = `${content.slice(0, start)}${content.slice(end + ATTACHMENT_MARKER_END.length)}`.trimEnd()
  return { cleanContent, attachments: decodeAttachments(encoded) }
}

function renderAttachmentsIntoMessage(messageText: HTMLElement, attachments: ReadyAttachment[]) {
  const parent = messageText.parentElement
  if (!parent || attachments.length === 0) return

  const existing = parent.querySelector<HTMLElement>(":scope > [data-786-sent-attachments]")
  if (existing) existing.remove()

  const grid = document.createElement("div")
  grid.dataset["786SentAttachments"] = "true"
  grid.style.display = "flex"
  grid.style.flexWrap = "wrap"
  grid.style.gap = "8px"
  grid.style.marginTop = "12px"

  for (const attachment of attachments) {
    if (attachment.mediaType.startsWith("image/")) {
      const link = document.createElement("a")
      link.href = attachment.url
      link.target = "_blank"
      link.rel = "noreferrer"
      link.style.display = "block"

      const image = document.createElement("img")
      image.src = attachment.url
      image.alt = attachment.name || "Sent image"
      image.loading = "lazy"
      image.style.width = "112px"
      image.style.height = "88px"
      image.style.objectFit = "cover"
      image.style.borderRadius = "12px"
      image.style.border = "1px solid rgba(103,232,249,0.25)"
      image.style.background = "#0f172a"
      link.appendChild(image)
      grid.appendChild(link)
      continue
    }

    const link = document.createElement("a")
    link.href = attachment.url
    link.target = "_blank"
    link.rel = "noreferrer"
    link.textContent = attachment.name || "View PDF"
    link.style.display = "inline-flex"
    link.style.alignItems = "center"
    link.style.padding = "8px 10px"
    link.style.borderRadius = "10px"
    link.style.border = "1px solid rgba(248,113,113,0.3)"
    link.style.background = "rgba(248,113,113,0.1)"
    link.style.color = "#fecaca"
    link.style.fontSize = "11px"
    grid.appendChild(link)
  }

  messageText.insertAdjacentElement("afterend", grid)
}

export function AdminChatAttachmentBridge() {
  const pathname = usePathname()
  const active = pathname === "/786-admin/chat"
  const inputRef = useRef<HTMLInputElement | null>(null)
  const readyRef = useRef(new Map<string, ReadyAttachment>())
  const uploadPromisesRef = useRef(new Map<string, Promise<ReadyAttachment>>())
  const objectUrlsRef = useRef(new Map<string, string>())
  const pendingPersistenceRef = useRef<ReadyAttachment[]>([])
  const [composer, setComposer] = useState<HTMLElement | null>(null)
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])

  function removeAttachment(id: string) {
    readyRef.current.delete(id)
    uploadPromisesRef.current.delete(id)

    const objectUrl = objectUrlsRef.current.get(id)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrlsRef.current.delete(id)
    }

    setAttachments((current) => current.filter((item) => item.id !== id))
    if (inputRef.current) inputRef.current.value = ""
  }

  function clearAllAttachments() {
    for (const objectUrl of objectUrlsRef.current.values()) {
      URL.revokeObjectURL(objectUrl)
    }
    objectUrlsRef.current.clear()
    readyRef.current.clear()
    uploadPromisesRef.current.clear()
    setAttachments([])
    if (inputRef.current) inputRef.current.value = ""
  }

  function scanSavedMessages() {
    const messageTexts = document.querySelectorAll<HTMLElement>("p.whitespace-pre-wrap")
    for (const messageText of Array.from(messageTexts)) {
      const raw = messageText.textContent || ""
      if (!raw.includes(ATTACHMENT_MARKER_START)) continue

      const extracted = extractAttachmentMarker(raw)
      messageText.textContent = extracted.cleanContent
      renderAttachmentsIntoMessage(messageText, extracted.attachments)
    }
  }

  function renderSentAttachments(message: string, sent: ReadyAttachment[]) {
    requestAnimationFrame(() => {
      const messageTexts = Array.from(document.querySelectorAll<HTMLElement>("p.whitespace-pre-wrap"))
      const target = [...messageTexts].reverse().find((node) => (node.textContent || "").trim() === message.trim())
      if (target) renderAttachmentsIntoMessage(target, sent)
    })
  }

  async function uploadFile(file: File): Promise<ReadyAttachment> {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const payload = (await response.json()) as {
          url?: string
          contentType?: string
          name?: string
        }

        if (payload.url) {
          return {
            url: payload.url,
            mediaType: payload.contentType || file.type,
            name: payload.name || file.name,
          }
        }
      }
    } catch {
      // Fall through to a data URL when Blob upload is unavailable.
    }

    return {
      url: await fileToDataUrl(file),
      mediaType: file.type,
      name: file.name,
    }
  }

  function acceptFile(file: File) {
    const supported = file.type.startsWith("image/") || file.type === "application/pdf"
    if (!supported || file.size > MAX_FILE_SIZE || attachments.length >= MAX_ATTACHMENTS) return

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    if (previewUrl) objectUrlsRef.current.set(id, previewUrl)

    setAttachments((current) => [
      ...current,
      {
        id,
        name: file.name,
        mediaType: file.type,
        previewUrl,
        uploading: true,
        error: null,
      },
    ])

    const uploadPromise = uploadFile(file)
      .then((ready) => {
        readyRef.current.set(id, ready)
        setAttachments((current) =>
          current.map((item) => item.id === id ? { ...item, uploading: false, error: null } : item)
        )
        return ready
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Attachment upload failed."
        setAttachments((current) =>
          current.map((item) => item.id === id ? { ...item, uploading: false, error: message } : item)
        )
        throw error
      })

    uploadPromisesRef.current.set(id, uploadPromise)
  }

  function acceptFiles(files: File[]) {
    const remaining = Math.max(0, MAX_ATTACHMENTS - attachments.length)
    files.slice(0, remaining).forEach(acceptFile)
  }

  useEffect(() => {
    if (!active) return

    const locateComposer = () => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Ask 786.Chat to build a real project..."]'
      )
      if (!textarea) return

      const innerComposer = textarea.parentElement
      if (innerComposer instanceof HTMLElement) {
        innerComposer.style.position = "relative"
        setComposer(innerComposer)
      }

      const paperclip = innerComposer?.querySelector<SVGElement>(".lucide-paperclip")
      if (paperclip) {
        paperclip.style.cursor = "pointer"
        paperclip.style.pointerEvents = "auto"
      }
    }

    locateComposer()
    scanSavedMessages()
    const observer = new MutationObserver(() => {
      locateComposer()
      scanSavedMessages()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      setComposer(null)
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest(".lucide-paperclip")) return
      event.preventDefault()
      event.stopPropagation()
      inputRef.current?.click()
    }

    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target
      if (!(target instanceof HTMLTextAreaElement)) return
      if (target.placeholder !== "Ask 786.Chat to build a real project...") return

      const clipboard = event.clipboardData
      if (!clipboard) return

      const images: File[] = []
      for (const item of Array.from(clipboard.items || [])) {
        if (item.kind !== "file" || !item.type.startsWith("image/")) continue
        const pastedFile = item.getAsFile()
        if (pastedFile) images.push(normalizeClipboardFile(pastedFile))
      }

      if (images.length === 0) {
        for (const file of Array.from(clipboard.files || [])) {
          if (file.type.startsWith("image/")) images.push(normalizeClipboardFile(file))
        }
      }

      if (images.length === 0) return
      event.preventDefault()
      event.stopPropagation()
      acceptFiles(images)
    }

    document.addEventListener("click", handleClick, true)
    document.addEventListener("paste", handlePaste, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("paste", handlePaste, true)
    }
  }, [active, attachments.length])

  useEffect(() => {
    if (!active) return

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const method = String(init?.method || "GET").toUpperCase()
      const isAdminChatRequest = url.includes("/api/786-admin/chat") && method === "POST"
      const isProjectPersistRequest =
        method === "POST" || method === "PATCH"
          ? /\/api\/786-admin\/projects(?:\/[^/?]+)?(?:\?|$)/.test(url)
          : false

      if (isAdminChatRequest) {
        let nextInit = init

        try {
          const bodyText = typeof init?.body === "string" ? init.body : ""
          const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : {}
          const orderedIds = attachments.map((item) => item.id)
          const readyAttachments = await Promise.all(
            orderedIds.map(async (id) => {
              const pending = uploadPromisesRef.current.get(id)
              if (pending) return pending
              const ready = readyRef.current.get(id)
              if (!ready) throw new Error("An attachment is not ready yet.")
              return ready
            })
          )

          if (readyAttachments.length > 0) {
            body.attachments = readyAttachments
            nextInit = { ...init, body: JSON.stringify(body) }
            pendingPersistenceRef.current = readyAttachments
            renderSentAttachments(String(body.message || ""), readyAttachments)
            clearAllAttachments()
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Attachments could not be prepared."
          return new Response(JSON.stringify({ success: false, error: message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        return originalFetch(input, nextInit)
      }

      if (isProjectPersistRequest && pendingPersistenceRef.current.length > 0 && typeof init?.body === "string") {
        try {
          const body = JSON.parse(init.body) as Record<string, unknown>
          const messages = Array.isArray(body.messages) ? body.messages as Array<Record<string, unknown>> : []
          const userMessage = messages.find((message) => message.role === "user" && typeof message.content === "string")

          if (userMessage) {
            userMessage.content = `${String(userMessage.content)}\n${attachmentMarker(pendingPersistenceRef.current)}`
            pendingPersistenceRef.current = []
            return originalFetch(input, { ...init, body: JSON.stringify(body) })
          }
        } catch {
          // Preserve the original persistence request if the body cannot be parsed.
        }
      }

      return originalFetch(input, init)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [active, attachments])

  useEffect(() => () => {
    for (const objectUrl of objectUrlsRef.current.values()) URL.revokeObjectURL(objectUrl)
  }, [])

  if (!active) return null

  const preview = attachments.length > 0 && composer
    ? createPortal(
        <div className="absolute bottom-full left-0 right-0 z-[120] mb-3 rounded-2xl border border-cyan-300/25 bg-[#101827] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-100">
              {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
            </span>
            <button type="button" onClick={clearAllAttachments} className="text-[11px] text-slate-400 hover:text-white">
              Remove all
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {attachments.map((item) => (
              <div key={item.id} className="relative w-24 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.name} className="h-16 w-full rounded-lg object-cover" />
                ) : item.mediaType === "application/pdf" ? (
                  <div className="grid h-16 place-items-center rounded-lg bg-red-500/15 text-red-200">
                    <FileText className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="grid h-16 place-items-center rounded-lg bg-cyan-500/15 text-cyan-200">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-3.5 w-3" />
                </button>

                <p className="mt-1 truncate text-[10px] text-slate-300">{item.name}</p>
                <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                  {item.uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{item.error || (item.uploading ? "Preparing" : "Ready")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>,
        composer
      )
    : null

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(event) => acceptFiles(Array.from(event.target.files || []))}
      />
      {preview}
    </>
  )
}
