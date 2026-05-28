"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Coins, 
  Users, 
  TrendingUp, 
  Search, 
  Plus,
  DollarSign,
  MessageCircle,
  Settings,
  Loader2,
  RefreshCw,
  Save
} from "lucide-react"

interface UserBalance {
  userId: string
  userName: string
  userEmail: string
  balance: number
  freeMessagesUsed: number
  freeMessagesLimit: number
  totalMessagesSent: number
  totalSpent: number
}

interface PricingSettings {
  costPer1000Messages: number
  freeMessagesDefault: number
  markupPercentage: number
  topupAmounts: number[]
}

interface Stats {
  totalUsers: number
  totalBalance: number
  totalSpent: number
  totalMessages: number
}

export default function AdminBalancesPage() {
  const [users, setUsers] = useState<UserBalance[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [pricing, setPricing] = useState<PricingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [addBalanceOpen, setAddBalanceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null)
  const [addAmount, setAddAmount] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/balances")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setStats(data.stats || null)
        setPricing(data.pricing || null)
      }
    } catch (error) {
      console.error("Failed to fetch balances:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBalance = async () => {
    if (!selectedUser || !addAmount) return
    
    setSaving(true)
    try {
      const res = await fetch("/api/admin/balances/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUser.userId, 
          amount: parseFloat(addAmount) 
        }),
      })

      if (res.ok) {
        setAddBalanceOpen(false)
        setSelectedUser(null)
        setAddAmount("")
        fetchData()
      } else {
        alert("Failed to add balance")
      }
    } catch (error) {
      console.error("Error adding balance:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!pricing) return
    
    setSaving(true)
    try {
      const res = await fetch("/api/admin/balances/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      })

      if (res.ok) {
        setSettingsOpen(false)
        fetchData()
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.userName?.toLowerCase().includes(search.toLowerCase()) ||
    u.userEmail?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Balances</h1>
            <p className="text-white/50 text-sm mt-1">Manage AI credits and pricing</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-white/10 text-white hover:bg-white/5">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setSettingsOpen(true)} className="bg-cyan-600 hover:bg-cyan-700">
              <Settings className="w-4 h-4 mr-2" />
              Pricing Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Total Users</p>
                    <p className="text-xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Coins className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Total Balance</p>
                    <p className="text-xl font-bold text-white">${stats.totalBalance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Total Spent</p>
                    <p className="text-xl font-bold text-white">${stats.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Total Messages</p>
                    <p className="text-xl font-bold text-white">{stats.totalMessages.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">All Users</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">User</TableHead>
                  <TableHead className="text-white/60">Free Messages</TableHead>
                  <TableHead className="text-white/60">Balance</TableHead>
                  <TableHead className="text-white/60">Total Spent</TableHead>
                  <TableHead className="text-white/60">Total Messages</TableHead>
                  <TableHead className="text-white/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userId} className="border-white/10">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{user.userName || "Unknown"}</p>
                        <p className="text-xs text-white/50">{user.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-white">
                          {user.freeMessagesUsed} / {user.freeMessagesLimit}
                        </span>
                        {user.freeMessagesUsed >= user.freeMessagesLimit && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">
                            Used
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${user.balance > 0 ? "text-green-400" : "text-white/50"}`}>
                        ${user.balance.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">${user.totalSpent.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{user.totalMessagesSent}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white hover:bg-cyan-500/20"
                        onClick={() => {
                          setSelectedUser(user)
                          setAddBalanceOpen(true)
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Balance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Balance Dialog */}
      <Dialog open={addBalanceOpen} onOpenChange={setAddBalanceOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Balance</DialogTitle>
            <DialogDescription className="text-white/50">
              Add credits to {selectedUser?.userName || selectedUser?.userEmail}&apos;s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-white/50" />
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <p className="text-xs text-white/40">
              Current balance: ${selectedUser?.balance.toFixed(2) || "0.00"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBalanceOpen(false)} className="border-white/10 text-white">
              Cancel
            </Button>
            <Button onClick={handleAddBalance} disabled={saving || !addAmount} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Pricing Settings</DialogTitle>
            <DialogDescription className="text-white/50">
              Configure AI pricing and free message limits
            </DialogDescription>
          </DialogHeader>
          {pricing && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Cost per 1,000 Messages ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={pricing.costPer1000Messages}
                  onChange={(e) => setPricing({ ...pricing, costPer1000Messages: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Free Messages per User</label>
                <Input
                  type="number"
                  value={pricing.freeMessagesDefault}
                  onChange={(e) => setPricing({ ...pricing, freeMessagesDefault: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Markup Percentage (%)</label>
                <Input
                  type="number"
                  value={pricing.markupPercentage}
                  onChange={(e) => setPricing({ ...pricing, markupPercentage: parseInt(e.target.value) || 0 })}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-white/10 text-white">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
