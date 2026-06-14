"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import {
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  StopCircle,
  Zap,
  ArrowUp,
  ImagePlus,
  Paperclip,
  FileText,
  X,
  Eye,
  Code,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UpgradePopup } from "@/components/upgrade-popup"
import { ToolActivity, type ToolPart } from "@/components/workspace/tool-activity"

interface UsageData {
  used: number
  limit: number
  plan: string
  balance?: number
  freeMessagesRemaining?: number
  canSend?: boolean
  unlimited?: boolean
}

interface ChatPanelProps {
  onPreviewUpdate?: (html: string) => void
  viewMode?: "preview" | "code"
  onViewModeChange?: (mode: "preview" | "code") => void
}

interface AttachedFile {
  id: string
  file: File
  type: "image" | "pdf"
  preview?: string
  uploading?: boolean
  url?: string
}

// Helper to extract text from UIMessage parts
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

// Helper to extract tool-call parts (file edits, searches, etc.) from a message
function getToolParts(message: { parts?: Array<{ type: string }> }): ToolPart[] {
  if (!message.parts || !Array.isArray(message.parts)) return []
  return message.parts.filter((p): p is ToolPart =>
    typeof p.type === "string" && p.type.startsWith("tool-")
  )
}

// Helper to extract file parts from a message (images, PDFs, GIFs)
function getFileParts(message: { parts?: Array<{ type: string; url?: string; mediaType?: string }> }): Array<{ type: "file"; url: string; mediaType: string }> {
  if (!message.parts || !Array.isArray(message.parts)) return []
  return message.parts.filter((p): p is { type: "file"; url: string; mediaType: string } =>
    p.type === "file" && typeof p.url === "string"
  )
}

const suggestedPrompts = [
  "Explain quantum computing simply",
  "Write a Python sort function",
  "Help me write a professional email",
  "React best practices for 2025",
]

// Extract code blocks from AI text and build a sandboxed HTML preview
function buildPreviewHtml(text: string): string | null {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  const blocks: { lang: string; code: string }[] = []
  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({ lang: (match[1] || "").toLowerCase(), code: match[2].trim() })
  }
  if (blocks.length === 0) return null

  const htmlBlock = blocks.find(b => b.lang === "html" || b.lang === "htm")
  const cssBlock = blocks.find(b => b.lang === "css")
  const jsBlock = blocks.find(b => b.lang === "javascript" || b.lang === "js" || b.lang === "typescript" || b.lang === "ts")

  if (htmlBlock && htmlBlock.code.includes("<html")) {
    return htmlBlock.code
  }

  if (htmlBlock) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #fff; color: #111; }
${cssBlock ? cssBlock.code : ""}
</style>
</head>
<body>
${htmlBlock.code}
${jsBlock ? `<script>${jsBlock.code}<\/script>` : ""}
</body>
</html>`
  }

  if (cssBlock || jsBlock) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #fff; color: #111; }
${cssBlock ? cssBlock.code : ""}
</style>
</head>
<body>
<div id="app"></div>
${jsBlock ? `<script>${jsBlock.code}<\/script>` : ""}
</body>
</html>`
  }

  const reactBlock = blocks.find(b => ["jsx", "tsx", "react"].includes(b.lang))
  if (reactBlock) {
    const escaped = reactBlock.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d1117; color: #e6edf3; padding: 24px; margin: 0; }
pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.6; }
h3 { color: #58a6ff; font-family: -apple-system, sans-serif; margin-bottom: 16px; font-size: 14px; font-weight: 500; border-bottom: 1px solid #21262d; padding-bottom: 8px; }
</style>
</head>
<body>
<h3>Component Preview</h3>
<pre>${escaped}</pre>
</body>
</html>`
  }

  const firstBlock = blocks[0]
  const escaped = firstBlock.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
body { font-family: 'SF Mono', 'Fira Code', monospace; background: #0d1117; color: #e6edf3; padding: 24px; margin: 0; }
pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.6; }
h3 { color: #58a6ff; font-family: -apple-system, sans-serif; margin-bottom: 16px; font-size: 14px; font-weight: 500; border-bottom: 1px solid #21262d; padding-bottom: 8px; }
</style>
</head>
<body>
<h3>${firstBlock.lang || "Code"} Preview</h3>
<pre>${escaped}</pre>
</body>
</html>`
}

export function WorkspaceChatPanel({ onPreviewUpdate, viewMode, onViewModeChange }: ChatPanelProps) {
  const { user } = useAuth()
  const isOwnerAdmin = user?.email?.toLowerCase() === "mujeeb@job4u.com"
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const [input, setInput] = useState("")

const {
  messages,
  sendMessage,
  status,
  stop,
  reload,
  error,
} = useChat({
    api: "/api/chat",
    body: {
      usage: usage ? { used: usage.used, limit: usage.limit, plan: usage.plan } : undefined,
      files: attachedFiles.filter(f => f.url).map(f => ({ url: f.url!, type: f.type })),
    },
    onError: (err) => {
      console.error("Chat error:", err)
    },
  })
const isLoading = status === "streaming" || status === "submitted"
// Fetch usage on mount
useEffect(() => {
  fetch("/api/usage")
    .then((res) => res.json())
    .then((data) => {
      setUsage(data)
      window.dispatchEvent(new Event("chat-updated"))
    })
    .catch(() => {})
}, [])

  // Refresh usage after each message
  useEffect(() => {
    if (messages.length > 0) {
      fetch("/api/usage")
        .then((res) => res.json())
       .then((data) => {
  setUsage(data)
  window.dispatchEvent(new Event("chat-updated"))
})
        .catch(() => {})
    }
  }, [messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [input])

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current
    if (!container) return
    const threshold = 100
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    setShowScrollButton(!atBottom)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

if (!isOwnerAdmin && usage?.canSend === false && !isLoading) {
  setShowUpgrade(true)
  return
}

  const uploadedFiles = attachedFiles.filter((f) => f.url && !f.uploading)
  const messageText = input.trim() || "Please analyze the attached file."

  sendMessage({
    parts: [
      { type: "text", text: messageText },
      ...uploadedFiles.map((f) => ({
        type: "file" as const,
        url: f.url!,
        mediaType: f.file.type,
      })),
    ],
  } as any)

  setInput("")
  setAttachedFiles([])
}
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf") => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const id = Math.random().toString(36).substring(7)
      const newFile: AttachedFile = {
        id,
        file,
        type,
        uploading: true,
      }

      if (type === "image") {
        newFile.preview = URL.createObjectURL(file)
      }

      setAttachedFiles(prev => [...prev, newFile])

      // Upload the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.url) {
          setAttachedFiles(prev =>
            prev.map(f => f.id === id ? { ...f, url: data.url, uploading: false } : f)
          )
        } else {
          // If upload fails, try using base64 data URL as fallback
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            setAttachedFiles(prev =>
              prev.map(f => f.id === id ? { ...f, url: dataUrl, uploading: false } : f)
            )
          }
          reader.readAsDataURL(file)
        }
      } catch {
        // On network error, try base64 fallback
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setAttachedFiles(prev =>
            prev.map(f => f.id === id ? { ...f, url: dataUrl, uploading: false } : f)
          )
        }
        reader.readAsDataURL(file)
      }
    }

    // Reset input
    e.target.value = ""
  }

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id))
  }
const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length === 0) return

    // Process each pasted image like a file select
    for (const file of imageFiles) {
      const id = Math.random().toString(36).substring(7)
      const newFile: AttachedFile = {
        id,
        file,
        type: "image",
        preview: URL.createObjectURL(file),
        uploading: true,
      }

      setAttachedFiles(prev => [...prev, newFile])

  
      // Upload the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (data.url) {
          setAttachedFiles(prev =>
            prev.map(f => f.id === id ? { ...f, url: data.url, uploading: false } : f)
          )
        } else {
          // Fallback to base64
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string
            setAttachedFiles(prev =>
              prev.map(f => f.id === id ? { ...f, url: dataUrl, uploading: false } : f)
            )
          }
          reader.readAsDataURL(file)
        }
      } catch {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setAttachedFiles(prev =>
            prev.map(f => f.id === id ? { ...f, url: dataUrl, uploading: false } : f)
          )
        }
        reader.readAsDataURL(file)
      }
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestedPrompt = (prompt: string) => {
    // Set the input and submit
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set
    nativeInputValueSetter?.call(textareaRef.current, prompt)
    textareaRef.current?.dispatchEvent(new Event("input", { bubbles: true }))
    // Submit after a small delay
    setTimeout(() => {
      textareaRef.current?.form?.requestSubmit()
    }, 50)
  }

  // Send preview updates when new assistant messages arrive
  useEffect(() => {
    if (!onPreviewUpdate) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === "assistant") {
      const text = getMessageText(lastMsg)
      const html = buildPreviewHtml(text)
if (html) {
  localStorage.setItem("mujeebproai_last_preview_html", html)
  onPreviewUpdate(html)
}
    }
    }, [messages, onPreviewUpdate])

  useEffect(() => {
    if (!onPreviewUpdate) return

    const savedPreview = localStorage.getItem("mujeebproai_last_preview_html")
    if (savedPreview) {
      onPreviewUpdate(savedPreview)
    }

    const handleNewChat = () => {
      localStorage.removeItem("mujeebproai_last_preview_html")
      onPreviewUpdate("")
    }

    window.addEventListener("new-chat", handleNewChat)
    return () => window.removeEventListener("new-chat", handleNewChat)
  }, [onPreviewUpdate])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Messages area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="mb-8">
                <MujeebProAILogo className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome to Mujeeb Pro AI
                </h1>
                <p className="text-gray-400 text-lg">
                  How can I help you today?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="p-3 text-left text-sm text-gray-300 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 max-w-md text-center">
                <p className="text-red-400 text-sm mb-3">
                  Something went wrong. Please try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reload()}
                  className="border-red-800/30 text-red-400 hover:bg-red-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const text = getMessageText(message)
              const toolParts = getToolParts(message)
              const fileParts = getFileParts(message)
              const isUser = message.role === "user"
              const isAssistant = message.role === "assistant"

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-3",
                    isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Avatar */}
                  {isAssistant && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <div className={cn(
                    "max-w-[85%] space-y-2",
                    isUser && "order-1"
                  )}>
                    {/* File parts (images, PDFs) */}
                    {fileParts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {fileParts.map((fp, idx) => (
                          fp.mediaType.startsWith("image/") ? (
                            <img
                              key={idx}
                              src={fp.url}
                              alt="Attached image"
                              className="max-w-[200px] rounded-lg border border-gray-700/50"
                            />
                          ) : (
                            <div key={idx} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700/50">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span className="text-xs text-gray-400">Attached file</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {/* Text content */}
                    {text && (
                      <div className={cn(
                        "rounded-2xl px-4 py-3",
                        isUser
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "bg-gray-800/50 border border-gray-700/30 text-gray-100"
                      )}>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Tool activity */}
                    {toolParts.length > 0 && (
                      <ToolActivity parts={toolParts} />
                    )}

                    {/* Action buttons for assistant messages */}
                    {isAssistant && text && (
                      <div className="flex items-center gap-2 px-2">
                        <button
                          onClick={() => handleCopy(text, message.id)}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Copy"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => reload()}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {onPreviewUpdate && text && buildPreviewHtml(text) && (
                          <button
                            onClick={() => onPreviewUpdate(buildPreviewHtml(text)!)}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/30 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all shadow-lg"
          >
            <ArrowUp className="w-5 h-5 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-gray-800/80 rounded-lg px-3 py-2 border border-gray-700/50"
                >
                  {file.type === "image" && file.preview ? (
                    <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-xs text-gray-400 truncate max-w-[100px]">
                    {file.file.name}
                  </span>
                  {file.uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  ) : (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
               onPaste={handlePaste}
                placeholder="Ask me anything... (Ctrl+V to paste images)"
                rows={1}
               className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-16 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none scrollbar-thin"
                disabled={isLoading}
              />
              <div className="absolute left-2 bottom-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Attach image"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, "image")}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e, "pdf")}
            />

            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
              className={cn(
                "rounded-xl px-4 py-3 h-auto",
                "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500",
                "text-white font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              {isLoading ? (
                <StopCircle className="w-5 h-5" onClick={stop} />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </Button>
          </form>

          {/* Usage info */}
          {usage && (
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-400" />
               <span className="text-xs text-gray-500">
  {isOwnerAdmin || usage?.unlimited ? (
    "Unlimited"
  ) : (
    `Used: ${usage?.used ?? 0}/${usage?.limit ?? 10} • Remaining: ${
      usage?.freeMessagesRemaining ??
      Math.max((usage?.limit ?? 10) - (usage?.used ?? 0), 0)
    }`
  )}
</span>
              </div>
              {!isOwnerAdmin && !usage.unlimited && usage.used >= usage.limit && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade popup - FIXED: Using onOpenChange instead of onClose */}
      <UpgradePopup
        open={showUpgrade}
        onOpenChange={(open) => setShowUpgrade(open)}
      />
    </div>
  )
}
