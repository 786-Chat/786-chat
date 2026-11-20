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
  const [customers, orders] = await Promise.all([
    sql`SELECT id, name, email, phone, address, created_at FROM customers WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql`SELECT id, customer_id, status, total, created_at FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC`,
  ]);

  return <AdminClient user={user as any} customers={customers as any[]} orders={orders as any[]} />;
}
