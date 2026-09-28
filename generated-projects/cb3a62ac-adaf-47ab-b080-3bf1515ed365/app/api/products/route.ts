export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const productSchema = z.object({
  name: z.string().min(1),
  flavour: z.string().min(1),
  sku: z.string().min(1),
  netWeight: z.string().min(1),
  ingredients: z.string().min(1),
  allergens: z.string().min(1),
  storageInstruction: z.string().min(1),
  shelfLifeDays: z.coerce.number().int().positive(),
  active: z.boolean().default(true)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM products ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  try {
    await db`
      INSERT INTO products (id, name, flavour, sku, net_weight, ingredients, allergens, storage_instruction, shelf_life_days, active)
      VALUES (${id}, ${data.name}, ${data.flavour}, ${data.sku}, ${data.netWeight}, ${data.ingredients}, ${data.allergens}, ${data.storageInstruction}, ${data.shelfLifeDays}, ${data.active})
    `;
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ id, ...data }, { status: 201 });
}
