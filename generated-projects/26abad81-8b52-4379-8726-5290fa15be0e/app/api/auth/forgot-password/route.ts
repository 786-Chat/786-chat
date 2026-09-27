export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { hashToken } from "@/lib/server/auth";
import { sendEmail } from "@/lib/server/email";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const rows = await db`SELECT id FROM users WHERE email = ${parsed.data.email}`;
  if (rows.length === 0) {
    return NextResponse.json({ success: true });
  }
  const token = crypto.randomUUID();
  await db`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (${crypto.randomUUID()}, ${rows[0].id}, ${hashToken(token)}, now() + interval '1 hour')`;
  const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;
  await sendEmail({
    to: parsed.data.email,
    subject: "Reset your password",
    html: `<a href="${resetUrl}">Reset password</a>`,
  });
  return NextResponse.json({ success: true });
}
