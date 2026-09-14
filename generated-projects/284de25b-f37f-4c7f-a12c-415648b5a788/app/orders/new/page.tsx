import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { ensureProductSchema } from '@/lib/server/products';
import { redirect } from 'next/navigation';
import OrderForm from './OrderForm';

export const metadata = { title: 'New Order | NorthStar Logistics' };
export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await ensureProductSchema();
  const sql = getSql();
  const [customers, products] = await Promise.all([
    sql`SELECT id, name FROM customers WHERE user_id=${user.id} ORDER BY name`,
    sql`SELECT id, name, sku, price, stock FROM products WHERE user_id=${user.id} ORDER BY name`,
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4"><h1 className="text-2xl font-bold text-slate-900">Create New Order</h1><Link href="/orders" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ArrowLeft size={16} /> Back to Orders</Link></div>
      <OrderForm customers={customers as unknown as any[]} products={products as unknown as any[]} />
    </div>
  );
}
