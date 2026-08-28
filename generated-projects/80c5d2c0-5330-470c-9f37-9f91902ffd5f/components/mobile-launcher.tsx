"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ChevronRight,
} from "lucide-react";

const apps = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "bg-sky-500" },
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
  { name: "Opening Checks", href: "/opening-checks", icon: ClipboardCheck, color: "bg-teal-500" },
  { name: "Closing Checks", href: "/closing-checks", icon: ClipboardCheck, color: "bg-orange-500" },
  { name: "Process Flow", href: "/process-flow", icon: Factory, color: "bg-fuchsia-500" },
];

export default function MobileLauncher() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-full w-full max-w-md px-4 pb-8 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Raja Catering</h1>
            <p className="text-sm text-slate-400">Operations</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-lg font-bold text-slate-950">
            RC
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-2 transition active:scale-95"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${app.color}`}
              >
                <app.icon className="h-8 w-8 text-white" />
              </span>
              <span className="text-center text-xs font-medium leading-tight text-slate-200">
                {app.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-1 text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}
