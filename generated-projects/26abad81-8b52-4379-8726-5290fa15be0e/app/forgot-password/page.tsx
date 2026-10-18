"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setMessage("If that email exists, a reset link has been sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-xl font-bold">Forgot Password</h1>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="h-11 w-full rounded border-2 border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
        <button type="submit" className="h-11 w-full cursor-pointer rounded bg-sky-500 font-semibold text-slate-950 hover:bg-sky-400">Send Reset Link</button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
      </form>
    </div>
  );
}
