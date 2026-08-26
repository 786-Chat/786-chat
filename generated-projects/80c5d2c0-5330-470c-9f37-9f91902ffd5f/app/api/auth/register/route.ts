export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { hashPassword, hashToken } from "@/lib/server/auth";
import { sendEmail } from "@/lib/server/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const existing = await db`SELECT id FROM users WHERE email = ${parsed.data.email}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(parsed.data.password);
  await db`INSERT INTO users (id, email, password_hash, name) VALUES (${id}, ${parsed.data.email}, ${passwordHash}, ${parsed.data.name || ""})`;
  const token = crypto.randomUUID();
  await db`INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (${crypto.randomUUID()}, ${id}, ${hashToken(token)}, now() + interval '24 hours')`;
  const verifyUrl = `${new URL(request.url).origin}/verify-email?token=${token}`;
  await sendEmail({
    to: parsed.data.email,
    subject: "Verify your email",
    html: `<a href="${verifyUrl}">Verify email</a>`,
  });
  return NextResponse.json({ id }, { status: 201 });
}
