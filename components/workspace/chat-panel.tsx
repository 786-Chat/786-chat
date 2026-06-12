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
