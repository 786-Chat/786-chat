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
  Menu,
  X,
  Truck,
  CornerDownRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  child?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opening-checks", label: "Opening Checks", icon: ShieldCheck },

  // Production records are saved into Ready Stock.
  { href: "/production", label: "Production", icon: Factory },
  { href: "/inventory", label: "Ready Stock", icon: Boxes, child: true },

  // Delivery intake records are saved into Stock.
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/stock", label: "Stock", icon: Boxes, child: true },

  { href: "/chat-structure", label: "Chat Structure", icon: Factory },
  { href: "/products", label: "Products", icon: Package },
  { href: "/ingredients", label: "Ingredients", icon: Package },
  { href: "/process-flow", label: "Process Flow", icon: Factory },

  // Daily food-safety operations kept together.
  { href: "/freezers", label: "Freezers", icon: Snowflake },
  { href: "/cleaning", label: "Cleaning", icon: SprayCan },
  { href: "/haccp", label: "HACCP", icon: ShieldCheck },
  { href: "/documents", label: "Documents", icon: FileText },
];

const closingItem: NavItem = {
  href: "/closing-checks",
  label: "Closing Checks",
  icon: ShieldCheck,
};

function SidebarLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-md text-sm font-medium transition-colors",
        item.child ? "ml-5 gap-2 px-3 py-1.5" : "gap-3 px-3 py-2",
        active
          ? "bg-sky-500/10 text-sky-400"
          : item.child
            ? "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      {item.child && <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-sky-500" />}
      <item.icon className={cn("shrink-0", item.child ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span className="min-w-0 break-words">{item.label}</span>
    </Link>
  );
}

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

      <div className="flex min-w-0">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-14 z-20 bg-black/60 lg:hidden"
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 max-w-[88vw] transform border-r border-slate-800 bg-slate-950 pt-14 transition-transform lg:static lg:w-64 lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex h-full min-h-0 flex-col gap-1 overflow-y-auto p-3">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={pathname === item.href}
                onClick={() => setMobileOpen(false)}
              />
            ))}

            <div className="mt-auto border-t border-slate-800 pt-3">
              <SidebarLink
                item={closingItem}
                active={pathname === closingItem.href}
                onClick={() => setMobileOpen(false)}
              />
            </div>
          </nav>
        </aside>

        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
