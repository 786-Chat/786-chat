"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function MobileBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard")}
      className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 shadow-lg transition hover:bg-slate-700 active:scale-95 md:hidden"
      aria-label="Back to Dashboard"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
