import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-coffee-900 text-cream py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">786 Coffee</h3>
            <p className="text-sm text-coffee-200">
              Artisan coffee crafted with warmth and tradition.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-coffee-200 hover:text-gold-300">Home</Link></li>
              <li><Link href="/about" className="text-sm text-coffee-200 hover:text-gold-300">About</Link></li>
              <li><Link href="/contact" className="text-sm text-coffee-200 hover:text-gold-300">Contact</Link></li>
              <li><Link href="/login" className="text-sm text-coffee-200 hover:text-gold-300">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Visit</h4>
            <p className="text-sm text-coffee-200">123 Coffee Lane</p>
            <p className="text-sm text-coffee-200">City, Country</p>
            <p className="text-sm text-coffee-200">hello@786coffee.com</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-coffee-800 text-center text-sm text-coffee-300">
          © {new Date().getFullYear()} 786 Coffee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
