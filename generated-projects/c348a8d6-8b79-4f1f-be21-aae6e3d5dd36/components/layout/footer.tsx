import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ],
  Company: [
    { label: 'About', href: '/' },
    { label: 'Careers', href: '/' },
  ],
  Resources: [
    { label: 'Blog', href: '/' },
    { label: 'Support', href: '/contact' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                786
              </span>
              <span className="text-base font-bold text-slate-900">Journey Coffee</span>
            </Link>
            <p className="mt-4 text-sm text-slate-600">
              Specialty coffee, ethically sourced and roasted for the modern brewer.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-indigo-600">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} 786 Journey Coffee. All rights reserved.
        </div>
      </div>
    </footer>
  );
}