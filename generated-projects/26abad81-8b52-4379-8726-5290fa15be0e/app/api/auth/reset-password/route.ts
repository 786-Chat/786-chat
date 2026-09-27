export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { hashPassword, hashToken } from "@/lib/server/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const tokenHash = hashToken(parsed.data.token);
  const rows = await db`SELECT * FROM password_reset_tokens WHERE token_hash = ${tokenHash} AND expires_at > now()`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await db`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${rows[0].user_id}`;
  await db`DELETE FROM sessions WHERE user_id = ${rows[0].user_id}`;
  await db`DELETE FROM password_reset_tokens WHERE id = ${rows[0].id}`;
  return NextResponse.json({ success: true });
}
