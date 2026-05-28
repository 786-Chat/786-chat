"use client"

import { SettingsLayout } from "@/components/settings/settings-layout"
import { motion } from "framer-motion"
import {
  BarChart3,
  Users,
  Globe,
  MessageSquare,
  TrendingUp,
  Clock,
  HardDrive
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function WorkspaceUsagePage() {
  // Mock usage data - in real app, fetch from API
  const usage = {
    sites: { used: 3, limit: 10 },
    storage: { used: 2.5, limit: 10 }, // GB
    apiCalls: { used: 15000, limit: 50000 },
    teamMembers: { used: 2, limit: 5 },
    orders: { used: 450, limit: 1000 },
  }

  const stats = [
    {
      icon: Globe,
      label: "Active Sites",
      value: usage.sites.used,
      limit: usage.sites.limit,
      unit: "sites",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: usage.storage.used,
      limit: usage.storage.limit,
      unit: "GB",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: MessageSquare,
      label: "API Calls",
      value: usage.apiCalls.used,
      limit: usage.apiCalls.limit,
      unit: "calls",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      icon: Users,
      label: "Team Members",
      value: usage.teamMembers.used,
      limit: usage.teamMembers.limit,
      unit: "members",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ]

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Workspace Usage</h1>
          <p className="text-muted-foreground">Monitor your workspace resource usage</p>
        </motion.div>

        {/* Current Period */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Current Billing Period
              </CardTitle>
              <CardDescription>Usage resets on the 1st of each month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">May 1, 2024 - May 31, 2024</span>
                <span className="text-muted-foreground">21 days remaining</span>
              </div>
              <Progress value={33} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {stats.map((stat, index) => {
            const percentage = (stat.value / stat.limit) * 100
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <span className="text-2xl font-bold">
                        {typeof stat.value === "number" && stat.value >= 1000
                          ? `${(stat.value / 1000).toFixed(1)}k`
                          : stat.value}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className="text-muted-foreground">
                          {stat.value} / {stat.limit} {stat.unit}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={percentage > 80 ? "[&>div]:bg-amber-500" : ""}
                      />
                      {percentage > 80 && (
                        <p className="text-xs text-amber-500">Approaching limit</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Orders This Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Orders This Month
              </CardTitle>
              <CardDescription>Track your order volume across all sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{usage.orders.used}</p>
                    <p className="text-sm text-muted-foreground">Total orders processed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-500">+23%</p>
                    <p className="text-sm text-muted-foreground">vs last month</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order limit</span>
                    <span className="text-muted-foreground">
                      {usage.orders.used} / {usage.orders.limit}
                    </span>
                  </div>
                  <Progress value={(usage.orders.used / usage.orders.limit) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Need more resources?</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade your plan to increase limits and unlock more features.
                  </p>
                </div>
                <a href="/dashboard/billing" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
                  Upgrade Plan
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SettingsLayout>
  )
}
