import { getSql } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const schema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  total: z.coerce.number().min(0),
});

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const orderRows = (await sql`SELECT * FROM orders WHERE id = ${params.id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
  if (orderRows.length === 0) redirect('/orders');
  const order = orderRows[0];

  const customers = (await sql`SELECT id, name FROM customers WHERE user_id = ${user.id} ORDER BY name`) as unknown as Array<Record<string, any>>;

  async function updateOrder(formData: FormData) {
    'use server';
    // Ensure user is not null inside server action
    const currentUser = await getCurrentUser();
    if (!currentUser) redirect('/login');

    const parsed = schema.safeParse({
      customer_id: formData.get('customer_id'),
      status: formData.get('status'),
      total: formData.get('total'),
    });
    if (!parsed.success) return;
    const { customer_id, status, total } = parsed.data;
    await sql`UPDATE orders SET customer_id = ${customer_id}, status = ${status}, total = ${total}, updated_at = now() WHERE id = ${params.id} AND user_id = ${currentUser.id}`;
    await sql`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES (${currentUser.id}, 'update', 'order', ${params.id}, ${JSON.stringify({ customer_id, status, total })})`;
    revalidatePath('/orders');
    redirect('/orders');
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Order</h1>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">Back to Orders</Link>
        </div>
        <form action={updateOrder} className="space-y-4 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-slate-700">Customer</label>
            <select name="customer_id" defaultValue={order.customer_id} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select name="status" defaultValue={order.status} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Total</label>
            <input type="number" name="total" step="0.01" defaultValue={order.total} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </div>
          <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Changes</button>
        </form>
      </div>
    </main>
  );
}
