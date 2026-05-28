"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  Loader2,
  CreditCard
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  mrr: number
  totalChats: number
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    plan_id: string | null
    credits_added: number
    user_name: string | null
    user_email: string | null
    created_at: string
  }>
  subscriptionStats: Array<{
    plan: string
    status: string
    count: number
  }>
  topUsers: Array<{
    name: string
    email: string
    chat_count: number
    plan: string
  }>
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch revenue data
        const revenueRes = await fetch("/api/admin/revenue", { credentials: "include" })
        const revenueData = revenueRes.ok ? await revenueRes.json() : {}

        // Fetch users with real data
        const usersRes = await fetch("/api/admin/users", { credentials: "include" })
        const usersData = usersRes.ok ? await usersRes.json() : { users: [], stats: {} }

        // Fetch chats count
        const chatsRes = await fetch("/api/admin/chats", { credentials: "include" })
        const chatsData = chatsRes.ok ? await chatsRes.json() : { chats: [] }

        // Calculate active subscriptions
        const activeSubscriptions = (revenueData.subscriptionStats || [])
          .filter((s: { status: string; plan: string }) => s.status === "active" && s.plan !== "starter")
          .reduce((sum: number, s: { count: string }) => sum + parseInt(s.count), 0)

        // Get top users from real database data (sorted by chat count)
        const topUsers = (usersData.users || [])
          .sort((a: { chat_count: number }, b: { chat_count: number }) => (b.chat_count || 0) - (a.chat_count || 0))
          .slice(0, 5)
          .map((u: { name: string; email: string; plan: string; chat_count: number }) => ({
            name: u.name || "Unknown",
            email: u.email,
            chat_count: u.chat_count || 0,
            plan: u.plan || "starter"
          }))

        setStats({
          totalUsers: usersData.stats?.total_users || usersData.users?.length || 0,
          activeSubscriptions,
          totalRevenue: parseFloat(revenueData.totalRevenue) || 0,
          mrr: revenueData.mrr || 0,
          totalChats: chatsData.chats?.length || 0,
          recentTransactions: revenueData.recentTransactions || [],
          subscriptionStats: revenueData.subscriptionStats || [],
          topUsers
        })
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
        setStats({
          totalUsers: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          mrr: 0,
          totalChats: 0,
          recentTransactions: [],
          subscriptionStats: [],
          topUsers: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Real-time data from Neon database and Stripe</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="flex items-center text-xs text-green-500 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Active
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <span className="flex items-center text-xs text-green-500 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Revenue
              </span>
            </div>
            <p className="text-2xl font-bold">£{stats?.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <span className="flex items-center text-xs text-cyan-500 font-medium">
                MRR
              </span>
            </div>
            <p className="text-2xl font-bold">£{stats?.mrr.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Monthly Recurring</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
              <span className="flex items-center text-xs text-green-500 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Paid
              </span>
            </div>
            <p className="text-2xl font-bold">{stats?.activeSubscriptions}</p>
            <p className="text-sm text-muted-foreground">Active Subscriptions</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Subscription Breakdown</CardTitle>
            <CardDescription>Users by plan and status from database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {["starter", "basic", "pro", "business", "enterprise"].map((plan) => {
                const planStats = stats?.subscriptionStats.filter(s => s.plan === plan) || []
                const active = planStats.find(s => s.status === "active")?.count || 0
                const total = planStats.reduce((sum, s) => sum + parseInt(String(s.count)), 0)
                
                return (
                  <div key={plan} className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-lg font-bold capitalize">{plan}</p>
                    <p className="text-2xl font-bold text-primary">{active}</p>
                    <p className="text-xs text-muted-foreground">active of {total}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Real payments from Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {stats?.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet
                  </p>
                ) : (
                  stats?.recentTransactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        tx.type === "subscription" ? "bg-green-500" :
                        tx.type === "topup" ? "bg-purple-500" :
                        tx.type === "renewal" ? "bg-blue-500" :
                        "bg-red-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.user_email || "Unknown user"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {tx.type} {tx.plan_id && `- ${tx.plan_id}`}
                          {tx.credits_added > 0 && ` (+${tx.credits_added} credits)`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-500">
                          £{parseFloat(String(tx.amount)).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Top Users
              </CardTitle>
              <CardDescription>Most active users by chat count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users yet
                  </p>
                ) : (
                  stats?.topUsers.map((user, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                        {user.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.chat_count} chats</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          user.plan !== "starter" 
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {user.plan}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
