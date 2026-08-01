"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_id: string;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCustomers(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      setForm({ name: "", email: "", phone: "" });
      setShowForm(false);
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold neon-text">CUSTOMERS</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="neon-button">
              <Plus className="w-4 h-4 inline mr-1" /> New
            </button>
            <button onClick={fetchCustomers} className="neon-button">
              <RefreshCw className="w-4 h-4 inline" />
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-cyan-500/50 p-4 mb-6 clip-corner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="terminal-input"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="terminal-input"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="terminal-input"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <button type="submit" className="neon-button mt-4">Create</button>
          </form>
        )}

        {error && <div className="text-red-500 mb-4">ERROR: {error}</div>}

        {loading ? (
          <div className="text-cyan-400 pulse">LOADING...</div>
        ) : customers.length === 0 ? (
          <div className="text-gray-400">No customers found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
