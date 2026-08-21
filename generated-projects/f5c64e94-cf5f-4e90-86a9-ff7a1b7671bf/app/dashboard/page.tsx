import { getCurrentUser } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Dashboard | Bean House' };

type OrderRow = {
  id: string;
  total: string;
  status: string;
  created_at: Date;
};

type CountRow = { count: number };
type RevenueRow = { total: string };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const [orderResult, customerResult, revenueResult, recentOrders] = await Promise.all([
    db`SELECT COUNT(*)::int AS count FROM orders WHERE user_id = ${user.userId}` as unknown as Promise<CountRow[]>,
    db`SELECT COUNT(*)::int AS count FROM customers WHERE user_id = ${user.userId}` as unknown as Promise<CountRow[]>,
    db`SELECT COALESCE(SUM(total), 0)::numeric(10,2) AS total FROM orders WHERE user_id = ${user.userId}` as unknown as Promise<RevenueRow[]>,
    db`SELECT id, total, status, created_at FROM orders WHERE user_id = ${user.userId} ORDER BY created_at DESC LIMIT 5` as unknown as Promise<OrderRow[]>,
  ]);

  const totalOrders = orderResult[0]?.count ?? 0;
  const totalCustomers = customerResult[0]?.count ?? 0;
  const revenue = revenueResult[0]?.total ?? '0.00';

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Welcome back, {user.email}</p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-500">Total Orders</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">{totalOrders}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-500">Total Customers</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">{totalCustomers}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-500">Revenue</h2>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">${revenue}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-neutral-500">Quick Actions</h2>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/orders/new" className="text-sm font-medium text-blue-600 hover:underline">New Order</Link>
              <Link href="/customers/new" className="text-sm font-medium text-blue-600 hover:underline">New Customer</Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-neutral-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-neutral-900">
                        <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                          {order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">${order.total}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900">{order.status}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
