"use client"

import { useState, use } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  ChevronLeft,
  Monitor,
  Smartphone,
  Check,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Mail,
  Menu,
  Coffee,
  Pizza,
  Drumstick,
  Utensils,
  Home,
  Image as ImageIcon,
  MessageSquare,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { WebsiteLaunchWizard } from "@/components/website-launch-wizard"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

// Theme data matching the listing page
const THEMES: Record<string, {
  name: string
  category: string
  price: number
  description: string
  features: string[]
  layout: string
  colors: { bg: string; primary: string; secondary: string; accent: string; text: string }
}> = {
  // Restaurant themes
  "fine-dining-luxe": {
    name: "Fine Dining Luxe",
    category: "restaurant",
    price: 79.99,
    description: "Elegant luxury restaurant with fullscreen hero and sophisticated menu cards",
    features: ["Fullscreen Hero", "Elegant Menu", "Reservation System", "Chef Profiles", "Gallery", "Contact Form"],
    layout: "luxury-fullscreen",
    colors: { bg: "#0a0a0a", primary: "#d4af37", secondary: "#1a1a1a", accent: "#fff8e7", text: "#ffffff" }
  },
  "family-diner": {
    name: "Family Diner",
    category: "restaurant",
    price: 49.99,
    description: "Warm family restaurant with big food cards and friendly layout",
    features: ["Big Food Cards", "Kids Menu", "Family Deals", "Party Bookings", "Reviews", "Location Map"],
    layout: "card-grid",
    colors: { bg: "#fef3c7", primary: "#d97706", secondary: "#fffbeb", accent: "#92400e", text: "#1c1917" }
  },
  "modern-bistro": {
    name: "Modern Bistro",
    category: "restaurant",
    price: 59.99,
    description: "Contemporary menu board layout with Instagram-style gallery",
    features: ["Menu Board", "Instagram Feed", "Online Orders", "Reviews", "Events", "Newsletter"],
    layout: "menu-board",
    colors: { bg: "#18181b", primary: "#f97316", secondary: "#27272a", accent: "#fed7aa", text: "#fafafa" }
  },
  "reservation-focus": {
    name: "Reserve & Dine",
    category: "restaurant",
    price: 69.99,
    description: "Booking-focused layout with prominent reservation widget",
    features: ["Booking Widget", "Table Selection", "Special Events", "Private Dining", "Gift Cards", "Calendar"],
    layout: "booking-centric",
    colors: { bg: "#1e1b4b", primary: "#818cf8", secondary: "#312e81", accent: "#c4b5fd", text: "#e0e7ff" }
  },
  "gallery-restaurant": {
    name: "Visual Feast",
    category: "restaurant",
    price: 64.99,
    description: "Gallery-focused design showcasing beautiful food photography",
    features: ["Photo Gallery", "Chef Story", "Food Blog", "Virtual Tour", "Press Section", "Awards"],
    layout: "gallery-focus",
    colors: { bg: "#0c0a09", primary: "#ef4444", secondary: "#1c1917", accent: "#fecaca", text: "#fafaf9" }
  },
  // Cafe themes
  "cozy-coffeehouse": {
    name: "Cozy Coffeehouse",
    category: "cafe",
    price: 39.99,
    description: "Warm and inviting coffee shop with rustic wooden elements",
    features: ["Coffee Menu", "Loyalty Cards", "WiFi Info", "Cozy Gallery", "Blog", "Events"],
    layout: "cozy-rustic",
    colors: { bg: "#1c1917", primary: "#a16207", secondary: "#292524", accent: "#fef3c7", text: "#fafaf9" }
  },
  "pastel-bakery": {
    name: "Pastel Bakery",
    category: "cafe",
    price: 44.99,
    description: "Sweet pastel design perfect for bakeries and patisseries",
    features: ["Pastry Display", "Custom Cakes", "Gift Cards", "Catering", "Wedding Cakes", "Classes"],
    layout: "pastel-sweet",
    colors: { bg: "#fdf2f8", primary: "#ec4899", secondary: "#fce7f3", accent: "#9d174d", text: "#1f2937" }
  },
  "minimal-white-cafe": {
    name: "Minimal White",
    category: "cafe",
    price: 34.99,
    description: "Clean minimalist design with lots of white space",
    features: ["Clean Layout", "Quick Order", "Seasonal Menu", "Mobile First", "Fast Loading", "SEO Ready"],
    layout: "minimal-clean",
    colors: { bg: "#ffffff", primary: "#0f172a", secondary: "#f8fafc", accent: "#64748b", text: "#0f172a" }
  },
  "dark-espresso": {
    name: "Dark Espresso",
    category: "cafe",
    price: 49.99,
    description: "Dark moody theme for specialty coffee bars",
    features: ["Bean Origins", "Brewing Methods", "Coffee Classes", "Subscriptions", "Shop", "Events"],
    layout: "dark-moody",
    colors: { bg: "#0c0a09", primary: "#78350f", secondary: "#1c1917", accent: "#d97706", text: "#fafaf9" }
  },
  "brunch-spot": {
    name: "Brunch Spot",
    category: "cafe",
    price: 42.99,
    description: "Bright and cheerful brunch menu layout",
    features: ["Brunch Menu", "Smoothie Bar", "Avocado Toast", "Weekend Specials", "Reservations", "Catering"],
    layout: "brunch-bright",
    colors: { bg: "#fffbeb", primary: "#16a34a", secondary: "#fef9c3", accent: "#166534", text: "#1c1917" }
  },
  // Chicken themes
  "fast-food-order": {
    name: "Quick Order",
    category: "chicken",
    price: 54.99,
    description: "Fast food ordering layout with combo meal focus",
    features: ["Quick Order", "Combo Deals", "Pickup Timer", "Delivery Tracking", "Rewards", "App Link"],
    layout: "fast-order",
    colors: { bg: "#fef2f2", primary: "#dc2626", secondary: "#fee2e2", accent: "#fbbf24", text: "#1f2937" }
  },
  "peri-peri-fire": {
    name: "Peri Peri Fire",
    category: "chicken",
    price: 49.99,
    description: "Fiery peri peri theme with spice level indicators",
    features: ["Spice Levels", "Flame Effects", "Marinades", "Heat Challenge", "Rewards", "Catering"],
    layout: "spicy-fire",
    colors: { bg: "#1c1917", primary: "#ea580c", secondary: "#292524", accent: "#fdba74", text: "#fafaf9" }
  },
  "fried-chicken-deals": {
    name: "Crispy Deals",
    category: "chicken",
    price: 44.99,
    description: "Deal-focused layout with prominent offers and buckets",
    features: ["Daily Deals", "Bucket Meals", "Family Packs", "Loyalty Points", "Coupons", "Franchising"],
    layout: "deals-focus",
    colors: { bg: "#fef9c3", primary: "#ca8a04", secondary: "#fef08a", accent: "#a16207", text: "#1c1917" }
  },
  "combo-meal-grid": {
    name: "Combo King",
    category: "chicken",
    price: 52.99,
    description: "Grid layout showcasing combo meals and sides",
    features: ["Combo Builder", "Side Options", "Drink Upgrades", "Meal Deals", "Catering", "Bulk Orders"],
    layout: "combo-grid",
    colors: { bg: "#18181b", primary: "#f59e0b", secondary: "#27272a", accent: "#fcd34d", text: "#fafafa" }
  },
  "delivery-chicken": {
    name: "Deliver Fast",
    category: "chicken",
    price: 59.99,
    description: "Delivery-focused with live tracking and quick checkout",
    features: ["Live Tracking", "Quick Checkout", "Scheduled Orders", "Driver Tips", "Reorder", "Notifications"],
    layout: "delivery-first",
    colors: { bg: "#ecfdf5", primary: "#059669", secondary: "#d1fae5", accent: "#065f46", text: "#1f2937" }
  },
  // Pizza themes
  "woodfire-italian": {
    name: "Wood Fire Italian",
    category: "pizza",
    price: 59.99,
    description: "Authentic Italian pizzeria with rustic wood-fired look",
    features: ["Wood Fire Oven", "Italian Recipes", "Wine Pairing", "Dine-In Focus", "Private Events", "Catering"],
    layout: "italian-rustic",
    colors: { bg: "#1c1917", primary: "#dc2626", secondary: "#292524", accent: "#fef2f2", text: "#fafaf9" }
  },
  "slice-menu": {
    name: "Slice & Dice",
    category: "pizza",
    price: 44.99,
    description: "Slice-by-slice menu with quick order by the slice",
    features: ["By The Slice", "Build Your Own", "Slice Deals", "Late Night", "Student Discounts", "Loyalty"],
    layout: "slice-grid",
    colors: { bg: "#fffbeb", primary: "#ea580c", secondary: "#fed7aa", accent: "#c2410c", text: "#1c1917" }
  },
  "pizza-delivery": {
    name: "Pizza Express",
    category: "pizza",
    price: 54.99,
    description: "Delivery-optimized with pizza tracker and quick reorder",
    features: ["Pizza Tracker", "Quick Reorder", "Group Orders", "Coupons", "Subscriptions", "Notifications"],
    layout: "delivery-pizza",
    colors: { bg: "#18181b", primary: "#16a34a", secondary: "#27272a", accent: "#bbf7d0", text: "#fafafa" }
  },
  "family-pizza": {
    name: "Family Pizza Night",
    category: "pizza",
    price: 47.99,
    description: "Family-focused with deal bundles and party packages",
    features: ["Family Deals", "Party Packages", "Kids Menu", "Game Night Combos", "Catering", "Rewards"],
    layout: "family-deals",
    colors: { bg: "#fef2f2", primary: "#b91c1c", secondary: "#fee2e2", accent: "#fbbf24", text: "#1f2937" }
  },
  "modern-pizzeria": {
    name: "Modern Pizzeria",
    category: "pizza",
    price: 64.99,
    description: "Contemporary artisan pizza with gourmet toppings",
    features: ["Artisan Toppings", "Craft Beer", "Seasonal Specials", "Chef Table", "Events", "Private Dining"],
    layout: "modern-artisan",
    colors: { bg: "#0f172a", primary: "#f97316", secondary: "#1e293b", accent: "#fed7aa", text: "#f1f5f9" }
  }
}

// Category icons
const categoryIcons: Record<string, typeof Utensils> = {
  restaurant: Utensils,
  cafe: Coffee,
  chicken: Drumstick,
  pizza: Pizza
}

// Preview tabs
const PREVIEW_TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "menu", label: "Menu", icon: Menu },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: MessageSquare },
  { id: "checkout", label: "Checkout", icon: ShoppingCart }
]

// Theme Preview Component
function ThemePreview({ theme, device, activeTab }: { 
  theme: typeof THEMES[string]
  device: "desktop" | "mobile"
  activeTab: string
}) {
  const { colors, layout, name, category } = theme
  const isMobile = device === "mobile"
  const CategoryIcon = categoryIcons[category] || Utensils
  
  // Sample menu items
  const menuItems = [
    { name: "Signature Dish", price: "$18", desc: "Chef's special creation" },
    { name: "Classic Favorite", price: "$15", desc: "Traditional recipe" },
    { name: "House Special", price: "$22", desc: "Premium selection" },
    { name: "Light Bite", price: "$12", desc: "Perfect starter" },
  ]
  
  // Render content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case "menu":
        return (
          <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold text-center mb-4" style={{ color: colors.primary }}>Our Menu</h2>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {menuItems.map((item, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: colors.secondary }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm" style={{ color: colors.text }}>{item.name}</span>
                    <span className="font-bold text-sm" style={{ color: colors.primary }}>{item.price}</span>
                  </div>
                  <p className="text-xs opacity-70" style={{ color: colors.text }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
      case "gallery":
        return (
          <div className="p-4">
            <h2 className="text-lg font-bold text-center mb-4" style={{ color: colors.primary }}>Gallery</h2>
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg" style={{ background: `${colors.primary}30` }} />
              ))}
            </div>
          </div>
        )
      case "contact":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-center" style={{ color: colors.primary }}>Contact Us</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: colors.secondary }}>
                <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                <div>
                  <div className="text-xs opacity-70" style={{ color: colors.text }}>Address</div>
                  <div className="text-sm" style={{ color: colors.text }}>123 Main Street, City</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: colors.secondary }}>
                <Phone className="w-5 h-5" style={{ color: colors.primary }} />
                <div>
                  <div className="text-xs opacity-70" style={{ color: colors.text }}>Phone</div>
                  <div className="text-sm" style={{ color: colors.text }}>+44 123 456 7890</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: colors.secondary }}>
                <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                <div>
                  <div className="text-xs opacity-70" style={{ color: colors.text }}>Hours</div>
                  <div className="text-sm" style={{ color: colors.text }}>Mon-Sun: 11am - 10pm</div>
                </div>
              </div>
            </div>
          </div>
        )
      case "checkout":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-center" style={{ color: colors.primary }}>Checkout Demo</h2>
            <div className="p-4 rounded-lg" style={{ background: colors.secondary }}>
              <div className="space-y-3">
                <div className="flex justify-between text-sm" style={{ color: colors.text }}>
                  <span>Signature Dish x2</span>
                  <span>$36</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: colors.text }}>
                  <span>House Special x1</span>
                  <span>$22</span>
                </div>
                <div className="border-t pt-2 mt-2" style={{ borderColor: `${colors.primary}30` }}>
                  <div className="flex justify-between font-bold" style={{ color: colors.primary }}>
                    <span>Total</span>
                    <span>$58</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 rounded-lg text-sm font-medium" style={{ background: colors.primary, color: colors.bg }}>
                Place Order
              </button>
            </div>
          </div>
        )
      default: // home
        return (
          <>
            {/* Hero Section */}
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.bg})` }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="text-2xl font-bold" style={{ color: colors.text }}>{name}</div>
                <div className="text-sm mt-2 opacity-80" style={{ color: colors.text }}>Welcome to our {category}</div>
                <button className="mt-4 px-6 py-2 rounded-full text-sm font-medium" style={{ background: colors.primary, color: colors.bg }}>
                  View Menu
                </button>
              </div>
            </div>
            {/* Features */}
            <div className="p-4">
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                {["Fast Delivery", "Fresh Food", "Best Prices", "Top Rated"].map((feat, i) => (
                  <div key={i} className="p-3 rounded-lg text-center" style={{ background: colors.secondary }}>
                    <div className="text-xs font-medium" style={{ color: colors.primary }}>{feat}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Sample Items */}
            <div className="p-4">
              <h3 className="font-bold mb-3" style={{ color: colors.text }}>Popular Items</h3>
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ background: colors.secondary }}>
                    <div className="h-20" style={{ background: `${colors.primary}30` }} />
                    <div className="p-2">
                      <div className="text-xs font-medium" style={{ color: colors.text }}>Item {i}</div>
                      <div className="text-sm font-bold" style={{ color: colors.primary }}>$12</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
    }
  }
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${isMobile ? "w-[375px] mx-auto" : "w-full"}`}
      style={{ background: colors.bg, minHeight: isMobile ? "600px" : "500px" }}
    >
      {/* Watermark */}
      <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
        <div 
          className="text-3xl md:text-5xl font-bold opacity-15 rotate-[-15deg] whitespace-nowrap select-none"
          style={{ color: colors.primary }}
        >
          Preview by MujeebProAI.com
        </div>
      </div>
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: `${colors.primary}30`, background: `${colors.secondary}90` }}>
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-5 h-5" style={{ color: colors.primary }} />
          <span className="font-bold" style={{ color: colors.primary }}>{name.split(" ")[0]}</span>
        </div>
        {!isMobile && (
          <nav className="flex gap-4 text-sm">
            {["Home", "Menu", "About", "Contact"].map(item => (
              <span key={item} className="opacity-70 cursor-pointer" style={{ color: colors.text }}>{item}</span>
            ))}
          </nav>
        )}
        {isMobile && <Menu className="w-5 h-5" style={{ color: colors.text }} />}
      </header>
      
      {/* Content */}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </div>
  )
}

export default function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [activeTab, setActiveTab] = useState("home")
  const [showWizard, setShowWizard] = useState(false)
  const { user } = useAuth()
  
  const theme = THEMES[slug]
  
  const handleSelectTheme = () => {
    if (!user) {
      toast.error("Please log in to select a theme")
      return
    }
    setShowWizard(true)
  }
  
  if (!theme) {
    return (
      <main className="relative min-h-screen bg-background overflow-hidden">
        <SpaceBackground />
        <div className="relative z-10">
          <Navbar />
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">Theme Not Found</h1>
              <p className="text-muted-foreground mb-6">The theme you are looking for does not exist.</p>
              <Button asChild>
                <Link href="/themes">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Themes
                </Link>
              </Button>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    )
  }
  
  const CategoryIcon = categoryIcons[theme.category] || Utensils
  
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <SpaceBackground />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Header */}
        <section className="pt-28 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link href="/themes" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                <ChevronLeft className="w-4 h-4" />
                Back to Themes
              </Link>
              
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {theme.category.charAt(0).toUpperCase() + theme.category.slice(1)}
                    </Badge>
                    <Badge variant="outline">${theme.price}</Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{theme.name}</h1>
                  <p className="text-lg text-muted-foreground max-w-2xl">{theme.description}</p>
                </div>
                
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent shrink-0" onClick={handleSelectTheme}>
                  <ShoppingBag className="w-5 h-5" />
                  Select This Theme - ${theme.price}
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Preview Section */}
        <section className="px-4 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Preview Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1"
              >
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  {/* Device Toggle */}
                  <div className="flex items-center gap-2 glass rounded-full p-1 border border-white/10">
                    <button
                      onClick={() => setDevice("desktop")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                        device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setDevice("mobile")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                        device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </button>
                  </div>
                  
                  {/* Page Tabs */}
                  <div className="flex items-center gap-1 glass rounded-lg p-1 border border-white/10 overflow-x-auto">
                    {PREVIEW_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                          activeTab === tab.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Preview Frame */}
                <div className="glass rounded-xl border border-white/10 overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-white/5 rounded-full px-4 py-1 text-xs text-muted-foreground text-center">
                        yourrestaurant.com
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Content */}
                  <div className={`overflow-auto ${device === "mobile" ? "py-4" : ""}`} style={{ maxHeight: "600px" }}>
                    <ThemePreview theme={theme} device={device} activeTab={activeTab} />
                  </div>
                </div>
              </motion.div>
              
              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:w-80 shrink-0"
              >
                <div className="glass rounded-xl border border-white/10 p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Theme Features</h3>
                  <ul className="space-y-3">
                    {theme.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="text-2xl font-bold text-foreground">${theme.price}</span>
                    </div>
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-accent" onClick={handleSelectTheme}>
                      <ShoppingBag className="w-4 h-4" />
                      Select This Theme
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      One-time payment, lifetime updates
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
      
      {/* Website Launch Wizard */}
      {showWizard && (
        <WebsiteLaunchWizard
          theme={{
            id: slug,
            name: theme.name,
            category: theme.category,
            price: theme.price,
            description: theme.description,
            features: theme.features,
            colors: {
              primary: theme.colors.primary,
              secondary: theme.colors.secondary,
              accent: theme.colors.accent,
            },
          }}
          onClose={() => setShowWizard(false)}
        />
      )}
    </main>
  )
}
