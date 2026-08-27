export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const temperatureCheckSchema = z.object({
  equipmentId: z.string().min(1),
  actualTemperature: z.string().min(1),
  checkDate: z.string().min(1),
  checkTime: z.string().min(1),
  checkedBy: z.string().min(1),
  notes: z.string().default("")
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const equipmentId = searchParams.get("equipmentId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const db = getDb();
  let query = `SELECT * FROM temperature_checks WHERE 1=1`;
  const params: any[] = [];
  if (equipmentId) {
    params.push(equipmentId);
    query += ` AND equipment_id = $${params.length}`;
  }
  if (date) {
    params.push(date);
    query += ` AND check_date = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  query += ` ORDER BY check_date DESC, check_time DESC`;
  const rows = await db(query, ...params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = temperatureCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const equipmentRows = await db`SELECT * FROM freezer_equipment WHERE id = ${data.equipmentId}`;
  if (equipmentRows.length === 0) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }
  const equipment = equipmentRows[0];
  const target = parseFloat(equipment.target_temperature);
  const actual = parseFloat(data.actualTemperature);
  let status: string;
  if (equipment.equipment_type === "Freezer") {
    if (actual <= -18) status = "Normal";
    else if (actual <= -15) status = "Warning";
    else status = "Out of Range";
  } else {
    if (actual <= 5) status = "Normal";
    else if (actual <= 8) status = "Warning";
    else status = "Out of Range";
  }
  const id = crypto.randomUUID();
  await db`
    INSERT INTO temperature_checks (id, equipment_id, equipment_name, equipment_type, location, target_temperature, actual_temperature, check_date, check_time, checked_by, status, notes)
    VALUES (${id}, ${equipment.id}, ${equipment.name}, ${equipment.equipment_type}, ${equipment.location}, ${equipment.target_temperature}, ${data.actualTemperature}, ${data.checkDate}, ${data.checkTime}, ${data.checkedBy}, ${status}, ${data.notes})
  `;
  await db`
    UPDATE freezer_equipment SET
      current_temperature = ${data.actualTemperature},
      last_checked_date = ${data.checkDate},
      last_checked_time = ${data.checkTime},
      checked_by = ${data.checkedBy},
      status = ${status},
      updated_at = now()
    WHERE id = ${equipment.id}
  `;
  return NextResponse.json({ id, ...data, status }, { status: 201 });
}
