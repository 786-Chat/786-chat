import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-charcoal text-cream sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-accent" />
            <span className="font-serif text-xl">Saffron Manager</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/dashboard" className="hover:text-accent transition">Dashboard</Link>
            <Link href="/orders" className="hover:text-accent transition">Orders</Link>
            <Link href="/customers" className="hover:text-accent transition">Customers</Link>
            <Link href="/reservations" className="hover:text-accent transition">Reservations</Link>
            <Link href="/contact" className="hover:text-accent transition">Contact</Link>
          </div>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Login</Link>
        </div>
      </div>
    </nav>
  );
}