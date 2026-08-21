import { getSql } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';

// Server Actions for updating and deleting orders
async function updateOrder(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const total = parseFloat(formData.get('total') as string);
  const customerId = formData.get('customerId') as string;

  if (!id || !status || isNaN(total) || !customerId) {
    throw new Error('Invalid form data');
  }

  const sql = getSql();
  await sql`
    UPDATE orders
    SET status = ${status}, total = ${total}, customer_id = ${customerId}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
  `;
  revalidatePath(`/orders/${id}`);
  redirect(`/orders/${id}`);
}

async function deleteOrder(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const id = formData.get('id') as string;
  if (!id) return;

  const sql = getSql();
  await sql`DELETE FROM orders WHERE id = ${id} AND user_id = ${user.id}`;
  revalidatePath('/orders');
  redirect('/orders');
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const orders = (await sql`
    SELECT o.id, o.status, o.total, o.created_at, o.updated_at,
           c.id as customer_id, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ${params.id} AND o.user_id = ${user.id}
  `) as unknown as Array<Record<string, any>>;

  if (orders.length === 0) notFound();
  const order = orders[0];

  const customers = (await sql`SELECT id, name FROM customers WHERE user_id = ${user.id} ORDER BY name`) as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/orders/${order.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={order.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Total</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">${Number(order.total).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Created</dt>
                <dd className="mt-1 text-slate-700">{new Date(order.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last Updated</dt>
                <dd className="mt-1 text-slate-700">{new Date(order.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer</h2>
            <p className="text-slate-900 font-medium">{order.customer_name}</p>
            <p className="text-slate-600">{order.customer_email}</p>
            <p className="text-slate-600">{order.customer_phone}</p>
            <p className="text-slate-600">{order.customer_address}</p>
          </div>
        </div>

        {/* Update form */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Update Order</h2>
          <form action={updateOrder} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-slate-700">Customer</label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={order.customer_id}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={order.status}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="total" className="block text-sm font-medium text-slate-700">Total</label>
              <input
                type="number"
                id="total"
                name="total"
                step="0.01"
                defaultValue={order.total}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
