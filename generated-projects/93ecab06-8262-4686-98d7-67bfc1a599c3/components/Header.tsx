import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Coffee className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-slate-900">Bean House</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Home</Link>
          <Link href="/menu" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Menu</Link>
          <Link href="/about" className="text-sm font-medium text-slate-700 hover:text-indigo-600">About</Link>
          <Link href="/contact" className="text-sm font-medium text-slate-700 hover:text-indigo-600">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/contact">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/menu">Order Now</Link>
          </Button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-2 flex justify-around">
        <Link href="/" className="text-sm font-medium text-slate-700">Home</Link>
        <Link href="/menu" className="text-sm font-medium text-slate-700">Menu</Link>
        <Link href="/about" className="text-sm font-medium text-slate-700">About</Link>
        <Link href="/contact" className="text-sm font-medium text-slate-700">Contact</Link>
      </nav>
    </header>
  );
}
