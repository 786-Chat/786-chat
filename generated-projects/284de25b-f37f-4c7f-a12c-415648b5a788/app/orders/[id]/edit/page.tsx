import { getSql } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import Link from 'next/link';
import EditOrderForm from './edit-order-form';

export const dynamic = 'force-dynamic';

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sql = getSql();
  const orderRows = (await sql`
    SELECT id, customer_id, status, total
    FROM orders
    WHERE id = ${params.id} AND user_id = ${user.id}
    LIMIT 1
  `) as unknown as Array<{ id: string; customer_id: string; status: string; total: number }>;

  if (orderRows.length === 0) redirect('/orders');
  const order = orderRows[0];

  const [customers, products, items] = await Promise.all([
    sql`SELECT id, name FROM customers WHERE user_id = ${user.id} ORDER BY name`,
    sql`SELECT id, name, sku, price, stock FROM products WHERE user_id = ${user.id} ORDER BY name`,
    sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${order.id} ORDER BY created_at ASC`,
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Order</h1>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">Back to Orders</Link>
        </div>
        <EditOrderForm
          order={order}
          customers={customers as any[]}
          products={products as any[]}
          initialItems={items as any[]}
        />
      </div>
    </main>
  );
}
