import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-warm-gray bg-charcoal py-12 text-cream">
      <div className="container-custom">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-serif text-lg font-bold">786 Journey Coffee</h3>
            <p className="mt-2 text-sm text-cream/60">
              Every cup tells a journey. Ethically sourced, expertly roasted.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-cream/80">Explore</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-cream/60 hover:text-cream">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-cream/60 hover:text-cream">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-cream/60 hover:text-cream">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-cream/80">Visit</h4>
            <p className="mt-4 text-sm text-cream/60">
              123 Coffee Lane
              <br />
              Portland, OR 97205
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-cream/80">Hours</h4>
            <p className="mt-4 text-sm text-cream/60">
              Mon–Fri: 7am – 6pm
              <br />
              Sat–Sun: 8am – 5pm
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-cream/10 pt-8 text-center text-xs text-cream/40">
          &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}