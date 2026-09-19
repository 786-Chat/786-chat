import { getDb } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const metadata = { title: 'Order Details | Bean House' };

const statusSchema = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']);

type OrderRow = {
  id: string;
  total: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const db = getDb();

  const order = (await db`
    SELECT o.id, o.total, o.status, o.created_at, o.updated_at,
           c.id AS customer_id, c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ${params.id} AND o.user_id = ${user.userId}
  `) as unknown as OrderRow[];

  if (order.length === 0) {
    notFound();
  }

  const o = order[0];

  async function updateStatus(formData: FormData) {
    'use server';
    const status = statusSchema.parse(formData.get('status'));
    const db = getDb();
    await db`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${params.id} AND user_id = ${user.userId}`;
    revalidatePath(`/orders/${params.id}`);
  }

  async function deleteOrder() {
    'use server';
    const db = getDb();
    await db`DELETE FROM orders WHERE id = ${params.id} AND user_id = ${user.userId}`;
    redirect('/orders');
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/orders" className="text-sm text-neutral-500 hover:text-neutral-700">← Back to orders</Link>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">Order #{o.id.slice(0, 8)}</h1>
            <p className="text-sm text-neutral-500">Placed on {new Date(o.created_at).toLocaleDateString()}</p>
          </div>
          <form action={deleteOrder}>
            <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Customer</h2>
            {o.customer_id ? (
              <div className="mt-4 space-y-2">
                <p className="font-medium">{o.customer_name}</p>
                <p className="text-sm text-neutral-600">{o.customer_email}</p>
                {o.customer_phone && <p className="text-sm text-neutral-600">{o.customer_phone}</p>}
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">No customer linked</p>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Order Summary</h2>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-600">Total</dt>
                <dd className="font-mono font-semibold">${Number(o.total).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-600">Status</dt>
                <dd className="font-medium">{o.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-600">Last updated</dt>
                <dd className="text-sm">{new Date(o.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Update Status</h2>
          <form action={updateStatus} className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={o.status}
                className="mt-1 block w-48 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Save
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
