import Link from 'next/link';
import { Coffee } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neon-cyan/20 bg-neon-dark/80 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-neon-cyan">
          <Coffee className="h-5 w-5" />
          <span className="font-display text-sm font-bold tracking-wider">786 JOURNEY COFFEE</span>
        </div>
        <nav className="flex gap-6 font-mono text-xs uppercase tracking-widest text-gray-500">
          <Link href="/" className="hover:text-neon-cyan">Home</Link>
          <Link href="/services" className="hover:text-neon-cyan">Services</Link>
          <Link href="/contact" className="hover:text-neon-cyan">Contact</Link>
        </nav>
        <p className="font-mono text-xs text-gray-600">© {new Date().getFullYear()} {'//'} ALL SYSTEMS NOMINAL</p>
      </div>
    </footer>
  );
}
