import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t hairline bg-mist">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">786 Journey Coffee</p>
          <p className="mt-2 max-w-prose text-sm text-graphite/60">
            Small-batch specialty roaster. Sourced with care, roasted with intention.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-graphite/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-graphite/70 hover:text-graphite" href="/">Home</Link></li>
            <li><Link className="text-graphite/70 hover:text-graphite" href="/services">Services</Link></li>
            <li><Link className="text-graphite/70 hover:text-graphite" href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-graphite/50">Visit</p>
          <p className="mt-3 text-sm text-graphite/70">
            14 Roastery Lane<br />Portland, OR 97209
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-graphite/50">Hours</p>
          <p className="mt-3 text-sm text-graphite/70">
            Mon–Fri 7am–6pm<br />Sat–Sun 8am–4pm
          </p>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-graphite/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.</p>
          <p>Roasted in Portland, Oregon.</p>
        </div>
      </div>
    </footer>
  );
}
