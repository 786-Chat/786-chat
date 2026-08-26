export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const schema = z.object({
  confirmedBy: z.string().min(1),
  confirmationDate: z.string().min(1),
  reviewDate: z.string().optional(),
  notes: z.string().default(""),
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM haccp_flow_confirmations ORDER BY created_at DESC LIMIT 1`;
  return NextResponse.json(rows[0] || null);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  await db`
    INSERT INTO haccp_flow_confirmations (id, confirmed_by, confirmation_date, review_date, notes)
    VALUES (${id}, ${data.confirmedBy}, ${data.confirmationDate}, ${data.reviewDate || null}, ${data.notes})
  `;
  return NextResponse.json({ id, ...data }, { status: 201 });
}
