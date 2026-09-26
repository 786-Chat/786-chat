import Link from "next/link";

const SITEMAP = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-soft">
      <div className="mx-auto grid max-w-shell gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">786 Journey Coffee</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Small-batch roastery. Roasted with intention, served with care.
          </p>
        </div>
        <nav aria-label="Sitemap" className="md:col-span-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Index</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
            {SITEMAP.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-mono text-sm text-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-shell flex-col gap-1 px-4 py-4 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} 786 Journey Coffee</span>
          <span>Built on a strict grid.</span>
        </div>
      </div>
    </footer>
  );
}
