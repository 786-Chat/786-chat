export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const cleaningCheckSchema = z.object({
  areaEquipment: z.string().min(1),
  cleaningTask: z.string().min(1),
  cleaningDate: z.string().min(1),
  cleaningTime: z.string().min(1),
  cleanedBy: z.string().min(1),
  checkedBy: z.string().min(1),
  chemicalUsed: z.string().min(1),
  result: z.enum(["Satisfactory", "Unsatisfactory"]),
  notes: z.string().default(""),
  completed: z.boolean().default(false)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM cleaning_checks ORDER BY cleaning_date DESC, cleaning_time DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = cleaningCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO cleaning_checks (id, area_equipment, cleaning_task, cleaning_date, cleaning_time, cleaned_by, checked_by, chemical_used, result, notes, completed)
    VALUES (${id}, ${data.areaEquipment}, ${data.cleaningTask}, ${data.cleaningDate}, ${data.cleaningTime}, ${data.cleanedBy}, ${data.checkedBy}, ${data.chemicalUsed}, ${data.result}, ${data.notes}, ${data.completed})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
