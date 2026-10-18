'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Login' },
  { href: '/login?mode=register', label: 'Register' },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-black/90 backdrop-blur border-b border-gold/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold gold-text">Royal Spice</Link>
        <div className="hidden md:flex gap-6">
          {links.map(l=>(
            <Link key={l.href} href={l.href} className={`hover:text-yellow-300 transition ${path===l.href?'text-yellow-300':'text-gold'}`}>{l.label}</Link>
          ))}
        </div>
        <button className="md:hidden text-gold" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      </div>
      {open && (
        <div className="md:hidden bg-black border-t border-gold/30 px-4 py-4 flex flex-col gap-3">
          {links.map(l=>(
            <Link key={l.href} href={l.href} onClick={()=>setOpen(false)} className="text-gold hover:text-yellow-300">{l.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
