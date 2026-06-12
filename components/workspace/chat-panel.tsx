"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
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

export function WorkspaceChatPanel({ onPreviewUpdate, viewMode = "preview", onViewModeChange }: ChatPanelProps) {
  const { user } = useAuth()
  const isOwnerAdmin = user?.email?.toLowerCase() === "mujeeb@job4u.com"
  const [input, setInput] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [noCreditsError, setNoCreditsError] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  
  // Refs to avoid dependency array changes
  const sendMessageRef = useRef<typeof sendMessage | null>(null)
  const usageRef = useRef<UsageData | null>(null)
  const setMessagesRef = useRef<typeof setMessages | null>(null)

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    })
  )

  useEffect(() => {
    transport.current = new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    })
  }, [currentChatId])

  const { messages, sendMessage, status, setMessages, stop, error } = useChat({
    transport: transport.current,
    onError: (err) => {
      const errorMsg = err.message || ""
      if (
        errorMsg.includes("NO_CREDITS") ||
        errorMsg.includes("402") ||
        errorMsg.includes("PAYMENT_FAILED") ||
        errorMsg.includes("SUBSCRIPTION_PAUSED")
      ) {
        setNoCreditsError(true)
        setShowUpgradePopup(true)
      }
    },
    onFinish: () => {
      fetchUsage()
      window.dispatchEvent(new CustomEvent("chat-updated"))
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Keep refs updated
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])
  
  useEffect(() => {
    usageRef.current = usage
  }, [usage])
  
  useEffect(() => {
    setMessagesRef.current = setMessages
  }, [setMessages])

  const fetchUsage = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch("/api/chat", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        if (data.usage) {
          // Get balance data from the response
         const freeRemaining = isOwnerAdmin
  ? 999999999
  : Math.min(data.usage.monthly?.remaining ?? data.usage.freeMessagesRemaining ?? 10, 10)
          const balance = data.usage.balance ?? 0
          
          const usageData: UsageData = {
            used: data.usage.monthly?.used ?? data.usage.used ?? 0,
            limit: data.usage.monthly?.limit ?? data.usage.limit ?? 100,
            plan: data.usage.plan || "starter",
            balance: balance,
            freeMessagesRemaining: freeRemaining,
            // User can send if they have free messages OR have balance
            unlimited: data.usage.unlimited || isOwnerAdmin,
canSend: data.usage.unlimited || isOwnerAdmin || freeRemaining > 0 || balance > 0.001
          }
          setUsage(usageData)
          // Only show error if they truly cannot send (no free messages AND no balance)
         setNoCreditsError(!data.usage.unlimited && !isOwnerAdmin && freeRemaining <= 0 && balance < 0.001)
        }
      }
    } catch {
      // Silently ignore
    }
  }, [user])

  useEffect(() => {
    if (user) fetchUsage()
  }, [user, fetchUsage])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Detect code in the latest AI message and send to preview panel
  useEffect(() => {
    if (!onPreviewUpdate || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "assistant") return
    const text = getMessageText(lastMsg)
    if (!text) return
    const html = buildPreviewHtml(text)
    if (html) {
      onPreviewUpdate(html)
    }
  }, [messages, onPreviewUpdate])

  // After the AI finishes editing a file, point the preview at the live site
  // so the admin can watch the deployed change appear.
  const lastDeployedMsgId = useRef<string | null>(null)
  useEffect(() => {
    if (isLoading || messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "assistant") return
    if (lastDeployedMsgId.current === lastMsg.id) return

    const toolParts = getToolParts(lastMsg)
    const didEdit = toolParts.some(
      (p) =>
        (p.type === "tool-write_file" || p.type === "tool-delete_file") &&
        p.state === "output-available" &&
        p.output?.success !== false
    )
    if (didEdit) {
      lastDeployedMsgId.current = lastMsg.id
      // Vercel needs ~1-2 min to build & deploy the change. Show the site now,
      // then refresh with a cache-buster once the new deploy should be live so
      // the admin actually sees the updated version, not the old cached one.
      window.dispatchEvent(
        new CustomEvent("top-bar-preview-url", {
          detail: { url: "https://mujeebproai.com" },
        })
      )
      const t1 = setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("top-bar-preview-url", {
            detail: { url: `https://mujeebproai.com?v=${Date.now()}` },
          })
        )
      }, 90000)
      return () => clearTimeout(t1)
    }
  }, [messages, isLoading])

  // Listen for sidebar events - use refs to avoid dependency array issues with hot reload
  useEffect(() => {
    const handleNewChat = () => {
      setCurrentChatId(null)
      if (setMessagesRef.current) setMessagesRef.current([])
      setNoCreditsError(false)
      setInput("")
      setAttachedFiles([])
      textareaRef.current?.focus()
    }

    const handleLoadChat = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.chatId) return
      try {
        const response = await fetch(`/api/chat?chatId=${detail.chatId}`, { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setCurrentChatId(detail.chatId)
          const uiMessages = (data.messages || []).map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          }))
          if (setMessagesRef.current) setMessagesRef.current(uiMessages)
        }
      } catch (err) {
        console.error("Failed to load chat:", err)
      }
    }

    const handleChatSelected = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.chatId) {
        setCurrentChatId(detail.chatId)
      }
    }

    window.addEventListener("new-chat", handleNewChat)
    window.addEventListener("load-chat", handleLoadChat)
    window.addEventListener("chat-selected", handleChatSelected)
    
    // Listen for top bar messages - use refs to avoid stale closures
    const handleTopBarMessage = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.message && sendMessageRef.current) {
        // Check if user can send using ref
        const currentUsage = usageRef.current
        const canSend = currentUsage?.canSend ?? (currentUsage ? (currentUsage.limit - currentUsage.used > 0 || (currentUsage.balance ?? 0) > 0.001) : true)
 if (!isOwnerAdmin && !canSend) {
  setShowUpgradePopup(true)
  return
}
        sendMessageRef.current({ text: detail.message })
      }
    }
    window.addEventListener("top-bar-message", handleTopBarMessage)
    
    return () => {
      window.removeEventListener("new-chat", handleNewChat)
      window.removeEventListener("load-chat", handleLoadChat)
      window.removeEventListener("chat-selected", handleChatSelected)
      window.removeEventListener("top-bar-message", handleTopBarMessage)
    }
  }, []) // Empty dependency array - using refs instead

  useEffect(() => {
    if (messages.length > 0 && !currentChatId) {
      // The chat ID is set via the chat-selected event from the response header
    }
  }, [messages, currentChatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [input])

  // Handle view mode change - just call the prop callback
  const handleViewModeChange = (mode: "preview" | "code") => {
    onViewModeChange?.(mode)
  }

  // Upload file to blob storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Upload failed")
      
      const data = await response.json()
      return data.url || data.pathname
    } catch (error) {
      console.error("Upload error:", error)
      return null
    }
  }

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      
      const id = Math.random().toString(36).substring(7)
      const preview = URL.createObjectURL(file)
      
      setAttachedFiles(prev => [...prev, { id, file, type: "image", preview, uploading: true }])
      
      const url = await uploadFile(file)
      
      setAttachedFiles(prev => 
        prev.map(f => f.id === id ? { ...f, uploading: false, url: url || undefined } : f)
      )
    }
    
    e.target.value = ""
  }

  // Handle PDF selection
  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") continue
      
      const id = Math.random().toString(36).substring(7)
      
      setAttachedFiles(prev => [...prev, { id, file, type: "pdf", uploading: true }])
      
      const url = await uploadFile(file)
      
      setAttachedFiles(prev => 
        prev.map(f => f.id === id ? { ...f, uploading: false, url: url || undefined } : f)
      )
    }
    
    e.target.value = ""
  }

  // Handle paste event for images
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue
        
        const id = Math.random().toString(36).substring(7)
        const preview = URL.createObjectURL(file)
        
        setAttachedFiles(prev => [...prev, { id, file, type: "image", preview, uploading: true }])
        
        const url = await uploadFile(file)
        
        setAttachedFiles(prev => 
          prev.map(f => f.id === id ? { ...f, uploading: false, url: url || undefined } : f)
        )
      }
    }
  }

  // Remove attached file
  const removeFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) URL.revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return
    
    // Check if user can send: has free messages OR has balance
    const canSend = usage?.canSend ?? (usage ? (usage.limit - usage.used > 0 || (usage.balance ?? 0) > 0.001) : true)
    
    if (!canSend) {
      setShowUpgradePopup(true)
      return
    }
    setNoCreditsError(false)
    
    // Build message with file descriptions
    let messageText = input.trim()
    
    if (attachedFiles.length > 0) {
      const fileDescriptions = attachedFiles.map(f => {
        if (f.type === "image") {
          return `[Attached Image: ${f.file.name}${f.url ? ` - ${f.url}` : ""}]`
        } else {
          return `[Attached PDF: ${f.file.name}${f.url ? ` - ${f.url}` : ""}] Please analyze this document.`
        }
      }).join("\n")
      
      messageText = fileDescriptions + (messageText ? "\n\n" + messageText : "\n\nPlease analyze the attached files.")
    }
    
    sendMessage({ text: messageText })
setInput("")
setAttachedFiles([])
  }

 const handlePromptClick = (prompt: string) => {
  if (!isOwnerAdmin && usage && usage.used >= usage.limit) {
    setShowUpgradePopup(true)
    return
  }

  sendMessage({ text: prompt })
}

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

 const regenerateResponse = () => {
  if (!isOwnerAdmin && usage && usage.used >= usage.limit) {
      setShowUpgradePopup(true)
      return
    }
    const lastUserMsg = messages.filter(m => m.role === "user").pop()
    if (lastUserMsg) {
      const text = getMessageText(lastUserMsg)
      if (text) sendMessage({ text })
    }
  }

  // User can send if: has free messages OR has balance OR no usage data yet (give benefit of doubt)
  const canSendMessage =
  isOwnerAdmin || !usage || usage.canSend || (usage.limit - usage.used > 0) || ((usage.balance ?? 0) > 0.001)

  return (
    <div 
      className="flex-1 flex flex-col h-full relative backdrop-blur-xl border-r border-cyan-500/10"
      style={{ 
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(10, 15, 30, 0.98) 100%)',
      }}
    >
      {/* Messages Area with proper scrolling */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ scrollBehavior: 'smooth' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center max-w-lg w-full"
            >
              <div className="flex justify-center mb-6">
                <MujeebProAILogo variant="icon" size="xl" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">What can I help you build?</h2>
              <p className="text-sm text-white/40 mb-8">
                {"I'm MujeebProAI, powered by DeepSeek. I can help with coding, writing, analysis, and more."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={!canSendMessage}
                    className={cn(
                      "p-3 text-left text-xs rounded-xl border transition-all",
                      canSendMessage
                        ? "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-cyan-500/30 text-white/60 hover:text-white/90"
                        : "bg-white/[0.02] border-white/[0.04] text-white/20 cursor-not-allowed"
                    )}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div ref={messagesContainerRef} className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            <div className="flex-1 min-h-[100px]" />
            <div className="max-w-3xl mx-auto w-full px-2 sm:px-4 py-6 space-y-6 overflow-x-hidden">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const text = getMessageText(message)
                const toolParts = message.role === "assistant" ? getToolParts(message) : []
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-3 group relative overflow-hidden",
                        message.role === "user"
                          ? "bg-cyan-500/15 border border-cyan-500/20 text-white rounded-br-md"
                          : "bg-white/[0.04] border border-white/[0.06] text-white rounded-bl-md"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <>
                          {toolParts.length > 0 && <ToolActivity parts={toolParts} />}
                          {text && (
                            <div className="prose prose-invert prose-sm max-w-none overflow-hidden prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:overflow-x-auto prose-pre:max-w-full prose-code:text-cyan-400 prose-code:break-all prose-headings:text-white prose-p:text-white/85 prose-li:text-white/85 prose-strong:text-white [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:whitespace-pre-wrap [&_code]:break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{text}</p>
                      )}

                      {/* Hover actions */}
                      <div
                        className={cn(
                          "absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                          message.role === "user" ? "right-0" : "left-0"
                        )}
                      >
                        <button
                          onClick={() => copyToClipboard(text, message.id)}
                          className="p-1.5 rounded-md bg-white/[0.06] text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {message.role === "assistant" && index === messages.length - 1 && !isLoading && (
                          <button
                            onClick={regenerateResponse}
                            className="p-1.5 rounded-md bg-white/[0.06] text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            title="Regenerate"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-white/60" />
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {/* Enhanced Colorful Thinking Animation */}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center mt-1 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <Bot className="w-3.5 h-3.5 text-white relative z-10" />
                    {/* Pulsing ring animation */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/30 to-purple-500/30 animate-ping" />
                  </div>
                  <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3">
                    {/* Animated colorful dots */}
                    <div className="flex gap-1.5">
                      {[
                        { color: "bg-cyan-400", delay: 0 },
                        { color: "bg-purple-400", delay: 0.15 },
                        { color: "bg-pink-400", delay: 0.3 },
                      ].map((dot, i) => (
                        <motion.span
                          key={i}
                          className={`w-2 h-2 ${dot.color} rounded-full`}
                          animate={{
                            y: [0, -6, 0],
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: dot.delay,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </motion.div>
                      <span className="text-xs bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">
                        AI is thinking...
                      </span>
                    </div>
                    <button onClick={stop} className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Stop">
                      <StopCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="relative group bg-white/[0.03] border border-white/[0.08] rounded-lg p-2 flex items-center gap-2"
              >
                {file.type === "image" && file.preview ? (
                  <img src={file.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-red-500/20 rounded flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-white/70 truncate max-w-[100px]">{file.file.name}</span>
                  <span className="text-[10px] text-white/40">
                    {file.uploading ? "Uploading..." : file.type === "image" ? "Image" : "PDF"}
                  </span>
                </div>
                {file.uploading && (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/[0.06] p-3 sm:p-4 bg-[#0a0a0f] relative z-10 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-end bg-white/[0.03] border border-white/[0.08] rounded-2xl focus-within:border-cyan-500/30 transition-colors overflow-hidden">
              {/* File attach buttons */}
              <div className="flex items-center gap-0.5 pl-2 pb-2 pt-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handlePdfSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="Attach image (or paste)"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="Attach PDF"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as unknown as React.FormEvent)
                  }
                }}
                placeholder="Message MujeebProAI... (paste images here)"
                className="flex-1 min-h-[44px] max-h-[200px] px-3 sm:px-2 py-3 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none overflow-y-auto"
                rows={1}
                disabled={isLoading}
                autoFocus
              />
              <Button
                type="submit"
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-xl m-1.5 flex-shrink-0 transition-all duration-300",
                  isLoading 
                    ? "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-pulse" 
                    : "bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/20 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                ) : (
                  <ArrowUp className="w-4 h-4 text-white" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-white/25 text-center mt-2">
              {"MujeebProAI may produce inaccurate information. "}
       {usage && (
  <span className="text-cyan-500/50">
    {usage.unlimited ? (
      <>Unlimited Messages | Unlimited Balance</>
    ) : (
      <>
        {usage.freeMessagesRemaining !== undefined
          ? `${usage.freeMessagesRemaining} free messages remaining`
          : `${Math.max(0, usage.limit - usage.used)} messages remaining`}
        {(usage.balance ?? 0) > 0 && ` | Balance: $${usage.balance?.toFixed(2)}`}
      </>
    )}
  </span>
)}
            </p>
          </form>
        </div>
      </div>

      {/* Error Display */}
      {error && !noCreditsError && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 max-w-md z-20">
          {error.message || "An error occurred"}
        </div>
      )}

      <UpgradePopup open={showUpgradePopup} onOpenChange={setShowUpgradePopup} />
    </div>
  )
}
