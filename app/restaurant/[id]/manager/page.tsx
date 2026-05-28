"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Shield, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ChefHat, 
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Loader2,
  ArrowRight,
  Package,
  Phone,
  MapPin
} from "lucide-react"

interface Order {
  id: string
  display_order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  items: { name: string; quantity: number; price: number; notes?: string }[]
  total: number
  currency: string
  payment_method: string
  payment_status: string
  status: string
  notes: string | null
  created_at: string
  driver_name?: string
}

interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  activeOrders: number
  completedToday: number
  cancelledToday: number
}

const statusFlow = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"]
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: ChefHat },
  ready: { label: "Ready", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Package },
  out_for_delivery: { label: "Out for Delivery", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
}

export default function ManagerDashboard() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siteId = params.id as string
  const pin = searchParams.get("pin")
  
  const [authenticated, setAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [pinInput, setPinInput] = useState("")
  const [staffName, setStaffName] = useState("")
  
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Verify PIN on load
  useEffect(() => {
    if (pin) {
      verifyPin(pin)
    } else {
      setAuthLoading(false)
    }
  }, [pin, siteId])

  const verifyPin = async (pinToVerify: string) => {
    try {
      const res = await fetch(`/api/restaurant/${siteId}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToVerify, role: "manager" }),
      })
      const data = await res.json()
      if (res.ok) {
        setAuthenticated(true)
        setStaffName(data.name)
      } else {
        toast.error(data.error || "Invalid PIN")
        setPinInput("")
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast.error("Connection error. Please try again.")
      setPinInput("")
    } finally {
      setAuthLoading(false)
    }
  }

  const handlePinSubmit = () => {
    if (pinInput.length === 4) {
      verifyPin(pinInput)
    }
  }

  const fetchData = useCallback(async () => {
    if (!authenticated) return
    
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/restaurant/${siteId}/orders?role=manager`),
        fetch(`/api/restaurant/${siteId}/stats`),
      ])
      
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders || [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [authenticated, siteId])

  useEffect(() => {
    if (authenticated) {
      fetchData()
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [authenticated, fetchData])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/restaurant/${siteId}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Order status updated to ${statusConfig[newStatus]?.label || newStatus}`)
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to update order")
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus)
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1]
    }
    return null
  }

  const formatPrice = (amount: number, currency: string = "GBP") => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount / 100)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <CardTitle>Manager Dashboard</CardTitle>
            <CardDescription>Enter your 4-digit PIN to access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest font-mono"
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            />
            <Button onClick={handlePinSubmit} className="w-full" disabled={pinInput.length !== 4}>
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-bold">Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {staffName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setRefreshing(true); fetchData() }}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                    <p className="text-xs text-muted-foreground">Today&apos;s Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-2xl font-bold">{formatPrice(stats.todayRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeOrders}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.completedToday}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold">{stats.cancelledToday}</p>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Orders */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Active Orders ({activeOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const config = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = config.icon
                  const nextStatus = getNextStatus(order.status)
                  const isDelivery = !!order.customer_address
                  
                  return (
                    <div key={order.id} className="p-4 rounded-lg border bg-background/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold font-mono">{order.display_order_number}</span>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <Badge variant="outline">
                            {isDelivery ? "Delivery" : "Collection"}
                          </Badge>
                        </div>
                        <span className="text-xl font-bold">{formatPrice(order.total, order.currency)}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{order.customer_name}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </span>
                        {isDelivery && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.customer_address}
                          </span>
                        )}
                      </div>

                      <div className="text-sm">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="mr-2">
                            {item.quantity}x {item.name}
                            {idx < Math.min(order.items.length, 3) - 1 && ","}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-muted-foreground">+{order.items.length - 3} more</span>
                        )}
                      </div>

                      {nextStatus && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                          >
                            Move to {statusConfig[nextStatus]?.label}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
