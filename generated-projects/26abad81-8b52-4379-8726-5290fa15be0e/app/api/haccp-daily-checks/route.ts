export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const dailyCheckSchema = z.object({
  checkDate: z.string().min(1),
  staffMember: z.string().min(1),
  productionToday: z.enum(["Yes", "No"]),
  heatTreatmentRecorded: z.enum(["OK", "Attention"]).optional(),
  coolingCompletedBelow8: z.enum(["OK", "Attention"]).optional(),
  coolingCompletedWithin90: z.enum(["OK", "Attention"]).optional(),
  freezerStorageCheck: z.enum(["OK", "Attention"]).optional(),
  cleaningCheckCompleted: z.enum(["OK", "Attention"]).optional(),
  anyProblem: z.enum(["Yes", "No"]),
  problemAction: z.string().optional(),
  completed: z.boolean().default(true)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_daily_checks ORDER BY check_date DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = dailyCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO haccp_daily_checks (id, check_date, staff_member, production_today, heat_treatment_recorded, cooling_completed_below_8, cooling_completed_within_90, freezer_storage_check, cleaning_check_completed, any_problem, problem_action, completed)
    VALUES (${id}, ${data.checkDate}, ${data.staffMember}, ${data.productionToday}, ${data.heatTreatmentRecorded ?? null}, ${data.coolingCompletedBelow8 ?? null}, ${data.coolingCompletedWithin90 ?? null}, ${data.freezerStorageCheck ?? null}, ${data.cleaningCheckCompleted ?? null}, ${data.anyProblem}, ${data.problemAction ?? ""}, ${data.completed})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
