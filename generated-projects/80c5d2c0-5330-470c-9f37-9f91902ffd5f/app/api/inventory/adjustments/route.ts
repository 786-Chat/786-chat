export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  const rows = await db`SELECT * FROM inventory_adjustments ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}
