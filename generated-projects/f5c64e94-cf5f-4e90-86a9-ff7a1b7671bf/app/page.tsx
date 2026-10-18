import Link from 'next/link';
import { ArrowRight, Coffee, Users, ShoppingBag, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-amber-600" />
            <span className="text-lg font-semibold text-neutral-900">Bean House</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <Link href="/about" className="hover:text-neutral-900">About</Link>
            <Link href="/contact" className="hover:text-neutral-900">Contact</Link>
            <Link href="/login" className="hover:text-neutral-900">Sign in</Link>
            <Link href="/login?mode=register" className="rounded-md bg-amber-600 px-3 py-2 text-white hover:bg-amber-700">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                Manage your coffee business with ease
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Track customers, orders, and revenue in one place. Bean House gives you the tools to grow your café or roastery.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
                  Sign in
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <Users className="h-8 w-8 text-amber-600" />
                <p className="mt-4 text-2xl font-bold text-neutral-900">Customers</p>
                <p className="text-sm text-neutral-500">Manage your client base</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <ShoppingBag className="h-8 w-8 text-amber-600" />
                <p className="mt-4 text-2xl font-bold text-neutral-900">Orders</p>
                <p className="text-sm text-neutral-500">Track every sale</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <BarChart3 className="h-8 w-8 text-amber-600" />
                <p className="mt-4 text-2xl font-bold text-neutral-900">Insights</p>
                <p className="text-sm text-neutral-500">Understand your business</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
                <Coffee className="h-8 w-8 text-amber-600" />
                <p className="mt-4 text-2xl font-bold text-neutral-900">Dashboard</p>
                <p className="text-sm text-neutral-500">All in one place</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-neutral-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Bean House. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
