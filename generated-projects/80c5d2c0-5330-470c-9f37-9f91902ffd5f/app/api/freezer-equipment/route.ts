import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const freezerEquipmentSchema = z.object({
  name: z.string().min(1),
  equipmentType: z.enum(["Freezer", "Chiller"]),
  location: z.string().min(1),
  targetTemperature: z.string().min(1),
  currentTemperature: z.string().min(1),
  lastCheckedDate: z.string().min(1),
  lastCheckedTime: z.string().min(1),
  checkedBy: z.string().min(1),
  status: z.enum(["Normal", "Warning", "Out of Range"]),
  notes: z.string().default(""),
  active: z.boolean().default(true)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM freezer_equipment ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = freezerEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO freezer_equipment (id, name, equipment_type, location, target_temperature, current_temperature, last_checked_date, last_checked_time, checked_by, status, notes, active)
    VALUES (${id}, ${data.name}, ${data.equipmentType}, ${data.location}, ${data.targetTemperature}, ${data.currentTemperature}, ${data.lastCheckedDate}, ${data.lastCheckedTime}, ${data.checkedBy}, ${data.status}, ${data.notes}, ${data.active})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
