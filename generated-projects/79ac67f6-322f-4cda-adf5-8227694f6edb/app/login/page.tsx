"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    // Simulate login (no backend)
    setError("");
    router.push("/");
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8">
        <h1 className="text-2xl font-bold text-coffee-900 mb-6 text-center">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-coffee-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-coffee-200 focus:border-gold-400 outline-none py-2 bg-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-coffee-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-coffee-200 focus:border-gold-400 outline-none py-2 bg-transparent"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-coffee-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-gold-500"
              />
              Remember me
            </label>
            <Link href="/login" className="text-sm text-gold-500 hover:text-gold-400">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-coffee-800 text-cream py-3 rounded-full font-semibold hover:bg-coffee-700 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
