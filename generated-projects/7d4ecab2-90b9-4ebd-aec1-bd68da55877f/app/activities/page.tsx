"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Bell } from "lucide-react";

type Activity = {
  id: string;
  type: string;
  description: string;
  due_date: string;
  completed: boolean;
  company_id: string;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "follow-up", description: "", due_date: "" });

  async function fetchActivities() {
    setLoading(true);
    try {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setActivities(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      setForm({ type: "follow-up", description: "", due_date: "" });
      setShowForm(false);
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold neon-text">ACTIVITIES</h1>
          <button onClick={() => setShowForm(!showForm)} className="neon-button">
            <Plus className="w-4 h-4 inline mr-1" /> New
          </button>
        </header>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-cyan-500/50 p-4 mb-6 clip-corner">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="terminal-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="follow-up">Follow-up</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
              </select>
              <input
                className="terminal-input"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <input
                className="terminal-input"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="neon-button mt-4">Create</button>
          </form>
        )}

        {error && <div className="text-red-500 mb-4">ERROR: {error}</div>}

        {loading ? (
          <div className="text-cyan-400 pulse">LOADING...</div>
        ) : activities.length === 0 ? (
          <div className="text-gray-400">No activities found.</div>
        ) : (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="border border-cyan-500/30 p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold">{a.type.toUpperCase()}</div>
                  <div className="text-gray-400">{a.description}</div>
                  <div className="text-sm text-cyan-400">Due: {a.due_date}</div>
                </div>
                <button
                  onClick={() => toggleComplete(a.id, a.completed)}
                  className={`neon-button ${a.completed ? "text-acid" : ""}`}
                >
                  {a.completed ? "DONE" : "MARK"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
