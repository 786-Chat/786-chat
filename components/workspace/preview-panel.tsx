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

function looksLikeReactOrTsxCode(value: string): boolean {
  const text = value.trim()

  if (!text) return false

  const codeSignals = [
    /^["']use client["']/,
    /\bimport\s+.+\s+from\s+["'][^"']+["']/,
    /\bexport\s+default\s+function\b/,
    /\bexport\s+function\b/,
    /\bfunction\s+[A-Z][A-Za-z0-9_]*\s*\(/,
    /\bconst\s+[A-Z][A-Za-z0-9_]*\s*=\s*\(/,
    /interface\s+[A-Z][A-Za-z0-9_]*/,
    /type\s+[A-Z][A-Za-z0-9_]*\s*=/,
    /className=/,
    /onClick=/,
    /useState\s*\(/,
    /useEffect\s*\(/,
  ]

  const hasRealHtmlDocument =
    /<!doctype html/i.test(text) ||
    /<html[\s>]/i.test(text) ||
    /<body[\s>]/i.test(text)

  if (hasRealHtmlDocument) return false

  return codeSignals.some((pattern) => pattern.test(text))
}

function hasVisibleHtmlContent(html: string): boolean {
  if (!html || !html.trim()) return false
  if (looksLikeReactOrTsxCode(html)) return false

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

  const hasRealPreviewElement =
    /<(main|section|header|footer|nav|div|article|aside|h1|h2|h3|p|button|form|img|a|ul|ol|li|table|canvas|svg|iframe)\b/i.test(
      noScriptsStyles
    )

  return textOnly.length > 3 || hasRealPreviewElement
}

function stripDangerousPreviewHtml(html: string): string {
  if (!html) return ""

  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => {
      const lower = script.toLowerCase()

      const looksDangerous =
        lower.includes("localstorage") ||
        lower.includes("sessionstorage") ||
        lower.includes("document.cookie") ||
        lower.includes("fetch(") ||
        lower.includes("xmlhttprequest") ||
        lower.includes("/api/admin") ||
        lower.includes("/admin") ||
        lower.includes("authorization") ||
        lower.includes("bearer ") ||
        lower.includes("secret") ||
        lower.includes("private_key") ||
        lower.includes("private key")

      return looksDangerous ? "" : script
    })
    .replace(/\son\w+=["'][\s\S]*?["']/gi, "")
    .replace(/\shref=["']javascript:[\s\S]*?["']/gi, ' href="#"')
    .replace(/\ssrc=["']javascript:[\s\S]*?["']/gi, "")
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

  const isReactCode = previewHtml ? looksLikeReactOrTsxCode(previewHtml) : false

  const cleanedPreviewHtml =
    previewHtml && !isReactCode && hasVisibleHtmlContent(previewHtml)
      ? stripDangerousPreviewHtml(previewHtml)
      : ""

  const safePreviewHtml =
    cleanedPreviewHtml && hasVisibleHtmlContent(cleanedPreviewHtml)
      ? cleanedPreviewHtml
      : ""

  const hasPreviewHtml = Boolean(safePreviewHtml)

  const normalizeCustomerPreviewUrl = (url: string) => {
    const cleanUrl = url.trim()
    if (!cleanUrl) return ""
    if (cleanUrl === "about:blank") return ""
    if (cleanUrl === "/") return "/"
    if (cleanUrl.startsWith("/site/")) return cleanUrl

    if (cleanUrl.startsWith("https://www.mujeebproai.com")) {
      return cleanUrl.replace("https://www.mujeebproai.com", "") || "/"
    }

    if (cleanUrl.startsWith("https://mujeebproai.com")) {
      return cleanUrl.replace("https://mujeebproai.com", "") || "/"
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

  const isDesktopDevice = device === "full"
  const isTabletDevice = device === "ipad" || device === "ipad-pro"
  const isMobileDevice = !isDesktopDevice && !isTabletDevice

  const copyCode = async () => {
    const codeToCopy = safePreviewHtml || previewHtml || ""
    if (!codeToCopy) return

    await navigator.clipboard.writeText(codeToCopy)
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

  const renderPreviewFrame = (content: "html" | "url") => {
    const iframeProps =
      content === "html"
        ? {
            key: `html-${refreshKey}-${device}-${safePreviewHtml.length}`,
            srcDoc: safePreviewHtml,
            title: "Generated Preview",
            sandbox: "allow-scripts allow-forms allow-popups",
          }
        : {
            key: `${refreshKey}-${device}-${safeLiveUrl}`,
            src: safeLiveUrl,
            title: "Website Preview",
            sandbox: "allow-scripts allow-same-origin allow-forms allow-popups",
          }

    if (isDesktopDevice) {
      return (
        <iframe
          {...iframeProps}
          className="absolute inset-0 h-full w-full bg-white"
        />
      )
    }

    const frameClass = isMobileDevice
      ? "h-[852px] w-[393px] max-h-[calc(100vh-170px)] max-w-[94vw] rounded-[58px]"
      : "h-[720px] w-[900px] max-h-[calc(100vh-190px)] max-w-[94vw] rounded-[34px]"

    const screenClass = isMobileDevice ? "rounded-[50px]" : "rounded-[26px]"

    return (
      <div className="absolute inset-0 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.24),transparent_38%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.16),transparent_42%)] p-5">
        <div className="flex min-h-full items-center justify-center py-5">
          <div
            className={cn(
              "relative shrink-0 shadow-2xl bg-[#111318]",
              frameClass,
              isMobileDevice ? "p-[10px] shadow-cyan-500/25" : "p-[4px] shadow-purple-500/25"
            )}
          >
            {isMobileDevice && (
              <>
                <div className="absolute left-1/2 top-[18px] z-30 h-[31px] w-[118px] -translate-x-1/2 rounded-full bg-black border border-white/10" />
                <div className="absolute right-[-3px] top-[190px] z-30 h-[92px] w-[4px] rounded-r-full bg-[#2a2d35]" />
                <div className="absolute left-[-3px] top-[150px] z-30 h-[54px] w-[4px] rounded-l-full bg-[#2a2d35]" />
                <div className="absolute left-[-3px] top-[220px] z-30 h-[78px] w-[4px] rounded-l-full bg-[#2a2d35]" />
              </>
            )}

            <div
              className={cn(
                "relative h-full w-full overflow-hidden bg-white",
                screenClass
              )}
            >
              {isTabletDevice && (
                <div className="absolute left-1/2 top-3 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-black/80 border border-white/10" />
              )}

              <iframe {...iframeProps} className="h-full w-full bg-white" />

              <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/15" />
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RefreshCw className="w-3 h-3" />
          </Button>

          {safeLiveUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
              onClick={() => window.open(safeLiveUrl, "_blank")}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
            onClick={onClose}
          >
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
                ? "Website Preview"
                : isReactCode
                  ? "Code detected - switch to Code mode"
                  : "Preview Ready - No Website Loaded"}
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            device === "full"
              ? "text-cyan-400 bg-cyan-500/10"
              : "text-white/30 hover:text-white hover:bg-white/5"
          )}
          onClick={() => setDevice("full")}
          title="Desktop"
        >
          <Monitor className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            device === "ipad" || device === "ipad-pro"
              ? "text-purple-300 bg-purple-500/10"
              : "text-white/30 hover:text-white hover:bg-white/5"
          )}
          onClick={() => setDevice("ipad")}
          title="Tablet"
        >
          <Tablet className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            device !== "full" && device !== "ipad" && device !== "ipad-pro"
              ? "text-emerald-300 bg-emerald-500/10"
              : "text-white/30 hover:text-white hover:bg-white/5"
          )}
          onClick={() => setDevice("iphone-17-pro")}
          title="Mobile"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#08080d] w-full max-w-full">
        {showEmptyPreview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 bg-[#08080d]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-white/15" />
            </div>

            <h3 className="text-sm font-medium text-white/50 mb-1">
              {isReactCode ? "Code is not preview HTML" : "Preview is empty"}
            </h3>

            <p className="text-xs text-white/25 max-w-[280px] mb-4">
              {isReactCode
                ? "React/TSX code will only show in Code mode. Preview mode only renders real HTML or your live website."
                : "Ask AI to generate or edit a website. The preview will appear here instead of a blank white page."}
            </p>

            {isReactCode ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                onClick={copyCode}
              >
                <Copy className="w-3 h-3 mr-1.5" />
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                onClick={loadMyCustomerSite}
              >
                <Globe className="w-3 h-3 mr-1.5" />
                Preview My Site
              </Button>
            )}
          </div>
        ) : viewMode === "code" && (safePreviewHtml || previewHtml) ? (
          <div className="absolute inset-0 overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0d1117] sticky top-0 z-10">
              <span className="text-xs text-white/50">Generated Code</span>

              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <pre className="p-4 text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {safePreviewHtml || previewHtml}
            </pre>
          </div>
        ) : hasPreviewHtml ? (
          renderPreviewFrame("html")
        ) : safeLiveUrl ? (
          renderPreviewFrame("url")
        ) : null}
      </div>
    </div>
  )
}
