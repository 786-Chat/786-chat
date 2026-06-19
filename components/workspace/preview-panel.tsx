"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ExternalLink,
  RefreshCw,
  RotateCcw,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Copy,
  Check,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

interface PreviewPanelProps {
  project?: {
    id: string
    name: string
    template?: string
    files?: Record<string, string>
  } | null

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

function getDeviceLabel(device: string): string {
  switch (device) {
    case "full":
      return "Full Size"
    case "ipad":
    case "ipad-pro":
      return "Tablet"
    case "iphone-17-pro":
      return "iPhone 17 Pro Max"
    default:
      return "Mobile"
  }
}

function getSourceFileHints(url: string): string[] {
  const cleanUrl = url.trim().toLowerCase()

  if (!cleanUrl || cleanUrl === "/") {
    return ["app/page.tsx", "components/ui/space-background.tsx"]
  }

  if (cleanUrl.includes("/themes")) {
    return ["app/themes/page.tsx", "app/themes/[slug]/page.tsx", "components/website-launch-wizard.tsx"]
  }

  if (cleanUrl.includes("/pricing")) {
    return ["app/pricing/page.tsx", "lib/billing.ts"]
  }

  if (cleanUrl.includes("/about")) {
    return ["app/about/page.tsx"]
  }

  if (cleanUrl.includes("/contact")) {
    return ["app/contact/page.tsx"]
  }

  if (cleanUrl.includes("/features")) {
    return ["app/features/page.tsx"]
  }

  return [`app${cleanUrl}/page.tsx`]
}

function looksLikeReactOrTsxCode(value: string): boolean {
  const text = value.trim()
  if (!text) return false

  const hasHtmlDocument =
    /<!doctype html/i.test(text) ||
    /<html[\s>]/i.test(text) ||
    /<body[\s>]/i.test(text)

  if (hasHtmlDocument) return false

  const reactSignals = [
    /^["']use client["']/,
    /\bimport\s+.+\s+from\s+["'][^"']+["']/,
    /\bexport\s+default\s+function\b/,
    /\bexport\s+function\b/,
    /\bfunction\s+[A-Z][A-Za-z0-9_]*\s*\(/,
    /\bconst\s+[A-Z][A-Za-z0-9_]*\s*=\s*\(/,
    /\binterface\s+[A-Z][A-Za-z0-9_]*/,
    /\btype\s+[A-Z][A-Za-z0-9_]*\s*=/,
    /\buseState\s*\(/,
    /\buseEffect\s*\(/,
    /className=/,
    /onClick=/,
  ]

  return reactSignals.some((pattern) => pattern.test(text))
}

function isFakeComponentCodePreview(html: string): boolean {
  const text = html.trim().toLowerCase()

  return (
    text.includes("<h3>component code</h3>") ||
    (text.includes("component code") &&
      text.includes("<pre") &&
      text.includes("import ") &&
      text.includes("export default"))
  )
}

function hasVisibleHtmlContent(html: string): boolean {
  if (!html || !html.trim()) return false
  if (looksLikeReactOrTsxCode(html)) return false
  if (isFakeComponentCodePreview(html)) return false

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

function hideIframeScrollbar(iframe: HTMLIFrameElement | null) {
  if (!iframe) return

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    const style = doc.createElement("style")
    style.setAttribute("data-mujeebproai-scrollbar-fix", "true")
    style.innerHTML = `
      html, body {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `
    doc.head?.appendChild(style)
  } catch {
    // Cross-origin iframe cannot be styled. Keep preview safe and functional.
  }
}

export function WorkspacePreviewPanel({
  project,
  device,
  setDevice,
  previewUrl,
  setPreviewUrl,
  onClose,
  previewHtml,
  viewMode = "preview",
  onViewModeChange,
}: PreviewPanelProps) {
  const { user } = useAuth()
  const isOwnerAdmin = user?.email?.toLowerCase() === "mujeeb@job4u.com"

  const [refreshKey, setRefreshKey] = useState(0)
  const [liveUrl, setLiveUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [localPreviewHtml, setLocalPreviewHtml] = useState(previewHtml || "")
  const [canRollbackPreview, setCanRollbackPreview] = useState(false)

  const userEmail = user?.email?.toLowerCase() || "guest"
  const previewStorageKey =
    userEmail !== "guest"
      ? `mujeebproai_last_preview_html_${userEmail}`
      : "mujeebproai_last_preview_html_guest"
  const previewBackupStorageKey = `${previewStorageKey}_backup`
  const previewHistoryStorageKey = `${previewStorageKey}_history`

  const currentPreviewHtml = localPreviewHtml || previewHtml || ""

  const isReactCode = currentPreviewHtml ? looksLikeReactOrTsxCode(currentPreviewHtml) : false
  const isBadComponentPreview = currentPreviewHtml
    ? isFakeComponentCodePreview(currentPreviewHtml)
    : false

  const cleanedPreviewHtml =
    currentPreviewHtml &&
    !isReactCode &&
    !isBadComponentPreview &&
    hasVisibleHtmlContent(currentPreviewHtml)
      ? stripDangerousPreviewHtml(currentPreviewHtml)
      : ""
  const safePreviewHtml =
  cleanedPreviewHtml && hasVisibleHtmlContent(cleanedPreviewHtml)
    ? cleanedPreviewHtml
    : ""

const hasPreviewHtml = Boolean(safePreviewHtml)

const projectFiles = project?.files ?? {}
const projectFilePaths = Object.keys(projectFiles)

const defaultFile =
  projectFilePaths.length > 0
    ? projectFilePaths[0]
    : "app/page.tsx"

const [selectedFile, setSelectedFile] = useState(defaultFile)

const selectedFileContent =
  projectFiles[selectedFile] ||
  projectFiles[defaultFile] ||
  ""

useEffect(() => {
  if (projectFilePaths.length > 0) {
    setSelectedFile(projectFilePaths[0])
  }
}, [project?.id, projectFilePaths.length])

  const readPreviewHistory = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(previewHistoryStorageKey) || "[]"
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) return []

      return parsed.filter(
        (item): item is string =>
          typeof item === "string" && hasVisibleHtmlContent(item)
      )
    } catch {
      return []
    }
  }, [previewHistoryStorageKey])

  const writePreviewHistory = useCallback(
    (history: string[]) => {
      const cleanHistory = history
        .filter((item) => hasVisibleHtmlContent(item))
        .slice(-20)

      if (cleanHistory.length > 0) {
        localStorage.setItem(previewHistoryStorageKey, JSON.stringify(cleanHistory))
        localStorage.setItem(previewBackupStorageKey, cleanHistory[cleanHistory.length - 1])
      } else {
        localStorage.removeItem(previewHistoryStorageKey)
        localStorage.removeItem(previewBackupStorageKey)
      }

      setCanRollbackPreview(cleanHistory.length > 0)
    },
    [previewBackupStorageKey, previewHistoryStorageKey]
  )

  const refreshRollbackState = useCallback(() => {
    setCanRollbackPreview(readPreviewHistory().length > 0)
  }, [readPreviewHistory])

  const restorePreviousPreview = useCallback(() => {
    const history = readPreviewHistory()
    const previousPreview = history[history.length - 1]

    if (!previousPreview || !hasVisibleHtmlContent(previousPreview)) {
      writePreviewHistory([])
      return
    }

    const remainingHistory = history.slice(0, -1)

    localStorage.setItem(previewStorageKey, previousPreview)
    writePreviewHistory(remainingHistory)

    setLocalPreviewHtml(previousPreview)
    setPreviewUrl("")
    setLiveUrl("")
    setRefreshKey((prev) => prev + 1)
    onViewModeChange?.("preview")
  }, [onViewModeChange, previewStorageKey, readPreviewHistory, setPreviewUrl, writePreviewHistory])

  useEffect(() => {
    setLocalPreviewHtml(previewHtml || "")
  }, [previewHtml])

  useEffect(() => {
    refreshRollbackState()

    const handleStorage = () => refreshRollbackState()
    const handlePreviewHistoryChanged = () => refreshRollbackState()

    window.addEventListener("storage", handleStorage)
    window.addEventListener("preview-history-changed", handlePreviewHistoryChanged)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("preview-history-changed", handlePreviewHistoryChanged)
    }
  }, [refreshRollbackState])
  const normalizeCustomerPreviewUrl = (url: string) => {
    const cleanUrl = url.trim()

    if (!cleanUrl || cleanUrl === "about:blank") return ""

    if (isOwnerAdmin) {
      if (cleanUrl === "/") return "/"
      if (cleanUrl.startsWith("https://www.mujeebproai.com")) {
        return cleanUrl.replace("https://www.mujeebproai.com", "") || "/"
      }
      if (cleanUrl.startsWith("https://mujeebproai.com")) {
        return cleanUrl.replace("https://mujeebproai.com", "") || "/"
      }
      return cleanUrl
    }

    if (cleanUrl === "/") return ""
    if (cleanUrl.includes("mujeebproai.com")) return ""
    if (cleanUrl.startsWith("/dashboard")) return ""
    if (cleanUrl.startsWith("/admin")) return ""
    if (cleanUrl.startsWith("/login")) return ""
    if (cleanUrl.startsWith("/register")) return ""

    if (cleanUrl.startsWith("/site/")) return cleanUrl

    return ""
  }

  const isBlockedPreviewUrl = (url: string) => {
    const cleanUrl = url.trim().toLowerCase()
    if (!cleanUrl) return false
    if (cleanUrl === "about:blank") return true

    if (!isOwnerAdmin && cleanUrl.startsWith("/site/")) return false

    const blockedWords = [
      "/login",
      "/register",
      "/admin",
      "/admin-login",
      "/dashboard",
      "/settings",
      "/users",
      "/subscriptions",
      "/balances",
      "/logs",
      "/api/admin",
      "mujeebproai.com",
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

    if (!normalizedUrl || isBlockedPreviewUrl(normalizedUrl)) {
      clearPreview()
      return
    }

    setLiveUrl(normalizedUrl)
  }, [previewUrl, isOwnerAdmin])

  const currentDeviceLabel = getDeviceLabel(device)

  const isDesktopDevice = device === "full"
  const isTabletDevice = device === "ipad" || device === "ipad-pro"
  const isMobileDevice = !isDesktopDevice && !isTabletDevice

  const copyCode = async () => {
    const codeToCopy = safePreviewHtml || currentPreviewHtml || ""
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

      if (data.subdomain) {
        nextUrl = `/site/${data.subdomain}`
      } else if (data.previewUrl) {
        nextUrl = normalizeCustomerPreviewUrl(data.previewUrl)
      }

      if (!nextUrl || isBlockedPreviewUrl(nextUrl)) {
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
    isOwnerAdmin
      ? liveUrl && liveUrl !== "about:blank" && !isBlockedPreviewUrl(liveUrl)
        ? liveUrl
        : ""
      : liveUrl && liveUrl.startsWith("/site/") && !isBlockedPreviewUrl(liveUrl)
        ? liveUrl
        : ""

  const showEmptyPreview = !hasPreviewHtml && !safeLiveUrl

  const sourceFileHints = getSourceFileHints(safeLiveUrl)

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
          onLoad={(event) => hideIframeScrollbar(event.currentTarget)}
          className="absolute inset-0 h-full w-full bg-white"
        />
      )
    }

    const frameClass = isMobileDevice
      ? "h-[844px] w-[390px] max-h-[calc(100vh-165px)] max-w-[94vw] rounded-[54px]"
      : "h-[720px] w-[900px] max-h-[calc(100vh-190px)] max-w-[94vw] rounded-[34px]"

    const screenClass = isMobileDevice ? "rounded-[44px]" : "rounded-[26px]"

    return (
      <div className="absolute inset-0 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_38%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_42%)] p-5">
        <div className="flex min-h-full items-center justify-center py-5">
          <div
            className={cn(
              "relative shrink-0 shadow-2xl",
              frameClass,
              isMobileDevice
                ? "bg-[#080a10] p-[9px] shadow-cyan-500/25 ring-1 ring-white/15"
                : "bg-[#111318] p-[4px] shadow-purple-500/25"
            )}
          >
            {isMobileDevice && (
              <>
                <div className="absolute left-1/2 top-[17px] z-30 h-[28px] w-[110px] -translate-x-1/2 rounded-full bg-black shadow-inner border border-white/10" />
                <div className="absolute left-1/2 top-[25px] z-40 h-[7px] w-[44px] -translate-x-1/2 rounded-full bg-white/10" />
                <div className="absolute right-[-3px] top-[190px] z-30 h-[88px] w-[4px] rounded-r-full bg-[#2a2d35]" />
                <div className="absolute left-[-3px] top-[145px] z-30 h-[52px] w-[4px] rounded-l-full bg-[#2a2d35]" />
                <div className="absolute left-[-3px] top-[215px] z-30 h-[76px] w-[4px] rounded-l-full bg-[#2a2d35]" />
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

              <iframe
                {...iframeProps}
                onLoad={(event) => hideIframeScrollbar(event.currentTarget)}
                className="h-full w-full bg-white border-0"
              />

              <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/10" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  const renderLiveUrlCodeNotice = () => {
    return (
      <div className="border-b border-white/[0.06] px-4 py-2 bg-[#0d1117]">
        <span className="text-xs text-white/50">Live React Page Source</span>
      </div>
    )
  }

  const renderCodeMode = () => {
    if (!project || projectFilePaths.length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#08080d] text-white/40 text-sm">
          No project files found
        </div>
      )
    }

    return (
      <div className="absolute inset-0 flex bg-[#0b0f17] text-white">
        <div className="w-56 border-r border-white/10 overflow-y-auto">
          <div className="p-2 text-xs text-white/50 border-b border-white/10">
            Project Files
          </div>

          {projectFilePaths.map((file) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${
                selectedFile === file ? "bg-white/10 text-cyan-300" : "text-white/70"
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-xs text-white/40 mb-2">{selectedFile}</div>

          <pre className="text-xs whitespace-pre-wrap text-white/80">
            {selectedFileContent}
          </pre>
        </div>
      </div>
    )
  }

  const renderLiveCodePanel = () => {
    return (
      <div className="p-5">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white">This preview is a live route</h3>
          </div>

          <p className="text-xs leading-relaxed text-white/55 mb-4">
            The preview is showing <span className="text-cyan-300">{safeLiveUrl || "/"}</span>.
            Code mode cannot display the real React source automatically from the iframe.
            Ask MujeebProAI chat to read the source files below if you want to edit this page.
          </p>

          <div className="space-y-2">
            {sourceFileHints.map((path) => (
              <div
                key={path}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2"
              >
                <code className="text-xs text-cyan-100/80">{path}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(path)}
                  className="text-[11px] text-white/35 hover:text-white"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-white/35">
            Example: &ldquo;Read app/themes/page.tsx and show me the code for this preview.&rdquo;
          </p>
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
          {hasPreviewHtml ? "Live Preview" : safeLiveUrl ? currentDeviceLabel : "Preview"}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 transition-colors",
              canRollbackPreview
                ? "text-cyan-300 hover:text-white hover:bg-cyan-500/15"
                : "text-white/15 cursor-not-allowed"
            )}
            onClick={restorePreviousPreview}
            disabled={!canRollbackPreview}
            title={
              canRollbackPreview
                ? "Restore previous preview"
                : "No previous preview saved yet"
            }
          >
            <RotateCcw className="w-3 h-3" />
          </Button>

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
                ? viewMode === "code"
                  ? "Code Mode - Live React Route"
                  : "Website Preview"
                : isReactCode || isBadComponentPreview
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
       {viewMode === "code" ? (
  renderCodeMode()
) : showEmptyPreview ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 bg-[#08080d]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-white/15" />
            </div>

            <h3 className="text-sm font-medium text-white/50 mb-1">
              {isReactCode || isBadComponentPreview ? "Code is not preview HTML" : "Preview is empty"}
            </h3>

            <p className="text-xs text-white/25 max-w-[280px] mb-4">
              {isReactCode || isBadComponentPreview
                ? "React/TSX code will only show in Code mode. Preview mode only renders real HTML or your live website."
                : "Ask AI to generate or edit a website. The preview will appear here instead of a blank white page."}
            </p>

            {isReactCode || isBadComponentPreview ? (
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
        ) : viewMode === "code" && (safePreviewHtml || currentPreviewHtml) ? (
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
              {safePreviewHtml || currentPreviewHtml}
            </pre>
          </div>
        ) : viewMode === "code" && safeLiveUrl ? (
          <div className="absolute inset-0 flex flex-col bg-[#08080d]">
            {/* Source file hints at top */}
            <div className="flex-shrink-0">
              {renderLiveUrlCodeNotice()}
              {renderLiveCodePanel()}
            </div>

            {/* Live preview below the hints */}
            <div className="flex-1 relative min-h-0">
              {renderPreviewFrame("url")}
            </div>
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
