"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Truck, 
  Package, 
  Phone, 
  MapPin, 
  Navigation,
  CheckCircle,
  RefreshCw,
  Loader2,
  Clock,
  DollarSign,
  ExternalLink
} from "lucide-react"

interface OrderItem {
  name: string
  quantity: number
}

interface Order {
  id: string
  display_order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: OrderItem[]
  total: number
  currency: string
  payment_method: string
  payment_status: string
  status: string
  notes: string | null
  created_at: string
}

interface DriverStats {
  todayDeliveries: number
  todayEarnings: number
  pendingDeliveries: number
}

export default function DriverDashboard() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siteId = params.id as string
  const pin = searchParams.get("pin")
  
  const [authenticated, setAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [pinInput, setPinInput] = useState("")
  const [staffName, setStaffName] = useState("")
  const [driverId, setDriverId] = useState("")
  
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [loading, setLoading] = useState(true)

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
        body: JSON.stringify({ pin: pinToVerify, role: "driver" }),
      })
      if (res.ok) {
        const data = await res.json()
        setAuthenticated(true)
        setStaffName(data.name)
        setDriverId(data.id)
      }
    } catch (error) {
      console.error("Auth error:", error)
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
    if (!authenticated || !driverId) return
    
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/restaurant/${siteId}/orders?role=driver&driverId=${driverId}`),
        fetch(`/api/restaurant/${siteId}/driver-stats?driverId=${driverId}`),
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
    }
  }, [authenticated, siteId, driverId])

  useEffect(() => {
    if (authenticated && driverId) {
      fetchData()
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [authenticated, driverId, fetchData])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/restaurant/${siteId}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, driverId }),
      })
      if (res.ok) {
        toast.success(newStatus === "delivered" ? "Delivery completed!" : "Status updated")
        fetchData()
      }
    } catch (error) {
      toast.error("Failed to update")
    }
  }

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank")
  }

  const callCustomer = (phone: string) => {
    window.open(`tel:${phone}`, "_self")
  }

  const formatPrice = (amount: number, currency: string = "GBP") => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount / 100)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Truck className="w-10 h-10 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-white">Driver App</CardTitle>
            <CardDescription>Enter your PIN to start</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className="text-center text-3xl tracking-widest font-mono h-16 bg-zinc-800 border-zinc-700"
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            />
            <Button onClick={handlePinSubmit} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" disabled={pinInput.length !== 4}>
              Start Driving
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const readyOrders = orders.filter(o => o.status === "ready")
  const activeDeliveries = orders.filter(o => o.status === "out_for_delivery")

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold">Driver App</h1>
              <p className="text-sm text-zinc-400">{staffName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-zinc-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 text-center">
                <Truck className="w-6 h-6 mx-auto text-blue-400 mb-1" />
                <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                <p className="text-xs text-zinc-500">Today</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto text-green-400 mb-1" />
                <p className="text-2xl font-bold">{formatPrice(stats.todayEarnings)}</p>
                <p className="text-xs text-zinc-500">Earnings</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-yellow-400 mb-1" />
                <p className="text-2xl font-bold">{stats.pendingDeliveries}</p>
                <p className="text-xs text-zinc-500">Pending</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Delivery */}
        {activeDeliveries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              Active Delivery
            </h2>
            {activeDeliveries.map((order) => (
              <Card key={order.id} className="bg-blue-950 border-blue-800">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono">{order.display_order_number}</span>
                    <Badge className={order.payment_status === "paid" ? "bg-green-500" : "bg-red-500"}>
                      {order.payment_status === "paid" ? "PAID" : `COLLECT ${formatPrice(order.total)}`}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{order.customer_name}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-blue-700"
                        onClick={() => callCustomer(order.customer_phone)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                    
                    <div 
                      className="p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                      onClick={() => openMaps(order.customer_address)}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{order.customer_address}</p>
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            Tap to open in Maps
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-500" />
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="text-sm text-zinc-400">
                    {order.items.length} items: {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
                      <p className="text-sm text-yellow-400">Note: {order.notes}</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Complete Delivery
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Ready for Pickup */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-green-500" />
            Ready for Pickup ({readyOrders.length})
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : readyOrders.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center text-zinc-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No orders ready for pickup</p>
              </CardContent>
            </Card>
          ) : (
            readyOrders.map((order) => (
              <Card key={order.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold font-mono">{order.display_order_number}</span>
                      <p className="text-sm text-zinc-400">{order.customer_name}</p>
                    </div>
                    <Badge className={order.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {order.payment_status === "paid" ? "PAID" : formatPrice(order.total)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{order.customer_address}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Start Delivery
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-zinc-700"
                      onClick={() => openMaps(order.customer_address)}
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
