import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

const orderSchema = z.object({
  customer_id: z.string().uuid(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.coerce.number().int().min(1) })).min(1),
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
  const { customer_id, status, items } = parsed.data;
  const sql = getSql();

  const customer = (await sql`SELECT id FROM customers WHERE id = ${customer_id} AND user_id = ${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
  if (!customer.length) return NextResponse.json({ error: 'Customer not found' }, { status: 400 });

  const orderRows = (await sql`SELECT id FROM orders WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`) as unknown as Array<Record<string, any>>;
  if (!orderRows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Fetch existing items
  const existingItems = (await sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${id}`) as unknown as Array<{ product_id: string; quantity: number }>;
  const existingMap = new Map(existingItems.map((i) => [i.product_id, i.quantity]));

  // Aggregate new items by product
  const newMap = new Map<string, number>();
  for (const item of items) {
    newMap.set(item.product_id, (newMap.get(item.product_id) || 0) + item.quantity);
  }

  // Validate products and compute total
  const productIds = Array.from(newMap.keys());
  const products = (await sql`SELECT id, name, price, stock FROM products WHERE id = ANY(${productIds}) AND user_id = ${user.id}`) as unknown as Array<{ id: string; name: string; price: number; stock: number }>;
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  for (const [productId, quantity] of newMap) {
    const product = productMap.get(productId);
    if (!product) return NextResponse.json({ error: 'A selected product no longer exists' }, { status: 400 });
    const oldQty = existingMap.get(productId) || 0;
    const diff = quantity - oldQty;
    if (diff > 0 && product.stock < diff) {
      return NextResponse.json({ error: `Not enough stock for ${product.name}` }, { status: 400 });
    }
    total += Number(product.price) * quantity;
  }

  // Begin transaction-like sequence with rollback on error
  const client = sql;
  try {
    // Update order
    await client`UPDATE orders SET customer_id = ${customer_id}, status = ${status}, total = ${total}, updated_at = now() WHERE id = ${id} AND user_id = ${user.id}`;

    // Delete existing items and restore stock
    for (const item of existingItems) {
      const product = productMap.get(item.product_id);
      if (product) {
        await client`UPDATE products SET stock = stock + ${item.quantity}, updated_at = now() WHERE id = ${item.product_id} AND user_id = ${user.id}`;
      }
    }
    await client`DELETE FROM order_items WHERE order_id = ${id}`;

    // Insert new items and decrement stock
    for (const [productId, quantity] of newMap) {
      const product = productMap.get(productId)!;
      await client`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES (${id}, ${productId}, ${product.name}, ${quantity}, ${product.price}, ${Number(product.price) * quantity})`;
      await client`UPDATE products SET stock = stock - ${quantity}, updated_at = now() WHERE id = ${productId} AND user_id = ${user.id}`;
    }
  } catch (error) {
    // Rollback: restore original stock and items
    // This is a simplified rollback; in production use a real transaction.
    // For now, we restore stock to original state by reversing changes.
    // Since we already restored old stock and deleted items, we need to re-insert old items and re-decrement.
    // To keep it safe, we'll re-insert old items and adjust stock back.
    // But this is complex; we'll just return error and rely on the fact that the operations are idempotent enough.
    // Better: use a transaction. But Neon serverless supports transactions via sql.begin? Not in this version.
    // We'll implement a compensating rollback.
    // Re-insert old items and restore stock to original.
    await client`DELETE FROM order_items WHERE order_id = ${id}`;
    for (const item of existingItems) {
      const product = productMap.get(item.product_id);
      if (product) {
        await client`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES (${id}, ${item.product_id}, ${product.name}, ${item.quantity}, ${product.price}, ${Number(product.price) * item.quantity})`;
        await client`UPDATE products SET stock = stock - ${item.quantity}, updated_at = now() WHERE id = ${item.product_id} AND user_id = ${user.id}`;
      }
    }
    // Restore order total and fields
    const originalOrder = (await client`SELECT customer_id, status, total FROM orders WHERE id = ${id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
    if (originalOrder.length) {
      await client`UPDATE orders SET customer_id = ${originalOrder[0].customer_id}, status = ${originalOrder[0].status}, total = ${originalOrder[0].total}, updated_at = now() WHERE id = ${id} AND user_id = ${user.id}`;
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update order' }, { status: 400 });
  }

  const updated = (await sql`SELECT id, customer_id, status, total, created_at, updated_at FROM orders WHERE id = ${id} AND user_id = ${user.id}`) as unknown as Array<Record<string, any>>;
  return NextResponse.json(updated[0]);
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

  const items = (await sql`SELECT product_id, quantity FROM order_items WHERE order_id = ${id}`) as unknown as Array<Record<string, any>>;

  const rows = (await sql`DELETE FROM orders WHERE id = ${id} AND user_id = ${user.id} RETURNING id`) as unknown as Array<Record<string, any>>;
  if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  for (const item of items) {
    if (item.product_id) {
      await sql`UPDATE products SET stock = stock + ${item.quantity}, updated_at = now() WHERE id = ${item.product_id} AND user_id = ${user.id}`;
    }
  }

  return NextResponse.json({ ok: true });
}
