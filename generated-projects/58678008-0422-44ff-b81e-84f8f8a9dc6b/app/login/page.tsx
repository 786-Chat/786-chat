"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    // Simulate authentication delay
    setTimeout(() => {
      setLoading(false);
      // In a real app, you would call your auth API here.
      // For this demo, we just show a success message.
      alert("Sign-in successful (demo).");
    }, 800);
  };

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

      {/* Main content */}
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        {/* Left: Editorial cover */}
        <section className="animate-fade-up space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
              Subscriber Access
            </p>
            <h1 className="text-5xl font-bold leading-[1.1] md:text-6xl">
              The World,
              <br />
              <span className="italic">Ink on Paper.</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-ink/80">
              Sign in to continue reading the latest issue, access your archive,
              and manage your subscription.
            </p>
          </div>

          <div className="rule-thick pt-6">
            <blockquote className="border-l-4 border-accent pl-4 text-xl italic text-ink/80">
              “Journalism is the first draft of history.”
            </blockquote>
            <p className="mt-2 text-sm uppercase tracking-wider text-ink/60">
              — The Ledger Editorial Board
            </p>
          </div>

          <div className="hidden md:block">
            <div className="relative h-64 overflow-hidden bg-ink">
              <div className="absolute inset-0 animate-pan bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm text-paper">
                The newsroom, 2025
              </p>
            </div>
          </div>
        </section>

        {/* Right: Login form */}
        <section className="animate-fade-up md:pl-8">
          <div className="card-paper border border-ink/10 p-8 md:p-10">
            <h2 className="mb-6 text-3xl font-bold">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="label-editorial">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-editorial pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label-editorial">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-editorial pl-8 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 border-ink bg-transparent accent-accent"
                  />
                  Remember me
                </label>
                <span className="text-sm text-ink/40">Forgot password?</span>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "group flex w-full items-center justify-center gap-2 border-2 border-ink bg-ink py-3 text-sm font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-accent hover:border-accent disabled:opacity-50",
                  loading && "cursor-wait"
                )}
              >
                {loading ? "Signing in…" : "Sign In"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="rule-thin mt-8 pt-6 text-center text-sm text-ink/60">
              New to The Ledger?{" "}
              <span className="font-semibold text-ink/40">Subscribe now</span>
            </div>
          </div>
        </section>
      </div>

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
