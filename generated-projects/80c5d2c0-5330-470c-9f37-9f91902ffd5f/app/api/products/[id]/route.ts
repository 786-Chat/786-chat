import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const productSchema = z.object({
  name: z.string().min(1).optional(),
  flavour: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  netWeight: z.string().min(1).optional(),
  ingredients: z.string().min(1).optional(),
  allergens: z.string().min(1).optional(),
  storageInstruction: z.string().min(1).optional(),
  shelfLifeDays: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM products WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM products WHERE id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  try {
    await db`
      UPDATE products SET
        name = ${merged.name},
        flavour = ${merged.flavour},
        sku = ${merged.sku},
        net_weight = ${merged.netWeight},
        ingredients = ${merged.ingredients},
        allergens = ${merged.allergens},
        storage_instruction = ${merged.storageInstruction},
        shelf_life_days = ${merged.shelfLifeDays},
        active = ${merged.active},
        updated_at = now()
      WHERE id = ${params.id}
    `;
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM products WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
