"use client"

import { useParams } from "next/navigation"
import { useState, useRef } from "react"
import { 
  ChefHat, 
  Clock,
  CheckCircle,
  RefreshCw,
  Printer,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KitchenTicket, printReceipt } from "@/components/receipts/receipt-templates"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

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
  customer_phone: string
  customer_address: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  currency: string
  payment_method: string
  status: string
  notes: string
  pending_at: string
  accepted_at: string
  preparing_at: string
  ready_at: string
  created_at: string
}

const statusColors: Record<string, string> = {
  accepted: "bg-blue-500",
  preparing: "bg-purple-500",
  ready: "bg-green-500",
}

export default function KitchenDisplayPage() {
  const params = useParams()
  const siteId = params.id as string
  
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const printRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const { data, error, isLoading, mutate } = useSWR(
    `/api/customer/sites/${siteId}/orders?status=accepted,preparing,ready`,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds for kitchen
  )

  const { data: siteData } = useSWR(
    `/api/customer/sites/${siteId}`,
    fetcher
  )

  const orders: Order[] = data?.orders || []
  const site = siteData?.site

  // Group orders by status
  const acceptedOrders = orders.filter(o => o.status === "accepted")
  const preparingOrders = orders.filter(o => o.status === "preparing")
  const readyOrders = orders.filter(o => o.status === "ready")

  const getTimeSinceOrder = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      
      if (!res.ok) throw new Error("Failed to update")
      
      toast.success("Order updated")
      mutate()
    } catch {
      toast.error("Failed to update order")
    } finally {
      setUpdating(null)
    }
  }

  const handlePrintKitchenTicket = (order: Order) => {
    // Create temporary print element
    const printDiv = document.createElement("div")
    printDiv.id = `kitchen-ticket-${order.id}`
    printDiv.innerHTML = `
      <div style="font-family: monospace; font-size: 12px; width: 80mm; padding: 16px; background: white; color: black;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 24px; font-weight: bold;">${order.display_order_number}</div>
          <div style="font-size: 18px; text-transform: uppercase; font-weight: bold; margin-top: 8px;">
            ** ${order.customer_address ? "DELIVERY" : "COLLECTION"} **
          </div>
          <div style="font-size: 14px; margin-top: 8px;">
            ${new Date(order.created_at).toLocaleString("en-GB")}
          </div>
        </div>
        <hr style="border-top: 2px solid black; margin: 8px 0;" />
        <div style="margin-bottom: 12px;">
          ${(order.items as OrderItem[]).map(item => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 16px; font-weight: bold;">
                <span style="background: black; color: white; padding: 4px 8px; border-radius: 4px;">
                  ${item.quantity}x
                </span>
                <span style="text-transform: uppercase;">${item.name}</span>
              </div>
              ${item.notes ? `<div style="margin-left: 40px; margin-top: 4px; font-size: 14px; border-left: 2px solid #999; padding-left: 8px;">${item.notes}</div>` : ""}
            </div>
          `).join("")}
        </div>
        ${order.notes ? `
          <hr style="border-top: 2px solid black; margin: 12px 0;" />
          <div style="background: #eee; padding: 8px; font-size: 14px;">
            <span style="font-weight: bold;">NOTES: </span>${order.notes}
          </div>
        ` : ""}
        <hr style="border-top: 2px solid black; margin: 12px 0;" />
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #666;">Customer:</div>
          <div style="font-size: 18px; font-weight: bold;">${order.customer_name}</div>
        </div>
      </div>
    `
    document.body.appendChild(printDiv)
    
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kitchen Ticket - ${order.display_order_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: monospace; }
              @media print {
                body { width: 80mm; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>${printDiv.innerHTML}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
    
    document.body.removeChild(printDiv)
    toast.success("Kitchen ticket printed")
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const OrderCard = ({ order, showActions = true }: { order: Order; showActions?: boolean }) => {
    const isDelivery = !!order.customer_address
    const timeSince = getTimeSinceOrder(order.created_at)
    const isUrgent = parseInt(timeSince) > 15

    return (
      <Card className={`bg-card/80 border-2 ${isUrgent && order.status !== "ready" ? "border-red-500 animate-pulse" : "border-border/50"}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold">{order.display_order_number}</span>
              <Badge variant="outline" className={isDelivery ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}>
                {isDelivery ? "DELIVERY" : "COLLECTION"}
              </Badge>
            </div>
            <div className={`flex items-center gap-1 text-sm ${isUrgent ? "text-red-500" : "text-muted-foreground"}`}>
              <Clock className="w-4 h-4" />
              {timeSince}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {(order.items as OrderItem[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-bold">
                  {item.quantity}x
                </span>
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {item.notes && (
                    <p className="text-xs text-yellow-400 mt-0.5">Note: {item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-4 text-sm">
              <span className="font-bold text-yellow-500">Notes: </span>
              {order.notes}
            </div>
          )}

          {/* Customer */}
          <div className="text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{order.customer_name}</span>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              {order.status === "accepted" && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => updateOrderStatus(order.id, "preparing")}
                  disabled={updating === order.id}
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Start Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateOrderStatus(order.id, "ready")}
                  disabled={updating === order.id}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Ready
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePrintKitchenTicket(order)}
              >
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            Kitchen Display
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time order management for kitchen staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accepted / New Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${statusColors.accepted}`} />
            <h2 className="font-semibold">New Orders ({acceptedOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {acceptedOrders.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No new orders
                </CardContent>
              </Card>
            ) : (
              acceptedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Preparing */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${statusColors.preparing}`} />
            <h2 className="font-semibold">Preparing ({preparingOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {preparingOrders.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No orders preparing
                </CardContent>
              </Card>
            ) : (
              preparingOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>

        {/* Ready */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${statusColors.ready}`} />
            <h2 className="font-semibold">Ready ({readyOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No orders ready
                </CardContent>
              </Card>
            ) : (
              readyOrders.map(order => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Audio element for new order sound */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />
    </div>
  )
}
