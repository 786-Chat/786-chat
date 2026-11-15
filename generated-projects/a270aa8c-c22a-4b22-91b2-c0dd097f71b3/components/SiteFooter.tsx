import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-indigo/10 bg-ink text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-sm font-semibold">786 Journey Coffee</p>
          <p className="mt-2 text-sm text-white/60">Small-batch coffee, brewed with intention.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/services" className="hover:text-white">Services</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Reach us</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>hello@786journeycoffee.com</li>
            <li>Mon–Fri · 8am–5pm</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Crafted</p>
          <p className="mt-3 text-sm text-white/60">Roasted in small batches. Shipped fresh.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
      </div>
    </footer>
  );
}
