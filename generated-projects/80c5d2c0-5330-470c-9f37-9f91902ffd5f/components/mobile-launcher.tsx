"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Truck,
  Boxes,
  Package,
  Wheat,
  Snowflake,
  SprayCan,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  FolderOpen,
} from "lucide-react";

const apps = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "bg-sky-500" },
  { name: "Opening Checks", href: "/opening-checks", icon: ClipboardCheck, color: "bg-teal-500" },
  { name: "Production", href: "/production", icon: Factory, color: "bg-emerald-500" },
  { name: "Delivery", href: "/delivery", icon: Truck, color: "bg-amber-500" },
  { name: "Ready Stock", href: "/inventory", icon: Boxes, color: "bg-violet-500" },
  { name: "Stock", href: "/stock", icon: Package, color: "bg-blue-500" },
  { name: "Products", href: "/products", icon: Package, color: "bg-pink-500" },
  { name: "Ingredients", href: "/ingredients", icon: Wheat, color: "bg-green-500" },
  { name: "Freezers", href: "/freezers", icon: Snowflake, color: "bg-cyan-500" },
  { name: "Cleaning", href: "/cleaning", icon: SprayCan, color: "bg-indigo-500" },
  { name: "HACCP", href: "/haccp", icon: ShieldCheck, color: "bg-red-500" },
  { name: "Documents", href: "/documents", icon: FileText, color: "bg-slate-500" },
  { name: "My Documents", href: "/my-documents", icon: FolderOpen, color: "bg-purple-500" },
  { name: "Closing Checks", href: "/closing-checks", icon: ClipboardCheck, color: "bg-orange-500" },
];

export default function MobileLauncher() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile || pathname !== "/") return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-full w-full max-w-md px-4 pb-8 pt-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Super Business Mujeeb
          </h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Master Template
          </p>
          <span className="mt-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            MASTER TEMPLATE – SUPER ADMIN ONLY
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 transition active:scale-95"
            >
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${app.color}`}>
                <app.icon className="h-8 w-8 text-white" />
              </span>
              <span className="text-center text-xs font-medium leading-tight text-slate-200">
                {app.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
