import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";

const optionSchema = z.object({
  optionType: z.enum(["equipment_type", "location", "staff_name", "saved_note"]),
  value: z.string().min(1)
});

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM freezer_options ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = optionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { optionType, value } = parsed.data;
  const db = getDb();
  const id = crypto.randomUUID();
  try {
    await db`INSERT INTO freezer_options (id, option_type, value) VALUES (${id}, ${optionType}, ${value})`;
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: "Option already exists" }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ id, optionType, value }, { status: 201 });
}
