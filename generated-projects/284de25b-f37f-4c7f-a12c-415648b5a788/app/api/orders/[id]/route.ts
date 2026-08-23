import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

const orderSchema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  total: z.coerce.number().min(0),
});

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const sql = getSql();
  const rows = (await sql`
    SELECT o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at, c.name AS customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ${id} AND o.user_id = ${user.id}
    LIMIT 1
  `) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

async function updateOrder(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
  const { customer_id, status, total } = parsed.data;
  const sql = getSql();
  const customer = (await sql`SELECT id FROM customers WHERE id = ${customer_id} AND user_id = ${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
  if (!customer.length) return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
  const rows = (await sql`
    UPDATE orders
    SET customer_id = ${customer_id}, status = ${status}, total = ${total}, updated_at = now()
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, customer_id, status, total, created_at, updated_at
  `) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateOrder(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return updateOrder(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = context.params;
  const sql = getSql();

  // Fetch order items to restore stock
  const items = (await sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${id}`) as unknown as Array<Record<string, any>>;

  // Delete the order (cascades to order_items)
  const rows = (await sql`DELETE FROM orders WHERE id = ${id} AND user_id = ${user.id} RETURNING id`) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Restore product stock
  for (const item of items) {
    if (item.product_id) {
      await sql`UPDATE products SET stock = stock + ${item.quantity}, updated_at = now() WHERE id = ${item.product_id} AND user_id = ${user.id}`;
    }
  }

  return NextResponse.json({ ok: true });
}
