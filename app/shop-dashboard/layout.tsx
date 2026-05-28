"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Pizza,
  Gift,
  ImageIcon,
  Truck,
  Receipt,
  Clock,
  Store,
  Users,
  ChefHat,
  CreditCard,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  Bell,
  Eye,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Site {
  id: string
  site_name: string
  subdomain: string
  business_name?: string
  is_active: boolean
  is_locked: boolean
  payment_status?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  siteId?: string
}

interface ShopSession {
  user: User
  site: Site
  timestamp: number
}

interface ShopContextType {
  user: User | null
  site: Site | null
  isLoading: boolean
  logout: () => void
  debugInfo: DebugInfo
}

interface DebugInfo {
  cookieFound: boolean
  localStorageFound: boolean
  sessionApiStatus: string
  userEmail: string
  siteId: string
}

const ShopContext = createContext<ShopContextType | null>(null)

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error("useShop must be used within ShopProvider")
  return context
}

// Debug component for development
function DebugBox({ debugInfo }: { debugInfo: DebugInfo }) {
  const [show, setShow] = useState(true)
  
  if (!show) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono z-[9999] max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-white">Debug Info</span>
        <button onClick={() => setShow(false)} className="text-gray-400 hover:text-white">X</button>
      </div>
      <div className="space-y-1">
        <div>Cookie: <span className={debugInfo.cookieFound ? "text-green-400" : "text-red-400"}>{debugInfo.cookieFound ? "YES" : "NO"}</span></div>
        <div>LocalStorage: <span className={debugInfo.localStorageFound ? "text-green-400" : "text-red-400"}>{debugInfo.localStorageFound ? "YES" : "NO"}</span></div>
        <div>Session API: <span className={debugInfo.sessionApiStatus === "ok" ? "text-green-400" : "text-red-400"}>{debugInfo.sessionApiStatus}</span></div>
        <div>Email: <span className="text-yellow-400">{debugInfo.userEmail || "N/A"}</span></div>
        <div>SiteID: <span className="text-yellow-400">{debugInfo.siteId || "N/A"}</span></div>
      </div>
    </div>
  )
}

const sidebarItems = [
  { name: "Overview", href: "/shop-dashboard", icon: LayoutDashboard },
  { name: "AI Assistant", href: "/shop-dashboard/ai", icon: Sparkles },
  { name: "Menu Builder", href: "/shop-dashboard/menu", icon: UtensilsCrossed },
  { name: "Orders", href: "/shop-dashboard/orders", icon: ShoppingBag },
  { name: "Toppings & Extras", href: "/shop-dashboard/toppings", icon: Pizza },
  { name: "Meal Deals", href: "/shop-dashboard/deals", icon: Gift },
  { name: "Images/Gallery", href: "/shop-dashboard/gallery", icon: ImageIcon },
  { name: "Delivery Settings", href: "/shop-dashboard/delivery", icon: Truck },
  { name: "VAT & Charges", href: "/shop-dashboard/vat", icon: Receipt },
  { name: "Opening Hours", href: "/shop-dashboard/hours", icon: Clock },
  { name: "Marketplace Settings", href: "/shop-dashboard/marketplace", icon: Store },
  { name: "Driver Activity", href: "/shop-dashboard/drivers", icon: Users },
  { name: "Kitchen Display", href: "/shop-dashboard/kitchen", icon: ChefHat },
  { name: "Billing", href: "/shop-dashboard/billing", icon: CreditCard },
  { name: "Support", href: "/shop-dashboard/support", icon: HelpCircle },
]

export default function ShopDashboardLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [site, setSite] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [siteSelectorOpen, setSiteSelectorOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    cookieFound: false,
    localStorageFound: false,
    sessionApiStatus: "checking",
    userEmail: "",
    siteId: ""
  })
  
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    let sessionData: ShopSession | null = null
    let apiStatus = "checking"
    let cookieFound = false
    let localStorageFound = false

    // 1. Try session API first (checks httpOnly cookie)
    try {
      const res = await fetch("/api/shop/session")
      if (res.ok) {
        const data = await res.json()
        cookieFound = true
        apiStatus = "ok"
        sessionData = {
          user: data.user,
          site: data.site,
          timestamp: Date.now()
        }
      } else {
        apiStatus = `error: ${res.status}`
      }
    } catch (error) {
      apiStatus = "network error"
    }

    // 2. If API failed, check localStorage backup
    if (!sessionData) {
      try {
        const stored = localStorage.getItem("shop-session")
        if (stored) {
          const parsed = JSON.parse(stored) as ShopSession
          // Check if session is less than 7 days old
          if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            localStorageFound = true
            sessionData = parsed
          }
        }
      } catch {
        // localStorage not available or parse error
      }
    }

    // Update debug info
    setDebugInfo({
      cookieFound,
      localStorageFound,
      sessionApiStatus: apiStatus,
      userEmail: sessionData?.user?.email || "",
      siteId: sessionData?.site?.id || sessionData?.user?.siteId || ""
    })

    // 3. If we have session data, use it
    if (sessionData && sessionData.user) {
      setUser(sessionData.user)
      setSite(sessionData.site || null)
      setIsLoading(false)
    } else {
      // No valid session - redirect to login
      localStorage.removeItem("shop-session")
      router.push("/shop-login")
    }
  }

  const logout = async () => {
    await fetch("/api/shop/logout", { method: "POST" })
    localStorage.removeItem("shop-session")
    router.push("/shop-login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ShopContext.Provider value={{ user, site, isLoading, logout, debugInfo }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
        {/* Debug Box */}
        <DebugBox debugInfo={debugInfo} />
        
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-b border-purple-500/20 z-50 flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-amber-400">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">{site?.site_name || "Dashboard"}</span>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black z-40"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-purple-500/20 z-50 overflow-y-auto"
              >
                <SidebarContent 
                  pathname={pathname} 
                  currentSite={site}
                  siteSelectorOpen={siteSelectorOpen}
                  setSiteSelectorOpen={setSiteSelectorOpen}
                  logout={logout}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-purple-500/20 overflow-y-auto">
          <SidebarContent 
            pathname={pathname} 
            currentSite={site}
            siteSelectorOpen={siteSelectorOpen}
            setSiteSelectorOpen={setSiteSelectorOpen}
            logout={logout}
          />
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 pt-16 lg:pt-0">
          {/* Payment Warning Banner */}
          {site?.is_locked && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Your website is currently suspended due to unpaid subscription.</p>
                <p className="text-sm text-red-200">Please pay your bill to reactivate your website.</p>
              </div>
              <Link href="/shop-dashboard/billing">
                <Button size="sm" className="bg-white text-red-600 hover:bg-red-50">Pay Now</Button>
              </Link>
            </div>
          )}
          
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ShopContext.Provider>
  )
}

function SidebarContent({ 
  pathname, 
  currentSite, 
  siteSelectorOpen, 
  setSiteSelectorOpen,
  logout,
  onClose 
}: {
  pathname: string
  currentSite: Site | null
  siteSelectorOpen: boolean
  setSiteSelectorOpen: (open: boolean) => void
  logout: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-semibold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent text-sm">Restaurant Panel</p>
              <p className="text-xs text-slate-500">VIP Dashboard</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-amber-400">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Site Info */}
      {currentSite && (
        <div className="p-3 border-b border-purple-500/20">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 border border-purple-500/20">
            <p className="font-medium text-amber-300 text-sm">{currentSite.site_name}</p>
            <p className="text-xs text-slate-500">{currentSite.subdomain}.mujeebproai.com</p>
            <Link 
              href={`/site/${currentSite.subdomain}/menu`} 
              target="_blank"
              className="mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-xs font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
            >
              <Eye className="w-4 h-4" />
              View Public Menu
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/shop-dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-amber-400")} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-purple-500/20">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
        <p className="mt-3 text-center text-xs text-slate-600">
          Powered by <span className="bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent font-medium">MujeebProAI</span>
        </p>
      </div>
    </div>
  )
}
