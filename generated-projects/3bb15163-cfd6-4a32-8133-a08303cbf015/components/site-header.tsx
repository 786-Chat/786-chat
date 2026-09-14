"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-shell flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
          <span className="flex h-7 w-7 items-center justify-center border border-ink bg-ink text-paper">
            <Coffee className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">786 Journey Coffee</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
                  active ? "border-ink bg-ink text-paper" : "text-muted hover:border-line hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
