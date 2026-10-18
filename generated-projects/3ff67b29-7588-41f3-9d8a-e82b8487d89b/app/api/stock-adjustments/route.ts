export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const adjustmentSchema = z.object({
  itemType: z.enum(["ingredient", "product"]),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantityChange: z.string().min(1),
  reason: z.string().min(1),
  staffName: z.string().min(1)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM stock_adjustments ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO stock_adjustments (id, item_type, item_id, item_name, quantity_change, reason, staff_name)
    VALUES (${id}, ${data.itemType}, ${data.itemId}, ${data.itemName}, ${data.quantityChange}, ${data.reason}, ${data.staffName})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
