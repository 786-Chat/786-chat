import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import { getSql } from '@/lib/server/db';

export const metadata = { title: 'Dashboard | Manufacturing Ops' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const [shift] = await sql`SELECT * FROM shifts ORDER BY started_at DESC LIMIT 1`;
  const lines = await sql`SELECT * FROM production_lines ORDER BY name`;
  const qualityHolds = await sql`SELECT * FROM quality_holds WHERE status = 'open' ORDER BY created_at DESC LIMIT 5`;
  const materials = await sql`SELECT * FROM materials WHERE stock_level < reorder_level ORDER BY name LIMIT 5`;
  const maintenance = await sql`SELECT * FROM maintenance_tasks WHERE status = 'scheduled' ORDER BY scheduled_at LIMIT 5`;
  const traceability = await sql`SELECT * FROM traceability_events ORDER BY created_at DESC LIMIT 5`;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <aside className="fixed inset-y-0 left-0 w-16 bg-[#1e293b] border-r border-slate-700 flex flex-col items-center py-4 gap-6">
        <span className="text-xs font-bold text-slate-400">OPS</span>
        <nav className="flex flex-col gap-4">
          <a href="/dashboard" className="text-slate-300 hover:text-white" title="Production">P</a>
          <a href="/dashboard" className="text-slate-300 hover:text-white" title="Quality">Q</a>
          <a href="/dashboard" className="text-slate-300 hover:text-white" title="Stock">S</a>
          <a href="/dashboard" className="text-slate-300 hover:text-white" title="Maintenance">M</a>
          <a href="/dashboard" className="text-slate-300 hover:text-white" title="Reports">R</a>
        </nav>
      </aside>
      <main className="ml-16 p-6">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Shift Command Centre</h1>
            <p className="text-sm text-slate-400">Welcome, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-slate-800 rounded text-xs">Shift: {shift?.name ?? 'Day'}</span>
            <span className="px-3 py-1 bg-slate-800 rounded text-xs">Sync: Live</span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-400">Output</h2>
            <p className="text-2xl font-bold tabular-nums">{shift?.output ?? 0} units</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-400">Downtime</h2>
            <p className="text-2xl font-bold tabular-nums">{shift?.downtime_minutes ?? 0} min</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-400">Quality Exceptions</h2>
            <p className="text-2xl font-bold tabular-nums">{qualityHolds.length}</p>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Active Lines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lines.map((line) => (
              <div key={line.id} className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-medium">{line.name}</h3>
                <p className="text-sm text-slate-400">Status: {line.status}</p>
                <p className="text-sm text-slate-400">Batch: {line.current_batch ?? '—'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Quality Holds</h2>
          <ul className="space-y-2">
            {qualityHolds.map((hold) => (
              <li key={hold.id} className="bg-slate-800 p-3 rounded flex justify-between">
                <span>{hold.batch_ref}</span>
                <span className="text-amber-400">{hold.reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Materials Low Stock</h2>
          <ul className="space-y-2">
            {materials.map((mat) => (
              <li key={mat.id} className="bg-slate-800 p-3 rounded flex justify-between">
                <span>{mat.name}</span>
                <span className="text-amber-400">{mat.stock_level} / {mat.reorder_level}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Maintenance Scheduled</h2>
          <ul className="space-y-2">
            {maintenance.map((task) => (
              <li key={task.id} className="bg-slate-800 p-3 rounded flex justify-between">
                <span>{task.title}</span>
                <span className="text-slate-400">{new Date(task.scheduled_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Traceability</h2>
          <ul className="space-y-2">
            {traceability.map((event) => (
              <li key={event.id} className="bg-slate-800 p-3 rounded flex justify-between">
                <span>{event.batch_ref}</span>
                <span className="text-slate-400">{event.event_type} · {new Date(event.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
