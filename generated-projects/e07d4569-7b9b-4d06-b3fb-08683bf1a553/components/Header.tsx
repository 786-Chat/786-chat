'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neon-cyan/30 bg-neon-dark/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-neon-cyan neon-text">
          <Coffee className="h-6 w-6" />
          <span className="font-display text-lg font-bold tracking-wider">786 JOURNEY</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-mono text-sm uppercase tracking-widest transition-colors hover:text-neon-cyan',
                pathname === link.href ? 'text-neon-cyan neon-text' : 'text-gray-400'
              )}
            >
              {link.label}
            </Link>
          ))}
          <span className="flex items-center gap-1 text-xs text-neon-acid">
            <span className="h-2 w-2 animate-pulse rounded-full bg-neon-acid" />
            ONLINE
          </span>
        </nav>

        <button
          className="md:hidden text-neon-cyan"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-neon-cyan/20 bg-neon-dark px-4 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-2 font-mono text-sm uppercase tracking-widest',
                pathname === link.href ? 'text-neon-cyan' : 'text-gray-400'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}