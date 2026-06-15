"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CreditCard,
  Zap,
  BarChart3,
  Settings,
  User,
  ChevronRight,
  ExternalLink,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

type DashboardTab = "overview" | "billing" | "usage" | "settings" | "profile"

interface DashboardPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface SubscriptionData {
  plan: string
  status: string
  messagesUsed: number
  messagesLimit: number
  currentPeriodEnd: string | null
}

export function WorkspaceDashboardPanel({ isOpen, onClose }: DashboardPanelProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview")
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSubscription = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch("/api/user/subscription", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        // Normalize snake_case from API to camelCase
        setSubscription({
          plan: data.plan || "starter",
          status: data.status || "active",
          messagesUsed: data.messagesUsed ?? data.messages_used ?? 0,
          messagesLimit: data.messagesLimit ?? data.messages_limit ?? 10,
          currentPeriodEnd: data.currentPeriodEnd ?? data.current_period_end ?? null,
        })
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) fetchSubscription()
  }, [isOpen, user, fetchSubscription])

  const tabs: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "usage", label: "Usage", icon: Zap },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const usagePercent = subscription && subscription.messagesLimit > 0
    ? Math.min(100, (subscription.messagesUsed / subscription.messagesLimit) * 100)
    : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
              <h2 className="text-sm font-semibold text-white">Dashboard</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-white/[0.06] px-4 flex gap-1 overflow-x-auto flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-cyan-400 border-cyan-400"
                      : "text-white/40 border-transparent hover:text-white/60"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Welcome */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Welcome, {user?.name?.split(" ")[0] || "User"}
                    </h3>
                    <p className="text-xs text-white/50">
                      {subscription?.plan === "starter" ? "Free Plan" : `${subscription?.plan || "Starter"} Plan`}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Messages Used</p>
                      <p className="text-lg font-bold text-white">{subscription?.messagesUsed || 0}</p>
                      <p className="text-[10px] text-white/30">of {subscription?.messagesLimit || 5}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Plan</p>
                      <p className="text-lg font-bold text-white capitalize">{subscription?.plan || "Starter"}</p>
                      <p className="text-[10px] text-white/30">{subscription?.status || "Active"}</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50">Credit Usage</span>
                      <span className="text-xs font-medium text-cyan-400">{Math.round(usagePercent)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          usagePercent >= 100 ? "bg-red-500" : usagePercent >= 80 ? "bg-yellow-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 mb-2">Quick Links</p>
                    {[
                      { label: "Manage Billing", href: "/dashboard/billing", icon: CreditCard },
                      { label: "Usage Analytics", href: "/dashboard/usage", icon: BarChart3 },
                      { label: "Profile Settings", href: "/dashboard/profile", icon: User },
                      { label: "Account Settings", href: "/dashboard/settings", icon: Settings },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors group"
                      >
                        <link.icon className="w-3.5 h-3.5" />
                        <span className="flex-1">{link.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>

                  {/* Upgrade CTA */}
                  {subscription?.plan === "starter" && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
                      <h4 className="text-sm font-semibold text-white mb-1">Upgrade your plan</h4>
                      <p className="text-xs text-white/40 mb-3">Get unlimited messages and premium features</p>
                      <Link href="/dashboard/billing" onClick={onClose}>
                        <Button className="w-full h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90">
                          <Zap className="w-3.5 h-3.5 mr-2" />
                          Upgrade Now
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white mb-3">Subscription</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">Plan</span>
                        <span className="text-xs text-white font-medium capitalize">{subscription?.plan || "Starter"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">Status</span>
                        <span className={cn(
                          "text-xs font-medium",
                          subscription?.status === "active" ? "text-green-400" : "text-yellow-400"
                        )}>
                          {subscription?.status || "Active"}
                        </span>
                      </div>
                      {subscription?.currentPeriodEnd && (
                        <div className="flex justify-between">
                          <span className="text-xs text-white/40">Renews</span>
                          <span className="text-xs text-white/70">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href="/dashboard/billing" onClick={onClose}>
                    <Button variant="outline" className="w-full h-9 text-xs border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                      <CreditCard className="w-3.5 h-3.5 mr-2" />
                      Manage Billing
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  </Link>
                </div>
              )}

              {activeTab === "usage" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h3 className="text-sm font-semibold text-white mb-3">AI Messages</h3>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-white">{subscription?.messagesUsed || 0}</span>
                      <span className="text-sm text-white/30 mb-1">/ {subscription?.messagesLimit || 5}</span>
                    </div>
                    <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full",
                          usagePercent >= 100 ? "bg-red-500" : usagePercent >= 80 ? "bg-yellow-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-white/30 mt-2">
                      {subscription?.messagesLimit ? subscription.messagesLimit - (subscription?.messagesUsed || 0) : 5} messages remaining this period
                    </p>
                  </div>
                  <Link href="/dashboard/usage" onClick={onClose}>
                    <Button variant="outline" className="w-full h-9 text-xs border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                      <BarChart3 className="w-3.5 h-3.5 mr-2" />
                      Detailed Analytics
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  </Link>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{user?.name || "User"}</h3>
                      <p className="text-xs text-white/40">{user?.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard/profile" onClick={onClose}>
                    <Button variant="outline" className="w-full h-9 text-xs border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                      <User className="w-3.5 h-3.5 mr-2" />
                      Edit Profile
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  </Link>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    {[
                      { label: "Account Settings", href: "/dashboard/settings", icon: Settings },
                      { label: "Security", href: "/dashboard/settings", icon: Shield },
                      { label: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors group"
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
