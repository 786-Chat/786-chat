"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  Truck, 
  ShoppingBag,
  ChevronRight,
  Loader2,
  UtensilsCrossed,
  Pizza,
  Coffee,
  Cake,
  Soup,
  Salad,
  Sandwich,
  IceCream,
  MessageCircle,
  SlidersHorizontal,
  X,
  ChevronDown
} from "lucide-react"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

interface Restaurant {
  id: string
  site_name: string
  subdomain: string
  logo_url: string | null
  marketplace_cover_image: string | null
  marketplace_thumbnail: string | null
  restaurant_logo: string | null
  marketplace_category: string | null
  marketplace_description: string | null
  delivery_radius_miles: number
  estimated_delivery_minutes: number
  is_open: boolean
  delivery_enabled: boolean
  collection_enabled: boolean
  delivery_charge_amount: number
  minimum_order_delivery: number
  business_address: string | null
  whatsapp_number: string | null
  marketplace_featured: boolean
}

const categoryIcons: Record<string, React.ReactNode> = {
  "all": <UtensilsCrossed className="w-5 h-5" />,
  "restaurant": <UtensilsCrossed className="w-5 h-5" />,
  "pizza": <Pizza className="w-5 h-5" />,
  "chicken": <Soup className="w-5 h-5" />,
  "cafe": <Coffee className="w-5 h-5" />,
  "dessert": <IceCream className="w-5 h-5" />,
  "bakery": <Cake className="w-5 h-5" />,
  "indian": <Soup className="w-5 h-5" />,
  "chinese": <Soup className="w-5 h-5" />,
  "thai": <Soup className="w-5 h-5" />,
  "italian": <Pizza className="w-5 h-5" />,
  "mexican": <Salad className="w-5 h-5" />,
  "japanese": <Soup className="w-5 h-5" />,
  "fast food": <Sandwich className="w-5 h-5" />,
  "grocery": <ShoppingBag className="w-5 h-5" />,
}

const categories = [
  { value: "all", label: "All", emoji: "🍽️" },
  { value: "restaurant", label: "Restaurant", emoji: "🍴" },
  { value: "pizza", label: "Pizza", emoji: "🍕" },
  { value: "chicken", label: "Chicken", emoji: "🍗" },
  { value: "indian", label: "Indian", emoji: "🍛" },
  { value: "chinese", label: "Chinese", emoji: "🥡" },
  { value: "thai", label: "Thai", emoji: "🍜" },
  { value: "italian", label: "Italian", emoji: "🍝" },
  { value: "mexican", label: "Mexican", emoji: "🌮" },
  { value: "japanese", label: "Japanese", emoji: "🍣" },
  { value: "cafe", label: "Cafe", emoji: "☕" },
  { value: "dessert", label: "Dessert", emoji: "🍰" },
  { value: "bakery", label: "Bakery", emoji: "🥐" },
  { value: "fast food", label: "Fast Food", emoji: "🍔" },
  { value: "grocery", label: "Grocery", emoji: "🛒" },
]

const radiusOptions = [
  { value: "1", label: "1 mi" },
  { value: "3", label: "3 mi" },
  { value: "5", label: "5 mi" },
  { value: "10", label: "10 mi" },
  { value: "all", label: "Any" }
]

// Demo restaurants for testing when no real restaurants exist
const demoRestaurants: Restaurant[] = [
  {
    id: "demo-1",
    site_name: "Al-Baik Fried Chicken",
    subdomain: "albaik-demo",
    logo_url: null,
    marketplace_cover_image: null,
    marketplace_thumbnail: null,
    restaurant_logo: null,
    marketplace_category: "chicken",
    marketplace_description: "Famous crispy fried chicken with secret spices. Family recipe since 1974.",
    delivery_radius_miles: 5,
    estimated_delivery_minutes: 25,
    is_open: true,
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge_amount: 2.99,
    minimum_order_delivery: 12,
    business_address: "123 High Street, London",
    whatsapp_number: null,
    marketplace_featured: true
  },
  {
    id: "demo-2",
    site_name: "Dhaba Family Restaurant",
    subdomain: "dhaba-demo",
    logo_url: null,
    marketplace_cover_image: null,
    marketplace_thumbnail: null,
    restaurant_logo: null,
    marketplace_category: "indian",
    marketplace_description: "Authentic North Indian cuisine. Tandoori specialties and rich curries.",
    delivery_radius_miles: 4,
    estimated_delivery_minutes: 35,
    is_open: true,
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge_amount: 3.50,
    minimum_order_delivery: 15,
    business_address: "45 Curry Lane, Birmingham",
    whatsapp_number: null,
    marketplace_featured: true
  },
  {
    id: "demo-3",
    site_name: "Halal Pizza House",
    subdomain: "halalpizza-demo",
    logo_url: null,
    marketplace_cover_image: null,
    marketplace_thumbnail: null,
    restaurant_logo: null,
    marketplace_category: "pizza",
    marketplace_description: "100% Halal pizzas with fresh ingredients. Wood-fired oven baked.",
    delivery_radius_miles: 6,
    estimated_delivery_minutes: 30,
    is_open: true,
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge_amount: 1.99,
    minimum_order_delivery: 10,
    business_address: "78 Pizza Street, Manchester",
    whatsapp_number: null,
    marketplace_featured: false
  },
  {
    id: "demo-4",
    site_name: "Cafe Aroma",
    subdomain: "cafearoma-demo",
    logo_url: null,
    marketplace_cover_image: null,
    marketplace_thumbnail: null,
    restaurant_logo: null,
    marketplace_category: "cafe",
    marketplace_description: "Specialty coffee and fresh pastries. Perfect for breakfast and brunch.",
    delivery_radius_miles: 3,
    estimated_delivery_minutes: 20,
    is_open: true,
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge_amount: 2.50,
    minimum_order_delivery: 8,
    business_address: "12 Coffee Road, Leeds",
    whatsapp_number: null,
    marketplace_featured: false
  },
  {
    id: "demo-5",
    site_name: "Peri Peri Grill",
    subdomain: "perigrill-demo",
    logo_url: null,
    marketplace_cover_image: null,
    marketplace_thumbnail: null,
    restaurant_logo: null,
    marketplace_category: "chicken",
    marketplace_description: "Flame-grilled peri peri chicken. Spicy, succulent, and satisfying.",
    delivery_radius_miles: 5,
    estimated_delivery_minutes: 28,
    is_open: false,
    delivery_enabled: true,
    collection_enabled: true,
    delivery_charge_amount: 2.99,
    minimum_order_delivery: 12,
    business_address: "99 Grill Avenue, Sheffield",
    whatsapp_number: null,
    marketplace_featured: false
  }
]

export default function FoodMarketplacePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(demoRestaurants)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedRadius, setSelectedRadius] = useState("5")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showingDemo, setShowingDemo] = useState(true)

  const fetchRestaurants = useCallback(async (reset = false) => {
    if (reset) {
      setIsLoading(true)
      setPage(1)
    } else {
      setLoadingMore(true)
    }

    try {
      const queryParams = new URLSearchParams({
        page: reset ? "1" : String(page),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(selectedRadius !== "all" && { radius: selectedRadius })
      })

      const res = await fetch(`/api/marketplace/restaurants?${queryParams}`)
      if (res.ok) {
        const data = await res.json()
        const fetchedRestaurants = data.restaurants || []
        
        // If real restaurants found, use them
        if (fetchedRestaurants.length > 0) {
          if (reset) {
            setRestaurants(fetchedRestaurants)
          } else {
            setRestaurants(prev => [...prev, ...fetchedRestaurants])
          }
          setShowingDemo(false)
          setHasMore(data.hasMore || false)
        } else {
          // No real restaurants, show filtered demo data
          let filteredDemo = demoRestaurants
          if (selectedCategory !== "all") {
            filteredDemo = demoRestaurants.filter(r => 
              r.marketplace_category?.toLowerCase() === selectedCategory.toLowerCase()
            )
          }
          setRestaurants(filteredDemo)
          setShowingDemo(true)
          setHasMore(false)
        }
      } else {
        // API error, show demo data
        setRestaurants(demoRestaurants)
        setShowingDemo(true)
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error)
      // On error, show demo data
      let filteredDemo = demoRestaurants
      if (selectedCategory !== "all") {
        filteredDemo = demoRestaurants.filter(r => 
          r.marketplace_category?.toLowerCase() === selectedCategory.toLowerCase()
        )
      }
      setRestaurants(filteredDemo)
      setShowingDemo(true)
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [page, searchQuery, selectedCategory, selectedRadius])

  useEffect(() => {
    fetchRestaurants(true)
  }, [selectedCategory, selectedRadius])

  const handleSearch = () => {
    fetchRestaurants(true)
  }

  const loadMore = () => {
    setPage(prev => prev + 1)
    fetchRestaurants(false)
  }

  const featuredRestaurants = restaurants.filter(r => r.marketplace_featured)
  const regularRestaurants = restaurants.filter(r => !r.marketplace_featured)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header - Just Logo */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center">
            <Link href="/" className="flex-shrink-0">
              <MujeebProAILogo variant="compact" size="sm" />
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section - Clean & Modern */}
      <div className="bg-white pb-6 border-b">
        <div className="container mx-auto px-4 pt-6">
          {/* Search Area */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Order food to your door
              </h1>
              <p className="text-gray-500">
                Discover restaurants and cafes near you
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Enter postcode or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-12 h-14 text-base rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="h-14 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills - Scrollable */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="py-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Distance Filter */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-500">Distance:</span>
                <div className="flex gap-1">
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedRadius(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedRadius === opt.value
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCategory !== "all" || selectedRadius !== "5") && (
                <button
                  onClick={() => {
                    setSelectedCategory("all")
                    setSelectedRadius("5")
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {!isLoading && (
                <span>{restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="sm:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setShowMobileFilters(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedRadius(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedRadius === opt.value
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-6 h-12 bg-orange-500 hover:bg-orange-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Demo Banner */}
        {showingDemo && !isLoading && restaurants.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">Demo restaurants shown for testing</p>
              <p className="text-xs text-amber-600">Real restaurants will appear once they join the marketplace.</p>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-500">Finding restaurants near you...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState 
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        ) : (
          <>
            {/* Featured Section */}
            {featuredRestaurants.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">Featured</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredRestaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All Restaurants */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedCategory !== "all" 
                  ? `${categories.find(c => c.value === selectedCategory)?.label || selectedCategory} Restaurants`
                  : "All Restaurants"
                }
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {regularRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            </section>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-12 px-8 rounded-xl border-gray-300"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Show more restaurants
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 sm:hidden z-30">
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className="flex-1 h-12 rounded-xl"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button 
            onClick={handleSearch}
            className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Bottom Padding for Mobile */}
      <div className="h-24 sm:hidden" />
    </div>
  )
}

function RestaurantCard({ restaurant, featured = false }: { restaurant: Restaurant, featured?: boolean }) {
  const siteUrl = `/site/${restaurant.subdomain}`
  
  // Use cover image for featured cards, thumbnail for regular cards, fallback to logo
  const cardImage = featured 
    ? (restaurant.marketplace_cover_image || restaurant.marketplace_thumbnail || restaurant.logo_url)
    : (restaurant.marketplace_thumbnail || restaurant.marketplace_cover_image || restaurant.logo_url)
  
  // Restaurant logo for the badge
  const logoImage = restaurant.restaurant_logo || restaurant.logo_url

  return (
    <Card className={`overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all group rounded-xl ${featured ? "ring-2 ring-orange-200" : ""}`}>
      {/* Cover Image */}
      <Link href={siteUrl}>
        <div className={`relative bg-gradient-to-br from-orange-100 to-orange-50 ${featured ? "h-44" : "h-36"}`}>
          {cardImage ? (
            <Image
              src={cardImage}
              alt={restaurant.site_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <UtensilsCrossed className="w-12 h-12 text-orange-300" />
            </div>
          )}
          
          {/* Restaurant Logo Badge */}
          {logoImage && (
            <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl overflow-hidden bg-white shadow-lg border-2 border-white">
              <Image
                src={logoImage}
                alt={`${restaurant.site_name} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {restaurant.is_open ? (
              <Badge className="bg-green-500 text-white border-0 shadow-sm">Open</Badge>
            ) : (
              <Badge className="bg-gray-900/80 text-white border-0">Closed</Badge>
            )}
          </div>

          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-orange-500 text-white border-0 shadow-sm">
                <Star className="w-3 h-3 mr-1 fill-white" />
                Featured
              </Badge>
            </div>
          )}

          {/* Delivery Time Overlay */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Clock className="w-3.5 h-3.5" />
                {restaurant.estimated_delivery_minutes || 30} min
              </div>
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Restaurant Info */}
        <Link href={siteUrl}>
          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-1">
            {restaurant.site_name}
          </h3>
        </Link>
        
        {/* Category & Rating */}
        <div className="flex items-center gap-2 mb-3">
          {restaurant.marketplace_category && (
            <span className="text-sm text-gray-500">{restaurant.marketplace_category}</span>
          )}
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span className="text-sm text-gray-600">New</span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {restaurant.delivery_enabled && (
            <div className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {restaurant.delivery_charge_amount > 0 
                ? `£${Number(restaurant.delivery_charge_amount).toFixed(2)} delivery` 
                : "Free delivery"
              }
            </div>
          )}
          {restaurant.minimum_order_delivery > 0 && (
            <div>
              Min £{Number(restaurant.minimum_order_delivery).toFixed(2)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1 h-10 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50">
            <Link href={siteUrl}>
              View Menu
            </Link>
          </Button>
          <Button asChild className="flex-1 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
            <Link href={`${siteUrl}/order`}>
              Order Now
            </Link>
          </Button>
        </div>
        {restaurant.whatsapp_number && (
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full mt-2 h-8 text-xs text-gray-500 hover:text-green-600"
            asChild
          >
            <a 
              href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp Order
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ 
  selectedCategory, 
  onCategorySelect 
}: { 
  selectedCategory: string
  onCategorySelect: (cat: string) => void
}) {
  const suggestedCategories = categories.filter(c => c.value !== "all").slice(0, 6)

  return (
    <div className="text-center py-16 px-4">
      {/* Illustration */}
      <div className="w-32 h-32 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
        <UtensilsCrossed className="w-16 h-16 text-orange-400" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No restaurants found
      </h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {selectedCategory !== "all" 
          ? `We couldn't find any ${selectedCategory} restaurants in your area. Try a different cuisine or expand your search.`
          : "We couldn't find any restaurants in your area. Try searching a different location or check back later."
        }
      </p>

      {/* Quick Category Buttons */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-4">Try browsing by category:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestedCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategorySelect(cat.value)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all"
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-gray-100 rounded-2xl p-6 max-w-md mx-auto">
        <h3 className="font-medium text-gray-900 mb-3">Search tips</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            Try entering a different postcode
          </li>
          <li className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            Increase your delivery distance
          </li>
          <li className="flex items-start gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            Browse all categories
          </li>
        </ul>
      </div>
    </div>
  )
}
