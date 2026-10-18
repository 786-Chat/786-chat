
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

const orderSchema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  total: z.coerce.number().min(0),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getSql();
  const rows = (await sql`
    SELECT o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at, c.name AS customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.user_id = ${user.id}
    ORDER BY o.created_at DESC
  `) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
  const { customer_id, status, total } = parsed.data;
  const sql = getSql();
  const customer = (await sql`SELECT id FROM customers WHERE id = ${customer_id} AND user_id = ${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
  if (!customer.length) return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
  const rows = (await sql`
    INSERT INTO orders (user_id, customer_id, status, total)
    VALUES (${user.id}, ${customer_id}, ${status}, ${total})
    RETURNING id, customer_id, status, total, created_at, updated_at
  `) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows[0], { status: 201 });
}
