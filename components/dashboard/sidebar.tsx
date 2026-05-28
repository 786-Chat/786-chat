"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  LayoutDashboard, 
  Settings, 
  User, 
  CreditCard,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  BarChart3,
  Zap,
  Crown
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-cyan-500" },
  { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare, color: "from-purple-500 to-pink-500" },
  { href: "/dashboard/history", label: "Chat History", icon: History, color: "from-orange-500 to-red-500" },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3, color: "from-green-500 to-emerald-500" },
  { href: "/dashboard/profile", label: "Profile", icon: User, color: "from-indigo-500 to-purple-500" },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard, color: "from-yellow-500 to-orange-500" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "from-gray-500 to-gray-600" },
]

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield, color: "from-red-500 to-rose-500" },
]

export function DashboardSidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isAdmin = user?.email === "admin@mujeebproai.com"

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen glass border-r border-white/5 flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <MujeebProAILogo variant={isCollapsed ? "icon" : "full"} size="sm" />
        </Link>
      </div>

      {/* Plan Badge */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 py-3 border-b border-white/5"
          >
            <div className="relative overflow-hidden rounded-xl glass border border-white/10 p-3">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10" />
              
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  {user?.plan === "pro" ? (
                    <Crown className="w-4 h-4 text-white" />
                  ) : (
                    <Zap className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <p className="text-sm font-bold gradient-text capitalize">{user?.plan || "Free"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Credits</p>
                  <p className="text-sm font-semibold text-foreground">{user?.credits || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <motion.li 
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-10`}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Active border */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBorder"
                      className={`absolute inset-0 rounded-xl border border-white/10`}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <motion.div 
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isActive 
                        ? `bg-gradient-to-br ${item.color}` 
                        : "bg-white/5 group-hover:bg-white/10"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  </motion.div>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "text-sm font-medium relative z-10",
                          isActive && "text-foreground"
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.li>
            )
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <li className="pt-6 pb-2">
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      Admin
                    </motion.p>
                  )}
                </AnimatePresence>
              </li>
              {adminItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.color} opacity-10`} />
                      )}
                      
                      <motion.div 
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                          isActive 
                            ? `bg-gradient-to-br ${item.color}` 
                            : "bg-white/5 group-hover:bg-white/10"
                        )}
                        whileHover={{ scale: 1.1 }}
                      >
                        <item.icon className={cn(
                          "w-4 h-4",
                          isActive ? "text-white" : "text-muted-foreground"
                        )} />
                      </motion.div>
                      
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                )
              })}
            </>
          )}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-white/5 p-3">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "email@example.com"}</p>
              </div>
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={logout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-full p-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </motion.button>
    </motion.aside>
  )
}
