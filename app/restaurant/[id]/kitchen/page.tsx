"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  Truck, 
  RefreshCw,
  Loader2,
  ArrowRight,
  Package,
  AlertTriangle,
  Timer
} from "lucide-react"

interface OrderItem {
  name: string
  quantity: number
  price: number
  notes?: string
}

interface Order {
  id: string
  display_order_number: string
  customer_name: string
  customer_address: string | null
  items: OrderItem[]
  status: string
  notes: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "NEW", color: "bg-yellow-500 text-black" },
  accepted: { label: "ACCEPTED", color: "bg-blue-500 text-white" },
  preparing: { label: "COOKING", color: "bg-orange-500 text-white" },
  ready: { label: "READY", color: "bg-green-500 text-white" },
}

export default function KitchenDashboard() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siteId = params.id as string
  const pin = searchParams.get("pin")
  
  const [authenticated, setAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [pinInput, setPinInput] = useState("")
  const [staffName, setStaffName] = useState("")
  
  const [orders, setOrders] = useState<Order[]>([])
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
        body: JSON.stringify({ pin: pinToVerify, role: "kitchen" }),
      })
      if (res.ok) {
        const data = await res.json()
        setAuthenticated(true)
        setStaffName(data.name)
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

  const fetchOrders = useCallback(async () => {
    if (!authenticated) return
    
    try {
      const res = await fetch(`/api/restaurant/${siteId}/orders?role=kitchen`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }, [authenticated, siteId])

  useEffect(() => {
    if (authenticated) {
      fetchOrders()
      const interval = setInterval(fetchOrders, 15000) // Refresh every 15s for kitchen
      return () => clearInterval(interval)
    }
  }, [authenticated, fetchOrders])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/restaurant/${siteId}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Order marked as ${statusConfig[newStatus]?.label || newStatus}`)
        fetchOrders()
      }
    } catch (error) {
      toast.error("Failed to update order")
    }
  }

  const getTimeSince = (dateStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const isUrgent = (dateStr: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    return minutes > 15
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl text-white">Kitchen Display</CardTitle>
            <CardDescription>Enter your PIN to access</CardDescription>
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
            <Button onClick={handlePinSubmit} className="w-full h-12 text-lg bg-orange-500 hover:bg-orange-600" disabled={pinInput.length !== 4}>
              Start Kitchen Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === "pending")
  const acceptedOrders = orders.filter(o => o.status === "accepted")
  const preparingOrders = orders.filter(o => o.status === "preparing")
  const readyOrders = orders.filter(o => o.status === "ready")

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-zinc-400">{staffName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="border-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NEW Orders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  NEW ({pendingOrders.length})
                </h2>
              </div>
              {pendingOrders.map((order) => (
                <KitchenOrderCard 
                  key={order.id} 
                  order={order} 
                  onAccept={() => updateOrderStatus(order.id, "accepted")}
                  isUrgent={isUrgent(order.created_at)}
                  timeSince={getTimeSince(order.created_at)}
                />
              ))}
            </div>

            {/* ACCEPTED */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  ACCEPTED ({acceptedOrders.length})
                </h2>
              </div>
              {acceptedOrders.map((order) => (
                <KitchenOrderCard 
                  key={order.id} 
                  order={order} 
                  onStart={() => updateOrderStatus(order.id, "preparing")}
                  actionLabel="Start Cooking"
                  isUrgent={isUrgent(order.created_at)}
                  timeSince={getTimeSince(order.created_at)}
                />
              ))}
            </div>

            {/* COOKING */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  COOKING ({preparingOrders.length})
                </h2>
              </div>
              {preparingOrders.map((order) => (
                <KitchenOrderCard 
                  key={order.id} 
                  order={order} 
                  onComplete={() => updateOrderStatus(order.id, "ready")}
                  actionLabel="Mark Ready"
                  isUrgent={isUrgent(order.created_at)}
                  timeSince={getTimeSince(order.created_at)}
                />
              ))}
            </div>

            {/* READY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  READY ({readyOrders.length})
                </h2>
              </div>
              {readyOrders.map((order) => (
                <KitchenOrderCard 
                  key={order.id} 
                  order={order} 
                  isReady
                  timeSince={getTimeSince(order.created_at)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="text-center py-20">
            <ChefHat className="w-20 h-20 mx-auto text-zinc-700 mb-4" />
            <h2 className="text-2xl font-bold text-zinc-500">No Orders</h2>
            <p className="text-zinc-600">Waiting for new orders...</p>
          </div>
        )}
      </main>
    </div>
  )
}

function KitchenOrderCard({ 
  order, 
  onAccept, 
  onStart, 
  onComplete, 
  actionLabel,
  isReady,
  isUrgent,
  timeSince
}: { 
  order: Order
  onAccept?: () => void
  onStart?: () => void
  onComplete?: () => void
  actionLabel?: string
  isReady?: boolean
  isUrgent?: boolean
  timeSince: string
}) {
  const isDelivery = !!order.customer_address
  
  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${isUrgent ? "border-red-500 border-2" : ""} ${isReady ? "border-green-500" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono">{order.display_order_number}</span>
            {isUrgent && <AlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-zinc-500" />
            <span className={`font-mono ${isUrgent ? "text-red-500" : "text-zinc-400"}`}>{timeSince}</span>
          </div>
        </div>

        {/* Order Type */}
        <Badge variant="outline" className={isDelivery ? "border-purple-500 text-purple-400" : "border-blue-500 text-blue-400"}>
          {isDelivery ? <Truck className="w-3 h-3 mr-1" /> : <Package className="w-3 h-3 mr-1" />}
          {isDelivery ? "DELIVERY" : "COLLECTION"}
        </Badge>

        {/* Items */}
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="bg-orange-500 text-black font-bold px-2 py-1 rounded text-sm min-w-[32px] text-center">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <span className="font-medium text-lg">{item.name}</span>
                {item.notes && (
                  <p className="text-sm text-yellow-400 mt-1">* {item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
            <p className="text-sm text-yellow-400">
              <strong>NOTE:</strong> {order.notes}
            </p>
          </div>
        )}

        {/* Customer Name */}
        <div className="text-sm text-zinc-400 border-t border-zinc-800 pt-2">
          Customer: <span className="text-white font-medium">{order.customer_name}</span>
        </div>

        {/* Action Button */}
        {onAccept && (
          <Button 
            onClick={onAccept} 
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accept Order
          </Button>
        )}
        {onStart && (
          <Button 
            onClick={onStart} 
            className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700"
          >
            <ChefHat className="w-5 h-5 mr-2" />
            {actionLabel}
          </Button>
        )}
        {onComplete && (
          <Button 
            onClick={onComplete} 
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {actionLabel}
          </Button>
        )}
        {isReady && (
          <div className="text-center py-2 bg-green-500/20 rounded text-green-400 font-bold">
            READY FOR PICKUP
          </div>
        )}
      </CardContent>
    </Card>
  )
}
