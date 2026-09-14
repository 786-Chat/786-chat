import { getCurrentUser } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const orderSchema = z.object({
  customerId: z.string().uuid(),
  total: z.coerce.number().min(0),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']).default('pending'),
});

type CustomerRow = {
  id: string;
  name: string;
  email: string;
};

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getDb();
  const customers = (await sql`SELECT id, name, email FROM customers WHERE user_id = ${user.userId} ORDER BY name`) as unknown as CustomerRow[];

  async function createOrder(formData: FormData) {
    'use server';
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const parsed = orderSchema.safeParse({
      customerId: formData.get('customerId'),
      total: formData.get('total'),
      status: formData.get('status'),
    });
    if (!parsed.success) throw new Error('Invalid input');

    const sql = getDb();
    await sql`INSERT INTO orders (user_id, customer_id, total, status) VALUES (${user.userId}, ${parsed.data.customerId}, ${parsed.data.total}, ${parsed.data.status})`;
    revalidatePath('/orders');
    redirect('/orders');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">New Order</h1>
      <form action={createOrder} className="space-y-4">
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium mb-1">Customer</label>
          <select id="customerId" name="customerId" required className="w-full border rounded-md px-3 py-2">
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="total" className="block text-sm font-medium mb-1">Total</label>
          <input id="total" name="total" type="number" step="0.01" min="0" required className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
          <select id="status" name="status" className="w-full border rounded-md px-3 py-2">
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Create Order</button>
      </form>
    </main>
  );
}
