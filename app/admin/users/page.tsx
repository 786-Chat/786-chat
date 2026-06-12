"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Search, 
  MoreVertical,
  Mail,
  Ban,
  Trash2,
  Crown,
  Loader2,
  CheckCircle,
  Plus,
  RefreshCw,
  UserCheck,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string
  email: string
  role: string | null
  plan: string | null
  email_verified: boolean
  created_at: string
  updated_at: string
  subscription_status: string | null
  messages_used: number | null
  messages_limit: number | null
  extra_credits: number | null
  daily_messages_used: number | null
  stripe_customer_id: string | null
  current_period_end: string | null
  free_messages_used: number | null
  free_messages_limit: number | null
  chat_count: number
  message_count: number
}

interface Stats {
  total_users: number
  paid_users: number
  new_users_30d: number
  new_users_7d: number
}

const OWNER_EMAIL = "mujeeb@job4u.com"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialog states
  const [addCreditsDialog, setAddCreditsDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [changePlanDialog, setChangePlanDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [creditsToAdd, setCreditsToAdd] = useState("100")
  const [newPlan, setNewPlan] = useState("starter")

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAction = async (userId: string, action: string, data?: Record<string, unknown>) => {
    setActionLoading(userId + action)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action, data })
      })
      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Action failed:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string) => {
    setActionLoading(userId + "delete")
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (res.ok) {
        setDeleteDialog({ open: false, user: null })
        fetchUsers()
      }
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                         (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    const matchesPlan = planFilter === "all" || user.plan === planFilter
    const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter
    return matchesSearch && matchesPlan && matchesStatus
  })

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500"
      case "suspended": return "bg-red-500/10 text-red-500"
      case "canceled": return "bg-yellow-500/10 text-yellow-500"
      case "trialing": return "bg-blue-500/10 text-blue-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPlanColor = (plan: string | null) => {
    switch (plan) {
      case "pro": return "bg-primary/10 text-primary"
      case "business": return "bg-purple-500/10 text-purple-500"
      case "enterprise": return "bg-orange-500/10 text-orange-500"
      case "basic": return "bg-cyan-500/10 text-cyan-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  // Format the Messages column display
  const formatMessages = (user: User) => {
    // Owner gets "Unlimited"
    if (user.email === OWNER_EMAIL) {
      return <span className="font-medium text-primary">Unlimited</span>
    }

    // Normal customers: free_messages_used / free_messages_limit
    const used = user.free_messages_used ?? 0
    const limit = user.free_messages_limit ?? 10

    return (
      <>
        <span className="font-medium">{used}</span>
        <span className="text-muted-foreground">/{limit}</span>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage registered users from database</p>
        </div>
        <Button onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats?.paid_users || 0}</p>
            <p className="text-sm text-muted-foreground">Paid Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats?.new_users_7d || 0}</p>
            <p className="text-sm text-muted-foreground">New (7 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats?.new_users_30d || 0}</p>
            <p className="text-sm text-muted-foreground">New (30 days)</p>
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Messages</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Credits</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                              {user.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name || "No name"}</p>
                                {user.role === "admin" && (
                                  <Shield className="w-4 h-4 text-red-500" />
                                )}
                                {user.email_verified && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPlanColor(user.plan)}`}>
                            {user.plan || "starter"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(user.subscription_status)}`}>
                            {user.subscription_status || "none"}
                          </span>
                        </td>
                        <td className="p-4">
                          {formatMessages(user)}
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{user.extra_credits || 0}</span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setNewPlan(user.plan || "starter")
                                setChangePlanDialog({ open: true, user })
                              }}>
                                <Crown className="w-4 h-4 mr-2" />
                                Change Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAddCreditsDialog({ open: true, user })}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Credits
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(user.id, "reset_usage")}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset Usage
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.subscription_status === "suspended" ? (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "activate")}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  className="text-orange-500"
                                  onClick={() => handleAction(user.id, "suspend")}
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, user })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditsDialog.open} onOpenChange={(open) => setAddCreditsDialog({ open, user: open ? addCreditsDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add extra message credits to {addCreditsDialog.user?.name || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits to add</Label>
              <Input
                id="credits"
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCreditsDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (addCreditsDialog.user) {
                  handleAction(addCreditsDialog.user.id, "add_credits", { credits: parseInt(creditsToAdd) })
                  setAddCreditsDialog({ open: false, user: null })
                }
              }}
              disabled={actionLoading === addCreditsDialog.user?.id + "add_credits"}
            >
              {actionLoading === addCreditsDialog.user?.id + "add_credits" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialog.open} onOpenChange={(open) => setChangePlanDialog({ open, user: open ? changePlanDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Change subscription plan for {changePlanDialog.user?.name || "user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Select Plan</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (Free)</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (changePlanDialog.user) {
                  handleAction(changePlanDialog.user.id, "change_plan", { newPlan })
                  setChangePlanDialog({ open: false, user: null })
                }
              }}
              disabled={actionLoading === changePlanDialog.user?.id + "change_plan"}
            >
              {actionLoading === changePlanDialog.user?.id + "change_plan" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: open ? deleteDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteDialog.user?.name || "this user"}? This action cannot be undone.
              All user data including chats, messages, and subscriptions will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteDialog.user) {
                  handleDelete(deleteDialog.user.id)
                }
              }}
              disabled={actionLoading === deleteDialog.user?.id + "delete"}
            >
              {actionLoading === deleteDialog.user?.id + "delete" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
