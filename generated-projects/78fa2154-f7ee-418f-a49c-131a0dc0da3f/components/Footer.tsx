import Link from "next/link";
import { Coffee } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Coffee className="h-5 w-5 text-accent-light" />
            <span className="font-serif text-lg font-semibold">786 Journey Coffee</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone-400">
            Small-batch roasting, curated café experiences, and a journey in every cup.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
            Explore
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
            Visit
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>12 Roastery Lane</li>
            <li>Portland, OR 97205</li>
            <li>Mon–Sat · 7am–6pm</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
            Contact
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-stone-400">
            <li>hello@786journeycoffee.com</li>
            <li>+1 (503) 555-0178</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.</p>
          <p>Crafted with care in Portland.</p>
        </div>
      </div>
    </footer>
  );
}