
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Orders | NorthStar Logistics' };

async function deleteOrder(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return;
  const sql = getSql();
  await sql`DELETE FROM orders WHERE id = ${id} AND user_id = ${user.id}`;
  revalidatePath('/orders');
  revalidatePath('/dashboard');
}

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const sql = getSql();
  const orders = (await sql`
    SELECT o.id, o.status, o.total, o.created_at, c.name as customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.user_id = ${user.id}
    ORDER BY o.created_at DESC
  `) as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Orders</h1>
        <Link href="/orders/new" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2">
          <Plus size={16} /> New Order
        </Link>
      </header>
      <main className="p-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${statusClass(order.status)}`}>{order.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Number(order.total).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 mr-3"><Pencil size={16} className="inline" /></Link>
                    <form action={deleteOrder} className="inline">
                      <input type="hidden" name="id" value={order.id} />
                      <button type="submit" className="text-red-600 hover:text-red-900"><Trash2 size={16} className="inline" /></button>
                    </form>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in_transit': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
