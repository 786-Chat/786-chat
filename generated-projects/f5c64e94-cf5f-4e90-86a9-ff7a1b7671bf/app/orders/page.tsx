import { getCurrentUser } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = { title: 'Orders | Bean House' };

type OrderRow = {
  id: string;
  total: string;
  status: string;
  created_at: Date;
  customer_name: string | null;
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const db = getDb();
  const orders = (await db`
    SELECT o.id, o.total, o.status, o.created_at, c.name AS customer_name
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.user_id = ${user.userId}
    ORDER BY o.created_at DESC
  `) as unknown as OrderRow[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
          <Link
            href="/orders/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            New Order
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-neutral-500">No orders yet.</p>
            <Link href="/orders/new" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">{order.customer_name || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">${Number(order.total).toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
