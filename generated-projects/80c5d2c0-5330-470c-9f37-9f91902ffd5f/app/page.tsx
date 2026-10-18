"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Factory, Truck, Boxes, Package, Wheat, Snowflake, SprayCan, ShieldCheck, FileText, ClipboardCheck, FolderOpen } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      router.replace("/dashboard");
    }
  }, [isMobile, router]);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Super Business Mujeeb</h1>
          <Badge tone="amber">MASTER TEMPLATE – SUPER ADMIN ONLY</Badge>
        </div>
        <p className="mb-6 text-sm text-slate-400">
          Clean template foundation. No live data. Raja Catering remains independent.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Production", href: "/production", icon: Factory },
            { name: "Delivery", href: "/delivery", icon: Truck },
            { name: "Ready Stock", href: "/inventory", icon: Boxes },
            { name: "Stock", href: "/stock", icon: Package },
            { name: "Products", href: "/products", icon: Package },
            { name: "Ingredients", href: "/ingredients", icon: Wheat },
            { name: "Freezers", href: "/freezers", icon: Snowflake },
            { name: "Cleaning", href: "/cleaning", icon: SprayCan },
            { name: "HACCP", href: "/haccp", icon: ShieldCheck },
            { name: "Documents", href: "/documents", icon: FileText },
            { name: "My Documents", href: "/my-documents", icon: FolderOpen },
            { name: "Opening Checks", href: "/opening-checks", icon: ClipboardCheck },
            { name: "Closing Checks", href: "/closing-checks", icon: ClipboardCheck },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4 text-center hover:bg-slate-800"
            >
              <item.icon className="h-6 w-6 text-sky-400" />
              <span className="text-xs font-medium">{item.name}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
