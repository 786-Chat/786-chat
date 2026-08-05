"use client"

import "./globals.css";
import Link from "next/link";
import { Phone, Menu, X } from "lucide-react";
import { useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f6] text-[#1a2e2a] antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-700">Pearl</span>
            <span className="text-2xl font-bold text-amber-500">Care</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-emerald-900 hover:text-amber-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-800 transition-colors"
            >
              <Phone className="w-4 h-4" />
              (555) 123-4567
            </a>
          </nav>
          <button
            className="md:hidden text-emerald-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-medium text-emerald-900 hover:text-amber-600 py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="tel:+15551234567"
              className="block text-center bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-semibold"
            >
              Call Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-emerald-950 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">PearlCare Dental</h3>
            <p className="text-emerald-200 text-sm">
              Premium dental care with a gentle touch. Your smile is our priority.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-emerald-200 text-sm">123 Wellness Avenue, Suite 200</p>
            <p className="text-emerald-200 text-sm">(555) 123-4567</p>
            <p className="text-emerald-200 text-sm">hello@pearlcare.com</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Hours</h4>
            <p className="text-emerald-200 text-sm">Mon-Fri: 8am - 6pm</p>
            <p className="text-emerald-200 text-sm">Sat: 9am - 2pm</p>
            <p className="text-emerald-200 text-sm">Sun: Closed</p>
          </div>
        </div>
        <div className="border-t border-emerald-800 mt-8 pt-6 text-center text-sm text-emerald-300">
          © 2025 PearlCare Dental Clinic. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
