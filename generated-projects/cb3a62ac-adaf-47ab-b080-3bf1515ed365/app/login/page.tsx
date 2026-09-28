"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Sign in failed");
      const requested = new URLSearchParams(window.location.search).get("next") || "/documents";
      window.location.assign(requested.startsWith("/") ? requested : "/documents");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Raja Catering Sign In</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to access protected documents and records.</p>
        {message && <p className="mt-4 rounded bg-red-950/50 p-3 text-sm text-red-300">{message}</p>}
        <label className="mt-5 block text-sm font-semibold">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded border border-slate-600 bg-slate-950 px-3" />
        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded border border-slate-600 bg-slate-950 px-3" />
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label>
        <button disabled={busy} className="mt-5 h-11 w-full rounded bg-emerald-600 font-semibold text-white disabled:opacity-60">{busy ? "Signing in..." : "Sign In"}</button>
        <p className="mt-4 text-center text-sm text-slate-400">No account? <a className="font-semibold text-sky-400 underline" href="/register?next=/documents">Create account</a></p>
      </form>
    </main>
  );
}
