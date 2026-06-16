"use client"

import { useState, useEffect } from "react"
import {
  ExternalLink,
  RefreshCw,
  X,
  Monitor,
  Smartphone,
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
  const [liveUrl, setLiveUrl] = useState(previewUrl || "")
  const [copied, setCopied] = useState(false)
  const [allowedCustomerSiteUrl, setAllowedCustomerSiteUrl] = useState("")

  const isBlockedCustomerUrl = (url: string) => {
    if (isOwnerAdmin) return false

    const cleanUrl = url.trim().toLowerCase()
    const allowed = allowedCustomerSiteUrl.trim().toLowerCase()

    if (!cleanUrl) return false
    if (allowed && cleanUrl === allowed) return false
    if (cleanUrl.startsWith("/")) return true

    const blockedWords = [
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
    if (!previewUrl) {
      setLiveUrl("")
      return
    }

    if (isBlockedCustomerUrl(previewUrl)) {
      clearPreview()
      return
    }

    setLiveUrl(previewUrl)
  }, [previewUrl, isOwnerAdmin, allowedCustomerSiteUrl])

  const currentDevice = DEVICE_PRESETS.find((d) => d.id === device) || DEVICE_PRESETS[0]
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
    if (previewHtml) {
      await navigator.clipboard.writeText(previewHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const safeLiveUrl = isBlockedCustomerUrl(liveUrl) ? "" : liveUrl

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
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/50 font-medium">
            {previewHtml
              ? viewMode === "code"
                ? "Generated Code"
                : "Live Preview"
              : safeLiveUrl
              ? currentDevice.label
              : "Preview"}
          </span>
          {frameDims && (
            <span className="text-[10px] text-white/30">
              {frameDims.width} x {frameDims.height}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>

          {safeLiveUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
              onClick={() => window.open(safeLiveUrl, "_blank")}
              title="Open in new tab"
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
            {previewHtml
              ? viewMode === "code"
                ? "Generated Code - Your AI Generated Project"
                : "Live Preview - Your AI Generated Project"
              : safeLiveUrl
              ? "Customer Site Preview"
              : "Preview - Customer Website"}
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              device === "full"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-white/30 hover:text-white hover:bg-white/5",
            )}
            onClick={() => setDevice("full")}
            title="Full size"
          >
            <Monitor className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              device !== "full"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-white/30 hover:text-white hover:bg-white/5",
            )}
            onClick={() => setDevice("iphone-17-pro")}
            title="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#08080d] w-full max-w-full">
        {viewMode === "code" && previewHtml ? (
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
              {previewHtml}
            </pre>
          </div>
        ) : previewHtml ? (
          isFullSize ? (
            <iframe
              key={`html-${refreshKey}-${device}`}
              srcDoc={previewHtml}
              className="absolute inset-0 w-full h-full bg-white"
              title="Generated Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="absolute inset-0 flex items-start justify-center overflow-auto p-2 sm:p-4 md:p-6">
              <div
                className="bg-[#1a1a2e] rounded-[1.5rem] sm:rounded-[2.5rem] p-1.5 sm:p-2.5 shadow-2xl shadow-black/50 border border-white/[0.08]"
                style={{ maxWidth: "calc(100% - 16px)", width: "fit-content" }}
              >
                <div className="bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden">
                  <iframe
                    key={`html-${refreshKey}-${device}`}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title="Generated Preview"
                    sandbox="allow-scripts"
                    style={{
                      width: Math.min(
                        frameDims ? frameDims.width : 390,
                        typeof window !== "undefined" ? window.innerWidth - 48 : 390,
                      ),
                      height: frameDims ? frameDims.height : 844,
                      maxWidth: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          )
        ) : safeLiveUrl ? (
          isFullSize ? (
            <iframe
              key={`${refreshKey}-${device}`}
              src={safeLiveUrl}
              className="absolute inset-0 w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="absolute inset-0 flex items-start justify-center overflow-auto p-2 sm:p-4 md:p-6">
              <div
                className="bg-[#1a1a2e] rounded-[1.5rem] sm:rounded-[2.5rem] p-1.5 sm:p-2.5 shadow-2xl shadow-black/50 border border-white/[0.08]"
                style={{ maxWidth: "calc(100% - 16px)", width: "fit-content" }}
              >
                <div className="bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden">
                  <iframe
                    key={`${refreshKey}-${device}`}
                    src={safeLiveUrl}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    style={{
                      width: Math.min(
                        frameDims ? frameDims.width : 390,
                        typeof window !== "undefined" ? window.innerWidth - 48 : 390,
                      ),
                      height: frameDims ? frameDims.height : 844,
                      maxWidth: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-white/15" />
            </div>
            <h3 className="text-sm font-medium text-white/40 mb-1">Your Project Preview</h3>
            <p className="text-xs text-white/20 max-w-[240px] mb-4">
              Ask AI to generate your website or preview your own customer site.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              onClick={async () => {
                try {
                  const response = await fetch("/api/sites/my-site")
                  if (response.ok) {
                    const data = await response.json()
                    if (data.siteUrl && !isBlockedCustomerUrl(data.siteUrl)) {
                      setAllowedCustomerSiteUrl(data.siteUrl)
                      setLiveUrl(data.siteUrl)
                      setPreviewUrl(data.siteUrl)
                      return
                    }
                  }
                } catch {
                  console.log("[MujeebProAI] No customer site found")
                }

                clearPreview()
              }}
            >
              <Globe className="w-3 h-3 mr-1.5" />
              Preview My Site
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
