import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const haccpCheckSchema = z.object({
  checkDate: z.string().min(1).optional(),
  checkTime: z.string().min(1).optional(),
  processArea: z.string().min(1).optional(),
  hazardType: z.enum(["Biological", "Chemical", "Physical", "Allergen"]).optional(),
  controlPoint: z.string().min(1).optional(),
  criticalLimit: z.string().min(1).optional(),
  actualResult: z.string().min(1).optional(),
  status: z.enum(["Pass", "Warning", "Fail"]).optional(),
  checkedBy: z.string().min(1).optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_checks WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = haccpCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM haccp_checks WHERE id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE haccp_checks SET
      check_date = ${merged.checkDate},
      check_time = ${merged.checkTime},
      process_area = ${merged.processArea},
      hazard_type = ${merged.hazardType},
      control_point = ${merged.controlPoint},
      critical_limit = ${merged.criticalLimit},
      actual_result = ${merged.actualResult},
      status = ${merged.status},
      checked_by = ${merged.checkedBy},
      notes = ${merged.notes ?? ""},
      completed = ${merged.completed},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM haccp_checks WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
