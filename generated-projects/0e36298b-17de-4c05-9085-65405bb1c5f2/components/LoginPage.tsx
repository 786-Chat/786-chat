"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login submitted", { email, password });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_200%] animate-gradient-x">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
          {/* Hero Image Section */}
          <div className="hidden md:flex flex-col justify-center space-y-6">
            <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-2xl">
              {/* Using a remote image from Unsplash */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop"
                alt="Hero"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">Welcome Back</h2>
                <p className="text-sm opacity-80">Sign in to continue your journey</p>
              </div>
            </div>
            <div className="space-y-2 text-white">
              <h3 className="text-xl font-semibold">Your Gateway to Productivity</h3>
              <p className="text-sm opacity-80">
                Access your dashboard, manage tasks, and collaborate with your team seamlessly.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md shadow-2xl">
            <h1 className="mb-6 text-3xl font-bold text-white">Sign In</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/80">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-10 pr-3 text-white placeholder-white/50 outline-none transition focus:border-white/50 focus:bg-white/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/80">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-10 pr-10 text-white placeholder-white/50 outline-none transition focus:border-white/50 focus:bg-white/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-white/80">
                  <input type="checkbox" className="mr-2 rounded border-white/30 bg-white/10" />
                  Remember me
                </label>
                <a href="#" className="text-white/80 transition hover:text-white">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-white/80">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-semibold text-white underline-offset-2 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
