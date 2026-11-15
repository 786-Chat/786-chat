import Link from "next/link";
import { Coffee } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-indigo/10 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo to-violet text-white shadow-panel">
            <Coffee className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">786 Journey Coffee</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-pill px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-indigo/10 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-1 inline-flex items-center gap-1 rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-deep"
          >
            Order beans
          </Link>
        </nav>
      </div>
    </header>
  );
}
