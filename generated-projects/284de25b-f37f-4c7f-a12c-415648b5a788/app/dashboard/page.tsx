import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, Users, DollarSign, Clock, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Dashboard | NorthStar Logistics' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const userId = user.id as string;

  const [customerCount, orderCount, revenueResult, recentOrders] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM customers WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*)::int as count FROM orders WHERE user_id = ${userId}`,
    sql`SELECT COALESCE(SUM(total), 0)::numeric(10,2) as total FROM orders WHERE user_id = ${userId} AND status != 'cancelled'`,
    sql`SELECT id, status, total, created_at FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5`,
  ]);

  // Type-safe extraction: each result is an array of objects
  const customerCountRows = customerCount as unknown as Array<{ count: number }>;
  const orderCountRows = orderCount as unknown as Array<{ count: number }>;
  const revenueRows = revenueResult as unknown as Array<{ total: number }>;
  const recentOrderRows = recentOrders as unknown as Array<Record<string, any>>;

  const totalCustomers = customerCountRows[0]?.count ?? 0;
  const totalOrders = orderCountRows[0]?.count ?? 0;
  const totalRevenue = revenueRows[0]?.total ?? 0;

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">NorthStar Logistics</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <Link href="/customers" className="hover:text-slate-300">Customers</Link>
            <Link href="/orders" className="hover:text-slate-300">Orders</Link>
            {user.role === 'admin' && (
              <Link href="/admin" className="hover:text-slate-300">Admin</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">Welcome, {user.name}</h2>
          <p className="text-slate-600">Here is your logistics overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<Users className="h-6 w-6" />} label="Total Customers" value={totalCustomers} />
          <StatCard icon={<Package className="h-6 w-6" />} label="Total Orders" value={totalOrders} />
          <StatCard icon={<DollarSign className="h-6 w-6" />} label="Total Revenue" value={`$${Number(totalRevenue).toFixed(2)}`} />
          <StatCard icon={<Clock className="h-6 w-6" />} label="Recent Orders" value={recentOrderRows.length} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Link href="/orders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentOrderRows.length === 0 ? (
            <p className="px-6 py-8 text-slate-500">No orders yet. Create your first order.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentOrderRows.map((order: any) => (
                <li key={order.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[order.status] || 'bg-slate-100 text-slate-800'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="font-semibold">${Number(order.total).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
      <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
