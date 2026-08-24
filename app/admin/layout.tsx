"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  BellRing,
  Bot,
  ChevronLeft,
  FolderKanban,
  Globe,
  Headphones,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Rocket,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Manage",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/users", label: "Customer Approvals", icon: Users },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/monitoring", label: "Monitoring", icon: BellRing },
    ],
  },
  {
    label: "AI & Support",
    items: [
      { href: "/admin/ai-control", label: "AI Control", icon: Bot },
      { href: "/admin/ai-usage", label: "AI Usage", icon: Zap },
      { href: "/admin/support", label: "Support Inbox", icon: Headphones },
    ],
  },
  {
    label: "Customer Delivery",
    items: [
      { href: "/admin/site-deployments", label: "Deployments", icon: Rocket },
      { href: "/admin/customer-sites", label: "Customer Sites", icon: Globe },
      { href: "/admin/imports", label: "Website Imports", icon: Upload },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = user?.role === "admin" || user?.email?.toLowerCase() === "mujeeb@job4u.com"

  useEffect(() => {
    setSidebarOpen(false)
    if (isLoading) return
    if (!user) router.replace("/admin-login")
    else if (!isAdmin) router.replace("/786.chat")
  }, [isLoading, isAdmin, pathname, router, user])

  async function handleLogout() {
    await logout()
    router.replace("/admin-login")
  }

  if (pathname === "/admin-login") return <>{children}</>

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#030712] text-white">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          Checking owner access…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white lg:flex">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-white/10 bg-[#050918]/95 shadow-2xl backdrop-blur-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 to-violet-500/20 text-[11px] font-black text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.12)]">786</span>
            <span className="min-w-0">
              <strong className="block truncate text-base">786.Chat Owner</strong>
              <small className="block truncate text-xs text-slate-500">Admin control centre</small>
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                          active
                            ? "border border-cyan-300/15 bg-gradient-to-r from-cyan-400/15 to-violet-500/10 text-cyan-100 shadow-[inset_3px_0_0_rgba(34,211,238,.8)]"
                            : "text-slate-400 hover:bg-white/[.045] hover:text-white",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Link href="/786.chat" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.03] text-sm text-slate-300 transition hover:bg-white/[.07] hover:text-white">
            <ChevronLeft className="h-4 w-4" /> Back to 786.Chat
          </Link>
          <Button variant="ghost" className="w-full text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#030712]/85 px-4 backdrop-blur-xl sm:px-6">
          <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-300" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">786.Chat Admin</p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">Customers, projects, AI, deployments and platform health</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 sm:inline-flex">Owner access</span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-sm font-black text-white">
              {user.name?.charAt(0).toUpperCase() || "M"}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
