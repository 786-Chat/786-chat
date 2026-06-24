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
  FolderKanban,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
  freeMessagesRemaining?: number
  costPerMessage?: number
  unlimited?: boolean
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

type DbMessage = {
  role?: string
  content?: string
  created_at?: string
}

function makeProjectChatTitle(messages: DbMessage[], fallback: string) {
  const firstUserMessage = messages.find((message) => message.role === "user")
  const title = String(firstUserMessage?.content || fallback || "Project Chat")
    .replace(/CURRENT_PREVIEW_HTML:[\s\S]*$/i, "")
    .replace(/PROJECT_FILE_SYSTEM_RULE:[\s\S]*$/i, "")
    .trim()

  return title.length > 42 ? `${title.slice(0, 42)}...` : title || "Project Chat"
}

function clearPreviewStorage() {
  if (typeof window === "undefined") return

  for (const key of Object.keys(window.localStorage)) {
    if (
      key.startsWith("mujeebproai_last_preview_html") ||
      key.includes("preview_history") ||
      key.includes("_history")
    ) {
      window.localStorage.removeItem(key)
    }
  }
}

export function WorkspaceSidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedProjectId = searchParams.get("projectId")
  const isNewProjectParam = searchParams.get("newProject") === "1"

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [localFreshNewChat, setLocalFreshNewChat] = useState(false)

  const isFreshNewProject = isNewProjectParam || localFreshNewChat

  const deletedChatKey = user?.email
    ? `mujeebproai_deleted_chats_${user.email.toLowerCase()}`
    : "mujeebproai_deleted_chats_guest"

  useEffect(() => {
    if (isNewProjectParam) {
      setLocalFreshNewChat(true)
      setCurrentChatId(null)
      setChatHistory([])
    } else if (selectedProjectId) {
      setLocalFreshNewChat(false)
    }
  }, [isNewProjectParam, selectedProjectId])

  const loadUsage = useCallback(async () => {
    if (!user) return

    try {
      const [usageResponse, balanceResponse] = await Promise.all([
        fetch("/api/usage", { credentials: "include", cache: "no-store" }),
        fetch("/api/balance", { credentials: "include", cache: "no-store" }),
      ])

      const isOwner = user.email?.toLowerCase() === "mujeeb@job4u.com"
      const usageData = usageResponse.ok ? await usageResponse.json() : null
      const balanceData = balanceResponse.ok ? await balanceResponse.json() : null

      if (!usageData) return

      const used = Number(usageData.used ?? 0)
      const limit = Number(usageData.limit ?? 10)

      setUsage({
        used,
        limit: isOwner ? 999999999 : limit,
        plan: usageData.plan || "free",
        balance: Number(balanceData?.balance ?? usageData.balance ?? 0),
        freeMessagesRemaining: isOwner
          ? 999999999
          : usageData.freeMessagesRemaining ?? Math.max(limit - used, 0),
        costPerMessage: Number(balanceData?.pricing?.costPerMessage ?? 0.0005),
        unlimited: Boolean(isOwner || usageData.unlimited),
      })
    } catch {}
  }, [user])

  const fetchChatHistory = useCallback(async () => {
    if (!user) return

    await loadUsage()

    if (isFreshNewProject) {
      setChatHistory([])
      setCurrentChatId(null)
      return
    }

    try {
      const deletedIds =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem(deletedChatKey) || "[]")
          : []

      if (selectedProjectId) {
        const response = await fetch(
          `/api/chat?projectId=${encodeURIComponent(selectedProjectId)}`,
          { credentials: "include", cache: "no-store" }
        )

        if (!response.ok) {
          setChatHistory([])
          return
        }

        const data = await response.json()
        const chatId = data.chatId ? String(data.chatId) : ""
        const messages = Array.isArray(data.messages) ? data.messages : []

        if (!chatId || deletedIds.includes(chatId)) {
          setChatHistory([])
          setCurrentChatId(null)
          return
        }

        setChatHistory([
          {
            id: chatId,
            title: makeProjectChatTitle(messages, "Project Chat"),
            createdAt:
              messages[0]?.created_at || data.createdAt || new Date().toISOString(),
            messageCount: messages.length,
          },
        ])

        setCurrentChatId((current) => current || chatId)
        return
      }

      const response = await fetch("/api/chat", {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        setChatHistory([])
        return
      }

      const data = await response.json()

      setChatHistory(
        (data.chats || []).filter(
          (chat: ChatHistory) => !deletedIds.includes(chat.id)
        )
      )
    } catch {
      setChatHistory([])
    }
  }, [user, loadUsage, deletedChatKey, isFreshNewProject, selectedProjectId])

  useEffect(() => {
    if (user) fetchChatHistory()
  }, [user, fetchChatHistory])

  useEffect(() => {
    const handler = () => fetchChatHistory()
    window.addEventListener("chat-updated", handler)
    return () => window.removeEventListener("chat-updated", handler)
  }, [fetchChatHistory])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail

      if (detail?.chatId) {
        setLocalFreshNewChat(false)
        setCurrentChatId(detail.chatId)
      }

      if (detail?.chatId === null) {
        setCurrentChatId(null)
      }
    }

    window.addEventListener("chat-selected", handler)
    return () => window.removeEventListener("chat-selected", handler)
  }, [])

  const forceNewChatState = () => {
    window.dispatchEvent(new CustomEvent("new-chat", { detail: { fresh: true } }))
    window.dispatchEvent(new CustomEvent("preview-cleared", { detail: { fresh: true } }))
    window.dispatchEvent(
      new CustomEvent("chat-selected", { detail: { chatId: null, projectId: null } })
    )
    window.dispatchEvent(new Event("preview-history-changed"))
  }

  const startNewChat = () => {
    const freshUrl = `/dashboard/chat?newProject=1&fresh=${Date.now()}`

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", freshUrl)
      window.dispatchEvent(new PopStateEvent("popstate"))
    }

    setLocalFreshNewChat(true)
    setCurrentChatId(null)
    setChatHistory([])
    setSearchQuery("")
    clearPreviewStorage()

    forceNewChatState()

    router.replace(freshUrl, {
      scroll: false,
    })

    if (typeof window !== "undefined" && window.innerWidth < 768) onClose()
  }

  const loadChat = (chatId: string) => {
    setLocalFreshNewChat(false)
    setCurrentChatId(chatId)

    if (typeof window !== "undefined" && isFreshNewProject) {
      window.history.pushState({}, "", "/dashboard/chat")
      window.dispatchEvent(new PopStateEvent("popstate"))
    }

    window.dispatchEvent(new CustomEvent("load-chat", { detail: { chatId } }))
    if (typeof window !== "undefined" && window.innerWidth < 768) onClose()
  }

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const deletedIds = JSON.parse(localStorage.getItem(deletedChatKey) || "[]")
    const nextDeletedIds = Array.from(new Set([...deletedIds, chatId]))

    localStorage.setItem(deletedChatKey, JSON.stringify(nextDeletedIds))
    setChatHistory((prev) => prev.filter((c) => c.id !== chatId))

    if (currentChatId === chatId) setCurrentChatId(null)
  }

  const visibleChatHistory = isFreshNewProject ? [] : chatHistory

  const filteredChats = visibleChatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const todayChats = filteredChats.filter((c) => {
    const d = new Date(c.createdAt)
    return d.toDateString() === new Date().toDateString()
  })

  const olderChats = filteredChats.filter((c) => {
    const d = new Date(c.createdAt)
    return d.toDateString() !== new Date().toDateString()
  })

  return (
    <>
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
          background:
            "linear-gradient(180deg, rgba(88, 28, 135, 0.15) 0%, rgba(15, 10, 35, 0.98) 100%)",
        }}
      >
        <div className="w-[260px] h-full flex flex-col">
          <div className="p-3">
            <Button
              onClick={startNewChat}
              className="w-full h-9 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  selectedProjectId && !isFreshNewProject
                    ? "Search project chat..."
                    : "Search chats..."
                }
                className="w-full h-8 pl-8 pr-3 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>

          {usage && (
            <div className="px-3 pb-3">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      Messages
                    </span>
                    <span className="text-[10px] font-medium text-cyan-400">
                      {usage.unlimited
                        ? "Unlimited"
                        : `Used: ${usage.used}/${usage.limit}`}
                    </span>
                  </div>

                  {!usage.unlimited && (
                    <>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            (usage.freeMessagesRemaining ?? 0) <= 0
                              ? "bg-red-500"
                              : usage.used >= usage.limit * 0.8
                              ? "bg-yellow-500"
                              : "bg-gradient-to-r from-cyan-500 to-blue-500"
                          )}
                          style={{
                            width: `${Math.min(
                              100,
                              (usage.used / usage.limit) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-white/40">
                        Remaining:{" "}
                        {usage.freeMessagesRemaining ??
                          Math.max(usage.limit - usage.used, 0)}
                      </p>
                    </>
                  )}
                </div>

                {!usage.unlimited && usage.balance !== undefined && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <span className="text-[10px] text-white/40">Balance</span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        usage.balance > 0.1
                          ? "text-green-400"
                          : usage.balance > 0
                          ? "text-yellow-400"
                          : "text-red-400"
                      )}
                    >
                      ${usage.balance.toFixed(2)}
                    </span>
                  </div>
                )}

                {!usage.unlimited && (
                  <Link
                    href="/dashboard/top-up"
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 mt-2 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
                  >
                    <Zap className="w-3 h-3" />
                    Add Credits
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
            {todayChats.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-white/30 px-2 mb-1.5">
                  Today
                </p>
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
                <p className="text-[10px] uppercase tracking-wider text-white/30 px-2 mb-1.5">
                  Previous
                </p>
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
                <p className="text-[10px] text-white/20">
                  Start a new chat to begin
                </p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 mb-2">
              Quick Links
            </p>
            <div className="space-y-1">
              <Link
                href="/dashboard/projects"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>My Projects</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>

              <Link
                href="/themes"
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
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
