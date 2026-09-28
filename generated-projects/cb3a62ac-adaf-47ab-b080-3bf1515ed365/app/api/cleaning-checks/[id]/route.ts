export const dynamic = "force-dynamic"

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const cleaningCheckSchema = z.object({
  areaEquipment: z.string().min(1).optional(),
  cleaningTask: z.string().min(1).optional(),
  cleaningDate: z.string().min(1).optional(),
  cleaningTime: z.string().min(1).optional(),
  cleanedBy: z.string().min(1).optional(),
  checkedBy: z.string().min(1).optional(),
  chemicalUsed: z.string().min(1).optional(),
  result: z.enum(["Satisfactory", "Unsatisfactory"]).optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM cleaning_checks WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = cleaningCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT * FROM cleaning_checks WHERE id = ${params.id}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE cleaning_checks SET
      area_equipment = ${merged.areaEquipment},
      cleaning_task = ${merged.cleaningTask},
      cleaning_date = ${merged.cleaningDate},
      cleaning_time = ${merged.cleaningTime},
      cleaned_by = ${merged.cleanedBy},
      checked_by = ${merged.checkedBy},
      chemical_used = ${merged.chemicalUsed},
      result = ${merged.result},
      notes = ${merged.notes ?? ""},
      completed = ${merged.completed},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM cleaning_checks WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
