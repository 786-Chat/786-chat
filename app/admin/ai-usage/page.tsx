"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Users,
  Zap,
  AlertTriangle,
  RefreshCw,
  Settings
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

interface DailyStats {
  date: string
  requests: number
  cost: number
  tokens: number
}

interface TopUser {
  user_id: string
  email: string
  total_requests: number
  total_tokens: number
  total_cost: number
}

interface ProviderSetting {
  provider: string
  is_enabled: boolean
  is_primary: boolean
  model: string
  input_cost_per_million: number
  output_cost_per_million: number
}

export default function AdminAIUsagePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayRequests: 0,
    todayCost: 0,
    monthRequests: 0,
    monthCost: 0,
    totalUsers: 0,
    activeSubscriptions: 0
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])
  const [providers, setProviders] = useState<ProviderSetting[]>([])
  const [budgetAlert, setBudgetAlert] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/ai-usage")
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setDailyStats(data.dailyStats || [])
        setTopUsers(data.topUsers || [])
        setProviders(data.providers || [])
        setBudgetAlert(data.stats.monthCost > 100) // Alert if over $100
      }
    } catch (error) {
      console.error("Failed to fetch AI usage data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Usage Dashboard</h1>
          <p className="text-muted-foreground">Monitor AI costs and usage across all users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Budget Alert */}
      {budgetAlert && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-600">High AI Costs Alert</h3>
                <p className="text-sm text-red-500/80">
                  Monthly AI costs have exceeded $100. Consider reviewing usage patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Requests</p>
                <p className="text-3xl font-bold">{formatNumber(stats.todayRequests)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.todayCost)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.monthCost)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active AI Plans</p>
                <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/20">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cost Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily AI Cost (Last 30 Days)</CardTitle>
            <CardDescription>Track your daily AI spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]} />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily AI Requests</CardTitle>
            <CardDescription>Number of AI requests per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users and Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top AI Users</CardTitle>
            <CardDescription>Users with highest AI usage this month</CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No usage data yet</p>
            ) : (
              <div className="space-y-3">
                {topUsers.map((user, idx) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(user.total_requests)} requests, {formatNumber(user.total_tokens)} tokens
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">{formatCurrency(user.total_cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Providers */}
        <Card>
          <CardHeader>
            <CardTitle>AI Providers</CardTitle>
            <CardDescription>Configured AI service providers</CardDescription>
          </CardHeader>
          <CardContent>
            {providers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No providers configured</p>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm capitalize">{provider.provider}</p>
                        <p className="text-xs text-muted-foreground">{provider.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.is_primary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                      <Badge variant={provider.is_enabled ? "default" : "secondary"}>
                        {provider.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
