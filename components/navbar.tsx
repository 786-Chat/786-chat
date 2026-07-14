"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/themes", label: "Themes" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${isScrolled ? "border-b border-white/5 py-2 glass-strong" : "bg-transparent py-3"}`}
    >
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between overflow-visible px-4 sm:h-32 sm:px-6 lg:px-8">
        <Link href="/" aria-label="786 Chat AI home" className="relative z-20 flex shrink-0 items-center">
          <div className="block sm:hidden"><MujeebProAILogo variant="icon" size="sm" animated={false} /></div>
          <div className="hidden sm:block"><MujeebProAILogo variant="icon" size="xl" /></div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link, index) => {
            const isActive = link.href === "/themes" ? pathname === "/themes" || pathname?.startsWith("/themes/") : link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href) && link.href !== "/"
            return (
              <motion.div key={link.href} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 + 0.3 }}>
                <Link href={link.href} className={`group relative text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div className="hidden items-center gap-3 md:flex" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          {isLoading ? <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" /> : user ? (
            <>
              <Button variant="ghost" asChild className="hover:bg-white/5"><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></Button>
              <Button variant="outline" onClick={handleLogout} className="border-white/10 hover:border-primary/50 hover:bg-primary/10"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hover:bg-white/5"><Link href="/login">Log in</Link></Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild className="relative overflow-hidden bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:opacity-90"><Link href="/register"><span className="relative z-10">Get Started</span></Link></Button>
              </motion.div>
            </>
          )}
        </motion.div>

        <motion.button whileTap={{ scale: 0.9 }} className="flex h-10 w-10 items-center justify-center rounded-xl md:hidden glass" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          <AnimatePresence mode="wait">
            {isOpen ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="h-5 w-5" /></motion.div> : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="h-5 w-5" /></motion.div>}
          </AnimatePresence>
        </motion.button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -20 }} className="overflow-hidden border-t border-white/5 md:hidden glass-strong">
            <div className="flex flex-col gap-2 px-4 py-6">
              {navLinks.map((link, index) => (
                <motion.div key={link.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link href={link.href} className="block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground" onClick={() => setIsOpen(false)}>{link.label}</Link>
                </motion.div>
              ))}
              <div className="mt-2 flex flex-col gap-3 border-t border-white/5 pt-4">
                {isLoading ? <div className="h-12 animate-pulse rounded-xl bg-white/5" /> : user ? (
                  <><Button variant="outline" asChild className="h-12 w-full border-white/10" onClick={() => setIsOpen(false)}><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></Button><Button variant="ghost" className="h-12 w-full" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></>
                ) : (
                  <><Button variant="outline" asChild className="h-12 w-full border-white/10" onClick={() => setIsOpen(false)}><Link href="/login">Log in</Link></Button><Button asChild className="h-12 w-full bg-gradient-to-r from-primary to-accent" onClick={() => setIsOpen(false)}><Link href="/register">Get Started</Link></Button></>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
