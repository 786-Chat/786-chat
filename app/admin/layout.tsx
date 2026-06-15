"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  CreditCard,
  MessageSquare,
  ChevronLeft,
  Loader2,
  FileText,
  DollarSign,
  Search,
  LogOut,
  Activity,
  ImageIcon,
  Palette,
  Globe,
  ScrollText,
  MapPin,
  Rocket,
  Upload,
  Download,
  Coins,
  Store,
  UtensilsCrossed,
  Package,
  Share2,
  Bot,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/ai-control", label: "AI Control", icon: Bot },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Bot },
  { href: "/admin/balances", label: "User Balances", icon: Coins },
  { href: "/admin/site-deployments", label: "Deployments", icon: Rocket },
  { href: "/admin/customer-launches", label: "Customer Launches", icon: Rocket },
  { href: "/admin/imports", label: "Website Imports", icon: Upload },
  { href: "/admin/marketplace", label: "Marketplace", icon: Store },
  { href: "/food", label: "Order Food", icon: UtensilsCrossed },
  { href: "/admin/theme-import", label: "Theme Library", icon: Download },
  { href: "/admin/master-themes", label: "Master Themes", icon: Palette },
  { href: "/admin/customer-sites", label: "Customer Sites", icon: Globe },
  { href: "/admin/google-business", label: "Google Business", icon: MapPin },
  { href: "/admin/themes", label: "Theme Sales", icon: Palette },
  { href: "/admin/currency-pricing", label: "Currency & Pricing", icon: Coins },
  { href: "/admin/module-pricing", label: "Module Pricing", icon: Package },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/logs", label: "Admin Logs", icon: ScrollText },
  { href: "/admin/chats", label: "Chat Logs", icon: MessageSquare },
  { href: "/admin/logo", label: "Upload Logo", icon: ImageIcon },
  { href: "/admin/social-links", label: "Social Links", icon: Share2 },
  { href: "/admin/content", label: "Website Content", icon: FileText },
  { href: "/admin/pricing", label: "Pricing Plans", icon: DollarSign },
  { href: "/admin/seo", label: "SEO Settings", icon: Search },
  { href: "/admin/settings/stripe", label: "Stripe Integration", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // State for mobile sidebar

  const handleLogout = async () => {
    await logout()
    router.replace("/admin-login")
  }

  useEffect(() => {
    // Close sidebar on navigation
    setIsSidebarOpen(false)

    // Skip auth check for admin login page
    if (pathname === "/admin-login") {
      setIsAuthorized(true)
      return
    }
    
    if (!isLoading) {
      // Check if user is admin - check role from database or specific emails
      const isAdmin = user?.role === "admin" || user?.email === "admin@mujeebproai.com" || user?.email === "mujeeb@job4u.com"
      
      if (!user) {
        // Not logged in - middleware should handle redirect, but set a fallback
        setIsAuthorized(false)
        setTimeout(() => {
          router.replace("/admin-login")
        }, 100)
      } else if (!isAdmin) {
        // Logged in but not admin
        setIsAuthorized(false)
        setTimeout(() => {
          router.replace("/dashboard")
        }, 100)
      } else {
        setIsAuthorized(true)
      }
    }
  }, [user, isLoading, router, pathname])

  // Show login page without layout
  if (pathname === "/admin-login") {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized && pathname !== "/admin-login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-semibold">Admin Access Required</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
          <Link href="/admin-login">
            <Button variant="outline">Go to Admin Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-card border-r border-border flex flex-col",
          "transform -translate-x-full transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "",
          "sm:relative sm:translate-x-0 sm:w-64"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
            <MujeebProAILogo variant="icon" size="sm" animated={false} />
            <div>
              <span className="font-bold text-lg">Admin Panel</span>
              <p className="text-xs text-muted-foreground">MujeebProAI</p>
            </div>
          </Link>
          {/* Close button for mobile sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setIsSidebarOpen(false)} // Close sidebar on item click
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Back to Dashboard */}
        <div className="p-4 border-t border-border space-y-2">
          <Link 
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Button
            variant="ghost"
            className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header (visible only on small screens) */}
        <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 sm:hidden z-30">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="font-semibold text-white truncate">Admin Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={handleLogout}
                  title="Logout"
              >
                  <LogOut className="w-4 h-4" />
              </Button>
          </div>
        </header>

        {/* Desktop Header (hidden on small screens) */}
        <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border hidden sm:flex items-center px-6 z-30">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="font-semibold">Admin Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="text-sm font-medium text-red-500">Admin Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-red-500"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
