export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  const items = await db`SELECT * FROM deliveries ORDER BY created_at DESC`;
  return NextResponse.json({ items });
}
