import Link from "next/link";
import { Coffee, MapPin, Phone, Mail } from "lucide-react";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-coffee-900 border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Coffee className="h-8 w-8 text-gold" />
            <span className="font-serif text-xl font-bold text-cream">Bean House</span>
          </div>
          <p className="text-cream/70">Crafting exceptional coffee experiences since 2010.</p>
        </div>
        <div>
          <h3 className="text-gold font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream/70 hover:text-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-gold font-semibold mb-4">Visit Us</h3>
          <ul className="space-y-2 text-cream/70">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Coffee Lane, Beanville</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (555) 123-4567</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@beanhouse.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/20 py-4 text-center text-cream/50 text-sm">
        © {new Date().getFullYear()} Bean House. All rights reserved.
      </div>
    </footer>
  );
}
