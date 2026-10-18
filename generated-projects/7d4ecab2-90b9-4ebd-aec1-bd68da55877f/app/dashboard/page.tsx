"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, GitBranch, Activity, BarChart3, AlertTriangle, Bell } from "lucide-react";

type DashboardData = {
  customers: number;
  opportunities: number;
  activities: number;
  revenue: number;
  pendingFollowUps: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-cyan-400 text-xl pulse">LOADING...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-red-500 text-xl">ERROR: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold neon-text">DASHBOARD</h1>
          <nav className="flex gap-2">
            <Link href="/customers" className="neon-button">Customers</Link>
            <Link href="/pipeline" className="neon-button">Pipeline</Link>
            <Link href="/activities" className="neon-button">Activities</Link>
            <Link href="/reports" className="neon-button">Reports</Link>
          </nav>
        </header>

        {data && data.pendingFollowUps > 0 && (
          <div className="mb-6 p-4 border border-yellow-500/50 bg-yellow-500/10 clip-corner flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">You have {data.pendingFollowUps} pending follow-up tasks.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-cyan-500/50 clip-corner">
            <div className="flex items-center gap-2 text-cyan-400">
              <Users className="w-5 h-5" />
              <span>CUSTOMERS</span>
            </div>
            <div className="text-4xl font-bold mt-2">{data?.customers ?? 0}</div>
          </div>
          <div className="p-4 border border-cyan-500/50 clip-corner">
            <div className="flex items-center gap-2 text-cyan-400">
              <GitBranch className="w-5 h-5" />
              <span>OPPORTUNITIES</span>
            </div>
            <div className="text-4xl font-bold mt-2">{data?.opportunities ?? 0}</div>
          </div>
          <div className="p-4 border border-cyan-500/50 clip-corner">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="w-5 h-5" />
              <span>ACTIVITIES</span>
            </div>
            <div className="text-4xl font-bold mt-2">{data?.activities ?? 0}</div>
          </div>
          <div className="p-4 border border-cyan-500/50 clip-corner">
            <div className="flex items-center gap-2 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
              <span>REVENUE</span>
            </div>
            <div className="text-4xl font-bold mt-2">${(data?.revenue ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="border border-cyan-500/30 p-4 clip-corner">
          <h2 className="text-xl font-bold mb-4">SYSTEM STATUS</h2>
          <div className="flex items-center gap-2 text-cyan-400">
            <AlertTriangle className="w-5 h-5" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </main>
  );
}
