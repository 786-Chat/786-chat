"use client";

import { useEffect, useState } from "react";
import { MobileBackButton } from "@/components/mobile-back-button";
import { FreezersView } from "@/components/freezers-view";
import { MobileFreezerCheck } from "@/components/mobile-freezer-check";
import { MobileFreezerManage } from "@/components/mobile-freezer-manage";

export default function FreezersPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState<"check" | "manage">("check");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <>
        <MobileBackButton />
        <div className="space-y-4 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView("check")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeView === "check"
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Daily Check
            </button>
            <button
              onClick={() => setActiveView("manage")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeView === "manage"
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Manage Equipment
            </button>
          </div>
          {activeView === "check" ? <MobileFreezerCheck /> : <MobileFreezerManage />}
        </div>
      </>
    );
  }

  return <FreezersView />;
}
