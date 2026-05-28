"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquare, Search, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatLog {
  id: string
  user_name: string
  user_email: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<ChatLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/admin/chats", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredChats = chats.filter(
    chat => 
      chat.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-cyan-400" />
          Chat Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          View all user chat conversations
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background/50 border-white/10"
        />
      </div>

      {/* Chats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-white/10 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Chat Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Messages</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredChats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No chats found
                    </td>
                  </tr>
                ) : (
                  filteredChats.map((chat) => (
                    <tr key={chat.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{chat.user_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{chat.user_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {chat.title || "Untitled Chat"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">
                          {chat.message_count || 0} messages
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
