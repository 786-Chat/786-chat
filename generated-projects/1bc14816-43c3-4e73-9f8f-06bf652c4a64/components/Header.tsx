"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-navy-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Coffee className="h-5 w-5 text-cyan-400 shrink-0" />
          <span className="font-semibold tracking-tight truncate">786 Journey Coffee</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-colors min-h-[44px] inline-flex items-center",
                pathname === l.href
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10"
              )}
            >
              {l.label}
            </Link>
          ))}
          <span className="hidden sm:inline-flex items-center gap-1 ml-2 text-xs font-mono text-online">
            <Radio className="h-3 w-3" /> ONLINE
          </span>
        </nav>
      </div>
    </header>
  );
}
