import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/booking', label: 'Booking' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  return (
    <header className="bg-brand-green text-brand-cream shadow-md">
      <div className="container-custom flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <UtensilsCrossed className="h-6 w-6 text-brand-gold" />
          <span>Saffron Table</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-brand-gold">
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="md:hidden" aria-label="Menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}