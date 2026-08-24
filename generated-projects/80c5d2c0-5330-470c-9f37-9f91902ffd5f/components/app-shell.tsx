"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Package,
  Wheat,
  Snowflake,
  Boxes,
  Thermometer,
  SprayCan,
  ShieldCheck,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/products", label: "Products", icon: Package },
  { href: "/ingredients", label: "Ingredients", icon: Wheat },
  { href: "/freezers", label: "Freezers", icon: Snowflake },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/temperature", label: "Temperature", icon: Thermometer },
  { href: "/cleaning", label: "Cleaning", icon: SprayCan },
  { href: "/haccp", label: "HACCP", icon: ShieldCheck },
  { href: "/documents", label: "Documents", icon: FileText },
];

const pageOrder = [
  "/dashboard",
  "/production",
  "/products",
  "/ingredients",
  "/freezers",
  "/stock",
  "/inventory",
  "/temperature",
  "/cleaning",
  "/haccp",
  "/documents",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentIndex = pageOrder.indexOf(pathname);
  const prev = currentIndex > 0 ? pageOrder[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < pageOrder.length - 1 ? pageOrder[currentIndex + 1] : null;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-sky-500 font-bold text-slate-950">RC</span>
            <span className="text-sm font-semibold tracking-wide">Raja Catering</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {prev && (
              <Link
                href={prev}
                aria-label="Previous page"
                className="rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {next && (
              <Link
                href={next}
                aria-label="Next page"
                className="rounded-md border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-800 bg-slate-950 pt-14 transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sky-500/10 text-sky-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span>Plant: Main Kitchen</span>
          <span>Shift: A</span>
          <span>Sync: 2 min ago</span>
          <span>Audit: OK</span>
          <span>Connectivity: Online</span>
        </div>
      </footer>
    </div>
  );
}
