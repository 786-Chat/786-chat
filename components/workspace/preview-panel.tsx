"use client"

import { useState, useEffect } from "react"
import {
  ExternalLink,
  RefreshCw,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DEVICE_PRESETS } from "./top-bar"
import { useAuth } from "@/contexts/auth-context"

interface PreviewPanelProps {
  device: string
  setDevice: (device: string) => void
  previewUrl: string
  setPreviewUrl: (url: string) => void
  onClose: () => void
  expanded: boolean
  setExpanded: (v: boolean) => void
  previewHtml?: string
  viewMode?: "preview" | "code"
  onViewModeChange?: (mode: "preview" | "code") => void
}

function hasVisibleHtmlContent(html: string): boolean {
  if (!html || !html.trim()) return false

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = bodyMatch ? bodyMatch[1] : html

  const noScriptsStyles = content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()

  const textOnly = noScriptsStyles
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim()

  const hasImageOrSvg = /<(img|svg|canvas|iframe)\b/i.test(noScriptsStyles)
  return textOnly.length > 3 || hasImageOrSvg
}

function isBlockedPreviewHtml(html: string): boolean {
  const lower = html.toLowerCase()

  const blocked = [
    "welcome back",
    "sign in to your account",
    "enter your password",
    "forgot password",
    "don't have an account",
    "current-password",
    "/login",
    "admin dashboard",
    "admin panel",
    "mujeeb@job4u.com",
    "admin@mujeebproai.com",
  ]

  return blocked.some((word) => lower.includes(word))
}

export function WorkspacePreviewPanel({
  device,
  setDevice,
  previewUrl,
  setPreviewUrl,
  onClose,
  previewHtml,
  viewMode = "preview",
}: PreviewPanelProps) {
  const { user } = useAuth()
  const isOwnerAdmin = user?.email?.toLowerCase() === "mujeeb@job4u.com"

  const [refreshKey, setRefreshKey] = useState(0)
  const [liveUrl, setLiveUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const safePreviewHtml =
    previewHtml &&
    hasVisibleHtmlContent(previewHtml) &&
    !isBlockedPreviewHtml(previewHtml)
      ? previewHtml
      : ""

  const hasPreviewHtml = Boolean(safePreviewHtml)

  const normalizeCustomerPreviewUrl = (url: string) => {
    const cleanUrl = url.trim()
    if (!cleanUrl) return ""
    if (cleanUrl === "about:blank") return ""
    if (cleanUrl.startsWith("/site/")) return cleanUrl

    if (cleanUrl.startsWith("https://www.mujeebproai.com/site/")) {
      return cleanUrl.replace("https://www.mujeebproai.com", "")
    }

    if (cleanUrl.startsWith("https://mujeebproai.com/site/")) {
      return cleanUrl.replace("https://mujeebproai.com", "")
    }

    return cleanUrl
  }

  const isBlockedCustomerUrl = (url: string) => {
    if (isOwnerAdmin) return false

    const cleanUrl = url.trim().toLowerCase()
    if (!cleanUrl) return false
    if (cleanUrl === "about:blank") return true
    if (cleanUrl.startsWith("/site/")) return false

    const blockedWords = [
      "/login",
      "/admin",
      "/dashboard",
      "/settings",
      "/users",
      "/subscriptions",
      "/balances",
      "/logs",
      "/api/admin",
      "mujeebproai.com/login",
      "mujeebproai.com/admin",
      "mujeebproai.com/dashboard",
      "mujeebproai.com/settings",
      "mujeebproai.com/users",
      "mujeebproai.com/subscriptions",
      "mujeebproai.com/balances",
      "mujeebproai.com/logs",
      "mujeebproai.com/api/admin",
    ]

    return blockedWords.some((word) => cleanUrl.includes(word))
  }

  const clearPreview = () => {
    setLiveUrl("")
    setPreviewUrl("")
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    if (!previewUrl || previewUrl.trim() === "" || previewUrl === "about:blank") {
      setLiveUrl("")
      return
    }

    const normalizedUrl = normalizeCustomerPreviewUrl(previewUrl)

    if (!normalizedUrl || isBlockedCustomerUrl(normalizedUrl)) {
      clearPreview()
      return
    }

    setLiveUrl(normalizedUrl)
  }, [previewUrl, isOwnerAdmin])

  const currentDevice =
    DEVICE_PRESETS.find((d) => d.id === device) || DEVICE_PRESETS[0]

  const isFullSize = device === "full"

  const getFrameDimensions = () => {
    if (isFullSize) return null

    const d = DEVICE_PRESETS.find((p) => p.id === device)
    if (!d || d.width === "100%") return null

    return {
      width: parseInt(d.width),
      height: parseInt(d.height),
    }
  }

  const frameDims = getFrameDimensions()

  const copyCode = async () => {
    if (!safePreviewHtml) return

    await navigator.clipboard.writeText(safePreviewHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadMyCustomerSite = async () => {
    try {
      const response = await fetch("/api/sites/my-site", {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        clearPreview()
        return
      }

      const data = await response.json()
      let nextUrl = ""

      if (data.previewUrl) {
        nextUrl = normalizeCustomerPreviewUrl(data.previewUrl)
      } else if (data.subdomain) {
        nextUrl = `/site/${data.subdomain}`
      }

      if (!nextUrl || isBlockedCustomerUrl(nextUrl)) {
        clearPreview()
        return
      }

      setLiveUrl(nextUrl)
      setPreviewUrl(nextUrl)
      setRefreshKey((prev) => prev + 1)
    } catch {
      clearPreview()
    }
  }

  const safeLiveUrl =
    liveUrl && liveUrl !== "about:blank" && !isBlockedCustomerUrl(liveUrl)
      ? liveUrl
      : ""

  const showEmptyPreview = !hasPreviewHtml && !safeLiveUrl

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden w-full max-w-full backdrop-blur-xl border-l border-teal-500/20"
      style={{
        background:
          "linear-gradient(180deg, rgba(20, 184, 166, 0.1) 0%, rgba(10, 20, 30, 0.98) 100%)",
      }}
    >
      <div
        className="h-10 border-b border-teal-500/20 flex items-center justify-between px-3 flex-shrink-0"
        style={{ background: "rgba(20, 184, 166, 0.05)" }}
      >
        <span className="text-[11px] text-white/50 font-medium">
          {hasPreviewHtml ? "Live Preview" : safeLiveUrl ? currentDevice.label : "Preview"}
        </span>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5" onClick={() => setRefreshKey((prev) => prev + 1)}>
            <RefreshCw className="w-3 h-3" />
          </Button>

          {safeLiveUrl && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5" onClick={() => window.open(safeLiveUrl, "_blank")}>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center flex-1 h-7 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
          <span className="text-[11px] text-cyan-400/80">
            {hasPreviewHtml
              ? "Live Preview - Your AI Generated Project"
              : safeLiveUrl
                ? "Customer Website Preview"
                : "Preview Ready - No Website Loaded"}
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center gap-1">
        <Button variant="ghost" size="icon" className={cn("h-7 w-7", device === "full" ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white hover:bg-white/5")} onClick={() => setDevice("full")}>
          <Monitor className="w-3.5 h-3.5" />
        </Button>

        <Button variant="ghost" size="icon" className={cn("h-7 w-7", device === "ipad" || device === "ipad-pro" ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white hover:bg-white/5")} onClick={() => setDevice("ipad")}>
          <Tablet className="w-3.5 h-3.5" />
        </Button>

        <Button variant="ghost" size="icon" className={cn("h-7 w-7", device !== "full" && device !== "ipad" && device !== "ipad-pro" ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white hover:bg-white/5")} onClick={() => setDevice("iphone-17-pro")}>
          <Smartphone className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#08080d] w-full max-w-full">
        {showEmptyPreview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 bg-[#08080d]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-white/15" />
            </div>

            <h3 className="text-sm font-medium text-white/50 mb-1">Preview is empty</h3>

            <p className="text-xs text-white/25 max-w-[280px] mb-4">
              Ask AI to generate or edit a website. The preview will appear here instead of a blank white page.
            </p>

            <Button variant="outline" size="sm" className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" onClick={loadMyCustomerSite}>
              <Globe className="w-3 h-3 mr-1.5" />
              Preview My Site
            </Button>
          </div>
        ) : viewMode === "code" && hasPreviewHtml ? (
          <div className="absolute inset-0 overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0d1117] sticky top-0 z-10">
              <span className="text-xs text-white/50">Generated Code</span>
              <button onClick={copyCode} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <pre className="p-4 text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {safePreviewHtml}
            </pre>
          </div>
        ) : hasPreviewHtml ? (
          <iframe
            key={`html-${refreshKey}-${device}`}
            srcDoc={safePreviewHtml}
            className="absolute inset-0 w-full h-full bg-white"
            title="Generated Preview"
            sandbox="allow-scripts allow-forms allow-popups"
          />
        ) : safeLiveUrl ? (
          <iframe
            key={`${refreshKey}-${device}-${safeLiveUrl}`}
            src={safeLiveUrl}
            className="absolute inset-0 w-full h-full bg-white"
            title="Customer Website Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : null}
      </div>
    </div>
  )
}
