"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { 
  ShoppingBag, 
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Package,
  Phone,
  MapPin,
  Mail,
  RefreshCw,
  Filter,
  ChevronDown,
  AlertCircle,
  Printer,
  Receipt,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  customer_email: string
  customer_address: string
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  currency: string
  payment_method: string
  payment_status: string
  status: string
  notes: string
  pending_at: string
  accepted_at: string
  preparing_at: string
  ready_at: string
  out_for_delivery_at: string
  delivered_at: string
  cancelled_at: string
  cancellation_reason: string
  driver_name: string
  driver_phone: string
  estimated_delivery_time: number
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; next?: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock, next: "accepted" },
  accepted: { label: "Accepted", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle, next: "preparing" },
  preparing: { label: "Preparing", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: ChefHat, next: "ready" },
  ready: { label: "Ready", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Package, next: "out_for_delivery" },
  out_for_delivery: { label: "Out for Delivery", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", icon: Truck, next: "delivered" },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
}

export default function OrdersPage() {
  const params = useParams()
  const siteId = params.id as string
  
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [driverName, setDriverName] = useState("")
  const [driverPhone, setDriverPhone] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [updating, setUpdating] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/customer/sites/${siteId}/orders?status=${selectedStatus}`,
    fetcher,
    { refreshInterval: 30000 } // Auto refresh every 30 seconds
  )

  const orders: Order[] = data?.orders || []
  const statusCounts = data?.statusCounts || {}

  const formatCurrency = (amount: number, currency: string = "GBP") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
    }).format(amount / 100)
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, extraData?: Record<string, unknown>) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          status: newStatus,
          ...extraData,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to update order")
      
      toast.success(`Order ${newStatus === "cancelled" ? "cancelled" : "updated"} successfully`)
      mutate()
      setShowCancelDialog(false)
      setShowDeliveryDialog(false)
      setSelectedOrder(null)
    } catch {
      toast.error("Failed to update order")
    } finally {
      setUpdating(false)
    }
  }

  const handleNextStatus = (order: Order) => {
    const config = statusConfig[order.status]
    if (!config?.next) return
    
    if (config.next === "out_for_delivery") {
      setSelectedOrder(order)
      setShowDeliveryDialog(true)
    } else {
      updateOrderStatus(order.id, config.next)
    }
  }

  const handleCancel = (order: Order) => {
    setSelectedOrder(order)
    setCancellationReason("")
    setShowCancelDialog(true)
  }

  const confirmCancel = () => {
    if (!selectedOrder) return
    updateOrderStatus(selectedOrder.id, "cancelled", { cancellationReason })
  }

  const confirmDelivery = () => {
    if (!selectedOrder) return
    updateOrderStatus(selectedOrder.id, "out_for_delivery", {
      driverName,
      driverPhone,
      estimatedDeliveryTime: parseInt(estimatedTime) || null,
    })
  }

  const handlePrintReceipt = (order: Order, type: "customer" | "kitchen" | "driver") => {
    const isDelivery = !!order.customer_address
    const receiptData = {
      orderNumber: order.display_order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status || "pending",
      orderStatus: order.status,
      orderDate: order.created_at,
      orderType: isDelivery ? "delivery" : "collection",
      notes: order.notes,
      driverName: order.driver_name,
      driverPhone: order.driver_phone,
    }

    let printContent = ""
    
    if (type === "customer") {
      printContent = generateCustomerReceipt(receiptData)
    } else if (type === "kitchen") {
      printContent = generateKitchenTicket(receiptData)
    } else if (type === "driver") {
      printContent = generateDriverReceipt(receiptData)
    }

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${type === "kitchen" ? "Kitchen Ticket" : type === "driver" ? "Driver Receipt" : "Receipt"} - ${order.display_order_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Courier New', monospace; font-size: 12px; background: white; color: black; }
              @media print {
                body { width: 80mm; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} receipt printed`)
  }

  const generateCustomerReceipt = (data: Record<string, unknown>) => {
    const formatPrice = (amount: number) => `£${(amount / 100).toFixed(2)}`
    const items = data.items as OrderItem[]
    
    return `
      <div style="padding: 16px; width: 80mm;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: bold;">ORDER RECEIPT</div>
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="font-size: 24px; font-weight: bold;">${data.orderNumber}</div>
          <div style="text-transform: uppercase; font-weight: bold;">${data.orderType === "delivery" ? "DELIVERY" : "COLLECTION"}</div>
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold;">${data.customerName}</div>
          <div>${data.customerPhone}</div>
          ${data.customerAddress ? `<div style="margin-top: 4px;">${data.customerAddress}</div>` : ""}
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="margin-bottom: 8px;">
          ${items.map((item: OrderItem) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span><strong>${item.quantity}x</strong> ${item.name}</span>
              <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
            ${item.notes ? `<div style="font-size: 10px; font-style: italic; margin-left: 16px;">- ${item.notes}</div>` : ""}
          `).join("")}
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div>
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${formatPrice(data.subtotal as number)}</span></div>
          ${(data.deliveryFee as number) > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>${formatPrice(data.deliveryFee as number)}</span></div>` : ""}
          ${(data.tax as number) > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Tax:</span><span>${formatPrice(data.tax as number)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
            <span>TOTAL:</span><span>${formatPrice(data.total as number)}</span>
          </div>
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="text-align: center;">
          <div style="font-weight: bold; text-transform: uppercase;">${data.paymentMethod}</div>
        </div>
        ${data.notes ? `<hr style="border-top: 1px dashed #999; margin: 8px 0;" /><div style="font-size: 10px;"><strong>Notes:</strong> ${data.notes}</div>` : ""}
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="text-align: center; font-size: 10px;">
          <div>${new Date(data.orderDate as string).toLocaleString("en-GB")}</div>
          <div style="margin-top: 8px;">Thank you for your order!</div>
        </div>
      </div>
    `
  }

  const generateKitchenTicket = (data: Record<string, unknown>) => {
    const items = data.items as OrderItem[]
    
    return `
      <div style="padding: 16px; width: 80mm;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 28px; font-weight: bold;">${data.orderNumber}</div>
          <div style="font-size: 18px; text-transform: uppercase; font-weight: bold; margin-top: 8px;">
            ** ${data.orderType === "delivery" ? "DELIVERY" : "COLLECTION"} **
          </div>
          <div style="margin-top: 8px;">${new Date(data.orderDate as string).toLocaleString("en-GB")}</div>
        </div>
        <hr style="border-top: 2px solid #000; margin: 8px 0;" />
        <div style="margin-bottom: 12px;">
          ${items.map((item: OrderItem) => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 16px; font-weight: bold;">
                <span style="background: #000; color: #fff; padding: 4px 8px; border-radius: 4px;">${item.quantity}x</span>
                <span style="text-transform: uppercase;">${item.name}</span>
              </div>
              ${item.notes ? `<div style="margin-left: 40px; margin-top: 4px; font-size: 14px; border-left: 2px solid #999; padding-left: 8px;">${item.notes}</div>` : ""}
            </div>
          `).join("")}
        </div>
        ${data.notes ? `
          <hr style="border-top: 2px solid #000; margin: 12px 0;" />
          <div style="background: #eee; padding: 8px; font-size: 14px;">
            <strong>NOTES:</strong> ${data.notes}
          </div>
        ` : ""}
        <hr style="border-top: 2px solid #000; margin: 12px 0;" />
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #666;">Customer:</div>
          <div style="font-size: 18px; font-weight: bold;">${data.customerName}</div>
        </div>
      </div>
    `
  }

  const generateDriverReceipt = (data: Record<string, unknown>) => {
    const formatPrice = (amount: number) => `£${(amount / 100).toFixed(2)}`
    const items = data.items as OrderItem[]
    
    return `
      <div style="padding: 16px; width: 80mm;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 24px; font-weight: bold;">DELIVERY</div>
          <div style="font-size: 28px; font-weight: bold; margin-top: 4px;">${data.orderNumber}</div>
        </div>
        <hr style="border-top: 2px solid #000; margin: 8px 0;" />
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Deliver To:</div>
          <div style="font-size: 16px; font-weight: bold;">${data.customerName}</div>
          <div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border: 2px solid #999; font-size: 14px;">
            ${data.customerAddress}
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Phone:</div>
          <div style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${data.customerPhone}</div>
        </div>
        <hr style="border-top: 1px dashed #999; margin: 8px 0;" />
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Items (${items.length}):</div>
          ${items.map((item: OrderItem) => `<div style="font-size: 12px;">${item.quantity}x ${item.name}</div>`).join("")}
        </div>
        ${data.notes ? `
          <div style="margin-top: 8px; padding: 8px; background: #fef9c3; border: 1px solid #facc15;">
            <strong>Notes:</strong> ${data.notes}
          </div>
        ` : ""}
        <hr style="border-top: 2px solid #000; margin: 12px 0;" />
        <div style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold; padding: 8px; ${
            data.paymentStatus === "paid" 
              ? "background: #d1fae5; color: #065f46;" 
              : "background: #fee2e2; color: #991b1b;"
          }">
            ${data.paymentStatus === "paid" ? "PAID" : `COLLECT: ${formatPrice(data.total as number)}`}
          </div>
          <div style="font-size: 12px; margin-top: 4px; text-transform: uppercase;">${data.paymentMethod}</div>
        </div>
      </div>
    `
  }

  const totalOrders = Object.values(statusCounts).reduce((sum: number, count) => sum + (count as number), 0)
  const pendingCount = (statusCounts.pending || 0) as number
  const completedCount = (statusCounts.delivered || 0) as number
  const cancelledCount = (statusCounts.cancelled || 0) as number

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and manage customer orders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStatus("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStatus("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStatus("delivered")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedStatus("cancelled")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cancelledCount}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48 bg-card/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground/70">
                When customers place orders, they will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = config.icon
            
            return (
              <Card key={order.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{order.display_order_number}</span>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="font-medium text-foreground">{order.customer_name}</span>
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {order.customer_phone}
                          </div>
                        )}
                        {order.customer_address && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {order.customer_address.substring(0, 30)}...
                          </div>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="text-sm text-muted-foreground">
                        {(order.items as OrderItem[]).slice(0, 3).map((item, i) => (
                          <span key={i}>
                            {item.quantity}x {item.name}
                            {i < Math.min((order.items as OrderItem[]).length, 3) - 1 && ", "}
                          </span>
                        ))}
                        {(order.items as OrderItem[]).length > 3 && (
                          <span> +{(order.items as OrderItem[]).length - 3} more</span>
                        )}
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(order.total, order.currency)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.payment_method}</p>
                      </div>
                      
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <div className="flex items-center gap-2">
                          {config.next && (
                            <Button 
                              size="sm" 
                              onClick={() => handleNextStatus(order)}
                              disabled={updating}
                            >
                              {config.next === "accepted" && "Accept"}
                              {config.next === "preparing" && "Start Preparing"}
                              {config.next === "ready" && "Mark Ready"}
                              {config.next === "out_for_delivery" && "Send for Delivery"}
                              {config.next === "delivered" && "Mark Delivered"}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrintReceipt(order, "customer")}>
                                <Receipt className="w-4 h-4 mr-2" />
                                Print Customer Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintReceipt(order, "kitchen")}>
                                <FileText className="w-4 h-4 mr-2" />
                                Print Kitchen Ticket
                              </DropdownMenuItem>
                              {order.customer_address && (
                                <DropdownMenuItem onClick={() => handlePrintReceipt(order, "driver")}>
                                  <Truck className="w-4 h-4 mr-2" />
                                  Print Driver Receipt
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleCancel(order)} className="text-red-500">
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Timeline */}
                  {order.status !== "cancelled" && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto">
                        <div className={order.pending_at ? "text-foreground" : ""}>
                          Received {order.pending_at && formatTime(order.pending_at)}
                        </div>
                        <span>→</span>
                        <div className={order.accepted_at ? "text-foreground" : ""}>
                          Accepted {order.accepted_at && formatTime(order.accepted_at)}
                        </div>
                        <span>→</span>
                        <div className={order.preparing_at ? "text-foreground" : ""}>
                          Preparing {order.preparing_at && formatTime(order.preparing_at)}
                        </div>
                        <span>→</span>
                        <div className={order.ready_at ? "text-foreground" : ""}>
                          Ready {order.ready_at && formatTime(order.ready_at)}
                        </div>
                        <span>→</span>
                        <div className={order.out_for_delivery_at ? "text-foreground" : ""}>
                          Out {order.out_for_delivery_at && formatTime(order.out_for_delivery_at)}
                        </div>
                        <span>→</span>
                        <div className={order.delivered_at ? "text-green-500 font-medium" : ""}>
                          Delivered {order.delivered_at && formatTime(order.delivered_at)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Reason */}
                  {order.status === "cancelled" && order.cancellation_reason && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-start gap-2 text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Cancelled: {order.cancellation_reason}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {selectedOrder?.display_order_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cancellation Reason</label>
              <Textarea
                placeholder="Enter reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={updating}>
              {updating ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery</DialogTitle>
            <DialogDescription>
              Enter delivery details for order {selectedOrder?.display_order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Driver Name</label>
              <Input
                placeholder="Enter driver name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Driver Phone</label>
              <Input
                placeholder="Enter driver phone number"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estimated Delivery Time (minutes)</label>
              <Input
                type="number"
                placeholder="e.g. 30"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelivery} disabled={updating}>
              {updating ? "Assigning..." : "Assign & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
