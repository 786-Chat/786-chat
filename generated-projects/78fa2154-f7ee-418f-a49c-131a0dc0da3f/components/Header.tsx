"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Coffee } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-stone-900">
          <Coffee className="h-6 w-6 text-accent" />
          <span className="font-serif text-lg font-semibold tracking-tight">
            786 Journey Coffee
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-600 transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary text-xs">
            Book a Tasting
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 text-xs"
            >
              Book a Tasting
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}