export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM my_documents ORDER BY check_date DESC`;
  return NextResponse.json(rows);
}
