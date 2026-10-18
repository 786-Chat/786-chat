import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import { ArrowDown, ArrowUp, Box, CheckCircle2, Clock, Cpu, Gauge, Package, ShieldAlert, Wrench } from 'lucide-react';

export const metadata = { title: 'Dashboard | Manufacturing Ops' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const shift = { name: 'Shift A', time: '06:00 – 14:00', output: 1248, target: 1200, downtime: 23, quality: 98.2 };
  const lines = [
    { id: 'LN-01', name: 'Assembly Line 1', status: 'running', output: 412, target: 400, efficiency: 103 },
    { id: 'LN-02', name: 'Assembly Line 2', status: 'idle', output: 0, target: 400, efficiency: 0 },
    { id: 'LN-03', name: 'Machining Cell', status: 'running', output: 836, target: 800, efficiency: 104.5 },
  ];
  const qualityHolds = [
    { id: 'QH-1042', line: 'LN-01', reason: 'Torque deviation', qty: 12, time: '08:42' },
    { id: 'QH-1043', line: 'LN-03', reason: 'Surface finish', qty: 5, time: '09:15' },
  ];
  const materials = [
    { sku: 'RM-AL-500', name: 'Aluminium 5000', stock: 1240, unit: 'kg', reorder: 500 },
    { sku: 'RM-ST-300', name: 'Steel 300', stock: 320, unit: 'kg', reorder: 400 },
    { sku: 'PK-BOX-01', name: 'Box 01', stock: 5000, unit: 'pcs', reorder: 2000 },
  ];
  const maintenance = [
    { id: 'WO-221', asset: 'Press P-04', type: 'Preventive', due: 'Today 14:00', priority: 'high' },
    { id: 'WO-222', asset: 'Conveyor C-12', type: 'Corrective', due: 'Tomorrow', priority: 'medium' },
  ];
  const traceability = [
    { batch: 'B-2024-001', line: 'LN-01', material: 'RM-AL-500', qty: 400, status: 'in-progress' },
    { batch: 'B-2024-002', line: 'LN-03', material: 'RM-ST-300', qty: 800, status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Module rail */}
      <aside className="fixed inset-y-0 left-0 w-16 bg-navy-900 text-white flex flex-col items-center py-4 space-y-6">
        <div className="w-10 h-10 bg-process-blue-500 rounded-lg flex items-center justify-center font-bold">MO</div>
        <nav className="flex flex-col space-y-4">
          <a href="/dashboard" className="p-2 rounded hover:bg-navy-800" title="Production"><Gauge size={20} /></a>
          <a href="#quality" className="p-2 rounded hover:bg-navy-800" title="Quality"><ShieldAlert size={20} /></a>
          <a href="#materials" className="p-2 rounded hover:bg-navy-800" title="Stock"><Package size={20} /></a>
          <a href="#maintenance" className="p-2 rounded hover:bg-navy-800" title="Maintenance"><Wrench size={20} /></a>
          <a href="#traceability" className="p-2 rounded hover:bg-navy-800" title="Reports"><Cpu size={20} /></a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-16 p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shift Command Centre</h1>
            <p className="text-sm text-slate-500">Welcome back, {user.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-safety-amber-100 text-safety-amber-800 rounded-full text-sm font-medium">Shift A</span>
            <span className="text-sm text-slate-500">06:00 – 14:00</span>
          </div>
        </header>

        {/* Shift health */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-process-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Output</span>
              <ArrowUp className="text-quality-green-500" size={18} />
            </div>
            <p className="text-2xl font-bold">{shift.output}</p>
            <p className="text-xs text-slate-400">Target {shift.target}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-safety-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Downtime</span>
              <Clock className="text-safety-amber-500" size={18} />
            </div>
            <p className="text-2xl font-bold">{shift.downtime} min</p>
            <p className="text-xs text-slate-400">2 events</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-quality-green-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Quality</span>
              <CheckCircle2 className="text-quality-green-500" size={18} />
            </div>
            <p className="text-2xl font-bold">{shift.quality}%</p>
            <p className="text-xs text-slate-400">2 holds</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-navy-500">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">OEE</span>
              <Gauge className="text-navy-500" size={18} />
            </div>
            <p className="text-2xl font-bold">87.4%</p>
            <p className="text-xs text-slate-400">+2.1% vs yesterday</p>
          </div>
        </section>

        {/* Active lines */}
        <section className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3">Active Lines</h2>
          <div className="space-y-3">
            {lines.map(line => (
              <div key={line.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${line.status === 'running' ? 'bg-quality-green-500' : 'bg-safety-amber-500'}`} />
                  <span className="font-medium">{line.id}</span>
                  <span className="text-sm text-slate-500">{line.name}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <span>Output: <strong>{line.output}</strong> / {line.target}</span>
                  <span className={`px-2 py-0.5 rounded ${line.efficiency >= 100 ? 'bg-quality-green-100 text-quality-green-800' : 'bg-safety-amber-100 text-safety-amber-800'}`}>
                    {line.efficiency}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quality holds */}
        <section id="quality" className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3">Quality Holds</h2>
          <div className="space-y-2">
            {qualityHolds.map(hold => (
              <div key={hold.id} className="flex items-center justify-between p-3 bg-safety-amber-50 border border-safety-amber-200 rounded">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="text-safety-amber-600" size={18} />
                  <span className="font-medium">{hold.id}</span>
                  <span className="text-sm text-slate-600">{hold.reason}</span>
                </div>
                <div className="text-sm text-slate-500">Qty {hold.qty} · {hold.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Materials */}
        <section id="materials" className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3">Materials</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">SKU</th>
                  <th>Name</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(mat => (
                  <tr key={mat.sku} className="border-b last:border-0">
                    <td className="py-2 font-mono">{mat.sku}</td>
                    <td>{mat.name}</td>
                    <td className="font-mono">{mat.stock} {mat.unit}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${mat.stock < mat.reorder ? 'bg-safety-amber-100 text-safety-amber-800' : 'bg-quality-green-100 text-quality-green-800'}`}>
                        {mat.stock < mat.reorder ? 'Reorder' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Maintenance */}
        <section id="maintenance" className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3">Maintenance</h2>
          <div className="space-y-2">
            {maintenance.map(wo => (
              <div key={wo.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center space-x-3">
                  <Wrench className="text-navy-500" size={18} />
                  <span className="font-medium">{wo.id}</span>
                  <span className="text-sm text-slate-600">{wo.asset}</span>
                  <span className="text-sm text-slate-500">{wo.type}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-500">{wo.due}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${wo.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-safety-amber-100 text-safety-amber-800'}`}>
                    {wo.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Traceability */}
        <section id="traceability" className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-3">Traceability</h2>
          <div className="space-y-2">
            {traceability.map(batch => (
              <div key={batch.batch} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center space-x-3">
                  <Box className="text-process-blue-500" size={18} />
                  <span className="font-mono font-medium">{batch.batch}</span>
                  <span className="text-sm text-slate-600">{batch.line}</span>
                  <span className="text-sm text-slate-500">{batch.material}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-500">Qty {batch.qty}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${batch.status === 'completed' ? 'bg-quality-green-100 text-quality-green-800' : 'bg-process-blue-100 text-process-blue-800'}`}>
                    {batch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t">
          <span>Plant 01 · Shift A</span>
          <span>Sync: 2 min ago</span>
          <span>Audit: enabled</span>
          <span>Connectivity: online</span>
        </footer>
      </main>
    </div>
  );
}
