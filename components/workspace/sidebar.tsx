"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  Zap,
  Palette,
  Upload,
  Globe,
  ExternalLink,
  FileText,
  Rocket,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatHistory {
  id: string
  title: string
  createdAt: string
  messageCount: number
}

interface UsageData {
  used: number
  limit: number
  plan: string
  balance?: number
  freeMessagesUsed?: number
  freeMessagesLimit?: number
  freeMessagesRemaining?: number
  costPerMessage?: number
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function WorkspaceSidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const fetchChatHistory = useCallback(async () => {
    if (!user) return
    try {
      const [chatResponse, balanceResponse] = await Promise.all([
        fetch("/api/chat", { credentials: "include" }),
        fetch("/api/balance", { credentials: "include" })
      ])

      if (chatResponse.ok) {
        const data = await chatResponse.json()
        setChatHistory(data.chats || [])
        
        // Merge balance data with usage
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setUsage({
  used: balanceData.freeMessagesUsed || 0,
  limit: balanceData.freeMessagesLimit || 10,
  plan: data.usage?.plan || "free",
  balance: balanceData.balance || 0,
  freeMessagesUsed: balanceData.freeMessagesUsed || 0,
  freeMessagesLimit: balanceData.freeMessagesLimit || 10,
  freeMessagesRemaining: balanceData.freeMessagesRemaining ?? 10,
  costPerMessage: balanceData.pricing?.costPerMessage || 0.0005
})
        } else if (data.usage) {
          setUsage(data.usage)
        }
      } else if (chatResponse.status === 401) {
        // Session expired, silently ignore
      }
    } catch {
      // Network error, silently ignore on mount
    }
  }, [user])

  useEffect(() => {
    if (user) fetchChatHistory()
  }, [user, fetchChatHistory])

  // Listen for chat updates
  useEffect(() => {
    const handler = () => fetchChatHistory()
    window.addEventListener("chat-updated", handler)
    return () => window.removeEventListener("chat-updated", handler)
  }, [fetchChatHistory])

  // Listen for chat selection
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.chatId) setCurrentChatId(detail.chatId)
    }
    window.addEventListener("chat-selected", handler)
    return () => window.removeEventListener("chat-selected", handler)
  }, [])

  const startNewChat = () => {
    setCurrentChatId(null)
    window.dispatchEvent(new CustomEvent("new-chat"))
  }

  const loadChat = (chatId: string) => {
    setCurrentChatId(chatId)
    window.dispatchEvent(new CustomEvent("load-chat", { detail: { chatId } }))
    // On mobile, close sidebar after selecting
    if (window.innerWidth < 768) onClose()
  }

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent loading the chat when clicking delete
    if (!confirm("Are you sure you want to delete this chat?")) return
    
    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`, {
        method: "DELETE",
        credentials: "include"
      })
      
      if (response.ok) {
        // Remove from local state
        setChatHistory(prev => prev.filter(c => c.id !== chatId))
        // If we deleted the current chat, start a new one
        if (currentChatId === chatId) {
          startNewChat()
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error)
    }
  }

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const todayChats = filteredChats.filter(c => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const olderChats = filteredChats.filter(c => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.toDateString() !== now.toDateString()
  })

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 260 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "flex-shrink-0 border-r border-purple-500/20 flex flex-col overflow-hidden backdrop-blur-xl",
          "md:relative fixed left-0 top-12 bottom-0 z-40"
        )}
        style={{ 
          background: 'linear-gradient(180deg, rgba(88, 28, 135, 0.15) 0%, rgba(15, 10, 35, 0.98) 100%)',
        }}
      >
        <div className="w-[260px] h-full flex flex-col">
          {/* New Chat Button */}
          <div className="p-3">
            <Button
              onClick={startNewChat}
              className="w-full h-9 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>

          {/* Usage Bar */}
          {usage && (
            <div className="px-3 pb-3">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
                {/* Free Messages */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Free Messages</span>
                    <span className="text-[10px] font-medium text-cyan-400">
                      {usage.freeMessagesRemaining || (usage.limit - usage.used)}/{usage.freeMessagesLimit || usage.limit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (usage.freeMessagesRemaining || 0) <= 0
                          ? "bg-red-500"
                          : (usage.freeMessagesUsed || usage.used) >= (usage.freeMessagesLimit || usage.limit) * 0.8
                          ? "bg-yellow-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500"
                      )}
                      style={{ width: `${Math.min(100, ((usage.freeMessagesUsed || usage.used) / (usage.freeMessagesLimit || usage.limit)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Balance (only show if free messages used) */}
                {usage.balance !== undefined && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <span className="text-[10px] text-white/40">Balance</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      usage.balance > 0.10 ? "text-green-400" : usage.balance > 0 ? "text-yellow-400" : "text-red-400"
                    )}>
                      ${usage.balance.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Add Credits Button */}
                <Link
                  href="/dashboard/top-up"
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 mt-2 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  Add Credits
                </Link>
              </div>
            </div>
          )}

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
            {todayChats.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 px-2 mb-1.5">Today</p>
                {todayChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-all group mb-0.5",
                      currentChatId === chat.id
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                    <Trash2 
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all flex-shrink-0"
                      onClick={(e) => deleteChat(chat.id, e)}
                    />
                  </button>
                ))}
              </div>
            )}
            
            {olderChats.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 px-2 mb-1.5">Previous</p>
                {olderChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-all group mb-0.5",
                      currentChatId === chat.id
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{chat.title}</span>
                    <Trash2 
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all flex-shrink-0"
                      onClick={(e) => deleteChat(chat.id, e)}
                    />
                  </button>
                ))}
              </div>
            )}

            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-white/20" />
                </div>
                <p className="text-xs text-white/30 mb-1">No conversations</p>
                <p className="text-[10px] text-white/20">Start a new chat to begin</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="p-3 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 mb-2">Quick Links</p>
            <div className="space-y-1">
              <Link
                href="/marketplace"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Marketplace</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/import-website"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Website</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/dashboard/imports"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Import Requests</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/dashboard/sites"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>My Websites</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
              <Link
                href="/dashboard/deployments"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Deployments</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
