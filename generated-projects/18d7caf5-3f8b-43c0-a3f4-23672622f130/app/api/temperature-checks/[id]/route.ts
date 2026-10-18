export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const temperatureCheckSchema = z.object({
  equipmentId: z.string().min(1).optional(),
  actualTemperature: z.string().min(1).optional(),
  checkDate: z.string().min(1).optional(),
  checkTime: z.string().min(1).optional(),
  checkedBy: z.string().min(1).optional(),
  notes: z.string().optional()
});

function calculateStatus(equipmentType: string, actualTemperature: string) {
  const actual = Number.parseFloat(actualTemperature);
  if (!Number.isFinite(actual)) return "Out of Range";

  if (equipmentType === "Freezer") {
    if (actual <= -18) return "Normal";
    if (actual <= -15) return "Warning";
    return "Out of Range";
  }

  if (actual <= 5) return "Normal";
  if (actual <= 8) return "Warning";
  return "Out of Range";
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM temperature_checks WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = temperatureCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const existingRows = await db`SELECT * FROM temperature_checks WHERE id = ${params.id}`;
  if (existingRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = existingRows[0] as any;
  const equipmentId = parsed.data.equipmentId ?? current.equipment_id;
  const actualTemperature = parsed.data.actualTemperature ?? current.actual_temperature;
  const checkDate = parsed.data.checkDate ?? current.check_date;
  const checkTime = parsed.data.checkTime ?? current.check_time;
  const checkedBy = parsed.data.checkedBy ?? current.checked_by;
  const notes = parsed.data.notes ?? current.notes ?? "";

  const equipmentRows = await db`SELECT * FROM freezer_equipment WHERE id = ${equipmentId}`;
  if (equipmentRows.length === 0) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const equipment = equipmentRows[0] as any;
  const status = calculateStatus(String(equipment.equipment_type ?? ""), String(actualTemperature));

  const updatedRows = await db`
    UPDATE temperature_checks SET
      equipment_id = ${equipment.id},
      equipment_name = ${equipment.name},
      equipment_type = ${equipment.equipment_type},
      location = ${equipment.location},
      target_temperature = ${equipment.target_temperature},
      actual_temperature = ${actualTemperature},
      check_date = ${checkDate},
      check_time = ${checkTime},
      checked_by = ${checkedBy},
      status = ${status},
      notes = ${notes},
      updated_at = now()
    WHERE id = ${params.id}
    RETURNING *
  `;

  return NextResponse.json(updatedRows[0]);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM temperature_checks WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
