"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Registration failed");
      const requested = new URLSearchParams(window.location.search).get("next") || "/documents";
      window.location.assign(`/login?registered=1&next=${encodeURIComponent(requested.startsWith("/") ? requested : "/documents")}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Create Raja Catering Account</h1>
        <p className="mt-2 text-sm text-slate-400">Create a secure account for protected documents and records.</p>
        {message && <p className="mt-4 rounded bg-red-950/50 p-3 text-sm text-red-300">{message}</p>}
        <label className="mt-5 block text-sm font-semibold">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded border border-slate-600 bg-slate-950 px-3" />
        <label className="mt-4 block text-sm font-semibold">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded border border-slate-600 bg-slate-950 px-3" />
        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded border border-slate-600 bg-slate-950 px-3" />
        <button disabled={busy} className="mt-5 h-11 w-full rounded bg-emerald-600 font-semibold text-white disabled:opacity-60">{busy ? "Creating account..." : "Create Account"}</button>
        <p className="mt-4 text-center text-sm text-slate-400">Already registered? <a className="font-semibold text-sky-400 underline" href="/login?next=/documents">Sign in</a></p>
      </form>
    </main>
  );
}
