export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const deliverySchema = z.object({
  name: z.string().min(1).optional(),
  supplier: z.string().min(1).optional(),
  supplierBatch: z.string().min(1).optional(),
  quantity: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  dateReceived: z.string().min(1).optional(),
  useByDate: z.string().min(1).optional(),
  storageLocation: z.string().min(1).optional(),
  allergenYesNo: z.string().min(1).optional(),
  allergenType: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM deliveries WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = deliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM deliveries WHERE id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE deliveries SET
      name = ${merged.name},
      supplier = ${merged.supplier},
      supplier_batch = ${merged.supplierBatch},
      quantity = ${merged.quantity},
      unit = ${merged.unit},
      date_received = ${merged.dateReceived},
      use_by_date = ${merged.useByDate},
      storage_location = ${merged.storageLocation},
      allergen_yes_no = ${merged.allergenYesNo},
      allergen_type = ${merged.allergenType ?? ""},
      notes = ${merged.notes ?? ""},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM deliveries WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
