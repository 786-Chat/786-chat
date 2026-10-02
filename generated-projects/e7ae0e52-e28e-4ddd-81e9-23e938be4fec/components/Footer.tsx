import Link from "next/link";
import { Coffee, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-coffee-900 text-coffee-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-display text-xl font-bold mb-4">
              <Coffee className="w-6 h-6 text-accent" />
              786 Journey Coffee
            </div>
            <p className="text-coffee-300 text-sm leading-relaxed">
              Crafting memorable coffee experiences, one cup at a time.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-accent transition-colors">Services</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>123 Coffee Lane, Beanville</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>hello@786journeycoffee.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-coffee-700 mt-8 pt-8 text-center text-sm text-coffee-400">
          &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}