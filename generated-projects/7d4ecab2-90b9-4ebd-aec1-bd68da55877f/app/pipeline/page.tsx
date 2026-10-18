"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type Opportunity = {
  id: string;
  customer_id: string;
  customer_name: string;
  stage: string;
  value: number;
  campaign: string;
  company_id: string;
};

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: "", stage: "qualification", value: "", campaign: "" });

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setOpportunities(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, value: Number(form.value) }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setForm({ customer_id: "", stage: "qualification", value: "", campaign: "" });
      setShowForm(false);
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold neon-text">PIPELINE</h1>
          <button onClick={() => setShowForm(!showForm)} className="neon-button">
            <Plus className="w-4 h-4 inline mr-1" /> New
          </button>
        </header>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-cyan-500/50 p-4 mb-6 clip-corner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="terminal-input"
                placeholder="Customer ID"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                required
              />
              <select
                className="terminal-input"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
              </select>
              <input
                className="terminal-input"
                type="number"
                placeholder="Value"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
              <input
                className="terminal-input"
                placeholder="Campaign"
                value={form.campaign}
                onChange={(e) => setForm({ ...form, campaign: e.target.value })}
              />
            </div>
            <button type="submit" className="neon-button mt-4">Create</button>
          </form>
        )}

        {error && <div className="text-red-500 mb-4">ERROR: {error}</div>}

        {loading ? (
          <div className="text-cyan-400 pulse">LOADING...</div>
        ) : opportunities.length === 0 ? (
          <div className="text-gray-400">No opportunities found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Campaign</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer_name}</td>
                  <td>{o.stage}</td>
                  <td>${o.value.toLocaleString()}</td>
                  <td>{o.campaign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
