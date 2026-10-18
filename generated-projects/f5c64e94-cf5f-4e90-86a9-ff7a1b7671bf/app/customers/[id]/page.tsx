import { getDb } from '@/lib/server/db';
import { requireUser } from '@/lib/server/auth';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import CustomerDetailClient from './customer-detail-client';

export const metadata = { title: 'Customer Detail | Bean House' };

const paramsSchema = z.object({ id: z.string().uuid() });

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
};

type OrderRow = {
  id: string;
  total: string;
  status: string;
  created_at: Date;
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const user = await requireUser();
  const db = getDb();

  const customer = (await db`
    SELECT id, name, email, phone, created_at, updated_at
    FROM customers
    WHERE id = ${parsed.data.id} AND user_id = ${user.userId}
  `) as unknown as CustomerRow[];

  if (customer.length === 0) notFound();

  const orders = (await db`
    SELECT id, total, status, created_at
    FROM orders
    WHERE customer_id = ${parsed.data.id} AND user_id = ${user.userId}
    ORDER BY created_at DESC
  `) as unknown as OrderRow[];

  return <CustomerDetailClient customer={customer[0]} orders={orders} />;
}
