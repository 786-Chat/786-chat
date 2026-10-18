import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      {/* Masthead */}
      <header className="masthead px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            The Ledger
          </Link>
          <nav className="hidden gap-6 text-sm uppercase tracking-wider md:flex">
            <span className="cursor-default text-ink/60">Issue 42</span>
            <span className="cursor-default text-ink/60">Spring 2025</span>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
          The Ledger
        </p>
        <h1 className="mt-4 text-6xl font-bold leading-tight md:text-7xl">
          The World,
          <br />
          <span className="italic">Ink on Paper.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
          A current-affairs publication for the discerning reader. Sign in to
          access your subscription and read the latest issue.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/login"
            className="group flex items-center gap-2 border-2 border-ink bg-ink py-3 px-6 text-sm font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-accent hover:border-accent"
          >
            Sign In
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-ink/60 md:flex-row">
          <p>© 2025 The Ledger. All rights reserved.</p>
          <nav className="flex gap-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <Link href="/login" className="hover:text-accent">Sign In</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
