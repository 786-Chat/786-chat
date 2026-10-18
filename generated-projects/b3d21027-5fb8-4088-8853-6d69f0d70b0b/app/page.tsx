import Link from "next/link";
import { Coffee, Leaf, Users, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-cyan-500/20 bg-[#0a0f1e]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold tracking-tight">Bean House</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-cyan-400">Home</Link>
            <Link href="/menu" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Menu</Link>
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Login</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-glow">
            Crafted Coffee, <span className="text-cyan-400">Roasted with Passion</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            From bean to cup, we serve the finest artisan coffee in a cozy atmosphere.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/login" className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-[#0a0f1e] transition hover:bg-cyan-400">
              Get Started
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-cyan-500/50 px-6 py-3 font-semibold text-cyan-400 transition hover:bg-cyan-500/10">
              View Dashboard
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
              <Leaf className="h-10 w-10 text-green-400" />
              <h3 className="mt-4 text-xl font-semibold">Premium Beans</h3>
              <p className="mt-2 text-slate-400">Sourced from sustainable farms worldwide.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
              <Users className="h-10 w-10 text-amber-400" />
              <h3 className="mt-4 text-xl font-semibold">Community</h3>
              <p className="mt-2 text-slate-400">A place to gather, work, and connect.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
              <BarChart3 className="h-10 w-10 text-cyan-400" />
              <h3 className="mt-4 text-xl font-semibold">Quality</h3>
              <p className="mt-2 text-slate-400">Every cup brewed to perfection.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-cyan-500/20 py-6 text-center text-sm text-slate-500">
        © 2025 Bean House. All rights reserved.
      </footer>
    </div>
  );
}
