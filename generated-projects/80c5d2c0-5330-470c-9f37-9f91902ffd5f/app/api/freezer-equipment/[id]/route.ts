import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const freezerEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  equipmentType: z.enum(["Freezer", "Chiller"]).optional(),
  location: z.string().min(1).optional(),
  targetTemperature: z.string().min(1).optional(),
  currentTemperature: z.string().min(1).optional(),
  lastCheckedDate: z.string().min(1).optional(),
  lastCheckedTime: z.string().min(1).optional(),
  checkedBy: z.string().min(1).optional(),
  status: z.enum(["Normal", "Warning", "Out of Range"]).optional(),
  notes: z.string().optional(),
  active: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM freezer_equipment WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = freezerEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM freezer_equipment WHERE id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE freezer_equipment SET
      name = ${merged.name},
      equipment_type = ${merged.equipmentType},
      location = ${merged.location},
      target_temperature = ${merged.targetTemperature},
      current_temperature = ${merged.currentTemperature},
      last_checked_date = ${merged.lastCheckedDate},
      last_checked_time = ${merged.lastCheckedTime},
      checked_by = ${merged.checkedBy},
      status = ${merged.status},
      notes = ${merged.notes ?? ""},
      active = ${merged.active},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM freezer_equipment WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
