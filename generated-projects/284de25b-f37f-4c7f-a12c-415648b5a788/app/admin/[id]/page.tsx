import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { notFound, redirect } from 'next/navigation';
import AdminEditForm from './admin-edit-form';

export const metadata = { title: 'Edit Record | NorthStar Logistics' };

export default async function AdminEditPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/dashboard');

  const sql = getSql();
  const { id } = params;

  // Try customer first
  const customers = (await sql`SELECT id, name, email, phone, address FROM customers WHERE id = ${id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
  if (customers.length > 0) {
    const customer = customers[0];
    return <AdminEditForm type="customer" initialData={customer} />;
  }

  // Try order - redirect to the new order edit page
  const orders = (await sql`SELECT id FROM orders WHERE id = ${id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
  if (orders.length > 0) {
    redirect(`/orders/${id}/edit`);
  }

  notFound();
}
