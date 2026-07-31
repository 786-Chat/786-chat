import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
] as const;

export const metadata: Metadata = {
  title: "Orbit Health",
  description: "Precision healthcare monitoring platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-graph-paper antialiased">
        <header className="sticky top-0 z-50 border-b border-navy-200/50 bg-white/80 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-navy-900">
              Orbit Health
            </Link>
            <ul className="flex items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-navy-600 transition-colors hover:text-cyan-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-navy-200/50 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-800">
                  Product
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/features" className="text-sm text-navy-500 hover:text-cyan-600">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-navy-500 hover:text-cyan-600">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-800">
                  Support
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/contact" className="text-sm text-navy-500 hover:text-cyan-600">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-sm text-navy-500 hover:text-cyan-600">
                      Account
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-800">
                  Company
                </h3>
                <ul className="space-y-2">
                  <li>
                    <span className="text-sm text-navy-500">About</span>
                  </li>
                  <li>
                    <span className="text-sm text-navy-500">Careers</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-800">
                  Legal
                </h3>
                <ul className="space-y-2">
                  <li>
                    <span className="text-sm text-navy-500">Privacy</span>
                  </li>
                  <li>
                    <span className="text-sm text-navy-500">Terms</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-navy-100 pt-8 text-center text-xs text-navy-400">
              &copy; {new Date().getFullYear()} Orbit Health. All rights reserved.
            </div>
          </div>
        </footer>
      <script src="/786-visual-editor.js" defer></script></body>
    </html>
  );
}
