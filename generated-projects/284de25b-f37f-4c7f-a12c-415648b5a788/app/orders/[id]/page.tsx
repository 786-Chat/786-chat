
import { getSql } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { ensureProductSchema } from '@/lib/server/products';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Package } from 'lucide-react';
import { revalidatePath } from 'next/cache';

async function updateOrder(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '');
  const customerId = String(formData.get('customerId') || '');

  if (!id || !status || !customerId) throw new Error('Invalid form data');

  const sql = getSql();
  await sql`
    UPDATE orders
    SET status = ${status}, customer_id = ${customerId}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
  `;
  revalidatePath(`/orders/${id}`);
  revalidatePath('/orders');
  revalidatePath('/dashboard');
  redirect(`/orders/${id}`);
}

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
  redirect('/orders');
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  await ensureProductSchema();
  const sql = getSql();
  const orders = (await sql`
    SELECT o.id, o.status, o.total, o.created_at, o.updated_at,
           c.id as customer_id, c.name as customer_name, c.email as customer_email,
           c.phone as customer_phone, c.address as customer_address
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ${params.id} AND o.user_id = ${user.id}
  `) as unknown as Array<Record<string, any>>;

  if (orders.length === 0) notFound();
  const order = orders[0];

  const [customers, orderItems] = await Promise.all([
    sql`SELECT id, name FROM customers WHERE user_id = ${user.id} ORDER BY name`,
    sql`
      SELECT product_id, product_name, quantity, unit_price, line_total
      FROM order_items
      WHERE order_id = ${order.id}
      ORDER BY created_at ASC
    `,
  ]);

  const customerRows = customers as unknown as Array<Record<string, any>>;
  const itemRows = orderItems as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="text-slate-500 hover:text-slate-700" aria-label="Back to orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/orders/${order.id}/edit`} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={order.id} />
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
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
                <dd className="mt-1 text-lg font-semibold text-slate-900">£{Number(order.total).toFixed(2)}</dd>
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

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer</h2>
            <p className="font-medium text-slate-900">{order.customer_name}</p>
            <p className="break-all text-slate-600">{order.customer_email || '—'}</p>
            <p className="text-slate-600">{order.customer_phone || '—'}</p>
            <p className="break-words text-slate-600">{order.customer_address || '—'}</p>
          </div>
        </div>

        <section className="mt-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Order Items</h2>
          </div>
          {itemRows.length === 0 ? (
            <p className="text-sm text-slate-500">No product items were recorded for this older order.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {itemRows.map((item, index) => (
                    <tr key={`${item.product_id || item.product_name}-${index}`}>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{item.product_name}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm text-slate-700">£{Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">£{Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-slate-600">Order Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">£{Number(order.total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Update Order</h2>
          <form action={updateOrder} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-slate-700">Customer</label>
              <select id="customerId" name="customerId" defaultValue={order.customer_id} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                {customerRows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
              <select id="status" name="status" defaultValue={order.status} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </form>
          <p className="mt-3 text-xs text-slate-500">Order totals are calculated from product items and are not edited manually.</p>
        </div>
      </main>
    </div>
  );
}
