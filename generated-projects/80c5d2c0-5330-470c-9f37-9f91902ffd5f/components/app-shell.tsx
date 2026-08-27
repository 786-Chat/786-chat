"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Package,
  Snowflake,
  Boxes,
  SprayCan,
  ShieldCheck,
  FileText,
  GitBranch,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/freezers", label: "Freezers", icon: Snowflake },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/inventory", label: "Ready Stock", icon: Boxes },
  { href: "/cleaning", label: "Cleaning", icon: SprayCan },
  { href: "/opening-checks", label: "Opening Checks", icon: ShieldCheck },
  { href: "/closing-checks", label: "Closing Checks", icon: ShieldCheck },
  { href: "/haccp", label: "HACCP", icon: ShieldCheck },
  { href: "/process-flow", label: "Process Flow", icon: GitBranch },
  { href: "/documents", label: "Documents", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
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
        </div>
      </header>

      <div className="flex">
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

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
