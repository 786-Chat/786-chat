"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" }
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-transparent px-4 transition-all duration-300",
          scrolled
            ? "mt-2 border-black/5 bg-white/80 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl"
            : "mt-4 bg-white/40 py-3 backdrop-blur-md"
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Coffee className="h-4 w-4 text-accent" aria-hidden />
          <span>786 Journey</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-graphite/70 transition-colors hover:bg-black/5 hover:text-graphite"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
