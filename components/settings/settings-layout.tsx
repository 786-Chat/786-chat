"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Users,
  Plug,
  BarChart3,
  Shield,
  CreditCard,
  UserCircle,
  Gift,
  Palette,
  ChevronLeft,
  X,
  Menu,
  Building2,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SettingsLayoutProps {
  children: React.ReactNode
}

const settingsSections = [
  {
    title: "Workspace",
    items: [
      { icon: Building2, label: "Workspace Overview", href: "/dashboard/settings" },
      { icon: Users, label: "Collaborators", href: "/dashboard/settings/collaborators" },
      { icon: Plug, label: "Integrations", href: "/dashboard/settings/integrations" },
      { icon: BarChart3, label: "Workspace Usage", href: "/dashboard/settings/workspace-usage" },
      { icon: Shield, label: "Security", href: "/dashboard/settings/security" },
    ]
  },
  {
    title: "Account",
    items: [
      { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
      { icon: Zap, label: "Account Usage", href: "/dashboard/usage" },
      { icon: Settings, label: "Advanced", href: "/dashboard/settings/advanced" },
    ]
  },
  {
    title: "User",
    items: [
      { icon: UserCircle, label: "Profile", href: "/dashboard/profile" },
      { icon: Gift, label: "Promotions & Referrals", href: "/dashboard/settings/promotions" },
      { icon: Palette, label: "Personalization", href: "/dashboard/settings/personalization" },
    ]
  },
]

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold">Settings</h1>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex">
        {/* Settings Sidebar */}
        <motion.aside
          initial={false}
          animate={{ 
            width: sidebarOpen ? 260 : 0,
            x: mobileSidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0)
          }}
          className={cn(
            "h-[calc(100vh-64px)] lg:h-screen bg-card border-r border-border flex-shrink-0 overflow-hidden",
            "fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
          )}
        >
          <div className="w-[260px] h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Workspace
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {settingsSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    {section.title}
                  </h3>
                  <nav className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-background">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
