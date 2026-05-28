"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { 
  LayoutDashboard, 
  FileText, 
  UtensilsCrossed,
  Image as ImageIcon,
  CreditCard,
  ShoppingBag,
  Search,
  Globe,
  Palette,
  Receipt,
  HelpCircle,
  ChevronLeft,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Menu,
  X,
  Printer,
  ChefHat,
  Users,
  MapPin,
  CalendarDays,
  Star,
  Gift,
  QrCode,
  Truck,
  Percent,
  Smartphone,
  Download,
  Store
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.json())

const siteNavItems = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/content", label: "Website Content", icon: FileText },
  { href: "/menu", label: "Menu / Services", icon: UtensilsCrossed },
  { href: "/menu-builder", label: "Menu Builder", icon: UtensilsCrossed },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/kitchen", label: "Kitchen Display", icon: ChefHat },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/loyalty", label: "Loyalty Program", icon: Gift },
  { href: "/qr-codes", label: "QR Codes", icon: QrCode },
  { href: "/delivery-zones", label: "Delivery Zones", icon: Truck },
  { href: "/delivery-settings", label: "Delivery Settings", icon: Truck },
  { href: "/vat-settings", label: "VAT & Tax", icon: Receipt },
  { href: "/charges-settings", label: "Charges", icon: Percent },
  { href: "/visibility", label: "Visibility Settings", icon: Eye },
  { href: "/marketplace-profile", label: "Marketplace Profile", icon: Store },
  { href: "/pwa-settings", label: "App Icon / PWA", icon: Smartphone },
  { href: "/install-app", label: "Install App", icon: Download },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/printer", label: "Printer Settings", icon: Printer },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/google-business", label: "Google Business", icon: MapPin },
  { href: "/seo", label: "SEO Settings", icon: Search },
  { href: "/domain", label: "Domain Settings", icon: Globe },
  { href: "/theme", label: "Theme Settings", icon: Palette },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/support", label: "Support", icon: HelpCircle },
]

export default function SiteManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const params = useParams()
  const siteId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: siteData, error, mutate } = useSWR(
    siteId ? `/api/customer/sites/${siteId}` : null,
    fetcher
  )

  const site = siteData?.site
  const isLoading = authLoading || (!siteData && !error)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const togglePublish = async () => {
    if (!site) return
    try {
      const res = await fetch(`/api/customer/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_published: !site.is_published }),
      })
      if (res.ok) {
        mutate()
      }
    } catch (err) {
      console.error("Failed to toggle publish:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading site dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Site not found</h1>
          <p className="text-muted-foreground mb-4">This site does not exist or you do not have access.</p>
          <Button onClick={() => router.push("/dashboard/sites")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
        </div>
      </div>
    )
  }

  const basePath = `/dashboard/sites/${siteId}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(mobileMenuOpen || typeof window !== "undefined") && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={cn(
              "fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-card/95 backdrop-blur-xl border-r border-border flex flex-col",
              mobileMenuOpen ? "block" : "hidden lg:flex"
            )}
          >
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-border">
              <Link href="/dashboard/sites" className="flex items-center gap-3">
                <MujeebProAILogo variant="icon" size="xs" animated={false} />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm truncate block">{site.site_name}</span>
                  <p className="text-xs text-muted-foreground truncate">{site.subdomain}.mujeebproai.com</p>
                </div>
              </Link>
            </div>

            {/* Site Status */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    site.is_published ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  <span className="text-xs font-medium">
                    {site.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePublish}
                  className="h-7 text-xs"
                >
                  {site.is_published ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
              {site.is_published && (
                <a
                  href={`/site/${site.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Live Site
                </a>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
              <ul className="space-y-1">
                {siteNavItems.map((item) => {
                  const fullPath = basePath + item.href
                  const isActive = pathname === fullPath || (item.href === "" && pathname === basePath)
                  return (
                    <li key={item.href}>
                      <Link
                        href={fullPath}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Back Link */}
            <div className="p-4 border-t border-border">
              <Link 
                href="/dashboard/sites"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                All Sites
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 ml-10 lg:ml-0">
            <span className="font-semibold">{site.site_name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {site.theme_name || "Custom Theme"}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {site.is_published && (
              <a
                href={`/site/${site.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Site
              </a>
            )}
            <Button
              variant={site.is_published ? "outline" : "default"}
              size="sm"
              onClick={togglePublish}
            >
              {site.is_published ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
