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
  expanded,
  setExpanded,
  previewHtml,
  viewMode = "preview",
  onViewModeChange,
}: PreviewPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [urlInput, setUrlInput] = useState(previewUrl || "")
  const [liveUrl, setLiveUrl] = useState(previewUrl || "")
  const [copied, setCopied] = useState(false)

  // Only update when previewUrl changes from outside (e.g. AI generates a project)
  useEffect(() => {
    if (previewUrl) {
      setLiveUrl(previewUrl)
      setUrlInput(previewUrl)
    }
  }, [previewUrl])

  const currentDevice = DEVICE_PRESETS.find(d => d.id === device) || DEVICE_PRESETS[0]
  const isFullSize = device === "full"

  const getFrameDimensions = () => {
    if (isFullSize) return null
    const d = DEVICE_PRESETS.find(p => p.id === device)
    if (!d || d.width === "100%") return null
    return {
      width: parseInt(d.width),
      height: parseInt(d.height),
    }
  }

  const frameDims = getFrameDimensions()

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let url = urlInput.trim()
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }
    if (url) {
      setLiveUrl(url)
      setPreviewUrl(url)
      setRefreshKey(prev => prev + 1)
    }
  }

  const copyCode = async () => {
    if (previewHtml) {
      await navigator.clipboard.writeText(previewHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative border-l border-white/[0.06] md:border-l-0 bg-[#0d0d14] flex flex-col h-full overflow-hidden w-full max-w-full">
      {/* Preview Header */}
      <div className="h-10 border-b border-white/[0.06] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] text-white/30 ml-2">
            {liveUrl ? currentDevice.label : previewHtml ? "Generated Preview" : currentDevice.label}
          </span>
          {frameDims && (
            <span className="text-[10px] text-white/20">
              {frameDims.width} x {frameDims.height}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          {liveUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/5"
              onClick={() => window.open(liveUrl, "_blank")}
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

      {/* URL Bar - Show different content based on what's being previewed */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        {previewHtml ? (
          /* When showing generated code, display a label instead of URL input */
          <div className="flex items-center flex-1 h-7 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
            <span className="text-[11px] text-cyan-400/80">
              {viewMode === "code" ? "Generated Code" : "Live Preview"} - Your AI Generated Project
            </span>
          </div>
        ) : (
          /* When no generated code, show URL input for external sites */
          <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
            <div className="flex items-center flex-1 h-7 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5">
              <Globe className="w-3 h-3 text-white/20 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter your website URL to preview..."
                className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </form>
        )}
      </div>

      {/* Device Quick Switch */}
      <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1">
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
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
            onClick={() => setDevice("iphone-17-pro")}
            title="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative overflow-hidden bg-[#08080d] w-full max-w-full">
        {viewMode === "code" && previewHtml ? (
          /* Code View - show the raw code */
          <div className="absolute inset-0 overflow-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0d1117] sticky top-0 z-10">
              <span className="text-xs text-white/50">Generated Code</span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-4 text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {previewHtml}
            </pre>
          </div>
        ) : previewHtml ? (
          /* AI-generated code preview - PRIORITIZE THIS over liveUrl */
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
                style={{
                  maxWidth: "calc(100% - 16px)",
                  width: "fit-content",
                }}
              >
                <div className="flex justify-center mb-1">
                  <div className="w-16 sm:w-24 h-4 sm:h-6 bg-black rounded-b-xl sm:rounded-b-2xl flex items-center justify-center">
                    <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-[#1a1a2e] rounded-full" />
                  </div>
                </div>
                <div
                  className="bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden"
                  style={{
                    width: Math.min(frameDims ? frameDims.width : 390, typeof window !== "undefined" ? window.innerWidth - 48 : 390),
                    height: frameDims ? frameDims.height : 844,
                    maxWidth: "100%",
                  }}
                >
                  <iframe
                    key={`html-${refreshKey}-${device}`}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title="Generated Preview"
                    sandbox="allow-scripts"
                  />
                </div>
                <div className="flex justify-center mt-1 sm:mt-2 pb-0.5 sm:pb-1">
                  <div className="w-20 sm:w-28 h-0.5 sm:h-1 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          )
        ) : liveUrl ? (
          /* External URL preview - only if no generated HTML */
          isFullSize ? (
            <iframe
              key={`${refreshKey}-${device}`}
              src={liveUrl}
              className="absolute inset-0 w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="absolute inset-0 flex items-start justify-center overflow-auto p-2 sm:p-4 md:p-6">
              <div
                className="bg-[#1a1a2e] rounded-[1.5rem] sm:rounded-[2.5rem] p-1.5 sm:p-2.5 shadow-2xl shadow-black/50 border border-white/[0.08]"
                style={{
                  maxWidth: "calc(100% - 16px)",
                  width: "fit-content",
                }}
              >
                <div className="flex justify-center mb-1">
                  <div className="w-16 sm:w-24 h-4 sm:h-6 bg-black rounded-b-xl sm:rounded-b-2xl flex items-center justify-center">
                    <div className="w-8 sm:w-12 h-1 sm:h-1.5 bg-[#1a1a2e] rounded-full" />
                  </div>
                </div>
                <div
                  className="bg-white rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden"
                  style={{
                    width: Math.min(frameDims ? frameDims.width : 390, typeof window !== "undefined" ? window.innerWidth - 48 : 390),
                    height: frameDims ? frameDims.height : 844,
                    maxWidth: "100%",
                  }}
                >
                  <iframe
                    key={`${refreshKey}-${device}`}
                    src={liveUrl}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
                <div className="flex justify-center mt-1 sm:mt-2 pb-0.5 sm:pb-1">
                  <div className="w-20 sm:w-28 h-0.5 sm:h-1 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          )
        ) : (
          /* Empty state with quick preview option */
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-white/15" />
            </div>
            <h3 className="text-sm font-medium text-white/40 mb-1">Your Project Preview</h3>
            <p className="text-xs text-white/20 max-w-[200px] mb-4">
              Ask AI to generate code and see the live preview here, or enter your website URL
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
              onClick={async () => {
                // Fetch customer's own website URL
                try {
                  const response = await fetch("/api/sites/my-site")
                  if (response.ok) {
                    const data = await response.json()
                    if (data.siteUrl) {
                      setLiveUrl(data.siteUrl)
                      setUrlInput(data.siteUrl)
                      setPreviewUrl(data.siteUrl)
                      return
                    }
                  }
                } catch (e) {
                  console.log("[v0] No customer site found, using default")
                }
                // Fallback: prompt user to enter URL
                const url = prompt("Enter your website URL to preview:")
                if (url) {
                  const fullUrl = url.startsWith("http") ? url : `https://${url}`
                  setLiveUrl(fullUrl)
                  setUrlInput(fullUrl)
                  setPreviewUrl(fullUrl)
                }
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
