"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-coffee-white/80 backdrop-blur-md border-b border-coffee-neutral/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="font-serif text-xl sm:text-2xl tracking-tight">
            786 Journey
          </Link>
          <nav className="flex items-center gap-6 sm:gap-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-xs sm:text-sm uppercase tracking-widest transition-colors hover:text-coffee-accent',
                  pathname === item.href ? 'text-coffee-accent' : 'text-coffee-black/70'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}