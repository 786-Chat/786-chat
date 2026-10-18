export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  steps: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM process_flows ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const id = crypto.randomUUID();
  await db`INSERT INTO process_flows (id, name, description, steps) VALUES (${id}, ${parsed.data.name}, ${parsed.data.description}, ${JSON.stringify(parsed.data.steps)})`;
  return NextResponse.json({ id, ...parsed.data }, { status: 201 });
}