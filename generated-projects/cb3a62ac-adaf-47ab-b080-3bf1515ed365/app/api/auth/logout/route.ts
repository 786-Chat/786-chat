export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSession } from "@/lib/server/auth";
import { cookies } from "next/headers";

export async function POST() {
  const session = await getSession();
  if (session) {
    const db = getDb();
    await db`DELETE FROM sessions WHERE id = ${session.sessionId}`;
  }
  cookies().delete("session");
  return NextResponse.json({ success: true });
}
