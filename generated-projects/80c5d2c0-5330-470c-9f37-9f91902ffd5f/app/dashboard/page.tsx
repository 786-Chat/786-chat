"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";

function MyDocumentsDashboardCard() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    const findDashboardGrid = () => {
      const grids = Array.from(document.querySelectorAll<HTMLElement>("div.grid.grid-cols-2.gap-3"));
      const dashboardGrid = grids.find((grid) => {
        const text = grid.textContent || "";
        return text.includes("Production Today") && text.includes("Documents");
      });

      if (dashboardGrid) {
        setTarget(dashboardGrid);
        observer?.disconnect();
        return true;
      }

      return false;
    };

    if (!findDashboardGrid()) {
      observer = new MutationObserver(findDashboardGrid);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => observer?.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/my-documents", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load My Documents");
        return res.json();
      })
      .then((data) => {
        if (active) setCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {
        if (active) setCount(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <button
      type="button"
      onClick={() => router.push("/my-documents")}
      className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10 active:scale-95"
      aria-label="Open My Documents"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex flex-col items-start gap-2">
        <FolderOpen className="h-6 w-6 text-sky-400" />
        <p className="text-xs font-medium text-slate-400">My Documents</p>
        <p className="text-2xl font-bold text-slate-100">{count === null ? "—" : count}</p>
      </div>
    </button>,
    target
  );
}

export default function DashboardPage() {
  return (
    <>
      <DashboardView />
      <MyDocumentsDashboardCard />
    </>
  );
}
