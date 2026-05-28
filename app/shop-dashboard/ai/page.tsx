"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Code, 
  FileText, 
  Globe,
  Utensils,
  TrendingUp,
  Zap,
  History,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ChevronUp
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AIUsage {
  requestsUsed: number
  requestsLimit: number
  requestsPercentage: number
  tokensUsed: number
  tokensLimit: number
  tokensPercentage: number
  totalCost: string
}

interface AIPlan {
  name: string
  monthlyRequests: number
  monthlyTokens: number
  maxOutputTokens: number
  features: string[]
}

interface RecentRequest {
  id: string
  request_type: string
  input_tokens: number
  output_tokens: number
  cost_usd: string
  created_at: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  type?: string
}

const requestTypes = [
  { id: "chat", name: "General Chat", icon: MessageSquare, description: "General conversation and questions" },
  { id: "website_edit", name: "Website Edit", icon: Globe, description: "Modify your website content" },
  { id: "menu_help", name: "Menu Writing", icon: Utensils, description: "Create menus and navigation" },
  { id: "business_content", name: "Business Content", icon: FileText, description: "Product descriptions, blogs, etc." },
  { id: "code_help", name: "Code Help", icon: Code, description: "HTML, CSS, JavaScript assistance" },
]

export default function CustomerAIDashboard() {
  const [plan, setPlan] = useState<AIPlan | null>(null)
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState("chat")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsageData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchUsageData = async () => {
    try {
      const res = await fetch("/api/ai")
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan || {
          name: "Free Trial",
          monthlyRequests: 50,
          monthlyTokens: 100000,
          maxOutputTokens: 2000,
          features: ["chat"]
        })
        setUsage(data.usage || {
          requestsUsed: 0,
          requestsLimit: 50,
          requestsPercentage: 0,
          tokensUsed: 0,
          tokensLimit: 100000,
          tokensPercentage: 0,
          totalCost: "0.00"
        })
        setRecentRequests(data.recentRequests || [])
      } else {
        // Set default free tier if API fails
        setPlan({
          name: "Free Trial",
          monthlyRequests: 50,
          monthlyTokens: 100000,
          maxOutputTokens: 2000,
          features: ["chat"]
        })
        setUsage({
          requestsUsed: 0,
          requestsLimit: 50,
          requestsPercentage: 0,
          tokensUsed: 0,
          tokensLimit: 100000,
          tokensPercentage: 0,
          totalCost: "0.00"
        })
      }
    } catch (error) {
      console.error("Failed to fetch AI usage:", error)
      // Set default free tier on error
      setPlan({
        name: "Free Trial",
        monthlyRequests: 50,
        monthlyTokens: 100000,
        maxOutputTokens: 2000,
        features: ["chat"]
      })
      setUsage({
        requestsUsed: 0,
        requestsLimit: 50,
        requestsPercentage: 0,
        tokensUsed: 0,
        tokensLimit: 100000,
        tokensPercentage: 0,
        totalCost: "0.00"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || sending) return

    const userMessage = message.trim()
    setMessage("")
    setMessages(prev => [...prev, { role: "user", content: userMessage, type: activeType }])
    setSending(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeType, message: userMessage })
      })

      const data = await res.json()

      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }])
        // Update usage
        if (data.usage) {
          setUsage(prev => prev ? {
            ...prev,
            requestsUsed: data.usage.requestsUsed,
            tokensUsed: data.usage.tokensUsed,
            requestsPercentage: Math.round((data.usage.requestsUsed / data.usage.requestsLimit) * 100),
            tokensPercentage: Math.round((data.usage.tokensUsed / data.usage.tokensLimit) * 100)
          } : null)
        }
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.error || "Sorry, something went wrong. Please try again." 
        }])
      }
    } catch {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Network error. Please check your connection and try again." 
      }])
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <p className="text-slate-400">Powered by DeepSeek AI</p>
        </div>
        {plan && (
          <Badge className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border-amber-500/30">
            {plan.name} Plan
          </Badge>
        )}
      </div>

      {/* Usage Stats */}
      {usage && plan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Requests Used</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-300">
                {formatNumber(usage.requestsUsed)} / {formatNumber(usage.requestsLimit)}
              </p>
              <Progress value={usage.requestsPercentage} className="mt-2 h-2" />
              <p className="text-xs text-slate-500 mt-1">{usage.requestsPercentage}% used this month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Tokens Used</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-300">
                {formatNumber(usage.tokensUsed)} / {formatNumber(usage.tokensLimit)}
              </p>
              <Progress value={usage.tokensPercentage} className="mt-2 h-2" />
              <p className="text-xs text-slate-500 mt-1">{usage.tokensPercentage}% used this month</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Estimated Cost</span>
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-300">${usage.totalCost}</p>
              <p className="text-xs text-slate-500 mt-3">This month&apos;s API usage cost</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Chat Area */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="bg-slate-900/50 border border-purple-500/20 p-1">
          <TabsTrigger value="chat" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <Bot className="w-4 h-4 mr-2" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          {/* Request Type Selector */}
          <div className="flex flex-wrap gap-2">
            {requestTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeType === type.id
                      ? "bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.name}
                </button>
              )
            })}
          </div>

          {/* Chat Messages */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="p-4">
              <div className="h-96 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Bot className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-400">Start a conversation</h3>
                    <p className="text-sm text-slate-500 max-w-md mt-2">
                      Ask me anything! I can help with website edits, content writing, menu creation, and code assistance.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900"
                            : "bg-slate-800 text-slate-200"
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          {msg.role === "assistant" && (
                            <button
                              onClick={() => copyToClipboard(msg.content, `msg-${idx}`)}
                              className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400"
                            >
                              {copied === `msg-${idx}` ? (
                                <><Check className="w-3 h-3" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {sending && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 rounded-2xl px-4 py-3">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`Ask about ${requestTypes.find(t => t.id === activeType)?.description.toLowerCase()}...`}
                  className="flex-1 min-h-[60px] max-h-32 bg-slate-800/50 border-purple-500/30 text-slate-200 placeholder:text-slate-500 resize-none"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-6"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-amber-200">Recent AI Requests</CardTitle>
              <CardDescription className="text-slate-400">Your latest AI interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No AI requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                          {req.request_type.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {req.input_tokens + req.output_tokens} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-400">${Number(req.cost_usd).toFixed(4)}</span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
