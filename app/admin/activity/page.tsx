"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Activity, 
  Search, 
  Loader2,
  LogIn,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  Shield,
  Filter,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ActivityLog {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  action: string
  input_tokens?: number
  output_tokens?: number
  tokens_used?: number
  estimated_cost_gbp?: number
  created_at: string
  metadata?: Record<string, unknown>
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/activity", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      } else if (res.status === 401 || res.status === 403) {
        setError("Access denied. Admin only.")
      } else {
        setError("Failed to load activity data.")
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const filteredActivities = activities.filter(activity => {
    const action = activity.action || ""
    const matchesSearch = 
      (activity.user_email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (activity.user_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      action.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || action === actionFilter
    return matchesSearch && matchesAction
  })

  const getActionIcon = (action: string | undefined) => {
    const a = action || ""
    if (a.includes("login") || a.includes("session")) return <LogIn className="w-4 h-4" />
    if (a.includes("message") || a.includes("chat")) return <MessageSquare className="w-4 h-4" />
    if (a.includes("payment") || a.includes("subscription")) return <CreditCard className="w-4 h-4" />
    if (a.includes("error") || a.includes("fail")) return <AlertTriangle className="w-4 h-4" />
    if (a.includes("admin")) return <Shield className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getActionColor = (action: string | undefined) => {
    const a = action || ""
    if (a.includes("login") || a.includes("session")) return "bg-blue-500/10 text-blue-500"
    if (a.includes("message") || a.includes("chat") || a === "ai_message") return "bg-green-500/10 text-green-500"
    if (a.includes("payment") || a.includes("subscription")) return "bg-purple-500/10 text-purple-500"
    if (a.includes("error") || a.includes("fail")) return "bg-red-500/10 text-red-500"
    if (a.includes("admin")) return "bg-orange-500/10 text-orange-500"
    return "bg-muted text-muted-foreground"
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Unknown"
    try {
      return new Date(date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return "Invalid date"
    }
  }

  // Get unique actions for filter
  const uniqueActions = [...new Set(activities.map(a => a.action || "unknown").filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Real activity from database - logins, chats, payments, errors</p>
        </div>
        <Button onClick={fetchActivities} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Login Events</p>
            </div>
            <p className="text-2xl font-bold">
              {activities.filter(a => (a.action || "").includes("login")).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <p className="text-sm text-muted-foreground">AI Messages</p>
            </div>
            <p className="text-2xl font-bold">
              {activities.filter(a => (a.action || "") === "ai_message" || (a.action || "").includes("chat")).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <p className="text-sm text-muted-foreground">Payments</p>
            </div>
            <p className="text-2xl font-bold">
              {activities.filter(a => (a.action || "").includes("payment")).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <p className="text-2xl font-bold">
              {activities.filter(a => (a.action || "").includes("error") || (a.action || "").includes("fail")).length}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Activity List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {filteredActivities.length} activities found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-70" />
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={fetchActivities}>
                  Try Again
                </Button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No activity yet</p>
                <p className="text-sm mt-1">Activity will appear here as users interact with the platform.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {activity.user_name || activity.user_email || "System"}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                      </div>
                      {activity.user_email && activity.user_name && (
                        <p className="text-sm text-muted-foreground truncate">{activity.user_email}</p>
                      )}
                      {(activity.tokens_used ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Tokens: {activity.tokens_used?.toLocaleString()} 
                          {activity.estimated_cost_gbp && ` | Cost: £${Number(activity.estimated_cost_gbp).toFixed(4)}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
