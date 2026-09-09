import Link from "next/link";
import { Coffee } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="bg-coffee-900/95 backdrop-blur sticky top-0 z-50 border-b border-gold/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 text-cream hover:text-gold transition-colors">
          <Coffee className="h-8 w-8 text-gold" />
          <span className="font-serif text-2xl font-bold">Bean House</span>
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-cream hover:text-gold transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
