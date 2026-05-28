"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  XCircle,
  Truck,
  ChefHat,
  AlertTriangle,
  CreditCard,
  Eye,
  ExternalLink,
  Bell,
  BellRing,
  Volume2,
  VolumeX
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  preparingOrders: number
  readyOrders: number
  deliveredOrders: number
  cancelledOrders: number
}

interface RecentOrder {
  id: string
  order_number: number
  display_order_number: string
  customer_name: string
  status: string
  total: number
  created_at: string
}

interface SiteInfo {
  id: string
  site_name: string
  subdomain: string
  is_active: boolean
  is_locked: boolean
  is_open: boolean
  payment_status: string
}

export default function ShopDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,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")
  }, [])

  // Play alarm sound
  const playAlarmSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    setNewOrderAlert(true)
    setTimeout(() => setNewOrderAlert(false), 5000)
  }, [soundEnabled])

  useEffect(() => {
    fetchDashboardData()
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/shop/dashboard")
      if (res.ok) {
        const data = await res.json()
        
        // Check for new orders
        if (lastOrderCount > 0 && data.stats.todayOrders > lastOrderCount) {
          playAlarmSound()
        }
        setLastOrderCount(data.stats.todayOrders || 0)
        
        setStats(data.stats)
        setRecentOrders(data.recentOrders || [])
        setSiteInfo(data.siteInfo)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP"
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
      case "confirmed": return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "preparing": return "bg-orange-500/20 text-orange-600 border-orange-500/30"
      case "ready": return "bg-purple-500/20 text-purple-600 border-purple-500/30"
      case "out_for_delivery": return "bg-cyan-500/20 text-cyan-600 border-cyan-500/30"
      case "delivered": return "bg-green-500/20 text-green-600 border-green-500/30"
      case "cancelled": return "bg-red-500/20 text-red-600 border-red-500/30"
      default: return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center gap-3"
          >
            <BellRing className="w-6 h-6 animate-bounce" />
            <span className="font-semibold text-lg">New Order Received!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Warning */}
      {siteInfo?.is_locked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-400">Payment Overdue - Site Suspended</h3>
              <p className="text-sm text-red-400/80 mt-1">
                Your website is currently unavailable to customers. Please pay your outstanding balance to reactivate.
              </p>
            </div>
            <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
              <CreditCard className="w-4 h-4" />
              Pay Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`gap-2 border-purple-500/30 ${soundEnabled ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
          {siteInfo && (
            <>
              <Badge className={siteInfo.is_open ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-700 text-slate-400"}>
                {siteInfo.is_open ? "Open" : "Closed"}
              </Badge>
              <Link href={`/site/${siteInfo.subdomain}/menu`} target="_blank">
                <Button variant="outline" size="sm" className="gap-2 border-purple-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Eye className="w-4 h-4" />
                  View Menu
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300/70">Today&apos;s Orders</p>
                  <p className="text-3xl font-bold text-blue-300">{stats?.todayOrders || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-300/70">Today&apos;s Revenue</p>
                  <p className="text-3xl font-bold text-emerald-300">{formatCurrency(stats?.todayRevenue || 0)}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-300/70">Pending</p>
                  <p className="text-3xl font-bold text-amber-300">{stats?.pendingOrders || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300/70">Preparing</p>
                  <p className="text-3xl font-bold text-purple-300">{stats?.preparingOrders || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/20">
                  <ChefHat className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900/50 border-purple-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/20">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Ready</p>
              <p className="text-xl font-bold text-purple-300">{stats?.readyOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-cyan-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-cyan-500/20">
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Out for Delivery</p>
              <p className="text-xl font-bold text-cyan-300">{stats?.deliveredOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-green-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Delivered</p>
              <p className="text-xl font-bold text-green-300">{stats?.deliveredOrders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-red-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/20">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Cancelled</p>
              <p className="text-xl font-bold text-red-300">{stats?.cancelledOrders || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-amber-200">Recent Orders</CardTitle>
            <CardDescription className="text-slate-400">Latest orders from your customers</CardDescription>
          </div>
          <Link href="/shop-dashboard/orders">
            <Button variant="outline" size="sm" className="border-purple-500/30 text-amber-400 hover:bg-amber-500/10">View All Orders</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono font-bold text-amber-400">
                      {order.display_order_number}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-semibold text-emerald-400">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
