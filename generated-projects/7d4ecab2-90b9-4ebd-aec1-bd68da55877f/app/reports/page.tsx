"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

type Report = {
  campaign: string;
  conversions: number;
  revenue: number;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setReports(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <main className="min-h-screen grid-bg p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold neon-text">REPORTS</h1>
          <BarChart3 className="w-6 h-6 text-cyan-400" />
        </header>

        {error && <div className="text-red-500 mb-4">ERROR: {error}</div>}

        {loading ? (
          <div className="text-cyan-400 pulse">LOADING...</div>
        ) : reports.length === 0 ? (
          <div className="text-gray-400">No report data.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Conversions</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.campaign}>
                  <td>{r.campaign}</td>
                  <td>{r.conversions}</td>
                  <td>${r.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
