export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { verifyPassword, createSession } from "@/lib/server/auth";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const rows = await db`SELECT * FROM users WHERE email = ${parsed.data.email}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const user = rows[0];
  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await createSession(user.id);
  const cookieStore = cookies();
  const maxAge = parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  const embeddedPreview = process.env.VERCEL_ENV === "preview" || process.env.VERCEL_TARGET_ENV === "staging";
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: embeddedPreview ? "none" : "lax",
    secure: embeddedPreview || process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
