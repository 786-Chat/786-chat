export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const deliverySchema = z.object({
  name: z.string().min(1),
  supplier: z.string().min(1),
  supplierBatch: z.string().min(1),
  quantity: z.string().min(1),
  unit: z.string().min(1),
  dateReceived: z.string().min(1),
  useByDate: z.string().min(1),
  storageLocation: z.string().min(1),
  allergenYesNo: z.string().min(1),
  allergenType: z.string().default(""),
  notes: z.string().default("")
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM deliveries ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = deliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO deliveries (id, name, supplier, supplier_batch, quantity, unit, date_received, use_by_date, storage_location, allergen_yes_no, allergen_type, notes)
    VALUES (${id}, ${data.name}, ${data.supplier}, ${data.supplierBatch}, ${data.quantity}, ${data.unit}, ${data.dateReceived}, ${data.useByDate}, ${data.storageLocation}, ${data.allergenYesNo}, ${data.allergenType}, ${data.notes})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
