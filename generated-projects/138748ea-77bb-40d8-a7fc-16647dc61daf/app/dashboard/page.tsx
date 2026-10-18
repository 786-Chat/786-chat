"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (user) {
      fetch('/api/uploads')
        .then((res) => res.json())
        .then(setUploads)
        .catch(() => setUploads([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <button onClick={handleLogout} className="bg-slate-900 text-white px-4 py-2 rounded-md">Logout</button>
        </div>
        <p className="text-slate-700 mb-4">Welcome, {user.email}</p>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Your Uploads</h2>
          {loading ? (
            <p>Loading...</p>
          ) : uploads.length === 0 ? (
            <p className="text-slate-500">No uploads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">File</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.file_name}</td>
                    <td className="py-2">{u.mime_type}</td>
                    <td className="py-2">{u.size_bytes} bytes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
