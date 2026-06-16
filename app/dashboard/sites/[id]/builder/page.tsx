"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import {
  Pencil,
  Globe,
  ExternalLink,
  Loader2,
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet, // Tablet icon is already imported here
  Eye,
  Code,
  Save,
  Undo2,
  Redo2,
  Sparkles,
  MessageSquare,
  Layout,
  Palette,
  Type,
  Image as ImageIcon,
  Settings,
  Layers,
  Box,
  X,
  Check,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Site {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  is_published: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  theme_name: string
  theme_slug: string
  theme_thumbnail: string
  logo_url: string | null
  site_config: any
  site_content: any
}

const builderTools = [
  { id: "layout", label: "Layout", icon: Layout },
  { id: "content", label: "Content", icon: Type },
  { id: "design", label: "Design", icon: Palette },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "components", label: "Components", icon: Layers },
]

export default function SiteBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState("layout")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard/sites")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !siteId) return

    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/customer/sites/${siteId}`, {
          credentials: "include",
        })
        if (!res.ok) {
          if (res.status === 404) {
            setError("Site not found")
          } else {
            setError("Failed to load site")
          }
          return
        }
        const data = await res.json()
        setSite(data.site)
      } catch (err) {
        console.error("Failed to fetch site:", err)
        setError("Failed to load site")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSite()
  }, [user, siteId])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <motion.div
          className="flex flex-col items-center gap-6 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <MujeebProAILogo variant="icon" size="xl" animated={false} />
          </motion.div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <p className="text-white/50 text-sm">Loading builder...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Pencil className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {error || "Project not found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            This project does not exist or you do not have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/sites")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to My Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Builder Top Bar */}
      <div className="h-12 border-b border-white/[0.06] bg-[#0d0d14] flex items-center justify-between px-2 flex-shrink-0 z-50">
        {/* Left */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/5"
            onClick={() => router.push(`/dashboard/sites/${siteId}`)}
            title="Back to project"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Pencil className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white hidden sm:inline">
              {site.site_name}
            </span>
          </div>
          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/5"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white hover:bg-white/5"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Center - Device Switcher (only in preview mode) */}
        {viewMode === "preview" && (
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5">
            {[
              { id: "desktop" as const, icon: Monitor, label: "Desktop" },
              { id: "tablet" as const, icon: Tablet, label: "Tablet" }, // This is the tablet icon
              { id: "mobile" as const, icon: Smartphone, label: "Mobile" },
            ].map((device) => (
              <button
                key={device.id}
                onClick={() => setPreviewDevice(device.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5",
                  previewDevice === device.id
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                )}
              >
                <device.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{device.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5 hidden sm:flex">
            <button
              onClick={() => setViewMode("preview")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5",
                viewMode === "preview"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Preview</span>
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5",
                viewMode === "code"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              )}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Code</span>
            </button>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* AI Chat Button */}
          <Link href={`/dashboard/sites/${siteId}/chat`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Chat</span>
            </Button>
          </Link>

          {/* Save Button */}
          <Button
            size="sm"
            className="h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-1.5 px-3"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-12 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col items-center py-2 gap-1 flex-shrink-0">
          {builderTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                activeTool === tool.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              )}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Tool Panel (only in preview mode) */}
        {viewMode === "preview" && (
          <div className="w-64 border-r border-white/[0.06] bg-[#0a0a0f] overflow-y-auto flex-shrink-0 hidden md:block">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                {builderTools.find(t => t.id === activeTool)?.label || "Tools"}
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-white/30 text-center py-8">
                  Select elements on the canvas to edit their properties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area - Conditional: Preview or Code */}
        {viewMode === "preview" ? (
          <div className="flex-1 flex items-start justify-center overflow-auto bg-[#08080d] p-4">
            <div
              className={cn(
                "bg-white rounded-lg shadow-2xl transition-all duration-300",
                previewDevice === "desktop" && "w-full max-w-5xl min-h-[600px]",
                previewDevice === "tablet" && "w-[768px] min-h-[900px]",
                previewDevice === "mobile" && "w-[375px] min-h-[667px]",
              )}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                    <Layout className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {site.site_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {site.theme_name || "Custom Theme"} — Visual Builder
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      AI-Powered
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      <Box className="w-3 h-3" />
                      Drag & Drop
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-6 max-w-xs mx-auto">
                    Click elements on the canvas or use the AI chat to make changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Code View */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d14]">
            {/* Code Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0a0a0f]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-white/30 ml-3 font-mono">
                  {site.subdomain}.mujeebproai.com — index.html
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/20 font-mono">
                  HTML · CSS · JS
                </span>
                <button className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Code Editor Body */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
              <div className="space-y-1">
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">1</span>
                  <span className="text-gray-400">&lt;!DOCTYPE html&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">2</span>
                  <span className="text-gray-400">&lt;<span className="text-cyan-400">html</span> lang=<span className="text-green-400">"en"</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">3</span>
                  <span className="text-gray-400">&lt;<span className="text-cyan-400">head</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">4</span>
                  <span className="text-gray-400">  &lt;<span className="text-cyan-400">meta</span> charset=<span className="text-green-400">"UTF-8"</span> /&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">5</span>
                  <span className="text-gray-400">  &lt;<span className="text-cyan-400">title</span>&gt;{site.site_name}&lt;/<span className="text-cyan-400">title</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">6</span>
                  <span className="text-gray-400">  &lt;<span className="text-cyan-400">meta</span> name=<span className="text-green-400">"viewport"</span> content=<span className="text-green-400">"width=device-width, initial-scale=1.0"</span> /&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">7</span>
                  <span className="text-gray-400">  &lt;<span className="text-cyan-400">link</span> rel=<span className="text-green-400">"stylesheet"</span> href=<span className="text-green-400">"style.css"</span> /&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">8</span>
                  <span className="text-gray-400">&lt;/<span className="text-cyan-400">head</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">9</span>
                  <span className="text-gray-400">&lt;<span className="text-cyan-400">body</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">10</span>
                  <span className="text-gray-400">  &lt;<span className="text-cyan-400">div</span> id=<span className="text-green-400">"app"</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">11</span>
                  <span className="text-gray-400">    &lt;<span className="text-cyan-400">h1</span>&gt;Welcome to {site.site_name}&lt;/<span className="text-cyan-400">h1</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">12</span>
                  <span className="text-gray-400">    &lt;<span className="text-cyan-400">p</span>&gt;Built with MujeebProAI&lt;/<span className="text-cyan-400">p</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">13</span>
                  <span className="text-gray-400">  &lt;/<span className="text-cyan-400">div</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">14</span>
                  <span className="text-gray-400">&lt;/<span className="text-cyan-400">body</span>&gt;</span>
                </div>
                <div className="flex">
                  <span className="text-white/20 w-8 text-right select-none mr-4">15</span>
                  <span className="text-gray-400">&lt;/<span className="text-cyan-400">html</span>&gt;</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}