"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Clock, 
  Flame, 
  Leaf, 
  Star,
  X,
  ChevronRight,
  Truck,
  Store
} from "lucide-react"
import { ItemCustomizationModal } from "./item-customization-modal"
import { StickyBasket } from "./sticky-basket"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  compare_price: number | null
  image_url: string | null
  category_id?: string | null
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  is_popular: boolean
  spice_level: number
  calories: number | null
  prep_time_minutes: number | null
  dietary_labels: string[]
  allergens: string[]
  ingredients?: string | null
  variants: Array<{
    id: string
    name: string
    price: number
    is_default: boolean
  }>
}

interface MenuCategory {
  id: string
  name: string
  description: string | null
  image_url: string | null
}

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  selectedVariant?: { id: string; name: string; price: number }
  selectedAddons: Array<{ id: string; name: string; price: number; groupName: string }>
  specialInstructions?: string
  totalPrice: number
}

interface SiteSettings {
  delivery_enabled: boolean
  collection_enabled: boolean
  delivery_charge_amount: number
  free_delivery_above: number | null
  vat_enabled: boolean
  vat_percentage: number
  service_charge_enabled: boolean
  service_charge_type: string
  service_charge_amount: number
  minimum_order_delivery: number
}

interface MenuPageProps {
  siteId: string
  subdomain?: string
  siteName: string
  logoUrl?: string | null
  primaryColor?: string
  settings?: SiteSettings
}

const defaultSettings: SiteSettings = {
  delivery_enabled: true,
  collection_enabled: true,
  delivery_charge_amount: 2.50,
  free_delivery_above: 20,
  vat_enabled: false,
  vat_percentage: 20,
  service_charge_enabled: false,
  service_charge_type: "percentage",
  service_charge_amount: 10,
  minimum_order_delivery: 10
}

export function MenuPage({ siteId, subdomain, siteName, logoUrl, primaryColor = "#f97316", settings = defaultSettings }: MenuPageProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [addonGroups, setAddonGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery")
  const [showMobileCart, setShowMobileCart] = useState(false)

  // Fetch menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use public API if subdomain is provided, otherwise use customer API
        if (subdomain) {
          const menuRes = await fetch(`/api/sites/${subdomain}/menu`)
          if (menuRes.ok) {
            const data = await menuRes.json()
            setCategories(data.categories || [])
            setItems(data.items || [])
            setAddonGroups(data.groups || [])
            if (data.categories?.length > 0) {
              setActiveCategory(data.categories[0].id)
            }
          }
        } else {
          const [categoriesRes, itemsRes, addonsRes] = await Promise.all([
            fetch(`/api/customer/sites/${siteId}/menu/categories`),
            fetch(`/api/customer/sites/${siteId}/menu/items`),
            fetch(`/api/customer/sites/${siteId}/menu/addon-groups`)
          ])
          
          if (categoriesRes.ok) {
            const data = await categoriesRes.json()
            setCategories(data.categories || [])
            if (data.categories?.length > 0) {
              setActiveCategory(data.categories[0].id)
            }
          }
          
          if (itemsRes.ok) {
            const data = await itemsRes.json()
            setItems(data.items || [])
          }
          
          if (addonsRes.ok) {
            const data = await addonsRes.json()
            setAddonGroups(data.groups || [])
          }
        }
      } catch (error) {
        console.error("Failed to fetch menu:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [siteId, subdomain])

  // Filter items by category and search
  const filteredItems = items.filter(item => {
    const matchesCategory = !activeCategory || item.category_id === activeCategory
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.is_available
  })

  // Get featured items
  const featuredItems = items.filter(item => item.is_featured && item.is_available)

  // Add item to cart
  const addToCart = useCallback((
    item: MenuItem, 
    quantity: number,
    selectedVariant?: { id: string; name: string; price: number },
    selectedAddons: Array<{ id: string; name: string; price: number; groupName: string }> = [],
    specialInstructions?: string
  ) => {
    const basePrice = selectedVariant ? selectedVariant.price : Number(item.price)
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0)
    const totalPrice = (basePrice + addonsPrice) * quantity

    const cartItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      menuItem: item,
      quantity,
      selectedVariant,
      selectedAddons,
      specialInstructions,
      totalPrice
    }

    setCart(prev => [...prev, cartItem])
    setSelectedItem(null)
  }, [])

  // Update cart item quantity
  const updateCartItemQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== cartItemId))
    } else {
      setCart(prev => prev.map(item => {
        if (item.id === cartItemId) {
          const basePrice = item.selectedVariant ? item.selectedVariant.price : Number(item.menuItem.price)
          const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0)
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: (basePrice + addonsPrice) * newQuantity
          }
        }
        return item
      }))
    }
  }, [])

  // Remove item from cart
  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId))
  }, [])

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const deliveryFee = orderType === "delivery" && settings.delivery_enabled
    ? (settings.free_delivery_above && subtotal >= settings.free_delivery_above ? 0 : settings.delivery_charge_amount)
    : 0
  const vatAmount = settings.vat_enabled ? (subtotal * settings.vat_percentage / 100) : 0
  const serviceCharge = settings.service_charge_enabled
    ? (settings.service_charge_type === "percentage" ? subtotal * settings.service_charge_amount / 100 : settings.service_charge_amount)
    : 0
  const total = subtotal + deliveryFee + vatAmount + serviceCharge

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt={siteName} width={40} height={40} className="rounded-lg object-cover" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {siteName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg">{siteName}</h1>
                <p className="text-xs text-muted-foreground">Order online</p>
              </div>
            </div>
            
            {/* Order Type Toggle */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setOrderType("delivery")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  orderType === "delivery" ? "bg-white shadow text-gray-900" : "text-gray-600"
                )}
              >
                <Truck className="w-4 h-4" />
                Delivery
              </button>
              <button
                onClick={() => setOrderType("collection")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  orderType === "collection" ? "bg-white shadow text-gray-900" : "text-gray-600"
                )}
              >
                <Store className="w-4 h-4" />
                Collection
              </button>
            </div>

            {/* Mobile Cart Button */}
            <button
              onClick={() => setShowMobileCart(true)}
              className="lg:hidden relative p-2 rounded-full bg-gray-100"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Order Type */}
      <div className="sm:hidden bg-white border-b px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setOrderType("delivery")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all",
              orderType === "delivery" ? "bg-white shadow text-gray-900" : "text-gray-600"
            )}
          >
            <Truck className="w-4 h-4" />
            Delivery
          </button>
          <button
            onClick={() => setOrderType("collection")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all",
              orderType === "collection" ? "bg-white shadow text-gray-900" : "text-gray-600"
            )}
          >
            <Store className="w-4 h-4" />
            Collection
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b px-4 py-3">
        <div className="container mx-auto max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-0 focus-visible:ring-2"
              style={{ "--tw-ring-color": primaryColor } as any}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Categories Sidebar - Desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Categories</h2>
              <nav className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeCategory === category.id 
                        ? "font-medium" 
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                    style={activeCategory === category.id ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Categories */}
            <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                      activeCategory === category.id 
                        ? "text-white" 
                        : "bg-white text-gray-700 border"
                    )}
                    style={activeCategory === category.id ? { backgroundColor: primaryColor } : {}}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Items */}
            {featuredItems.length > 0 && !searchQuery && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: primaryColor }} />
                  Popular Items
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredItems.slice(0, 4).map(item => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      primaryColor={primaryColor}
                      onSelect={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Menu Items by Category */}
            {categories.filter(cat => activeCategory === cat.id || !activeCategory).map(category => {
              const categoryItems = filteredItems.filter(item => item.category_id === category.id)
              if (categoryItems.length === 0) return null
              
              return (
                <section key={category.id} className="mb-8">
                  <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryItems.map(item => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        primaryColor={primaryColor}
                        onSelect={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Uncategorized Items */}
            {filteredItems.filter(item => !item.category_id).length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">Other Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.filter(item => !item.category_id).map(item => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      primaryColor={primaryColor}
                      onSelect={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or category</p>
              </div>
            )}
          </main>

          {/* Desktop Sticky Basket */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <StickyBasket
              cart={cart}
              orderType={orderType}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              vatAmount={vatAmount}
              vatPercentage={settings.vat_percentage}
              serviceCharge={serviceCharge}
              total={total}
              minimumOrder={settings.minimum_order_delivery}
              freeDeliveryAbove={settings.free_delivery_above}
              primaryColor={primaryColor}
              onUpdateQuantity={updateCartItemQuantity}
              onRemove={removeFromCart}
              onCheckout={() => {/* Navigate to checkout */}}
            />
          </aside>
        </div>
      </div>

      {/* Mobile Cart Sheet */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Your Order</h2>
              <button onClick={() => setShowMobileCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 h-[calc(100vh-72px)] overflow-auto">
              <StickyBasket
                cart={cart}
                orderType={orderType}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                vatAmount={vatAmount}
                vatPercentage={settings.vat_percentage}
                serviceCharge={serviceCharge}
                total={total}
                minimumOrder={settings.minimum_order_delivery}
                freeDeliveryAbove={settings.free_delivery_above}
                primaryColor={primaryColor}
                onUpdateQuantity={updateCartItemQuantity}
                onRemove={removeFromCart}
                onCheckout={() => setShowMobileCart(false)}
                isMobile
              />
            </div>
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {selectedItem && (
        <ItemCustomizationModal
          item={selectedItem}
          addonGroups={addonGroups}
          primaryColor={primaryColor}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Mobile Sticky Footer */}
      {cart.length > 0 && !showMobileCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg lg:hidden z-30">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-between px-6"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              View Order ({cartItemsCount})
            </span>
            <span>£{total.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Menu Item Card Component
function MenuItemCard({ 
  item, 
  primaryColor, 
  onSelect 
}: { 
  item: MenuItem
  primaryColor: string
  onSelect: () => void 
}) {
  const hasDiscount = item.compare_price && Number(item.compare_price) > Number(item.price)
  const discountPercent = hasDiscount 
    ? Math.round((1 - Number(item.price) / Number(item.compare_price)) * 100)
    : 0

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-xl shadow-sm overflow-hidden flex cursor-pointer hover:shadow-md transition-shadow group"
    >
      {/* Image */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
        {item.image_url ? (
          <Image 
            src={item.image_url} 
            alt={item.name} 
            fill 
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
            -{discountPercent}%
          </Badge>
        )}
        {item.is_new && (
          <Badge className="absolute top-2 right-2 text-white text-xs" style={{ backgroundColor: primaryColor }}>
            New
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {item.spice_level > 0 && (
              <span className="inline-flex items-center text-xs text-red-600">
                {Array.from({ length: item.spice_level }).map((_, i) => (
                  <Flame key={i} className="w-3 h-3" />
                ))}
              </span>
            )}
            {item.dietary_labels?.includes("Vegetarian") && (
              <Badge variant="outline" className="text-xs py-0 h-5 bg-green-50 text-green-700 border-green-200">
                <Leaf className="w-3 h-3 mr-1" />
                Veg
              </Badge>
            )}
            {item.dietary_labels?.includes("Vegan") && (
              <Badge variant="outline" className="text-xs py-0 h-5 bg-green-50 text-green-700 border-green-200">
                Vegan
              </Badge>
            )}
            {item.calories && (
              <Badge variant="outline" className="text-xs py-0 h-5">
                {item.calories} cal
              </Badge>
            )}
          </div>
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: primaryColor }}>
              £{Number(item.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                £{Number(item.compare_price).toFixed(2)}
              </span>
            )}
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
