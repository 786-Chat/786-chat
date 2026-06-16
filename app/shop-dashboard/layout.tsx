"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Gift,
  CreditCard,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ShopSite {
  id: string
  site_name?: string
  name?: string
  subdomain?: string
  custom_domain?: string | null
  is_locked?: boolean
  is_active?: boolean
  is_published?: boolean
}

interface ShopContextValue {
  site: ShopSite | null
  loading: boolean
  refreshSite: () => Promise<void>
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined)

export function useShop() {
  const context = useContext(ShopContext)

  if (!context) {
    throw new Error("useShop must be used inside ShopDashboardLayout")
  }

  return context
}

const navItems = [
  { label: "Dashboard", href: "/shop-dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/shop-dashboard/orders", icon: ShoppingBag },
  { label: "Menu", href: "/shop-dashboard/menu", icon: Utensils },
  { label: "Deals", href: "/shop-dashboard/deals", icon: Gift },
  { label: "Billing", href: "/shop-dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/shop-dashboard/settings", icon: Settings },
]

export default function ShopDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [site, setSite] = useState<ShopSite | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSite = async () => {
    try {
      const res = await fetch("/api/sites/my-site", {
        credentials: "include",
        cache: "no-store",
      })

      if (res.ok) {
        const data = await res.json()

        setSite({
          id: data.id || data.site?.id || "shop-site",
          site_name:
            data.site_name ||
            data.site?.site_name ||
            data.name ||
            data.site?.name ||
            "My Shop",
          name: data.name || data.site?.name || "My Shop",
          subdomain: data.subdomain || data.site?.subdomain,
          custom_domain: data.custom_domain || data.site?.custom_domain || null,
          is_locked: Boolean(data.is_locked || data.site?.is_locked),
          is_active: data.is_active ?? data.site?.is_active ?? true,
          is_published: data.is_published ?? data.site?.is_published ?? false,
        })
      } else {
        setSite({
          id: "shop-site",
          site_name: "My Shop",
          name: "My Shop",
          is_locked: false,
          is_active: true,
          is_published: false,
        })
      }
    } catch {
      setSite({
        id: "shop-site",
        site_name: "My Shop",
        name: "My Shop",
        is_locked: false,
        is_active: true,
        is_published: false,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSite()
  }, [])

  const shopName = site?.site_name || site?.name || "Shop Dashboard"

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <ShopContext.Provider value={{ site, loading, refreshSite }}>
      <div className="min-h-screen bg-slate-50 flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
          <div className="p-5 border-b border-slate-200">
            <h1 className="text-lg font-bold text-slate-900">{shopName}</h1>
            <p className="text-xs text-slate-500 mt-1">Restaurant Dashboard</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/shop-dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-slate-200">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Back to Workspace
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ShopContext.Provider>
  )
}
