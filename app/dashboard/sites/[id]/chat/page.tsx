"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import {
  MessageSquare,
  Globe,
  ExternalLink,
  Loader2,
  ChevronLeft,
  Bot,
  User,
  ArrowUp,
  Sparkles,
  StopCircle,
  Copy,
  Check,
  RefreshCw,
  ImagePlus,
  Paperclip,
  FileText,
  X,
  Eye,
  Code,
  Zap,
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

export default function SiteChatPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
            <p className="text-white/50 text-sm">Loading project workspace...</p>
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
            <MessageSquare className="w-8 h-8 text-red-400" />
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
      {/* Project Context Header */}
      <div className="border-b border-white/[0.06] bg-[#0d0d14]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 flex-shrink-0"
              onClick={() => router.push("/dashboard/sites")}
              title="Back to My Projects"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-white truncate">
                  {site.site_name}
                </h1>
                <p className="text-xs text-white/40 truncate flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {site.subdomain}.mujeebproai.com
                  {site.is_published && (
                    <span className="text-green-400 ml-1">• Live</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/dashboard/sites/${siteId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-white/50 hover:text-white hover:bg-white/5"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Overview
              </Button>
            </Link>
            {site.is_published && (
              <a
                href={`https://${site.subdomain}.mujeebproai.com`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View Live
                </Button>
              </a>
            )}
            <Link href={`/dashboard/sites/${siteId}/builder`}>
              <Button
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                <Code className="w-3.5 h-3.5 mr-1.5" />
                Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Project Info Bar */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0f]/80">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-4 text-xs text-white/30">
          <span>
            Theme: <span className="text-white/50">{site.theme_name || "Custom"}</span>
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span>
            Status:{" "}
            <span className={site.is_published ? "text-green-400" : "text-yellow-400"}>
              {site.is_published ? "Published" : "Draft"}
            </span>
          </span>
          {site.custom_domain && (
            <>
              <span className="w-px h-3 bg-white/10" />
              <span>
                Domain: <span className="text-white/50">{site.custom_domain}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative" 
          style={{ 
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(10, 15, 30, 0.98) 100%)',
          }}
        >
          {/* Empty Chat State */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center max-w-lg w-full"
            >
              <div className="flex justify-center mb-6">
                <MujeebProAILogo variant="icon" size="xl" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Building <span className="text-cyan-400">{site.site_name}</span>
              </h2>
              <p className="text-sm text-white/40 mb-2">
                Ask MujeebProAI to edit your website content, design, or code.
              </p>
              <p className="text-xs text-white/25 mb-8">
                Project: {site.subdomain}.mujeebproai.com
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  "Update the hero section",
                  "Change color scheme",
                  "Add a new page",
                  "Optimize for mobile",
                ].map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 text-left text-xs rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 text-white/60 hover:text-white/90 transition-all"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Input Area */}
          <div className="border-t border-white/[0.06] p-3 sm:p-4 bg-[#0a0a0f] relative z-10 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end bg-white/[0.03] border border-white/[0.08] rounded-2xl focus-within:border-cyan-500/30 transition-colors overflow-hidden">
                <div className="flex items-center gap-0.5 pl-2 pb-2 pt-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    title="Attach image"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder={`Ask AI to edit ${site.site_name}...`}
                  className="flex-1 min-h-[44px] max-h-[200px] px-3 sm:px-2 py-3 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none overflow-y-auto"
                  rows={1}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-xl m-1.5 flex-shrink-0 bg-cyan-500 hover:bg-cyan-400 transition-all duration-300"
                >
                  <ArrowUp className="w-4 h-4 text-white" />
                </Button>
              </div>
              <p className="text-[10px] text-white/25 text-center mt-2">
                MujeebProAI may produce inaccurate information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
