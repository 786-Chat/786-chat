"use client"

import { useState, useEffect } from "react"
import { Menu, X, Phone, MapPin, Clock } from "lucide-react"

interface RestaurantHeaderProps {
  restaurantName: string
  logoUrl?: string
  phone: string
  address: string
  openingHours: string
}

export function RestaurantHeader({
  restaurantName,
  logoUrl,
  phone,
  address,
  openingHours,
}: RestaurantHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Menu", href: "#menu" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#0a0a0a]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      {/* Top Info Bar - hidden on mobile */}
      <div
        className={`hidden md:flex items-center justify-center gap-8 py-2 text-[10px] uppercase tracking-[0.25em] text-[#b8a07a]/70 border-b border-[#b8a07a]/10 transition-all duration-500 ${
          isScrolled ? "h-0 overflow-hidden opacity-0 py-0" : "h-8 opacity-100"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> {address}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> {openingHours}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="w-3 h-3" /> {phone}
        </span>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-3 group">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="h-10 w-10 object-contain rounded-full ring-2 ring-[#b8a07a]/30 group-hover:ring-[#b8a07a]/60 transition-all"
              />
            )}
            <div>
              <span className="text-[10px] tracking-[0.35em] uppercase text-[#b8a07a] block leading-none mb-0.5">
                Fine Dining
              </span>
              <span className="font-serif text-xl md:text-2xl font-bold text-white tracking-tight">
                {restaurantName}
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.2em] text-white/70 hover:text-[#b8a07a] transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#b8a07a] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a
              href="#reservation"
              className="ml-4 px-6 py-2.5 bg-[#b8a07a] text-[#0a0a0a] text-xs uppercase tracking-[0.2em] font-semibold rounded-full hover:bg-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,160,122,0.3)]"
            >
              Reserve a Table
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-[#b8a07a] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <div
        className={`fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ top: "64px" }}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-8 px-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-serif text-white/80 hover:text-[#b8a07a] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#reservation"
            onClick={() => setIsMenuOpen(false)}
            className="mt-4 px-10 py-4 bg-[#b8a07a] text-[#0a0a0a] text-sm uppercase tracking-[0.2em] font-semibold rounded-full hover:bg-white transition-all"
          >
            Reserve a Table
          </a>
        </nav>
      </div>
    </header>
  )
}
