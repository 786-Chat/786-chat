"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import AuthCard from "@/components/auth-card";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("You must accept the terms and conditions.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-yellow-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl animate-float" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="pointer-events-none absolute top-20 left-10 h-16 w-16 rounded-full bg-amber-400/20 blur-xl animate-float" />
      <div className="pointer-events-none absolute bottom-24 right-16 h-20 w-20 rounded-full bg-yellow-500/20 blur-xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 w-full max-w-md">
        <AuthCard title="Create your account" subtitle="Join 786.Chat today">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-4 h-16 w-16 text-amber-400" />
              <h2 className="text-2xl font-semibold text-white">Account created!</h2>
              <p className="mt-2 text-amber-200/70">Welcome, {fullName}.</p>
              <Link
                href="/login"
                className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-amber-100">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400/70" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-amber-500/20 bg-white/5 py-3 pl-10 pr-4 text-white placeholder-amber-200/40 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

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

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-amber-100">
                  Password
                </label>
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

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-amber-100">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400/70" />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-amber-500/20 bg-white/5 py-3 pl-10 pr-12 text-white placeholder-amber-200/40 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/70 transition hover:text-amber-200"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-amber-100">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-500/20 bg-white/5 accent-amber-500"
                />
                I agree to the Terms and Conditions
              </label>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-semibold text-black shadow-glow transition hover:shadow-glow-lg hover:brightness-110 active:scale-[0.98]"
              >
                Create account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          {!submitted && (
            <p className="mt-6 text-center text-sm text-amber-200/60">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
                Sign in
              </Link>
            </p>
          )}
        </AuthCard>

        <p className="mt-6 text-center text-xs text-amber-200/40">
          © 2025 786.Chat. All rights reserved.
        </p>
      </div>
    </main>
  );
}
