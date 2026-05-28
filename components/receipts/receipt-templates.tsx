"use client"

import { forwardRef } from "react"

interface OrderItem {
  name: string
  quantity: number
  price: number
  notes?: string
}

interface ReceiptData {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  currency: string
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  restaurantName: string
  restaurantLogo?: string
  restaurantPhone?: string
  restaurantAddress?: string
  orderDate: string
  orderType: "delivery" | "collection"
  driverName?: string
  driverPhone?: string
  notes?: string
  footerText?: string
  showLogo?: boolean
}

const formatCurrency = (amount: number, currency: string = "GBP") => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount / 100)
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Customer Receipt Component
export const CustomerReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-4 w-[80mm] font-mono text-xs print:block hidden"
        style={{ fontFamily: "monospace" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          {data.showLogo && data.restaurantLogo && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.restaurantLogo} alt="" className="h-12 mx-auto" />
            </div>
          )}
          <div className="text-lg font-bold">{data.restaurantName}</div>
          {data.restaurantAddress && (
            <div className="text-[10px]">{data.restaurantAddress}</div>
          )}
          {data.restaurantPhone && (
            <div className="text-[10px]">Tel: {data.restaurantPhone}</div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Order Info */}
        <div className="text-center mb-2">
          <div className="text-xl font-bold">{data.orderNumber}</div>
          <div className="uppercase font-bold mt-1">
            {data.orderType === "delivery" ? "DELIVERY" : "COLLECTION"}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Customer Details */}
        <div className="mb-2">
          <div className="font-bold">{data.customerName}</div>
          <div>{data.customerPhone}</div>
          {data.orderType === "delivery" && data.customerAddress && (
            <div className="mt-1">{data.customerAddress}</div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Items */}
        <div className="mb-2">
          {data.items.map((item, i) => (
            <div key={i} className="flex justify-between mb-1">
              <div>
                <span className="font-bold">{item.quantity}x</span> {item.name}
                {item.notes && (
                  <div className="text-[10px] italic ml-4">- {item.notes}</div>
                )}
              </div>
              <div>{formatCurrency(item.price * item.quantity, data.currency)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          {data.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>{formatCurrency(data.deliveryFee, data.currency)}</span>
            </div>
          )}
          {data.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(data.tax, data.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-400">
            <span>TOTAL:</span>
            <span>{formatCurrency(data.total, data.currency)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Payment Info */}
        <div className="text-center">
          <div className="font-bold uppercase">{data.paymentMethod}</div>
          <div className="text-[10px]">
            {data.paymentStatus === "paid" ? "PAID" : "PAYMENT PENDING"}
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <>
            <div className="border-t border-dashed border-gray-400 my-2" />
            <div className="text-[10px]">
              <span className="font-bold">Notes: </span>{data.notes}
            </div>
          </>
        )}

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Footer */}
        <div className="text-center text-[10px]">
          <div>{formatDateTime(data.orderDate)}</div>
          {data.footerText && <div className="mt-2">{data.footerText}</div>}
        </div>
      </div>
    )
  }
)
CustomerReceipt.displayName = "CustomerReceipt"

// Kitchen Ticket Component - No customer payment details
export const KitchenTicket = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-4 w-[80mm] font-mono text-xs print:block hidden"
        style={{ fontFamily: "monospace" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold">{data.orderNumber}</div>
          <div className="text-lg uppercase font-bold mt-1">
            ** {data.orderType === "delivery" ? "DELIVERY" : "COLLECTION"} **
          </div>
          <div className="text-sm mt-1">{formatDateTime(data.orderDate)}</div>
        </div>

        <div className="border-t-2 border-black my-2" />

        {/* Items - Large and clear for kitchen */}
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div key={i}>
              <div className="flex items-start gap-2 text-base font-bold">
                <span className="bg-black text-white px-2 py-1 rounded">
                  {item.quantity}x
                </span>
                <span className="uppercase">{item.name}</span>
              </div>
              {item.notes && (
                <div className="ml-10 mt-1 text-sm border-l-2 border-gray-400 pl-2">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Notes */}
        {data.notes && (
          <>
            <div className="border-t-2 border-black my-3" />
            <div className="bg-gray-200 p-2 text-sm">
              <span className="font-bold">NOTES: </span>
              {data.notes}
            </div>
          </>
        )}

        <div className="border-t-2 border-black my-3" />

        {/* Customer Name for identification */}
        <div className="text-center">
          <div className="text-sm text-gray-600">Customer:</div>
          <div className="text-lg font-bold">{data.customerName}</div>
        </div>
      </div>
    )
  }
)
KitchenTicket.displayName = "KitchenTicket"

// Driver Receipt Component
export const DriverReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-4 w-[80mm] font-mono text-xs print:block hidden"
        style={{ fontFamily: "monospace" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold">DELIVERY</div>
          <div className="text-xl font-bold mt-1">{data.orderNumber}</div>
        </div>

        <div className="border-t-2 border-black my-2" />

        {/* Delivery Address - Large and clear */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Deliver To:</div>
          <div className="text-base font-bold">{data.customerName}</div>
          <div className="text-base mt-2 p-2 bg-gray-100 border-2 border-gray-400">
            {data.customerAddress}
          </div>
        </div>

        {/* Phone - Large for easy calling */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Phone:</div>
          <div className="text-xl font-bold tracking-wider">
            {data.customerPhone}
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* Order Summary */}
        <div className="mb-2">
          <div className="text-sm text-gray-600 mb-1">Items ({data.items.length}):</div>
          {data.items.map((item, i) => (
            <div key={i} className="text-sm">
              {item.quantity}x {item.name}
            </div>
          ))}
        </div>

        {/* Delivery Notes */}
        {data.notes && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400">
            <span className="font-bold">Notes: </span>
            {data.notes}
          </div>
        )}

        <div className="border-t-2 border-black my-3" />

        {/* Payment Status */}
        <div className="text-center">
          <div className={`text-lg font-bold p-2 ${
            data.paymentStatus === "paid" 
              ? "bg-green-200 text-green-800" 
              : "bg-red-200 text-red-800"
          }`}>
            {data.paymentStatus === "paid" ? "PAID" : `COLLECT: ${formatCurrency(data.total, data.currency)}`}
          </div>
          <div className="text-sm mt-1 uppercase">{data.paymentMethod}</div>
        </div>
      </div>
    )
  }
)
DriverReceipt.displayName = "DriverReceipt"

// Print function helper
export function printReceipt(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow popups for printing")
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: monospace; font-size: 12px; }
          @media print {
            body { width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}
