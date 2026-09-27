export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const haccpCheckSchema = z.object({
  checkDate: z.string().min(1),
  checkTime: z.string().min(1),
  processArea: z.string().min(1),
  hazardType: z.enum(["Biological", "Chemical", "Physical", "Allergen"]),
  controlPoint: z.string().min(1),
  criticalLimit: z.string().min(1),
  actualResult: z.string().min(1),
  status: z.enum(["Pass", "Warning", "Fail"]),
  checkedBy: z.string().min(1),
  notes: z.string().default(""),
  completed: z.boolean().default(false)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_checks ORDER BY check_date DESC, check_time DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = haccpCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO haccp_checks (id, check_date, check_time, process_area, hazard_type, control_point, critical_limit, actual_result, status, checked_by, notes, completed)
    VALUES (${id}, ${data.checkDate}, ${data.checkTime}, ${data.processArea}, ${data.hazardType}, ${data.controlPoint}, ${data.criticalLimit}, ${data.actualResult}, ${data.status}, ${data.checkedBy}, ${data.notes}, ${data.completed})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
