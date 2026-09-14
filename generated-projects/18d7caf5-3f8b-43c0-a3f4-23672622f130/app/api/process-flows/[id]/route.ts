export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  steps: z.array(z.string().min(1)).optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const rows = await db`SELECT * FROM process_flows WHERE id = ${params.id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const existing = await db`SELECT * FROM process_flows WHERE id = ${params.id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = existing[0];
  const merged = { ...current, ...parsed.data };
  await db`UPDATE process_flows SET name = ${merged.name}, description = ${merged.description ?? ""}, steps = ${JSON.stringify(merged.steps)}, updated_at = now() WHERE id = ${params.id}`;
  return NextResponse.json({ ...merged });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const result = await db`DELETE FROM process_flows WHERE id = ${params.id} RETURNING id`;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}