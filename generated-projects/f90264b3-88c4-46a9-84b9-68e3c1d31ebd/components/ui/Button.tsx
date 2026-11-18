import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function Button({ href, children, className }: ButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-white/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/60",
        className
      )}
    >
      {children}
    </Link>
  );
}
