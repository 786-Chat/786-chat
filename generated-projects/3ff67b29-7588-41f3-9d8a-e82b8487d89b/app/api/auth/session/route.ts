export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const db = (await import("@/lib/server/db")).getDb();
  const rows = await db`SELECT id, email, name FROM users WHERE id = ${session.userId}`;
  if (rows.length === 0) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: rows[0] });
}
