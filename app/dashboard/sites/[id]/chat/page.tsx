"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  Loader2, 
  ArrowLeft,
  Globe,
  Bot,
  User,
  Sparkles,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  MessageSquare,
  Rocket,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

interface Site {
  id: string
  site_name: string
  subdomain: string
  custom_domain: string | null
  is_published: boolean
  theme_name: string
  site_config: Record<string, unknown>
  site_content: Record<string, unknown>
}

export default function ProjectChatPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [previewKey, setPreviewKey] = useState(0)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false) // Track when AI makes changes

  // Fetch site data
  const { data: siteData, mutate: mutateSite } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )
  const site: Site | null = siteData?.site || null

  // Chat with project context
  const { 
    messages, 
    input, 
    setInput, 
    handleSubmit, 
    isLoading: chatLoading,
    setMessages
  } = useChat({
    api: "/api/project-chat",
    body: {
      siteId,
      siteName: site?.site_name,
      subdomain: site?.subdomain,
      siteConfig: site?.site_config,
      siteContent: site?.site_content
    },
    onFinish: () => {
      // Refresh site data after AI makes changes
      mutateSite()
      // Refresh preview
      setPreviewKey(prev => prev + 1)
      // Mark that changes were made - needs republish
      setHasChanges(true)
    }
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Deploy/Publish function
  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploySuccess(false)
    try {
      const response = await fetch(`/api/customer/sites/${siteId}/deploy`, {
        method: "POST",
        credentials: "include"
      })
      if (response.ok) {
        setDeploySuccess(true)
        setHasChanges(false) // Reset changes after successful deploy
        mutateSite() // Refresh site data
        // Reset success state after 3 seconds
        setTimeout(() => setDeploySuccess(false), 3000)
      }
    } catch (error) {
      console.error("Deploy failed:", error)
    } finally {
      setIsDeploying(false)
    }
  }

  // Handle textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"
  }

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !chatLoading) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  const previewWidth = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px"
  }

  const previewUrl = site?.is_published 
    ? `https://${site.subdomain}.mujeebproai.com`
    : `/api/preview/site/${siteId}`

  if (authLoading || !site) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 bg-[#0d0d14] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" asChild>
            <Link href="/dashboard/sites">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sites
            </Link>
          </Button>
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-medium text-white">{site.site_name}</h1>
              <p className="text-[10px] text-white/50">{site.subdomain}.mujeebproai.com</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center border border-white/10 rounded-lg p-0.5 bg-white/5">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${previewDevice === "desktop" ? "bg-white/10 text-white" : "text-white/40"}`}
              onClick={() => setPreviewDevice("desktop")}
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${previewDevice === "tablet" ? "bg-white/10 text-white" : "text-white/40"}`}
              onClick={() => setPreviewDevice("tablet")}
            >
              <Tablet className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${previewDevice === "mobile" ? "bg-white/10 text-white" : "text-white/40"}`}
              onClick={() => setPreviewDevice("mobile")}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/50 hover:text-white"
            onClick={() => setPreviewKey(prev => prev + 1)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {site.is_published && (
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 text-white/70 hover:text-white" asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                View Live
              </a>
            </Button>
          )}

          {/* Deploy/Publish Button */}
          <Button
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`h-7 text-xs ${
              deploySuccess 
                ? "bg-green-600 hover:bg-green-500" 
                : hasChanges
                  ? "bg-orange-600 hover:bg-orange-500 animate-pulse" 
                  : site.is_published 
                    ? "bg-gray-600 hover:bg-gray-500" 
                    : "bg-cyan-600 hover:bg-cyan-500"
            }`}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Deploying...
              </>
            ) : deploySuccess ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Deployed!
              </>
            ) : hasChanges ? (
              <>
                <Rocket className="w-3 h-3 mr-1" />
                Republish Changes
              </>
            ) : (
              <>
                <Rocket className="w-3 h-3 mr-1" />
                {site.is_published ? "Published" : "Publish"}
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-[450px] flex flex-col border-r border-white/10 bg-[#0d0d14]">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
                <p className="text-xs text-white/50">Edit your site with AI</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Chat with your site</h3>
                <p className="text-sm text-white/50 max-w-xs mx-auto">
                  Ask me to change colors, update text, add sections, or anything else about your website.
                </p>
                <div className="mt-6 space-y-2">
                  {[
                    "Change the primary color to blue",
                    "Update the hero title",
                    "Make the font larger",
                    "Add a testimonials section"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="block w-full text-left px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === "user"
                        ? "bg-cyan-600 text-white"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {chatLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/10 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to change your site..."
                className="min-h-[52px] max-h-[200px] pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none rounded-xl"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || chatLoading}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
              >
                {chatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-[#1a1a24] flex items-center justify-center p-6 overflow-hidden">
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{ 
              width: previewWidth[previewDevice],
              maxWidth: "100%",
              height: previewDevice === "mobile" ? "667px" : "100%"
            }}
          >
            <iframe
              key={previewKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Site Preview"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
