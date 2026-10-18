export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const dailyCheckSchema = z.object({
  checkDate: z.string().min(1).optional(),
  staffMember: z.string().min(1).optional(),
  productionToday: z.enum(["Yes", "No"]).optional(),
  heatTreatmentRecorded: z.enum(["OK", "Attention"]).optional(),
  coolingCompletedBelow8: z.enum(["OK", "Attention"]).optional(),
  coolingCompletedWithin90: z.enum(["OK", "Attention"]).optional(),
  freezerStorageCheck: z.enum(["OK", "Attention"]).optional(),
  cleaningCheckCompleted: z.enum(["OK", "Attention"]).optional(),
  anyProblem: z.enum(["Yes", "No"]).optional(),
  problemAction: z.string().optional(),
  completed: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_daily_checks WHERE id = ${params.id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = dailyCheckSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const existing = await db`SELECT * FROM haccp_daily_checks WHERE id = ${params.id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE haccp_daily_checks SET
      check_date = ${merged.checkDate},
      staff_member = ${merged.staffMember},
      production_today = ${merged.productionToday},
      heat_treatment_recorded = ${merged.heatTreatmentRecorded ?? null},
      cooling_completed_below_8 = ${merged.coolingCompletedBelow8 ?? null},
      cooling_completed_within_90 = ${merged.coolingCompletedWithin90 ?? null},
      freezer_storage_check = ${merged.freezerStorageCheck ?? null},
      cleaning_check_completed = ${merged.cleaningCheckCompleted ?? null},
      any_problem = ${merged.anyProblem},
      problem_action = ${merged.problemAction ?? ""},
      completed = ${merged.completed},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM haccp_daily_checks WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
