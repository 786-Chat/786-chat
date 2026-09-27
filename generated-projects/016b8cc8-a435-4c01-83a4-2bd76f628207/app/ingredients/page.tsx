"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileBackButton } from "@/components/mobile-back-button";

export default function IngredientsPage() {
  const [isMobile, setIsMobile] = useState(false);

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
        <div className="space-y-6 p-4">
          <h1 className="text-2xl font-bold">Ingredients</h1>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 text-center">
            <p className="text-sm text-slate-300">Raw ingredients are received through Delivery and managed in Stock.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/delivery" className="inline-flex h-11 items-center justify-center rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Record Delivery</Link>
              <Link href="/stock" className="inline-flex h-11 items-center justify-center rounded bg-sky-500 px-6 font-semibold text-slate-950 hover:bg-sky-400">View Stock</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { IngredientsView } = require("@/components/ingredients-view");
  return <IngredientsView />;
}
