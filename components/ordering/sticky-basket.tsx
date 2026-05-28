"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Truck,
  Info,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  menuItem: {
    id: string
    name: string
    image_url: string | null
    price: number
  }
  quantity: number
  selectedVariant?: { id: string; name: string; price: number }
  selectedAddons: Array<{ id: string; name: string; price: number; groupName: string }>
  specialInstructions?: string
  totalPrice: number
}

interface StickyBasketProps {
  cart: CartItem[]
  orderType: "delivery" | "collection"
  subtotal: number
  deliveryFee: number
  vatAmount: number
  vatPercentage: number
  serviceCharge: number
  total: number
  minimumOrder: number
  freeDeliveryAbove: number | null
  primaryColor: string
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  onCheckout: () => void
  isMobile?: boolean
}

export function StickyBasket({
  cart,
  orderType,
  subtotal,
  deliveryFee,
  vatAmount,
  vatPercentage,
  serviceCharge,
  total,
  minimumOrder,
  freeDeliveryAbove,
  primaryColor,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  isMobile = false
}: StickyBasketProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const meetsMinimum = orderType === "collection" || subtotal >= minimumOrder
  const amountToFreeDelivery = freeDeliveryAbove ? Math.max(0, freeDeliveryAbove - subtotal) : 0

  if (cart.length === 0) {
    return (
      <div className={cn("bg-white rounded-xl shadow-sm p-6", !isMobile && "sticky top-24")}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Your basket is empty</h3>
          <p className="text-sm text-gray-500">Add items to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white rounded-xl shadow-sm flex flex-col", !isMobile && "sticky top-24 max-h-[calc(100vh-120px)]")}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">Your Order</h2>
        <p className="text-sm text-gray-500">{itemCount} item{itemCount > 1 ? "s" : ""}</p>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3">
              {/* Quantity Controls */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{item.menuItem.name}</h4>
                {item.selectedVariant && (
                  <p className="text-xs text-gray-500">{item.selectedVariant.name}</p>
                )}
                {item.selectedAddons.length > 0 && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {item.selectedAddons.map(a => a.name).join(", ")}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-xs text-gray-400 italic line-clamp-1">
                    Note: {item.specialInstructions}
                  </p>
                )}
              </div>

              {/* Price & Remove */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-sm">£{item.totalPrice.toFixed(2)}</span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Free Delivery Progress */}
      {orderType === "delivery" && freeDeliveryAbove && amountToFreeDelivery > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Truck className="w-4 h-4" />
            <span>Add £{amountToFreeDelivery.toFixed(2)} for free delivery</span>
          </div>
          <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (subtotal / freeDeliveryAbove) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 border-t space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        
        {orderType === "delivery" && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery</span>
            <span className={deliveryFee === 0 ? "text-green-600" : ""}>
              {deliveryFee === 0 ? "FREE" : `£${deliveryFee.toFixed(2)}`}
            </span>
          </div>
        )}
        
        {vatAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT ({vatPercentage}%)</span>
            <span>£{vatAmount.toFixed(2)}</span>
          </div>
        )}
        
        {serviceCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Charge</span>
            <span>£{serviceCharge.toFixed(2)}</span>
          </div>
        )}

        <Separator className="my-2" />
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span style={{ color: primaryColor }}>£{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Minimum Order Warning */}
      {!meetsMinimum && (
        <div className="px-4 pb-2">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-700">
              Minimum order for delivery is £{minimumOrder.toFixed(2)}. 
              Add £{(minimumOrder - subtotal).toFixed(2)} more.
            </span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <div className="p-4 pt-0">
        <Button
          className="w-full h-12 text-white font-semibold text-base"
          style={{ backgroundColor: primaryColor }}
          onClick={onCheckout}
          disabled={!meetsMinimum}
        >
          <span className="flex items-center gap-2">
            Go to Checkout
            <ChevronRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </div>
  )
}
