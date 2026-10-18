export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const reviewSchema = z.object({
  reviewPeriod: z.string().min(1),
  reviewedBy: z.string().min(1),
  repeatedProblems: z.string().optional(),
  actionRequired: z.string().optional(),
  staffTrainingRequired: z.enum(["Yes", "No"]),
  reviewCompleted: z.boolean().default(true)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_manager_reviews ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO haccp_manager_reviews (id, review_period, reviewed_by, repeated_problems, action_required, staff_training_required, review_completed)
    VALUES (${id}, ${data.reviewPeriod}, ${data.reviewedBy}, ${data.repeatedProblems ?? ""}, ${data.actionRequired ?? ""}, ${data.staffTrainingRequired}, ${data.reviewCompleted})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
