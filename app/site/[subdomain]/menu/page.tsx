"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Loader2, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  Star,
  ChevronRight,
  Search,
  Utensils
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category_id: string
  is_available: boolean
  is_popular: boolean
  spicy_level: number
}

interface Category {
  id: string
  name: string
  description: string | null
  sort_order: number
}

interface CartItem extends MenuItem {
  quantity: number
}

interface RestaurantInfo {
  id: string
  site_name: string
  subdomain: string
  logo_url: string | null
  business_name: string
  address: string
  phone: string
  is_open: boolean
  delivery_fee: number
  minimum_order: number
  estimated_delivery: string
}

// Dummy data fallback
const dummyRestaurant: RestaurantInfo = {
  id: "demo",
  site_name: "Demo Pizza",
  subdomain: "demo-pizza",
  logo_url: null,
  business_name: "Demo Pizza Palace",
  address: "123 Pizza Street, London, UK",
  phone: "+44 20 1234 5678",
  is_open: true,
  delivery_fee: 2.50,
  minimum_order: 10,
  estimated_delivery: "30-45 min"
}

const dummyCategories: Category[] = [
  { id: "cat-1", name: "Pizzas", description: "Our signature pizzas", sort_order: 1 },
  { id: "cat-2", name: "Burgers", description: "Juicy burgers", sort_order: 2 },
  { id: "cat-3", name: "Sides", description: "Tasty sides", sort_order: 3 },
  { id: "cat-4", name: "Drinks", description: "Refreshing beverages", sort_order: 4 },
  { id: "cat-5", name: "Desserts", description: "Sweet treats", sort_order: 5 },
]

const dummyMenuItems: MenuItem[] = [
  { id: "item-1", name: "Margherita Pizza", description: "Classic tomato sauce, mozzarella, and fresh basil", price: 12.99, image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-2", name: "Pepperoni Pizza", description: "Loaded with pepperoni and melted mozzarella cheese", price: 14.99, image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 1 },
  { id: "item-3", name: "BBQ Chicken Pizza", description: "Grilled chicken, red onions, BBQ sauce, and cilantro", price: 15.99, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-4", name: "Vegetarian Supreme", description: "Bell peppers, mushrooms, olives, onions, and tomatoes", price: 13.99, image_url: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-5", name: "Spicy Meat Feast", description: "Pepperoni, sausage, bacon, and jalapenos", price: 16.99, image_url: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=300&fit=crop", category_id: "cat-1", is_available: true, is_popular: true, spicy_level: 3 },
  { id: "item-6", name: "Classic Cheeseburger", description: "Beef patty, cheddar cheese, lettuce, tomato, and special sauce", price: 10.99, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-7", name: "Bacon Double Burger", description: "Two beef patties, crispy bacon, cheese, and pickles", price: 13.99, image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-8", name: "Spicy Chicken Burger", description: "Crispy chicken, spicy mayo, lettuce, and pickles", price: 11.99, image_url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop", category_id: "cat-2", is_available: true, is_popular: false, spicy_level: 2 },
  { id: "item-9", name: "French Fries", description: "Crispy golden fries with sea salt", price: 3.99, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-10", name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 4.99, image_url: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-11", name: "Mozzarella Sticks", description: "Breaded mozzarella with marinara dipping sauce", price: 6.99, image_url: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-12", name: "Onion Rings", description: "Crispy battered onion rings", price: 4.99, image_url: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop", category_id: "cat-3", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-13", name: "Coca-Cola", description: "330ml can", price: 1.99, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-14", name: "Fresh Lemonade", description: "Homemade lemonade with fresh lemons", price: 2.99, image_url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-15", name: "Milkshake", description: "Creamy vanilla, chocolate, or strawberry", price: 4.99, image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop", category_id: "cat-4", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-16", name: "Chocolate Brownie", description: "Warm chocolate brownie with vanilla ice cream", price: 5.99, image_url: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: true, spicy_level: 0 },
  { id: "item-17", name: "Cheesecake", description: "New York style cheesecake with berry compote", price: 6.99, image_url: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: false, spicy_level: 0 },
  { id: "item-18", name: "Ice Cream Sundae", description: "Three scoops with chocolate sauce and whipped cream", price: 4.99, image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop", category_id: "cat-5", is_available: true, is_popular: false, spicy_level: 0 },
]

export default function RestaurantMenuPage() {
  const params = useParams()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchRestaurantData()
  }, [params.subdomain])

  const fetchRestaurantData = async () => {
    try {
      const res = await fetch(`/api/sites/menu?subdomain=${params.subdomain}`)
      if (res.ok) {
        const data = await res.json()
        setRestaurant(data.restaurant)
        setCategories(data.categories || [])
        setMenuItems(data.menuItems || [])
        if (data.categories?.length > 0) {
          setActiveCategory(data.categories[0].id)
        }
      } else {
        // Use dummy data as fallback
        const subdomainName = (params.subdomain as string).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        setRestaurant({ 
          ...dummyRestaurant, 
          subdomain: params.subdomain as string,
          site_name: subdomainName,
          business_name: subdomainName
        })
        setCategories(dummyCategories)
        setMenuItems(dummyMenuItems)
        setActiveCategory(dummyCategories[0].id)
      }
    } catch {
      // Use dummy data as fallback
      const subdomainName = (params.subdomain as string).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      setRestaurant({ 
        ...dummyRestaurant, 
        subdomain: params.subdomain as string,
        site_name: subdomainName,
        business_name: subdomainName
      })
      setCategories(dummyCategories)
      setMenuItems(dummyMenuItems)
      setActiveCategory(dummyCategories[0].id)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !activeCategory || item.category_id === activeCategory
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.is_available
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-slate-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  // This should never happen since we always use dummy data as fallback
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Utensils className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Restaurant Not Found</h1>
          <p className="text-slate-600 mb-6">This restaurant doesn&apos;t exist or is not available.</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.site_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900">{restaurant.business_name || restaurant.site_name}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant={restaurant.is_open ? "default" : "secondary"} className="text-[10px] h-4">
                    {restaurant.is_open ? "Open" : "Closed"}
                  </Badge>
                  <span>{restaurant.estimated_delivery || "30-45 min"}</span>
                </div>
              </div>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Restaurant Info Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {restaurant.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Delivery: {restaurant.estimated_delivery || "30-45 min"}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <span>Min. Order: {formatCurrency(restaurant.minimum_order || 10)}</span>
            <span>Delivery Fee: {formatCurrency(restaurant.delivery_fee || 2.5)}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-30 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="sticky top-[120px] z-20 bg-white border-b overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 py-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat.id
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No items found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {item.image_url && (
                  <div className="relative h-40 bg-slate-100">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.is_popular && (
                      <Badge className="absolute top-2 left-2 bg-orange-500">
                        <Star className="w-3 h-3 mr-1" /> Popular
                      </Badge>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      {item.spicy_level > 0 && (
                        <div className="flex gap-0.5 mt-2">
                          {[...Array(item.spicy_level)].map((_, i) => (
                            <span key={i} className="text-red-500">🌶️</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-orange-600">{formatCurrency(item.price)}</p>
                  </div>
                  <Button
                    onClick={() => addToCart(item)}
                    disabled={!restaurant.is_open}
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-lg">Your Order</h2>
                <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 bg-slate-50 rounded-lg p-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-orange-600 font-semibold text-sm">{formatCurrency(item.price)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full bg-white border flex items-center justify-center hover:bg-slate-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t bg-slate-50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Delivery Fee</span>
                      <span>{formatCurrency(restaurant.delivery_fee || 2.5)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-orange-600">{formatCurrency(cartTotal + (restaurant.delivery_fee || 2.5))}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/site/${params.subdomain}/order`)}
                    disabled={cartTotal < (restaurant.minimum_order || 10)}
                    className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
                  >
                    Checkout
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                  {cartTotal < (restaurant.minimum_order || 10) && (
                    <p className="text-center text-xs text-red-500 mt-2">
                      Minimum order: {formatCurrency(restaurant.minimum_order || 10)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !cartOpen && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 bg-orange-500 text-white py-4 rounded-xl shadow-lg flex items-center justify-between px-6 lg:hidden z-30"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">{cartCount} items</span>
          </div>
          <span className="font-bold">{formatCurrency(cartTotal)}</span>
        </motion.button>
      )}
    </div>
  )
}
