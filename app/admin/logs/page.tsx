"use client"

import { useState, useEffect } from "react"
import { 
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface AdminLog {
  id: string
  admin_id: string
  admin_email: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  details: Record<string, unknown>
  ip_address: string
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  theme_created: "bg-green-500/10 text-green-500 border-green-500/20",
  theme_edited: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  theme_duplicated: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  theme_deleted: "bg-red-500/10 text-red-500 border-red-500/20",
  site_suspended: "bg-red-500/10 text-red-500 border-red-500/20",
  site_activated: "bg-green-500/10 text-green-500 border-green-500/20",
  site_theme_changed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  modules_changed: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  password_reset: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  domain_changed: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
}

const ACTION_LABELS: Record<string, string> = {
  theme_created: "Theme Created",
  theme_edited: "Theme Edited",
  theme_duplicated: "Theme Duplicated",
  theme_deleted: "Theme Deleted",
  site_suspended: "Site Suspended",
  site_activated: "Site Activated",
  site_theme_changed: "Theme Changed",
  modules_changed: "Modules Changed",
  password_reset: "Password Reset",
  domain_changed: "Domain Changed",
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/logs")
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast.error("Failed to load admin logs")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
    return matchesSearch && matchesAction && matchesEntity
  })

  const uniqueActions = [...new Set(logs.map(l => l.action))]
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all admin actions and changes
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ScrollText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ScrollText className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action.includes("created")).length}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ScrollText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action.includes("edited") || l.action.includes("changed")).length}
                </p>
                <p className="text-xs text-muted-foreground">Modified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <ScrollText className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action.includes("deleted") || l.action.includes("suspended")).length}
                </p>
                <p className="text-xs text-muted-foreground">Deleted/Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by admin, entity, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map(entity => (
              <SelectItem key={entity} value={entity}>
                {entity.charAt(0).toUpperCase() + entity.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card className="bg-card/50 border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p>{new Date(log.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{log.admin_email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={ACTION_COLORS[log.action] || "bg-muted"}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{log.entity_name || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {log.details && Object.keys(log.details).length > 0 ? (
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No logs found</p>
          </div>
        )}
      </Card>
    </div>
  )
}
