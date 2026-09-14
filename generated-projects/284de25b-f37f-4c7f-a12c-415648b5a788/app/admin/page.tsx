import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const metadata = { title: 'Admin | NorthStar Logistics' };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const sql = getSql();
  const [customers, orders, unreadRows] = await Promise.all([
    sql`SELECT id, name, email, phone, address, created_at FROM customers WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql`SELECT id, customer_id, status, total, created_at FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql`SELECT order_id FROM order_reads WHERE user_id = ${user.id}`,
  ]);

  const readIds = new Set((unreadRows as unknown as Array<{ order_id: string }>).map((r) => r.order_id));
  const unreadOrderIds = (orders as unknown as Array<{ id: string }>)
    .filter((o) => !readIds.has(o.id))
    .map((o) => o.id);

  return <AdminClient user={user as any} customers={customers as any[]} orders={orders as any[]} unreadOrderIds={unreadOrderIds} />;
}
