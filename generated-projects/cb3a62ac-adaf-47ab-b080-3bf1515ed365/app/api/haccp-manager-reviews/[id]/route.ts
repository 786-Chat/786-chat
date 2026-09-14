export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const reviewSchema = z.object({
  reviewPeriod: z.string().min(1).optional(),
  reviewedBy: z.string().min(1).optional(),
  repeatedProblems: z.string().optional(),
  actionRequired: z.string().optional(),
  staffTrainingRequired: z.enum(["Yes", "No"]).optional(),
  reviewCompleted: z.boolean().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_manager_reviews WHERE id = ${params.id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const existing = await db`SELECT * FROM haccp_manager_reviews WHERE id = ${params.id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`
    UPDATE haccp_manager_reviews SET
      review_period = ${merged.reviewPeriod},
      reviewed_by = ${merged.reviewedBy},
      repeated_problems = ${merged.repeatedProblems ?? ""},
      action_required = ${merged.actionRequired ?? ""},
      staff_training_required = ${merged.staffTrainingRequired},
      review_completed = ${merged.reviewCompleted},
      updated_at = now()
    WHERE id = ${params.id}
  `;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM haccp_manager_reviews WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
