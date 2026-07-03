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

type AttachmentState = {
  name: string
  mediaType: string
  previewUrl: string | null
  uploading: boolean
  error: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

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

export function AdminChatAttachmentBridge() {
  const pathname = usePathname()
  const active = pathname === "/786-admin/chat"
  const inputRef = useRef<HTMLInputElement | null>(null)
  const attachmentRef = useRef<ReadyAttachment | null>(null)
  const uploadPromiseRef = useRef<Promise<ReadyAttachment> | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [composer, setComposer] = useState<HTMLElement | null>(null)
  const [attachment, setAttachment] = useState<AttachmentState | null>(null)

  function clearAttachment() {
    attachmentRef.current = null
    uploadPromiseRef.current = null
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    if (inputRef.current) inputRef.current.value = ""
    setAttachment(null)
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
      // Fall through to a data URL so image/file input still works without Blob storage.
    }

    const dataUrl = await fileToDataUrl(file)
    return {
      url: dataUrl,
      mediaType: file.type,
      name: file.name,
    }
  }

  function acceptFile(file: File) {
    const supported = file.type.startsWith("image/") || file.type === "application/pdf"
    if (!supported) {
      setAttachment({
        name: file.name,
        mediaType: file.type,
        previewUrl: null,
        uploading: false,
        error: "Only images and PDF files are supported.",
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachment({
        name: file.name,
        mediaType: file.type,
        previewUrl: null,
        uploading: false,
        error: "File is too large. Maximum size is 10 MB.",
      })
      return
    }

    clearAttachment()

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    objectUrlRef.current = previewUrl
    setAttachment({
      name: file.name,
      mediaType: file.type,
      previewUrl,
      uploading: true,
      error: null,
    })

    const uploadPromise = uploadFile(file)
      .then((ready) => {
        attachmentRef.current = ready
        setAttachment((current) =>
          current
            ? { ...current, uploading: false, error: null }
            : current
        )
        return ready
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Attachment upload failed."
        setAttachment((current) =>
          current
            ? { ...current, uploading: false, error: message }
            : current
        )
        throw error
      })

    uploadPromiseRef.current = uploadPromise
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
    const observer = new MutationObserver(locateComposer)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener("resize", locateComposer)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", locateComposer)
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

      let image: File | null = null

      for (const item of Array.from(clipboard.items || [])) {
        if (item.kind !== "file" || !item.type.startsWith("image/")) continue
        const pastedFile = item.getAsFile()
        if (pastedFile) {
          image = pastedFile
          break
        }
      }

      if (!image) {
        image = Array.from(clipboard.files || []).find((file) => file.type.startsWith("image/")) || null
      }

      if (!image) return

      event.preventDefault()
      event.stopPropagation()
      acceptFile(normalizeClipboardFile(image))
    }

    document.addEventListener("click", handleClick, true)
    document.addEventListener("paste", handlePaste, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("paste", handlePaste, true)
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
      const isAdminChatRequest = url.includes("/api/786-admin/chat") && String(init?.method || "GET").toUpperCase() === "POST"

      if (!isAdminChatRequest) {
        return originalFetch(input, init)
      }

      let nextInit = init

      try {
        const bodyText = typeof init?.body === "string" ? init.body : ""
        const body = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : {}
        const ready = uploadPromiseRef.current
          ? await uploadPromiseRef.current
          : attachmentRef.current

        if (ready) {
          body.attachment = ready
          nextInit = {
            ...init,
            body: JSON.stringify(body),
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Attachment could not be prepared."
        setAttachment((current) => current ? { ...current, uploading: false, error: message } : current)
        return new Response(JSON.stringify({ success: false, error: message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      const response = await originalFetch(input, nextInit)
      if (response.ok && attachmentRef.current) {
        queueMicrotask(clearAttachment)
      }
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [active])

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  if (!active) return null

  const preview = attachment && composer
    ? createPortal(
        <div className="absolute bottom-full left-0 right-0 z-[120] mb-3 rounded-2xl border border-cyan-300/25 bg-[#101827] p-3 shadow-2xl">
          <div className="flex items-center gap-3">
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.name}
                className="h-16 w-20 rounded-xl object-cover"
              />
            ) : attachment.mediaType === "application/pdf" ? (
              <div className="grid h-16 w-20 place-items-center rounded-xl bg-red-500/15 text-red-200">
                <FileText className="h-7 w-7" />
              </div>
            ) : (
              <div className="grid h-16 w-20 place-items-center rounded-xl bg-cyan-500/15 text-cyan-200">
                <ImageIcon className="h-7 w-7" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{attachment.name}</p>
              <p className={`mt-1 text-[11px] ${attachment.error ? "text-red-300" : "text-slate-400"}`}>
                {attachment.error || (attachment.uploading ? "Preparing attachment for Gemini…" : "Ready — add your instruction and send")}
              </p>
            </div>

            {attachment.uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
            ) : (
              <button
                type="button"
                onClick={clearAttachment}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) acceptFile(file)
        }}
      />
      {preview}
    </>
  )
}
