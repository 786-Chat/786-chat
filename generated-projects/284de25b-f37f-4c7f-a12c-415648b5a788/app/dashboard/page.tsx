import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { ensureProductSchema } from '@/lib/server/products';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Package, Users, PoundSterling, Clock, ArrowRight, Boxes } from 'lucide-react';

export const metadata = { title: 'Dashboard | NorthStar Logistics' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await ensureProductSchema();
  const sql = getSql();
  const userId = user.id as string;

  const [customerCount, orderCount, productCount, revenueResult, recentOrders] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM customers WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*)::int as count FROM orders WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*)::int as count FROM products WHERE user_id = ${userId}`,
    sql`SELECT COALESCE(SUM(total), 0)::numeric(10,2) as total FROM orders WHERE user_id = ${userId} AND status != 'cancelled'`,
    sql`SELECT id, status, total, created_at FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5`,
  ]);

  const totalCustomers = (customerCount as unknown as Array<{ count: number }>)[0]?.count ?? 0;
  const totalOrders = (orderCount as unknown as Array<{ count: number }>)[0]?.count ?? 0;
  const totalProducts = (productCount as unknown as Array<{ count: number }>)[0]?.count ?? 0;
  const totalRevenue = (revenueResult as unknown as Array<{ total: number }>)[0]?.total ?? 0;
  const recentOrderRows = recentOrders as unknown as Array<Record<string, any>>;

  const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">NorthStar Logistics</h1>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <Link href="/admin" className="hover:text-slate-300">Admin</Link>
            <Link href="/customers" className="hover:text-slate-300">Customers</Link>
            <Link href="/products" className="hover:text-slate-300">Products</Link>
            <Link href="/orders" className="hover:text-slate-300">Orders</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8"><h2 className="text-2xl font-semibold">Welcome, {user.name}</h2><p className="text-slate-600">Here is your logistics overview.</p></div>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Users className="h-6 w-6" />} label="Total Customers" value={totalCustomers} />
          <StatCard icon={<Boxes className="h-6 w-6" />} label="Total Products" value={totalProducts} />
          <StatCard icon={<Package className="h-6 w-6" />} label="Total Orders" value={totalOrders} />
          <StatCard icon={<PoundSterling className="h-6 w-6" />} label="Total Revenue" value={`£${Number(totalRevenue).toFixed(2)}`} />
          <StatCard icon={<Clock className="h-6 w-6" />} label="Recent Orders" value={recentOrderRows.length} />
        </div>
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b px-6 py-4"><h3 className="text-lg font-semibold">Recent Orders</h3><Link href="/orders" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">View all <ArrowRight className="h-4 w-4" /></Link></div>
          {recentOrderRows.length === 0 ? <p className="px-6 py-8 text-slate-500">No orders yet. Create your first order.</p> : (
            <ul className="divide-y divide-slate-200">
              {recentOrderRows.map((order: any) => (
                <li key={order.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Order #{order.id.slice(0, 8)}</p><p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[order.status] || 'bg-slate-100 text-slate-800'}`}>{order.status.replace('_', ' ')}</span><span className="font-semibold">£{Number(order.total).toFixed(2)}</span></div></li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="flex items-center gap-4 rounded-lg bg-white p-6 shadow"><div className="rounded-lg bg-blue-100 p-3 text-blue-600">{icon}</div><div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div></div>;
}
