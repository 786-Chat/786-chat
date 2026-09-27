export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const adjustmentSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantityChange: z.string().min(1),
  reason: z.string().min(1),
  staffName: z.string().min(1),
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM inventory_items ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { inventoryItemId, quantityChange, reason, staffName } = parsed.data;
  const db = getDb();
  const items = await db`SELECT * FROM inventory_items WHERE id = ${inventoryItemId}`;
  if (items.length === 0) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }
  const item = items[0];
  const before = parseFloat(item.quantity_available);
  const change = parseFloat(quantityChange);
  if (isNaN(before) || isNaN(change)) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }
  const after = before + change;
  if (after < 0) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await db`
    INSERT INTO inventory_adjustments (id, inventory_item_id, product_name, batch_number, quantity_before, quantity_change, quantity_after, reason, staff_name)
    VALUES (${id}, ${item.id}, ${item.product_name}, ${item.batch_number}, ${String(before)}, ${quantityChange}, ${String(after)}, ${reason}, ${staffName})
  `;
  await db`UPDATE inventory_items SET quantity_available = ${String(after)}, updated_at = now() WHERE id = ${item.id}`;
  return NextResponse.json({ id, quantityBefore: String(before), quantityAfter: String(after) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Inventory item id is required" }, { status: 400 });
  }
  const db = getDb();
  const rows = await db`SELECT id, batch_number FROM inventory_items WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Ready Stock item not found" }, { status: 404 });
  }
  await db`DELETE FROM inventory_items WHERE id = ${id}`;
  return NextResponse.json({ deleted: true, id, batchNumber: rows[0].batch_number });
}
