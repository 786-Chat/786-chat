import Link from "next/link";
import { Coffee, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Coffee className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-bold text-white">Bean House</span>
            </div>
            <p className="mt-4 text-sm">Crafting exceptional coffee since 2015.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/menu" className="hover:text-white">Menu</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Visit</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>123 Coffee Lane</li>
              <li>Seattle, WA 98101</li>
              <li>(555) 123-4567</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Follow</h3>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white" aria-label="Twitter"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm">
          © {new Date().getFullYear()} Bean House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
