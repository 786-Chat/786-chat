"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12">
      {/* Animated background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-yellow-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl animate-float" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute top-20 left-10 h-16 w-16 rounded-full bg-amber-400/20 blur-xl animate-float" />
      <div className="pointer-events-none absolute bottom-24 right-16 h-20 w-20 rounded-full bg-yellow-500/20 blur-xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="glass animate-card-float rounded-3xl p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl sm:p-10">
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-glow">
              <Sparkles className="h-7 w-7 text-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome to 786.Chat
            </h1>
            <p className="mt-2 text-sm text-amber-200/70">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Success message */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-4 h-16 w-16 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">Login successful!</h2>
              <p className="mt-2 text-amber-200/70">Welcome back, {email}.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                Sign in again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-amber-100">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400/70" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-amber-500/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-amber-200/40 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-amber-100">
                    Password
                  </label>
                  <a href="#" className="text-xs text-amber-400 hover:text-amber-300">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400/70" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-amber-500/20 bg-white/5 py-3 pl-10 pr-12 text-white placeholder-amber-200/40 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/70 transition hover:text-amber-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-amber-100">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-500/20 bg-white/5 accent-amber-500"
                  />
                  Remember me
                </label>
              </div>

              {/* Error message */}
              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-semibold text-black shadow-glow transition hover:shadow-glow-lg hover:brightness-110 active:scale-[0.98]"
              >
                Sign in
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          {/* Divider */}
          {!submitted && (
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-amber-500/20" />
              <span className="text-xs uppercase tracking-wider text-amber-200/50">or</span>
              <div className="h-px flex-1 bg-amber-500/20" />
            </div>
          )}

          {/* Social buttons */}
          {!submitted && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
                GitHub
              </button>
            </div>
          )}

          {/* Sign up link */}
          {!submitted && (
            <p className="mt-6 text-center text-sm text-amber-200/60">
              Don&apos;t have an account?{" "}
              <Link href="/login?mode=register" className="font-medium text-amber-400 hover:text-amber-300">
                Sign up
              </Link>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-amber-200/40">
          © 2025 786.Chat. All rights reserved.
        </p>
      </div>
    </main>
  );
}
