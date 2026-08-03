"use client";

import { useState } from "react";
import Link from "next/link";

export default function BookingPage() {
  const [form, setForm] = useState({ customer_id: "", opportunity_id: "", date: "", amount: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setMessage("Booking recorded and converted to sale.");
      setForm({ customer_id: "", opportunity_id: "", date: "", amount: "" });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold neon-text">BOOKING</h1>
        </header>

        <form onSubmit={handleSubmit} className="border border-cyan-500/50 p-6 clip-corner">
          <div className="space-y-4">
            <input
              className="terminal-input w-full"
              placeholder="Customer ID"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              required
            />
            <input
              className="terminal-input w-full"
              placeholder="Opportunity ID"
              value={form.opportunity_id}
              onChange={(e) => setForm({ ...form, opportunity_id: e.target.value })}
              required
            />
            <input
              className="terminal-input w-full"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <input
              className="terminal-input w-full"
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="neon-button mt-6 w-full">Record Booking</button>
        </form>

        {message && <div className="text-acid mt-4">{message}</div>}
        {error && <div className="text-red-500 mt-4">ERROR: {error}</div>}
      </div>
    </main>
  );
}
