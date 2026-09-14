import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { ensureProductSchema } from '@/lib/server/products';

export const dynamic = 'force-dynamic';

const orderSchema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.coerce.number().int().min(1) })).min(1),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getSql();
  const rows = (await sql`SELECT o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at, c.name AS customer_name FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.user_id=${user.id} ORDER BY o.created_at DESC`) as unknown as Array<Record<string, any>>;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });

  await ensureProductSchema();
  const sql = getSql();
  const { customer_id, status } = parsed.data;
  const customer = (await sql`SELECT id FROM customers WHERE id=${customer_id} AND user_id=${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
  if (!customer.length) return NextResponse.json({ error: 'Customer not found' }, { status: 400 });

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) quantities.set(item.product_id, (quantities.get(item.product_id) || 0) + item.quantity);
  const resolved: Array<{ id: string; name: string; price: number; quantity: number }> = [];
  for (const [productId, quantity] of Array.from(quantities.entries())) {
    const rows = (await sql`SELECT id, name, price, stock FROM products WHERE id=${productId} AND user_id=${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
    if (!rows.length) return NextResponse.json({ error: 'A selected product no longer exists' }, { status: 400 });
    const product = rows[0];
    if (Number(product.stock) < quantity) return NextResponse.json({ error: `Not enough stock for ${product.name}` }, { status: 400 });
    resolved.push({ id: product.id, name: product.name, price: Number(product.price), quantity });
  }

  const total = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const created = (await sql`INSERT INTO orders (user_id, customer_id, status, total) VALUES (${user.id}, ${customer_id}, ${status}, ${total}) RETURNING id, customer_id, status, total, created_at, updated_at`) as unknown as Array<Record<string, any>>;
  const order = created[0];
  const decremented: Array<{ id: string; quantity: number }> = [];
  try {
    for (const item of resolved) {
      const stockRows = (await sql`UPDATE products SET stock=stock-${item.quantity}, updated_at=now() WHERE id=${item.id} AND user_id=${user.id} AND stock>=${item.quantity} RETURNING id`) as unknown as Array<Record<string, any>>;
      if (!stockRows.length) throw new Error(`Not enough stock for ${item.name}`);
      decremented.push({ id: item.id, quantity: item.quantity });
      await sql`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES (${order.id}, ${item.id}, ${item.name}, ${item.quantity}, ${item.price}, ${item.price * item.quantity})`;
    }
  } catch (error) {
    for (const item of decremented) await sql`UPDATE products SET stock=stock+${item.quantity}, updated_at=now() WHERE id=${item.id} AND user_id=${user.id}`;
    await sql`DELETE FROM orders WHERE id=${order.id} AND user_id=${user.id}`;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create order' }, { status: 400 });
  }
  return NextResponse.json(order, { status: 201 });
}
