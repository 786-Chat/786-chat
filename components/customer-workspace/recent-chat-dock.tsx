"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Search, Trash2 } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"

type ChatSummary = {
  id: string
  title?: string
  createdAt?: string
  messageCount?: number
  projectId?: string | null
}

type StoredChatPreferences = {
  pins: string[]
  hidden: string[]
  names: Record<string, string>
}

const emptyPreferences: StoredChatPreferences = { pins: [], hidden: [], names: {} }

export function RecentChatDock() {
  const router = useRouter()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [preferences, setPreferences] = useState<StoredChatPreferences>(emptyPreferences)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const storageKey = useMemo(
    () => `786_chat_sidebar_${user?.email?.toLowerCase() || "guest"}`,
    [user?.email]
  )

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) setPreferences({ ...emptyPreferences, ...JSON.parse(saved) })
    } catch {
      setPreferences(emptyPreferences)
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences))
  }, [preferences, storageKey])

  useEffect(() => {
    let cancelled = false

    async function loadChats() {
      setLoading(true)
      try {
        const response = await fetch("/api/chat", {
          credentials: "include",
          cache: "no-store",
        })
        if (!response.ok) throw new Error("Unable to load chats")
        const data = await response.json()
        if (!cancelled) setChats(Array.isArray(data.chats) ? data.chats : [])
      } catch {
        if (!cancelled) setChats([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadChats()
    const refresh = () => loadChats()
    window.addEventListener("chat-updated", refresh)
    return () => {
      cancelled = true
      window.removeEventListener("chat-updated", refresh)
    }
  }, [])

  const visibleChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return chats
      .filter((chat) => !preferences.hidden.includes(chat.id))
      .filter((chat) => {
        const title = preferences.names[chat.id] || chat.title || "Project chat"
        return !normalizedQuery || title.toLowerCase().includes(normalizedQuery)
      })
      .sort((a, b) => {
        const pinDifference = Number(preferences.pins.includes(b.id)) - Number(preferences.pins.includes(a.id))
        if (pinDifference) return pinDifference
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
  }, [chats, preferences, query])

  function selectChat(chat: ChatSummary) {
    const suffix = chat.projectId ? `?projectId=${encodeURIComponent(chat.projectId)}` : ""
    router.push(`/dashboard/chat${suffix}`)
    window.dispatchEvent(new CustomEvent("load-chat", { detail: { chatId: chat.id } }))
    window.dispatchEvent(new CustomEvent("chat-selected", { detail: { chatId: chat.id, projectId: chat.projectId || null } }))
    setMenuId(null)
    if (window.innerWidth < 1024) setOpen(false)
  }

  function togglePin(chatId: string) {
    setPreferences((current) => ({
      ...current,
      pins: current.pins.includes(chatId)
        ? current.pins.filter((id) => id !== chatId)
        : [...current.pins, chatId],
    }))
    setMenuId(null)
  }

  function renameChat(chat: ChatSummary) {
    const currentName = preferences.names[chat.id] || chat.title || "Project chat"
    const nextName = window.prompt("Rename conversation", currentName)?.trim()
    if (!nextName) return
    setPreferences((current) => ({
      ...current,
      names: { ...current.names, [chat.id]: nextName.slice(0, 80) },
    }))
    setMenuId(null)
  }

  function hideChat(chatId: string) {
    if (!window.confirm("Remove this conversation from your sidebar?")) return
    setPreferences((current) => ({
      ...current,
      hidden: [...new Set([...current.hidden, chatId])],
      pins: current.pins.filter((id) => id !== chatId),
    }))
    setMenuId(null)
  }

  return (
    <div className="pointer-events-none fixed inset-y-3 left-[86px] z-40 hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto absolute left-0 top-1/2 grid h-12 w-7 -translate-y-1/2 place-items-center rounded-r-xl border border-l-0 border-white/10 bg-[#0b1020]/95 text-slate-300 shadow-xl backdrop-blur-xl hover:text-white"
        aria-label={open ? "Close recent chats" : "Open recent chats"}
      >
        {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <aside
        className={`pointer-events-auto ml-7 flex h-full w-72 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080c19]/95 shadow-2xl backdrop-blur-2xl transition duration-200 ${
          open ? "translate-x-0 opacity-100" : "-translate-x-[calc(100%+1.75rem)] opacity-0"
        }`}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Recent chats</p>
              <p className="text-xs text-slate-500">Private to your account</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">
              {visibleChats.length}
            </span>
          </div>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 focus-within:border-cyan-300/30">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading && <p className="px-3 py-8 text-center text-xs text-slate-500">Loading conversations…</p>}
          {!loading && visibleChats.length === 0 && (
            <div className="px-4 py-10 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-slate-600" />
              <p className="mt-3 text-xs font-semibold text-slate-400">No matching conversations</p>
            </div>
          )}

          {visibleChats.map((chat) => {
            const pinned = preferences.pins.includes(chat.id)
            const title = preferences.names[chat.id] || chat.title || "Project chat"
            return (
              <div key={chat.id} className="group relative mb-1 rounded-xl hover:bg-white/[.045]">
                <button type="button" onClick={() => selectChat(chat)} className="flex w-full items-start gap-3 px-3 py-3 pr-10 text-left">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${pinned ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-slate-500"}`}>
                    {pinned ? <Pin className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-200">{title}</span>
                    <span className="mt-1 block text-[10px] text-slate-600">
                      {chat.messageCount || 0} messages
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenuId((value) => (value === chat.id ? null : chat.id))}
                  className="absolute right-2 top-3 grid h-7 w-7 place-items-center rounded-lg text-slate-600 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  aria-label="Conversation actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuId === chat.id && (
                  <div className="absolute right-2 top-10 z-20 w-40 rounded-xl border border-white/10 bg-[#111728] p-1.5 shadow-2xl">
                    <button onClick={() => togglePin(chat.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5">
                      {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      {pinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => renameChat(chat)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5">
                      <Pencil className="h-3.5 w-3.5" /> Rename
                    </button>
                    <button onClick={() => hideChat(chat.id)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-red-300 hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
